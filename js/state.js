import { UPGRADE_CATEGORIES } from './config.js';

export let gameState = {
  grid: [],
  gridSize: { width: 1, height: 1 },
  drone: {
    x: 0,
    y: 0,
    inventory: {},
    inventoryCapacity: 10,
    state: "IDLE",
    speedMultiplier: 1, // NEW
  },
  farmResources: {
    WATER: 0,
    WHEAT: 0,
    CARROT: 0,
    POTATO: 0,
    BELL_PEPPER: 0,
    CORN: 0,
    TURNIP: 0,
    TOMATO: 0,
    PUMPKIN: 0,
    WATERMELON: 0,
    STRAWBERRY: 0,
    
    WHEAT_SEED: 0,
    CARROT_SEED: 0,
    POTATO_SEED: 0,
    BELL_PEPPER_SEED: 0,
    CORN_SEED: 0,
    TURNIP_SEED: 0,
    TOMATO_SEED: 0,
    PUMPKIN_SEED: 0,
    WATERMELON_SEED: 0,
    STRAWBERRY_SEED: 0,
  },
  waterCapacity: 10,
  waterCapacity: 10,
  rainChance: 5, // Starts at 5%
  unlockedCrops: ["WHEAT"],
  unlockedCrops: ["WHEAT"],
  dropChances: {
    CARROT_SEED: 0,
    POTATO_SEED: 0,
    BELL_PEPPER_SEED: 0,
    CORN_SEED: 0,
    TURNIP_SEED: 0,
    TOMATO_SEED: 0,
    PUMPKIN_SEED: 0,
    WATERMELON_SEED: 0,
    STRAWBERRY_SEED: 0,
  },
  doubleHarvestChance: {
    WHEAT: 0, CARROT: 0, POTATO: 0, BELL_PEPPER: 0, CORN: 0, TURNIP: 0, TOMATO: 0, PUMPKIN: 0, WATERMELON: 0, STRAWBERRY: 0
  },
  codeFeatures: {
    conditionals: false,
    functions: false,
    forLoop: false,
    whileLoop: false,
    autoRun: false,
    tabs: 1, // NEW: Start with 1 tab
  },
  userCode: { // Stores code for each tab
      1: "// Escreva seu código aqui...\n",
      2: "// Console 2 (Bloqueado)\n",
      3: "// Console 3 (Bloqueado)\n",
      4: "// Console 4 (Bloqueado)\n"
  },
  activeTab: 1,
  upgrades: {},
  isRunning: false,
  isAutoRunning: false,
  lastRainCheck: 0,
  botFarm: {
    unlocked: false,
    isRunning: true,
    level: 1, // Grid size multiplier?
    maxRobots: 2,
    robots: [], // { id, type, x, y, state, crop }
    speedMultiplier: 1,
  }
};

