import { gameState } from './state.js';
import { cropInfo, dropMap, TILE_UPDATE_SPEED } from './config.js';
import * as UI from './ui.js';
import { plantCrop, handleBuyUpgrade } from './game.js';

// Helper for dynamic speed
const getDelay = (baseMS) => {
    return Math.max(50, baseMS / (gameState.drone.speedMultiplier || 1));
};

export const API = {
    move: (direction) => {
        return new Promise((resolve) => {
            const { width, height } = gameState.gridSize;
            let { x, y } = gameState.drone;
            let newX = x,
                newY = y;

            switch (direction.toUpperCase()) {
                case "N": newY--; break;
                case "S": newY++; break;
                case "E": newX++; break;
                case "W": newX--; break;
                default:
                    UI.logToConsole(`Erro: Direção inválida '${direction}'`, "error");
                    resolve();
                    return;
            }

            // Toroidal movement
            gameState.drone.x = ((newX % width) + width) % width;
            gameState.drone.y = ((newY % height) + height) % height;
            gameState.drone.state = "WALK";

            const finalX = gameState.drone.x;
            const finalY = gameState.drone.y;

            UI.logToConsole(`Movido para (${finalX}, ${finalY})`);
            UI.updateDroneVisualPosition(finalX, finalY, width, height, true);
            // 'walk' is set inside updateDroneVisualPosition if animated=true


            setTimeout(() => {
                UI.setDroneState("idle"); 
                resolve();
            }, getDelay(TILE_UPDATE_SPEED));
        });
    },

    till: () => {
        return new Promise((resolve) => {
            const { x, y } = gameState.drone;
            const tile = gameState.grid[y][x];
            if (tile.state === "EMPTY") {
                UI.setDroneState("action");
                tile.state = "TILLED";
                UI.logToConsole(`Terra arada em (${x}, ${y})`);
            } else {
                UI.logToConsole(
                    `Não é possível arar aqui. Estado: ${tile.state}`,
                    "warn"
                );
            }
            UI.render();
            
            setTimeout(() => {
                UI.setDroneState("idle");
                resolve();
            }, getDelay(700));
        });
    },

    plant: (cropType) => {
        return new Promise((resolve) => {
            const { x, y } = gameState.drone;
            const tile = gameState.grid[y][x];

            if (!gameState.unlockedCrops.includes(cropType)) {
                UI.logToConsole(
                    `Erro: Colheita '${cropType}' não desbloqueada.`,
                    "error"
                );
                setTimeout(resolve, getDelay(TILE_UPDATE_SPEED));
                return;
            }

            const seedType = cropInfo[cropType]?.seed;
            const isFreeCrop = cropType === "WHEAT";
            const hasSeeds = isFreeCrop || gameState.farmResources[seedType] > 0;

            if (tile.state === "TILLED" && hasSeeds) {
                UI.setDroneState("action");
                if (!isFreeCrop) {
                    gameState.farmResources[seedType]--;
                }
                plantCrop(x, y, cropType);
                UI.logToConsole(`${cropType} plantado em (${x}, ${y})`);
            } else if (!hasSeeds) {
                UI.logToConsole(`Sem sementes de ${cropType} para plantar.`, "warn");
            } else {
                UI.logToConsole(
                    `Não é possível plantar aqui. A terra precisa ser arada.`,
                    "warn"
                );
            }
            UI.render();
            const { width, height } = gameState.gridSize;
            
            setTimeout(() => {
                UI.setDroneState("idle");
                resolve();
            }, getDelay(700));
        });
    },

    harvest: () => {
        return new Promise((resolve) => {
            const { x, y } = gameState.drone;
            const tile = gameState.grid[y][x];

            const inventorySize = Object.values(gameState.drone.inventory).reduce(
                (a, b) => a + b, 0
            );
            if (inventorySize >= gameState.drone.inventoryCapacity) {
                UI.logToConsole(
                    "Erro: Inventário do drone está cheio. Descarte ou use itens.",
                    "error"
                );
                setTimeout(resolve, getDelay(TILE_UPDATE_SPEED));
                return;
            }

            if (tile.state === "GROWN") {
                const cropType = tile.crop;

                // Double Harvest
                const doubleChance = gameState.doubleHarvestChance[cropType] || 0;
                let amount = 1;
                if (Math.random() * 100 < doubleChance) {
                    amount = 2;
                    UI.logToConsole(`🔥 Colheita Dupla! Obtido 2x ${cropType}.`, "info");
                }

                gameState.drone.inventory[cropType] =
                    (gameState.drone.inventory[cropType] || 0) + amount;
                gameState.farmResources[cropType] =
                    (gameState.farmResources[cropType] || 0) + amount;

                // Seed Drop
                const nextSeedType = dropMap[cropType];
                if (nextSeedType) {
                    const dropChance = gameState.dropChances[nextSeedType] || 0;
                    if (Math.random() * 100 < dropChance) {
                        gameState.farmResources[nextSeedType]++;
                        const baseCrop = nextSeedType.replace("_SEED", "");
                        UI.logToConsole(
                            `🎉 Semente de ${baseCrop} obtida! (Chance: ${dropChance}%)`,
                            "info"
                        );
                    }
                }

                tile.state = "EMPTY";
                tile.crop = null;
                tile.plantedAt = null;
                tile.watered = false;
                UI.logToConsole(`${cropType} colhido (${amount}x) de (${x}, ${y})`);
                UI.updateChart();
            } else {
                // Harvest Penalty
                if (tile.state === "PLANTED" || tile.state === "TILLED") {
                    UI.logToConsole(
                        `❌ Penalidade! Colheita falhou em ${tile.state}. Bloco resetado para 'EMPTY'.`,
                        "error"
                    );
                    tile.state = "EMPTY";
                    tile.crop = null;
                    tile.plantedAt = null;
                    tile.watered = false;
                } else {
                    UI.logToConsole(
                        `Nada para colher em (${x}, ${y}). Estado: ${tile.state}`,
                        "warn"
                    );
                }
            }
            UI.render();
            const { width, height } = gameState.gridSize;
            if (tile.state === "EMPTY" || tile.state === "GROWN" || tile.state === "PLANTED" || tile.state === "TILLED") {
                UI.setDroneState("action");
            }

            setTimeout(() => {
                UI.setDroneState("idle");
                resolve();
            }, getDelay(700));
        });
    },

    water: () => {
        return new Promise((resolve) => {
            const { x, y } = gameState.drone;
            const tile = gameState.grid[y][x];

            if (gameState.farmResources["WATER"] <= 0) {
                UI.logToConsole("Erro: Sem água! A chuva é a única fonte de água agora.", "error");
                setTimeout(resolve, getDelay(TILE_UPDATE_SPEED));
                return;
            }

            if (tile.state === "PLANTED" || tile.state === "TILLED") {
                UI.setDroneState("action");
                tile.watered = true;
                gameState.farmResources["WATER"]--;
                UI.logToConsole(
                    `Terra regada em (${x}, ${y}). Água: ${gameState.farmResources["WATER"]}/${gameState.waterCapacity}`
                );
            } else {
                UI.logToConsole(`Não há necessidade de regar aqui.`, "warn");
            }
            UI.render();

            setTimeout(() => {
                UI.setDroneState("idle");
                resolve();
            }, getDelay(700));
        });
    },



    checkTile: () => {
        const { x, y } = gameState.drone;
        const tile = gameState.grid[y][x];
        return tile.state;
    },

    getItemCount: (item) => {
        return gameState.farmResources[item] || 0;
    },

    buyUpgrade: (upgradeID) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                // Pass null for activeTab since we don't know it, or handle UI refresh generally
                // handleBuyUpgrade inside processes the purchase and calls render.
                // We pass null activeTab so modal doesn't flicker if open?
                // Actually handleBuyUpgrade expects activeTab to refresh modal.
                // If called from code, modal might not be open.
                const result = handleBuyUpgrade(upgradeID, null);
                if (result) {
                   // Logged inside
                }
                resolve();
            }, 500);
        });
    },

    console: {
        log: (message) => {
            UI.logToConsole(message, "user");
        },
    },
};
