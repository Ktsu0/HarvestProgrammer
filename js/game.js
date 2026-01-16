import { gameState, initializeGrid } from './state.js';
import { cropInfo, dropMap, TILE_UPDATE_SPEED, AUTO_RUN_DELAY } from './config.js';
import * as UI from './ui.js';

// --- Core Helper Functions ---

export function plantCrop(x, y, cropType) {
    const { width, height } = gameState.gridSize;
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const tile = gameState.grid[y][x];
    tile.state = "PLANTED";
    tile.crop = cropType;
    tile.plantedAt = Date.now();
    tile.watered = false; // Must be re-watered
}

export function handleBuyUpgrade(upgradeID, activeTab) {
    const upgrade = gameState.upgrades[upgradeID];
    if (!upgrade || upgrade.unlocked) return false;

    let canAfford = true;
    for (const item in upgrade.cost) {
        if (gameState.farmResources[item] < upgrade.cost[item]) {
            canAfford = false;
            break;
        }
    }

    if (canAfford) {
        for (const item in upgrade.cost) {
            gameState.farmResources[item] -= upgrade.cost[item];
            gameState.drone.inventory[item] -= upgrade.cost[item];
        }

        upgrade.effect();
        upgrade.unlocked = true;
        if (upgrade.category === "land") {
            initializeGrid();
        }
        // Re-render modal to toggle buttons/states
        if (activeTab) {
           UI.updateTechModalContent(activeTab, (id) => handleBuyUpgrade(id, activeTab));
        }
        UI.render();
        UI.logToConsole(`Upgrade ${upgradeID} comprado com sucesso.`, "info");
        return true;
    } else {
        UI.logToConsole(
            `Falha ao comprar ${upgradeID}. Verifique os recursos.`,
            "error"
        );
    }
    return false;
}

// --- Logic for API ---
export function validateCode(code) {
// ... (matches original until gameLoop)
    // 1. Check for Conditional Logic (if/else, switch)
    if (!gameState.codeFeatures.conditionals) {
        const conditionalRegex = /\b(if|else|switch)\s*\(/g;
        if (conditionalRegex.test(code)) {
            throw new Error(
                "[CODE_BLOCKED] O uso de Condicionais (`if`, `switch`) está bloqueado. Compre o upgrade 'CODE_CONDITIONALS'."
            );
        }
    }
    // 2. Check for custom function declarations
    if (!gameState.codeFeatures.functions) {
        const customFuncRegex =
            /\bfunction\s+[a-zA-Z0-9_]+\s*\([^)]*\)\s*\{|const\s+[a-zA-Z0-9_]+\s*=\s*\([^)]*\)\s*=>|var\s+[a-zA-Z0-9_]+\s*=\s*function\s*\([^)]*\)\s*\{/g;
        let match;

        if (customFuncRegex.test(code)) {
             // simplified logic for brevity compared to original, but same effect
            throw new Error(
                `[CODE_BLOCKED] A declaração de Funções personalizadas está bloqueada. Compre o upgrade 'CODE_FUNCTIONS'.`
            );
        }
    }

    // 3. Check for 'for' loops
    if (!gameState.codeFeatures.forLoop) {
        const forLoopRegex = /\bfor\s*\([^;]*;[^;]*;[^)]*\)\s*\{/g;
        if (forLoopRegex.test(code)) {
            throw new Error(
                "[CODE_BLOCKED] O uso do laço `for` está bloqueado. Compre o upgrade 'CODE_FOR_LOOP'."
            );
        }
    }

    // 4. Check for 'while' and 'do-while' loops
    if (!gameState.codeFeatures.whileLoop) {
        const whileLoopRegex = /\b(while|do)\s*\([^)]*\)\s*\{/g;
        if (whileLoopRegex.test(code)) {
            throw new Error(
                "[CODE_BLOCKED] O uso dos laços `while` ou `do-while` está bloqueado. Compre o upgrade 'CODE_WHILE_LOOP'."
            );
        }
    }
}