export const initializeUpgrades = () => {
    // --- Helpers ---
    const createLand = (w, h, cost) => ({
        category: "land", unlocked: false, cost,
        name: `Terreno ${w}x${h}`,
        effect: () => { gameState.gridSize = { width: w, height: h }; },
        description: `Expande para ${w}x${h}.`
    });

    const upgrades = {};

    // Helper to generate 6 upgrades per crop (3 Harvest, 3 Seed Drop)
    const createCropUpgrades = (cropKey, cropName, baseResource, startCostVal) => {
        const C = cropKey;
        const R = baseResource; // Currency used (usually the crop itself or previous tier)
        
        // 1. Harvest Multipliers (Double Harvest Chance)
        upgrades[`HARVEST_${C}_1`] = {
            category: "harvest", unlocked: false, 
            cost: { [R]: startCostVal * 10 },
            name: `${cropName}: Colheita I`,
            effect: () => gameState.doubleHarvestChance[C] += 20,
            description: `+20% de chance de colheita dupla para ${cropName}.`
        };
        upgrades[`HARVEST_${C}_2`] = {
            category: "harvest", unlocked: false, 
            cost: { [R]: startCostVal * 50 },
            name: `${cropName}: Colheita II`,
            effect: () => gameState.doubleHarvestChance[C] += 30, // Total 50
            description: `+30% de chance de colheita dupla (Total 50%).`
        };
        upgrades[`HARVEST_${C}_3`] = {
            category: "harvest", unlocked: false, 
            cost: { [R]: startCostVal * 150 },
            name: `${cropName}: Colheita III`,
            effect: () => gameState.doubleHarvestChance[C] += 50, // Total 100
            description: `Chance garantida (100%) de colheita dupla.`
        };

        // 2. Seed Drop Rates
        // Uses the Crop key for drop chance mapping (e.g., CARROT -> CARROT_SEED)
        const seedKey = `${C}_SEED`;
        upgrades[`SEED_${C}_1`] = {
            category: "seeds", unlocked: false, 
            cost: { [R]: startCostVal * 15 },
            name: `${cropName}: Sementes I`,
            effect: () => gameState.dropChances[seedKey] += 10,
            description: `+10% chance de dropar sementes de ${cropName}.`
        };
        upgrades[`SEED_${C}_2`] = {
            category: "seeds", unlocked: false, 
            cost: { [R]: startCostVal * 60 },
            name: `${cropName}: Sementes II`,
            effect: () => gameState.dropChances[seedKey] += 15,
            description: `+15% chance de dropar sementes.`
        };
        upgrades[`SEED_${C}_3`] = {
            category: "seeds", unlocked: false, 
            cost: { [R]: startCostVal * 200 },
            name: `${cropName}: Sementes III`,
            effect: () => gameState.dropChances[seedKey] += 25,
            description: `+25% chance de dropar sementes.`
        };
    };

    // --- Define Upgrades ---
    
    // LAND
    Object.assign(upgrades, {
        LAND_1_3x1: createLand(1, 3, { WHEAT: 5 }),
        LAND_3x3: createLand(3, 3, { WHEAT: 20 }),
        LAND_5x5: createLand(5, 5, { CARROT: 50, WHEAT: 50 }), // Adjusted
        LAND_8x8: createLand(8, 8, { POTATO: 100, CARROT: 100 }),
        LAND_12x12: createLand(12, 12, { BELL_PEPPER: 200, POTATO: 200 }),
        LAND_15x15: createLand(15, 15, { CORN: 400, BELL_PEPPER: 300 }),
        LAND_20x20: createLand(20, 20, { TURNIP: 600, CORN: 500 }),
        LAND_25x25: createLand(25, 25, { TOMATO: 1000, TURNIP: 800 }),
        LAND_30x30: createLand(30, 30, { PUMPKIN: 2000, TOMATO: 1500 }),
        LAND_40x40: createLand(40, 40, { WATERMELON: 5000, PUMPKIN: 3000 }), 
        LAND_50x50: createLand(50, 50, { STRAWBERRY: 5000, WATERMELON: 5000 }), // The Big One
    });

    // SPEED
    Object.assign(upgrades, {
        SPEED_1: { category: "speed", unlocked: false, cost: { WHEAT: 20 }, name: "Turbo Drone I (1.5x)", effect: () => gameState.drone.speedMultiplier = 1.5, description: "Aumenta a velocidade em 50%." },
        SPEED_2: { category: "speed", unlocked: false, cost: { CARROT: 100, WHEAT: 100 }, name: "Turbo Drone II (2x)", effect: () => gameState.drone.speedMultiplier = 2, description: "Dobra a velocidade." },
        SPEED_3: { category: "speed", unlocked: false, cost: { POTATO: 300, CARROT: 300 }, name: "Turbo Drone III (3x)", effect: () => gameState.drone.speedMultiplier = 3, description: "Triplica a velocidade." },
        SPEED_MAX: { category: "speed", unlocked: false, cost: { STRAWBERRY: 2000 }, name: "Teletransporte", effect: () => gameState.drone.speedMultiplier = 10, description: "Velocidade máxima." },
    });

    // CAPACITY (Expanded)
    Object.assign(upgrades, {
        CAP_1: { category: "capacity", unlocked: false, cost: { WHEAT: 10 }, name: "Mochila (+50)", effect: () => gameState.drone.inventoryCapacity += 50, description: "+50 Espaço" },
        CAP_2: { category: "capacity", unlocked: false, cost: { CARROT: 50 }, name: "Caixa (+100)", effect: () => gameState.drone.inventoryCapacity += 100, description: "+100 Espaço" },
        CAP_3: { category: "capacity", unlocked: false, cost: { POTATO: 150 }, name: "Container I (+500)", effect: () => gameState.drone.inventoryCapacity += 500, description: "+500 Espaço" },
        CAP_4: { category: "capacity", unlocked: false, cost: { CORN: 400 }, name: "Container II (+1000)", effect: () => gameState.drone.inventoryCapacity += 1000, description: "+1000 Espaço" },
        CAP_5: { category: "capacity", unlocked: false, cost: { TOMATO: 1000 }, name: "Silo Portátil (+5000)", effect: () => gameState.drone.inventoryCapacity += 5000, description: "+5000 Espaço" },
        CAP_6: { category: "capacity", unlocked: false, cost: { WATERMELON: 5000 }, name: "Buraco Negro (+10k)", effect: () => gameState.drone.inventoryCapacity += 10000, description: "+10.000 Espaço" },
        CAP_7: { category: "capacity", unlocked: false, cost: { STRAWBERRY: 10000 }, name: "Armazém Quântico (+50k)", effect: () => gameState.drone.inventoryCapacity += 50000, description: "+50.000 Espaço" },
    });

    // SYSTEM (Consoles & Logic)
    Object.assign(upgrades, {
        CODE_TAB_2: { category: "code", unlocked: false, cost: { CORN: 200 }, name: "Console 2", effect: () => gameState.codeFeatures.tabs = 2, description: "Desbloqueia aba 2." },
        CODE_TAB_3: { category: "code", unlocked: false, cost: { TOMATO: 500 }, name: "Console 3", effect: () => gameState.codeFeatures.tabs = 3, description: "Desbloqueia aba 3." },
        CODE_TAB_4: { category: "code", unlocked: false, cost: { STRAWBERRY: 1000 }, name: "Console 4", effect: () => gameState.codeFeatures.tabs = 4, description: "Desbloqueia aba 4." },
        CODE_COND: { category: "code", unlocked: false, cost: { WHEAT: 50 }, name: "Condicionais", effect: () => gameState.codeFeatures.conditionals = true, description: "Habilita if/else." },
        CODE_FUNC: { category: "code", unlocked: false, cost: { CARROT: 100 }, name: "Funções", effect: () => gameState.codeFeatures.functions = true, description: "Habilita funções." },
        CODE_LOOP: { category: "code", unlocked: false, cost: { POTATO: 150 }, name: "Loops", effect: () => { gameState.codeFeatures.forLoop = true; gameState.codeFeatures.whileLoop = true; }, description: "Habilita loops." },
        CODE_AUTO: { category: "code", unlocked: false, cost: { BELL_PEPPER: 200 }, name: "Auto Run", effect: () => gameState.codeFeatures.autoRun = true, description: "Executa automaticamente." },
    });

    // WATER TANKS & RAIN
    Object.assign(upgrades, {
        WATER_1: { category: "water", unlocked: false, cost: { WHEAT: 20 }, name: "Galão (+10)", effect: () => gameState.waterCapacity += 10, description: "+10 Capacidade de Água." },
        WATER_2: { category: "water", unlocked: false, cost: { CARROT: 50 }, name: "Tanque (+20)", effect: () => gameState.waterCapacity += 20, description: "+20 Capacidade de Água." },
        WATER_3: { category: "water", unlocked: false, cost: { POTATO: 150 }, name: "Cisterna (+50)", effect: () => gameState.waterCapacity += 50, description: "+50 Capacidade de Água." },
        WATER_4: { category: "water", unlocked: false, cost: { CORN: 400 }, name: "Caixa d'Água (+100)", effect: () => gameState.waterCapacity += 100, description: "+100 Capacidade de Água." },
        WATER_5: { category: "water", unlocked: false, cost: { TOMATO: 1000 }, name: "Reservatório (+500)", effect: () => gameState.waterCapacity += 500, description: "+500 Capacidade de Água." },
        WATER_MAX: { category: "water", unlocked: false, cost: { WATERMELON: 5000 }, name: "Oceano Portátil (+5k)", effect: () => gameState.waterCapacity += 5000, description: "+5000 Capacidade de Água." },
        
        // RAIN CHANCE (5 Levels)
        // RAIN CHANCE (Target: 10%, 20%, 30%, 40%)
        RAIN_1: { category: "water", unlocked: false, cost: { WHEAT: 50 }, name: "Dança da Chuva (+5%)", effect: () => gameState.rainChance += 5, description: "Total 10% Chance de Chuva." },
        RAIN_2: { category: "water", unlocked: false, cost: { CARROT: 100 }, name: "Totem da Tempestade (+10%)", effect: () => gameState.rainChance += 10, description: "Total 20% Chance de Chuva." },
        RAIN_3: { category: "water", unlocked: false, cost: { POTATO: 200 }, name: "Controle Climático (+10%)", effect: () => gameState.rainChance += 10, description: "Total 30% Chance de Chuva." },
        RAIN_MAX: { category: "water", unlocked: false, cost: { CORN: 500 }, name: "Satélite Meteorológico (+10%)", effect: () => gameState.rainChance += 10, description: "Total 40% Chance de Chuva." },
    });
    
    // ROBOTICS
    Object.assign(upgrades, {
        UNLOCK_BOTS: { category: "robotics", unlocked: false, cost: { WHEAT: 500, CORN: 200, CARROT: 200 }, name: "Fábrica de Robôs", effect: () => gameState.botFarm.unlocked = true, description: "Desbloqueia a Área dos Robôs." },
        BOT_LIMIT_1: { category: "robotics", unlocked: false, cost: { TURNIP: 300 }, name: "Expansão de Núcleo I", effect: () => gameState.botFarm.maxRobots += 1, description: "+1 Slot de Robô." },
        BOT_LIMIT_2: { category: "robotics", unlocked: false, cost: { TOMATO: 600 }, name: "Expansão de Núcleo II", effect: () => gameState.botFarm.maxRobots += 1, description: "+1 Slot de Robô." },
        BOT_LIMIT_3: { category: "robotics", unlocked: false, cost: { PUMPKIN: 1000 }, name: "Expansão de Núcleo III", effect: () => gameState.botFarm.maxRobots += 2, description: "+2 Slots de Robô." },
        BOT_LIMIT_4: { category: "robotics", unlocked: false, cost: { WATERMELON: 2500 }, name: "Expansão de Núcleo IV", effect: () => gameState.botFarm.maxRobots += 2, description: "+2 Slots de Robô." },
        BOT_LIMIT_5: { category: "robotics", unlocked: false, cost: { STRAWBERRY: 5000 }, name: "Mainframe IA", effect: () => gameState.botFarm.maxRobots += 5, description: "+5 Slots de Robô." },
        BOT_SPEED_1: { category: "robotics", unlocked: false, cost: { POTATO: 500 }, name: "Lubrificante Premium", effect: () => gameState.botFarm.speedMultiplier += 0.5, description: "Robôs 50% mais rápidos." },
        BOT_SPEED_2: { category: "robotics", unlocked: false, cost: { PUMPKIN: 1500 }, name: "Servos Hidráulicos", effect: () => gameState.botFarm.speedMultiplier += 1.0, description: "Robôs 100% mais rápidos." },
    });

    // CROP UNLOCKS (With base drop bonus)
    Object.assign(upgrades, {
        UNLOCK_CARROT: { category: "seeds", unlocked: false, cost: { WHEAT: 15 }, name: "Desbloquear Cenoura", effect: () => { gameState.unlockedCrops.push("CARROT"); gameState.dropChances.CARROT_SEED = 20; }, description: "Libera Cenouras (20% Drop)." },
        UNLOCK_POTATO: { category: "seeds", unlocked: false, cost: { CARROT: 30 }, name: "Desbloquear Batata", effect: () => { gameState.unlockedCrops.push("POTATO"); gameState.dropChances.POTATO_SEED = 20; }, description: "Libera Batatas (20% Drop)." },
        UNLOCK_PEPPER: { category: "seeds", unlocked: false, cost: { POTATO: 60 }, name: "Desbloquear Pimentão", effect: () => { gameState.unlockedCrops.push("BELL_PEPPER"); gameState.dropChances.BELL_PEPPER_SEED = 20; }, description: "Libera Pimentões (20% Drop)." },
        UNLOCK_CORN: { category: "seeds", unlocked: false, cost: { BELL_PEPPER: 100 }, name: "Desbloquear Milho", effect: () => { gameState.unlockedCrops.push("CORN"); gameState.dropChances.CORN_SEED = 20; }, description: "Libera Milho (20% Drop)." },
        UNLOCK_TURNIP: { category: "seeds", unlocked: false, cost: { CORN: 150 }, name: "Desbloquear Nabo", effect: () => { gameState.unlockedCrops.push("TURNIP"); gameState.dropChances.TURNIP_SEED = 20; }, description: "Libera Nabos (20% Drop)." },
        UNLOCK_TOMATO: { category: "seeds", unlocked: false, cost: { TURNIP: 250 }, name: "Desbloquear Tomate", effect: () => { gameState.unlockedCrops.push("TOMATO"); gameState.dropChances.TOMATO_SEED = 20; }, description: "Libera Tomates (20% Drop)." },
        UNLOCK_PUMPKIN: { category: "seeds", unlocked: false, cost: { TOMATO: 400 }, name: "Desbloquear Abóbora", effect: () => { gameState.unlockedCrops.push("PUMPKIN"); gameState.dropChances.PUMPKIN_SEED = 20; }, description: "Libera Abóboras (20% Drop)." },
        UNLOCK_WATERMELON: { category: "seeds", unlocked: false, cost: { PUMPKIN: 600 }, name: "Desbloquear Melancias", effect: () => { gameState.unlockedCrops.push("WATERMELON"); gameState.dropChances.WATERMELON_SEED = 20; }, description: "Libera Melancias (20% Drop)." },
        UNLOCK_STRAWBERRY: { category: "seeds", unlocked: false, cost: { WATERMELON: 1000 }, name: "Desbloquear Morangos", effect: () => { gameState.unlockedCrops.push("STRAWBERRY"); gameState.dropChances.STRAWBERRY_SEED = 20; }, description: "Libera Morangos (20% Drop)." },
    });

    // GENERATE CROP-SPECIFIC UPGRADES (Harvest & Drops)
    // Args: ID, Name, CostCurrency, BaseCostValue
    createCropUpgrades("WHEAT", "Trigo", "WHEAT", 10);
    createCropUpgrades("CARROT", "Cenoura", "CARROT", 20);
    createCropUpgrades("POTATO", "Batata", "POTATO", 30);
    createCropUpgrades("BELL_PEPPER", "Pimentão", "BELL_PEPPER", 40);
    createCropUpgrades("CORN", "Milho", "CORN", 50);
    createCropUpgrades("TURNIP", "Nabo", "TURNIP", 60);
    createCropUpgrades("TOMATO", "Tomate", "TOMATO", 80);
    createCropUpgrades("PUMPKIN", "Abóbora", "PUMPKIN", 100);
    createCropUpgrades("WATERMELON", "Melancia", "WATERMELON", 150);
    createCropUpgrades("STRAWBERRY", "Morango", "STRAWBERRY", 300);

    gameState.upgrades = upgrades;
};

