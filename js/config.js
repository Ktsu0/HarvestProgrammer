export const TILE_UPDATE_SPEED = 300;
export const AUTO_RUN_DELAY = 1000; // Faster auto-run default

export const UPGRADE_CATEGORIES = {
  land: "Terreno",
  capacity: "Capacidade do Drone",
  speed: "Velocidade do Drone", // NEW
  robotics: "Robótica Avançada", // NEW category
  harvest: "Multiplicadores de Colheita",
  seeds: "Sementes",
  water: "Recipiente de Água",
  code: "Sistema & Consoles", // Renamed
  inventory: "Inventário (Gerenciar Itens)",
};

export const cropInfo = {
  WHEAT: {
    seed: "WHEAT_SEED",
    emoji: "🌾",
    seedEmoji: "🌱",
    growthTime: 1000,
    drops: "CARROT_SEED",
    name: "Trigo",
  },
  CARROT: {
    seed: "CARROT_SEED",
    emoji: "🥕",
    seedEmoji: "🌰",
    growthTime: 2000,
    drops: "POTATO_SEED", // Changed chain
    name: "Cenoura",
  },
  POTATO: {
    // NEW
    seed: "POTATO_SEED",
    emoji: "🥔",
    seedEmoji: "🟤",
    growthTime: 4000,
    drops: "BELL_PEPPER_SEED",
    name: "Batata",
  },
  BELL_PEPPER: {
    seed: "BELL_PEPPER_SEED",
    emoji: "🌶️",
    seedEmoji: "🌿",
    growthTime: 5000,
    drops: "CORN_SEED",
    name: "Pimentão",
  },
  CORN: {
    seed: "CORN_SEED",
    emoji: "🌽",
    seedEmoji: "🟡",
    growthTime: 8000,
    drops: "TURNIP_SEED",
    name: "Milho",
  },
  TURNIP: {
    // NEW
    seed: "TURNIP_SEED",
    emoji: "🧅",
    seedEmoji: "⚪",
    growthTime: 6000,
    drops: "TOMATO_SEED",
    name: "Nabo",
  },
  TOMATO: {
    seed: "TOMATO_SEED",
    emoji: "🍅",
    seedEmoji: "🔴",
    growthTime: 12000,
    drops: "PUMPKIN_SEED",
    name: "Tomate",
  },
  PUMPKIN: {
    // NEW
    seed: "PUMPKIN_SEED",
    emoji: "🎃",
    seedEmoji: "🔸",
    growthTime: 20000,
    drops: "WATERMELON_SEED",
    name: "Abóbora",
  },
  WATERMELON: {
    // NEW
    seed: "WATERMELON_SEED",
    emoji: "🍉",
    seedEmoji: "⚫",
    growthTime: 30000,
    drops: "STRAWBERRY_SEED",
    name: "Melancia",
  },
  STRAWBERRY: {
    // NEW (Endgame)
    seed: "STRAWBERRY_SEED",
    emoji: "🍓",
    seedEmoji: "∴",
    growthTime: 45000,
    drops: null,
    name: "Morango",
  },
};

export const dropMap = {
  WHEAT: "CARROT_SEED",
  CARROT: "POTATO_SEED",
  POTATO: "BELL_PEPPER_SEED",
  BELL_PEPPER: "CORN_SEED",
  CORN: "TURNIP_SEED",
  TURNIP: "TOMATO_SEED",
  TOMATO: "PUMPKIN_SEED",
  PUMPKIN: "WATERMELON_SEED",
  WATERMELON: "STRAWBERRY_SEED",
};

export const apiFunctionsData = {
  move: {
    signature: "move('N'|'S'|'E'|'W')",
    description: "Move o drone uma casa na direção especificada.",
    details: "Uso de energia: 0. Assíncrona. O mundo é esférico (Toro).",
  },
  till: {
    signature: "till()",
    description: "Ara a terra atual.",
    details: "Requer terra EMPTY. Assíncrona.",
  },
  plant: {
    signature: "plant('CULTURA')",
    description: "Planta uma semente.",
    details:
      "Requer sementes e terra TILLED. Assíncrona.<br><br><span class=\"text-white font-semibold\">Culturas disponíveis:</span> 'WHEAT', 'CARROT', 'POTATO', 'BELL_PEPPER', 'CORN', 'TURNIP', 'TOMATO', 'PUMPKIN', 'WATERMELON', 'STRAWBERRY'.",
  },
  harvest: {
    signature: "harvest()",
    description: "Colhe a planta atual.",
    details: "Requer planta GROWN. Assíncrona.",
  },
  water: {
    signature: "water()",
    description: "Rega a terra.",
    details: "Gasta 1 Água. Assíncrona.",
  },

  checkTile: {
    signature: "checkTile()",
    description: "Retorna o estado do bloco.",
    details: "Síncrona. Retorna 'EMPTY', 'TILLED', 'PLANTED', 'GROWN'.",
  },
  getItemCount: {
    signature: "getItemCount('ITEM')",
    description: "Retorna a quantidade de um item.",
    details: "Síncrona.",
  },
  buyUpgrade: {
    signature: "buyUpgrade('ID')",
    description: "Compra um upgrade automaticamente.",
    details: "Assíncrona.",
  },
  "console.log": {
    signature: "console.log(...args)",
    description: "Imprime no console do jogo.",
    details: "Síncrona.",
  },
};