// --- Game Loop ---
export function gameLoop() {
    // Growth Logic
    const now = Date.now();
    let needsRender = false;

    // Rain Logic
    // Validates every 10 seconds (10000ms)
    // Use gameState.rainChance directly
    if (now - gameState.lastRainCheck > 10000) {
        gameState.lastRainCheck = now;
        if (Math.random() * 100 < gameState.rainChance) {
            UI.logToConsole("🌧️ Está chovendo! Plantas regadas e aceleradas.", "info");
            
            // 1. Refill Water (1-3 units)
            const bonusWater = Math.floor(Math.random() * 3) + 1;
            gameState.farmResources["WATER"] = Math.min(gameState.waterCapacity, gameState.farmResources["WATER"] + bonusWater);
            
            gameState.grid.forEach((row) => {
                row.forEach((tile) => {
                    if (tile.state === "PLANTED" || tile.state === "TILLED") {
                        tile.watered = true;
                    }
                    // 2. Cooldown Help (Boost growth by 5s)
                    if (tile.state === "PLANTED" && tile.plantedAt) {
                         tile.plantedAt -= 5000; // 5 seconds boost
                    }
                    tile.isRaining = true;
                });
            });
            needsRender = true;
            
            // Stop rain after 5 seconds
             setTimeout(() => {
                 gameState.grid.forEach(row => row.forEach(tile => tile.isRaining = false));
                 UI.render();
             }, 5000);
        }
    }

    // --- BOT LOGIC ---
    if (gameState.botFarm.unlocked && gameState.botFarm.isRunning) {
        // Run bots tick every ~1 second for simplicity, or just calculate yield based on time?
        // Let's do simple tick logic: Every bot has a 'progress' property.
        if (!gameState.botFarm.lastTick) gameState.botFarm.lastTick = now;
        const delta = now - gameState.botFarm.lastTick;
        
        if (delta > 1000) { // Every 1 second
            gameState.botFarm.lastTick = now;
            
            gameState.botFarm.robots.forEach(bot => {
                const info = cropInfo[bot.type];
                if (!info) return; // invalid bot
                
                // Bot Progress: 1000ms / GrowthTime * speed
                // Actually, let's just use simplified yield.
                // 1 unit per (GrowthTime / Multiplier) seconds.
                // Or: progress += speed * 1000; if progress > GrowthTime -> yield.
                
                if (!bot.progress) bot.progress = 0;
                
                // Only process active bots
                if (!bot.active) return;
                
                bot.progress += 1000 * gameState.botFarm.speedMultiplier;
                
                if (bot.progress >= info.growthTime) {
                   // Harvest!
                   let amount = 1;
                   
                   // Double Harvest Bonus
                   const doubleChance = gameState.doubleHarvestChance[bot.type] || 0;
                   if (Math.random() * 100 < doubleChance) {
                       amount = 2;
                   }
                   
                   gameState.farmResources[bot.type] = (gameState.farmResources[bot.type] || 0) + amount;
                   
                   // Seed Drop Bonus
                   const nextSeedType = dropMap[bot.type];
                   if (nextSeedType) {
                       const dropChance = gameState.dropChances[nextSeedType] || 0;
                       if (Math.random() * 100 < dropChance) {
                           gameState.farmResources[nextSeedType] = (gameState.farmResources[nextSeedType] || 0) + 1;
                       }
                   }

                   bot.progress = 0;
                }
            });
            // Don't main UI render for this unless we are viewing bot tab?
            // For now, no implicit render needed as resources update doesn't change grid.
            // But if inventory open, it should update.
            // Let's trigger a light update if menu open?
            // UI.renderInventoryDrawer() is handled in main loop? No.
            // Let's just let the user check resource count.
        }
    }

    gameState.grid.forEach((row) => {
        row.forEach((tile) => {
            if (tile.state === "PLANTED" && tile.crop) {
                // Self-healing & Type Safety
                if (!tile.plantedAt) {
                    tile.plantedAt = now;
                } else {
                    tile.plantedAt = Number(tile.plantedAt); // Ensure number
                }

                const info = cropInfo[tile.crop];
                if (info) {
                    const age = now - tile.plantedAt;
                    
                    const requiredTime = tile.watered ? info.growthTime : (info.growthTime * 3);
                    
                    if (age >= requiredTime) {
                        tile.state = "GROWN";
                        needsRender = true;
                    }
                }
            }
        });
    });

    if (needsRender) {
        UI.render();
    }

    requestAnimationFrame(gameLoop);
}

// --- Execution Management ---