export function initializeGrid() {
  const { width, height } = gameState.gridSize;
  const oldGrid = gameState.grid;
  const oldHeight = oldGrid.length;
  const oldWidth = oldGrid[0] ? oldGrid[0].length : 0;

  const newGrid = [];

  for (let y = 0; y < height; y++) {
    newGrid[y] = [];
    for (let x = 0; x < width; x++) {
      if (y < oldHeight && x < oldWidth) {
        newGrid[y][x] = oldGrid[y][x];
      } else {
        newGrid[y][x] = { state: "EMPTY", crop: null, plantTime: 0, watered: false, isRaining: false };
      }
    }
  }

  gameState.grid = newGrid;
  // Keep drone position safe
  gameState.drone.x = Math.min(gameState.drone.x, width - 1);
  gameState.drone.y = Math.min(gameState.drone.y, height - 1);
}
// --- Persistence ---

export function saveGame() {
    const unlockedUpgradeIds = Object.keys(gameState.upgrades).filter(id => gameState.upgrades[id].unlocked);
    
    const saveData = {
        grid: gameState.grid,
        gridSize: gameState.gridSize,
        drone: {
            x: gameState.drone.x,
            y: gameState.drone.y,
            inventory: gameState.drone.inventory,
            inventoryCapacity: gameState.drone.inventoryCapacity,
            inventoryCapacity: gameState.drone.inventoryCapacity,
            speedMultiplier: gameState.drone.speedMultiplier
        },
        botFarm: gameState.botFarm, // Save Bots
        farmResources: gameState.farmResources,
        waterCapacity: gameState.waterCapacity,
        rainChance: gameState.rainChance,
        unlockedCrops: gameState.unlockedCrops,
        dropChances: gameState.dropChances,
        doubleHarvestChance: gameState.doubleHarvestChance,
        codeFeatures: gameState.codeFeatures,
        userCode: gameState.userCode,
        activeTab: gameState.activeTab,
        unlockedUpgradeIds: unlockedUpgradeIds
    };
    
    localStorage.setItem("theFarmerPro_Data", JSON.stringify(saveData));
    // console.log("Jogo Salvo!"); // Optional log, maybe too spammy for auto-save
}

export function loadGame() {
    const json = localStorage.getItem("theFarmerPro_Data");
    if (!json) return false;
    
    try {
        const data = JSON.parse(json);
        
        // Restore State Variables
        if (data.grid) gameState.grid = data.grid;
        if (data.gridSize) gameState.gridSize = data.gridSize;
        
        // Drone (Merge to keep state prop safe if missing)
        if (data.drone) {
            gameState.drone.x = data.drone.x ?? 0;
            gameState.drone.y = data.drone.y ?? 0;
            gameState.drone.inventory = data.drone.inventory || {};
            gameState.drone.inventoryCapacity = data.drone.inventoryCapacity || 10;
            gameState.drone.speedMultiplier = data.drone.speedMultiplier || 1;
        }

        if (data.botFarm) {
            gameState.botFarm = data.botFarm;
            // Ensure defaults if fields added later
            if (!gameState.botFarm.robots) gameState.botFarm.robots = [];
            if (!gameState.botFarm.maxRobots) gameState.botFarm.maxRobots = 2;
        }

        if (data.farmResources) gameState.farmResources = data.farmResources;
        
        if (data.waterCapacity) gameState.waterCapacity = data.waterCapacity;
        if (data.rainChance) gameState.rainChance = data.rainChance;
        if (data.unlockedCrops) gameState.unlockedCrops = data.unlockedCrops;
        if (data.dropChances) gameState.dropChances = data.dropChances;
        if (data.doubleHarvestChance) gameState.doubleHarvestChance = data.doubleHarvestChance;
        if (data.codeFeatures) gameState.codeFeatures = data.codeFeatures;
        if (data.userCode) gameState.userCode = data.userCode;
        if (data.activeTab) gameState.activeTab = data.activeTab;
        
        // Restore Upgrades (Visual Unlocked State)
        if (data.unlockedUpgradeIds && Array.isArray(data.unlockedUpgradeIds)) {
            data.unlockedUpgradeIds.forEach(id => {
                if (gameState.upgrades[id]) {
                    gameState.upgrades[id].unlocked = true;
                }
            });
        }
        
        return true;
    } catch (e) {
        console.error("Erro ao carregar save:", e);
        return false;
    }
}

export function resetGame() {
    if (confirm("Tem certeza que deseja apagar todo o progresso e reiniciar?")) {
        localStorage.removeItem("theFarmerPro_Data");
        location.reload();
    }
}