export async function runSingleCycle(API_INSTANCE) {
    if (gameState.isRunning) return;

    const userCode = UI.codeEditor.value;

    try {
        validateCode(userCode);

        gameState.isRunning = true;
        
        if (!gameState.isAutoRunning) {
            UI.runBtn.disabled = true;
            UI.runBtn.textContent = "Executando...";
        }

        // Clear console of old info (preserve errors/warnings if needed, original code preserved them? No, it filtered only info/warn/error to keep? 
        // Original: kept info/warn/error, removed others? 
        // "Clear and prepare console (only non-error logs)" -> filter p with className included info/warn/error.
        // Actually original code cleared everything EXCEPT info/warn/error (kept history) or cleared everything and put back history?
        // "consoleOutputEl.innerHTML = ""; infoLines.forEach..." -> It kept old important logs and cleared the rest.
        // Let's simplify: just clear.
        // Or strictly follow original:
        const children =  Array.from(UI.consoleOutputEl.children);
        const savedLogs = children.filter(p => p.className.includes("text-red") || p.className.includes("text-yellow") || p.className.includes("text-blue"));
        UI.consoleOutputEl.innerHTML = "";
        savedLogs.forEach(p => UI.consoleOutputEl.appendChild(p));
        
        UI.logToConsole(
            gameState.isAutoRunning
                ? "Iniciando ciclo automático..."
                : "Iniciando execução...",
            "info"
        );

        // Execute Code
        const asyncFunction = new Function(
            "API",
            `
            const { move, till, plant, harvest, water, refill, checkTile, getItemCount, buyUpgrade, console } = API;
            return (async () => {
                ${userCode}
            })();
            `
        );

        await asyncFunction(API_INSTANCE);

    } catch (e) {
        UI.logToConsole(`Erro de execução: ${e.message}`, "error");
        if (gameState.isAutoRunning) {
            gameState.isAutoRunning = false;
            UI.logToConsole("Execução automática interrompida devido a erro.", "error");
        }
    }

    UI.logToConsole("Ciclo concluído.", "info");
    gameState.isRunning = false;
    UI.render();

    if (gameState.isAutoRunning) {
        setTimeout(() => autoRunLoop(API_INSTANCE), AUTO_RUN_DELAY);
    }
}

export function autoRunLoop(API_INSTANCE) {
    if (gameState.isAutoRunning && !gameState.isRunning) {
        runSingleCycle(API_INSTANCE);
    }
}

export function toggleCodeExecution(API_INSTANCE) {
    if (gameState.isAutoRunning) {
        gameState.isAutoRunning = false;
        UI.logToConsole("Execução automática pausada pelo usuário.", "info");
        UI.render();
    } else if (gameState.codeFeatures.autoRun) {
        gameState.isAutoRunning = true;
        UI.logToConsole("Execução automática iniciada. (Delay: 2s)", "info");
        UI.render();
        autoRunLoop(API_INSTANCE);
    } else {
        runSingleCycle(API_INSTANCE);
    }
}

// --- Bot Management ---
// --- Bot Management ---
export function buyRobot(cropType) {
    if (!gameState.botFarm.unlocked) return false;
    
    // Count existing robots of this specific type
    const ownershipCount = gameState.botFarm.robots.filter(b => b.type === cropType).length;
    
    // Base Costs (Scaling per crop tier roughly)
    const tierMap = {
        "WHEAT": 50, "CARROT": 100, "POTATO": 150, "BELL_PEPPER": 200, "CORN": 250,
        "TURNIP": 300, "TOMATO": 350, "PUMPKIN": 400, "WATERMELON": 450, "STRAWBERRY": 500
    };
    const baseCost = tierMap[cropType] || 50;
    
    // Cost = Base * (Owned + 1)
    const cost = baseCost * (ownershipCount + 1);
    
    // Resource check
    if ((gameState.farmResources[cropType] || 0) < cost) {
        UI.logToConsole(`Precisa de ${cost} ${cropType} para este Robô (Você tem ${ownershipCount} deste tipo).`, "error");
        return false;
    }
    
    gameState.farmResources[cropType] -= cost;
    
    // Check if can auto-activate
    const activeCount = gameState.botFarm.robots.filter(b => b.active).length;
    const canActivate = activeCount < gameState.botFarm.maxRobots;
    
    gameState.botFarm.robots.push({
        id: Date.now() + Math.random(),
        type: cropType,
        progress: 0,
        active: canActivate
    });
    
    UI.logToConsole(`Robô de ${cropType} comprado por ${cost}! ${canActivate ? 'Já está operando.' : 'Enviado para o Armazém.'}`, "info");
    UI.render(); 
    return true;
}

export function toggleRobot(botId) {
    const bot = gameState.botFarm.robots.find(b => b.id === botId);
    if (!bot) return;
    
    if (bot.active) {
        bot.active = false;
        UI.logToConsole("Robô desativado e movido para o Armazém.", "info");
    } else {
        const activeCount = gameState.botFarm.robots.filter(b => b.active).length;
        if (activeCount >= gameState.botFarm.maxRobots) {
            UI.logToConsole("Núcleo cheio! Desative um robô antes.", "error");
            return;
        }
        bot.active = true;
        UI.logToConsole("Robô ativado!", "info");
    }
    UI.render();
}

export function sellRobot(index) {
    const bot = gameState.botFarm.robots[index];
    if (!bot) return;
    
    // Refund 25 resources (50% of 50)
    const refund = 25;
    gameState.farmResources[bot.type] = (gameState.farmResources[bot.type] || 0) + refund;
    
    gameState.botFarm.robots.splice(index, 1);
    UI.logToConsole(`Robô vendido. +${refund} ${bot.type} reembolsados.`, "info");
    UI.render();
}
