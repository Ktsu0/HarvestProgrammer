import { gameState } from "./state.js";
import { cropInfo, apiFunctionsData } from "./config.js";

const TILE_SIZE = 100; // Increased size
const GAP_SIZE = 12; // Explicit gap
export const viewState = {
  zoom: 1,
  panX: 0,
  panY: 0,
  isDragging: false,
  lastX: 0,
  isDragging: false,
  lastX: 0,
  lastY: 0,
  autoCloseInventory: true, // Default true
};
export const gameViewportEl = document.querySelector(".game-viewport");

// DOM Elements
export const farmGridEl = document.getElementById("farm-grid");
export const droneEl = document.getElementById("drone-el");
export const consoleOutputEl = document.getElementById("console-output");
export const runBtn = document.getElementById("run-btn");
export const resetBtn = document.getElementById("reset-btn");
export const techBtn = document.getElementById("tech-btn");
export const helpBtn = document.getElementById("help-btn");
export const codeEditor = document.getElementById("code-editor");
export const upgradesListEl = document.getElementById("upgrades-list");
export const techModal = document.getElementById("tech-modal");
export const closeModalBtn = document.getElementById("close-modal-btn");
export const helpModal = document.getElementById("help-modal");
export const closeHelpModalBtn = document.getElementById(
  "close-help-modal-btn",
);
export const functionListEl = document.getElementById("function-list");
export const functionDetailsEl = document.getElementById("function-details");

// New UI Elements
export const tabBar = document.getElementById("tab-bar");
export const inventoryFab = document.getElementById("inventory-fab");
export const inventoryDrawer = document.getElementById("inventory-drawer");
export const inventoryContent = document.getElementById("inventory-content");
export const closeInventoryBtn = document.getElementById("close-inventory-btn");
export const droneStatusContent = document.getElementById(
  "drone-status-content",
);

// Delete Modal Elements
export const deleteModal = document.getElementById("delete-modal");
export const deleteSlider = document.getElementById("delete-slider");
export const deleteInput = document.getElementById("delete-input");
export const deleteConfirm = document.getElementById("delete-confirm-btn");
export const deleteCancel = document.getElementById("delete-cancel-btn");
export const deleteIcon = document.getElementById("delete-item-icon");
export const deleteName = document.getElementById("delete-item-name");

// Bot Elements
export const botsBtn = document.getElementById("bots-btn");
export const botsModal = document.getElementById("bots-modal");
export const closeBotsBtn = document.getElementById("close-bots-btn");
export const toggleBotsBtn = document.getElementById("toggle-bots-btn");
export const activeBotsGrid = document.getElementById("active-bots-grid");
export const botShopGrid = document.getElementById("bot-shop-grid");
export const botCapacityDisplay = document.getElementById(
  "bot-capacity-display",
);
export const botStatusBadge = document.getElementById("bot-status-badge");

let currentDeleteItem = null;

// --- Initialize DOM listeners for settings ---
export function initSettingsListeners() {
  const cb = document.getElementById("auto-close-inventory-checkbox");
  if (cb) {
    cb.addEventListener("change", (e) => {
      viewState.autoCloseInventory = e.target.checked;
    });
    // Sync initial state
    viewState.autoCloseInventory = cb.checked;
  }

  // Outside click listener for inventory
  document.addEventListener("click", (e) => {
    if (!viewState.autoCloseInventory) return;

    // If inventory is open
    if (inventoryDrawer.classList.contains("open")) {
      // Check if click is outside drawer AND outside the FAB that opens it
      // Also need to ignore if clicking checkbox itself (handled natively)
      if (
        !inventoryDrawer.contains(e.target) &&
        !inventoryFab.contains(e.target)
      ) {
        toggleInventory();
      }
    }
  });
}

// --- Tabs Logic ---
export function renderTabs() {
  tabBar.innerHTML = "";
  // Only render tabs that are unlocked
  for (let i = 1; i <= gameState.codeFeatures.tabs; i++) {
    const btn = document.createElement("button");
    // Active class logic remains
    btn.className = `code-tab ${gameState.activeTab === i ? "active" : ""}`;

    // Simple label, no lock icon needed since we hide locked ones
    btn.innerHTML = `<span class="text-xs">Console</span> ${i}`;

    btn.onclick = () => {
      // Save current code
      gameState.userCode[gameState.activeTab] = codeEditor.value;
      // Switch tab
      gameState.activeTab = i;
      codeEditor.value = gameState.userCode[i];
      renderTabs(); // Re-render to update active state
    };
    tabBar.appendChild(btn);
  }
  // Ensure editor shows current active tab's code
  if (codeEditor.value !== gameState.userCode[gameState.activeTab]) {
    codeEditor.value = gameState.userCode[gameState.activeTab] || "";
  }
}

// --- Inventory Drawer ---
export function toggleInventory() {
  inventoryDrawer.classList.toggle("open");
  renderInventoryDrawer();
}

export function renderInventoryDrawer() {
  inventoryContent.innerHTML = "";

  // Helper to create row
  const createRow = (k, v, isSeed) => {
    const info = cropInfo[isSeed ? k.replace("_SEED", "") : k];
    const emoji = isSeed ? info?.seedEmoji || "🌱" : info?.emoji || "❓";
    const name = info?.name || k;
    const color = isSeed ? "text-yellow-400" : "text-green-400";

    const row = document.createElement("div");
    row.className =
      "bg-[#27272a] p-2 rounded flex items-center border border-[#3f3f46] mb-2";
    row.innerHTML = `
            <span class="text-xl w-8 text-center flex-shrink-0">${emoji}</span>
            <span class="text-sm font-bold text-white uppercase flex-grow text-center mx-2">${name}</span>
            <div class="flex items-center gap-3 flex-shrink-0">
                <span class="${color} font-mono font-bold">${v}</span>
            </div>
        `;

    // Trash Btn
    const trashBtn = document.createElement("button");
    trashBtn.textContent = "🗑️";
    trashBtn.className =
      "text-xs p-1 hover:bg-red-500/20 rounded transition-colors grayscale hover:grayscale-0 opacity-50 hover:opacity-100";
    trashBtn.title = "Descartar item";
    trashBtn.onclick = () => handleDiscard(k);

    row.lastElementChild.appendChild(trashBtn);
    return row;
  };

  // 1. Resources
  const resources = Object.entries(gameState.farmResources).filter(
    ([k, v]) => v > 0 && !k.includes("SEED") && k !== "WATER",
  );
  if (resources.length > 0) {
    const h3 = document.createElement("h3");
    h3.className = "text-lg font-bold text-white mb-2 mt-4";
    h3.textContent = "Colheitas";
    inventoryContent.appendChild(h3);

    const grid = document.createElement("div");
    grid.className = "grid grid-cols-1 gap-1"; // Use col-1 for better trash access? Or col-2.
    // col-1 is safer for "row" layout.
    resources.forEach(([k, v]) => grid.appendChild(createRow(k, v, false)));
    inventoryContent.appendChild(grid);
  }

  // 2. Seeds
  const seeds = Object.entries(gameState.farmResources).filter(
    ([k, v]) => v > 0 && k.includes("SEED"),
  );
  if (seeds.length > 0) {
    const h3 = document.createElement("h3");
    h3.className = "text-lg font-bold text-white mb-2 mt-6";
    h3.textContent = "Sementes";
    inventoryContent.appendChild(h3);

    const grid = document.createElement("div");
    grid.className = "grid grid-cols-1 gap-1";
    seeds.forEach(([k, v]) => grid.appendChild(createRow(k, v, true)));
    inventoryContent.appendChild(grid);
  }
}

export function handleDiscard(itemType, amount = null) {
  const current = gameState.farmResources[itemType] || 0;
  if (current <= 0) return;

  let qty = amount;
  if (qty === null) {
    // Open Custom Modal instead of Prompt
    openDeleteModal(itemType);
    return;
  }

  if (isNaN(qty) || qty <= 0) return;

  // Logic
  if (gameState.farmResources[itemType] >= qty) {
    gameState.farmResources[itemType] -= qty;

    // Drone sync
    if (cropInfo[itemType] && !itemType.endsWith("_SEED")) {
      gameState.drone.inventory[itemType] = Math.max(
        0,
        (gameState.drone.inventory[itemType] || 0) - qty,
      );
      if (gameState.drone.inventory[itemType] === 0)
        delete gameState.drone.inventory[itemType];
    }

    logToConsole(`🗑️ Descartado ${qty}x ${itemType}`, "warn");
    renderInventoryDrawer();
    renderDroneStatus();
    render(); // Update tech tree buttons state etc
  } else {
    logToConsole("Erro: Quantidade insuficiente.", "error");
  }
}

export function renderDroneStatus() {
  const invCount = Object.values(gameState.drone.inventory).reduce(
    (a, b) => a + b,
    0,
  );

  droneStatusContent.innerHTML = `
        <div class="flex flex-col gap-2">
            <div class="flex justify-between items-center bg-[#27272a] p-2 rounded">
                <span class="text-gray-400 text-sm">Posição</span>
                <span class="font-mono text-accent-primary">(${gameState.drone.x}, ${gameState.drone.y})</span>
            </div>
            <div class="flex justify-between items-center bg-[#27272a] p-2 rounded">
                <span class="text-gray-400 text-sm">Carga</span>
                <span class="font-mono ${invCount >= gameState.drone.inventoryCapacity ? "text-red-500" : "text-white"}">
                    ${invCount} / ${gameState.drone.inventoryCapacity}
                </span>
            </div>
            <div class="flex justify-between items-center bg-[#27272a] p-2 rounded">
                <span class="text-gray-400 text-sm">Água</span>
                <span class="font-mono text-blue-400">${gameState.farmResources.WATER} / ${gameState.waterCapacity}</span>
            </div>
        </div>
        
        <div class="mt-4">
            <p class="text-xs text-gray-500 uppercase font-bold mb-1">Conteúdo do Drone</p>
            <div class="flex flex-wrap gap-1">
                ${Object.entries(gameState.drone.inventory)
                  .map(
                    ([k, v]) => `
                    <span class="px-2 py-1 bg-[#3f3f46] rounded text-xs text-white">
                        ${cropInfo[k]?.emoji || ""} ${v}
                    </span>
                `,
                  )
                  .join("")}
            </div>
        </div>
    `;
}

// --- Main Render ---
export function render() {
  const { width, height } = gameState.gridSize;

  // Auto-fit grid cells
  // Maximum viewport size ~ 600px -> calculate PX per tile
  // OR use CSS grid with 'fr' and let container handle it.

  farmGridEl.style.gridTemplateColumns = `repeat(${width}, 1fr)`;
  farmGridEl.style.gridTemplateRows = `repeat(${height}, 1fr)`;
  farmGridEl.style.gap = `${GAP_SIZE}px`;

  // Fixed Sizing for Pan/Zoom (Account for gaps)
  // TILE_SIZE is the content, plus gaps between them
  const totalW = width * TILE_SIZE + Math.max(0, width - 1) * GAP_SIZE;
  const totalH = height * TILE_SIZE + Math.max(0, height - 1) * GAP_SIZE;

  farmGridEl.style.width = `${totalW}px`;
  farmGridEl.style.height = `${totalH}px`;

  // Initial centering if first run or just update
  updateViewportTransform();

  farmGridEl.innerHTML = "";
  farmGridEl.appendChild(droneEl); // Preserve drone

  gameState.grid.forEach((row, y) => {
    row.forEach((tileData, x) => {
      const tile = document.createElement("div");
      tile.className = "tile";
      tile.classList.add(tileData.state.toLowerCase());
      if (tileData.watered) tile.classList.add("watered");

      const createCluster = (emoji) => {
        return `<div class="crop-cluster">
                    ${Array(9).fill(`<span>${emoji}</span>`).join("")}
                </div>`;
      };

      if (tileData.state === "PLANTED") {
        const info = cropInfo[tileData.crop];
        tile.innerHTML = createCluster(info?.seedEmoji || "🌱");
      } else if (tileData.state === "GROWN") {
        const emoji = cropInfo[tileData.crop]?.emoji || "?";
        tile.innerHTML = createCluster(emoji);
      }

      // Add tooltip
      tile.title = `(${x},${y}) ${tileData.state}`;
      farmGridEl.appendChild(tile);
    });
  });

  renderDroneStatus();
  renderInventoryDrawer(); // Update live if open

  // Update Tech Button state
  const canBuy = Object.keys(gameState.upgrades).some((id) => {
    const up = gameState.upgrades[id];
    if (up.unlocked) return false;
    return Object.keys(up.cost).every(
      (item) => gameState.farmResources[item] >= up.cost[item],
    );
  });

  techBtn.classList.toggle("animate-pulse", canBuy);
  if (canBuy) techBtn.style.borderColor = "var(--accent-warning)";
  else techBtn.style.borderColor = "var(--border-color)";

  // Run Btn
  runBtn.disabled = gameState.isRunning && !gameState.isAutoRunning;
  runBtn.textContent = gameState.isAutoRunning
    ? "PARAR (Auto)"
    : gameState.isRunning
      ? "Executando..."
      : "EXECUTAR";
  runBtn.className = gameState.isAutoRunning
    ? "btn btn-danger w-full"
    : "btn btn-primary w-full";

  // Bots Btn Visibility
  if (gameState.botFarm.unlocked) {
    botsBtn.classList.remove("hidden");
  } else {
    botsBtn.classList.add("hidden");
  }
}

// Log
export function logToConsole(msg, type = "log") {
  const p = document.createElement("p");
  p.textContent = `> ${msg}`;
  p.style.color =
    type === "error"
      ? "#ef4444"
      : type === "warn"
        ? "#f59e0b"
        : type === "info"
          ? "#3b82f6"
          : "#a1a1aa";
  consoleOutputEl.appendChild(p);
  consoleOutputEl.scrollTop = consoleOutputEl.scrollHeight;
}

// --- Drone Visuals ---
let droneAnimationTimeout = null;

export function setDroneState(state) {
  const visualEl = document.getElementById("drone-visual");
  if (!visualEl) return;

  // Reset classes
  visualEl.classList.remove("anim-idle", "anim-walk", "anim-action");

  // Add new class
  if (state === "walk") visualEl.classList.add("anim-walk");
  else if (state === "action") visualEl.classList.add("anim-action");
  else visualEl.classList.add("anim-idle");
}

export function updateDroneVisualPosition(
  x,
  y,
  width,
  height,
  animated = true,
) {
  const gridEl = farmGridEl;
  // Fallback or retry if size is 0 (layout not ready)
  if (!gridEl.clientWidth) {
    setTimeout(() => updateDroneVisualPosition(x, y, width, height, false), 50);
    return;
  }

  // Ensure we have tile dims
  const tileW = gridEl.clientWidth / width;
  const tileH = gridEl.clientHeight / height; // gridEl.clientHeight might be 0 if dynamic?
  // farm-grid has aspect-ratio: 1/1, so height should match width ideally?
  // But css: max-height: 95%.
  // Safest: Use tileW for both if square?
  // Let's use computed dimension.

  // Responsive size? No, fixed TILE_SIZE now
  // But we still want drone to look good inside the tile.
  const fitSize = TILE_SIZE * 0.75; // Slightly smaller than tile for aesthetics
  droneEl.style.width = `${fitSize}px`;
  droneEl.style.height = `${fitSize}px`;

  // Position logic: (x * STRIDE) + offset
  // Stride = TILE_SIZE + GAP_SIZE
  // Centered in tile: + (TILE_SIZE - fitSize)/2
  const stride = TILE_SIZE + GAP_SIZE;
  const xPos = x * stride + (TILE_SIZE - fitSize) / 2;
  const yPos = y * stride + (TILE_SIZE - fitSize) / 2;

  // Move
  const speed = 300 / (gameState.drone.speedMultiplier || 1);
  droneEl.style.transition = animated
    ? `transform ${speed / 1000}s linear`
    : "none";
  droneEl.style.transform = `translate(${xPos}px, ${yPos}px)`;

  // Animation
  if (animated) {
    setDroneState("walk");
    if (droneAnimationTimeout) clearTimeout(droneAnimationTimeout);
    droneAnimationTimeout = setTimeout(() => {
      setDroneState("idle");
    }, speed + 50);
  }
}
// Listen to resize to keep drone aligned
window.addEventListener("resize", () => {
  if (gameState.drone) {
    updateDroneVisualPosition(
      gameState.drone.x,
      gameState.drone.y,
      gameState.gridSize.width,
      gameState.gridSize.height,
      false,
    );
  }
});

// --- Tech Tree (Adapted for UI) ---
export function renderTechTree(buyCallback) {
  // ... similar to previous but styled for new CSS
  // Use `gameState.upgrades`
  let html = "";
  // Filter by active tab in modal (implemented in event listener)
  // We will export a simpler renderer that main.js controls
}

export function updateTechModalContent(category, buyCallback) {
  upgradesListEl.innerHTML = "";
  const items = Object.entries(gameState.upgrades).filter(
    ([, u]) => u.category === category,
  );

  if (items.length === 0) {
    upgradesListEl.innerHTML = "<p class='p-4 text-gray-500'>Nada aqui.</p>";
    return;
  }

  items.forEach(([id, u]) => {
    const canAfford = Object.entries(u.cost).every(
      ([k, v]) => gameState.farmResources[k] >= v,
    );
    const costStr = Object.entries(u.cost)
      .map(([k, v]) => {
        const icon = cropInfo[k.replace("_SEED", "")]?.emoji || k;
        const clr =
          gameState.farmResources[k] >= v ? "text-green-400" : "text-red-400";
        return `<span class="${clr} flex items-center gap-1 font-bold">${v} ${icon}</span>`;
      })
      .join(" ");

    const btnClass = u.unlocked
      ? "opacity-50 cursor-not-allowed bg-green-900/40 text-green-400 border border-green-900/50"
      : canAfford
        ? "bg-gradient-to-r from-accent-primary to-purple-600 hover:from-purple-600 hover:to-accent-primary text-white shadow-lg shadow-purple-900/20 transform hover:-translate-y-0.5 transition-all"
        : "bg-gray-800 text-gray-500 opacity-50 cursor-not-allowed border border-gray-700";
    const btnText = u.unlocked ? "✅ Comprado" : "Comprar";

    const div = document.createElement("div");
    // Redesigned Card with modern aesthetics
    div.className =
      "p-5 bg-gradient-to-br from-[#18181b] to-[#27272a] rounded-xl flex justify-between items-center border border-[#3f3f46] hover:border-accent-primary/50 transition-colors shadow-md relative overflow-hidden group";

    // Subtle glow overlay on hover for a premium effect
    const glowOverlay = `<div class="absolute inset-0 bg-gradient-to-r from-accent-primary/0 via-accent-primary/5 to-accent-primary/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>`;

    div.innerHTML = `
            ${glowOverlay}
            <div class="z-10 relative pr-4 flex-grow">
                <h4 class="font-extrabold text-white text-lg mb-1 flex items-center gap-2">
                   ${u.name}
                   ${u.unlocked ? '<span class="text-[10px] bg-green-900/50 text-green-400 px-2 py-0.5 rounded-full uppercase tracking-wider">Adquirido</span>' : ""}
                </h4>
                <p class="text-sm text-gray-400 leading-relaxed">${u.description}</p>
                <div class="mt-3 text-xs font-mono bg-black/40 px-3 py-2 rounded-lg inline-flex gap-3 border border-white/5 items-center">
                    <span class="text-gray-500 uppercase tracking-wider text-[10px]">Custo:</span>
                    ${costStr}
                </div>
            </div>
            <button class="z-10 px-6 py-2.5 rounded-lg font-bold text-sm tracking-wide ${btnClass}" ${!canAfford || u.unlocked ? "disabled" : ""}>
                ${btnText}
            </button>
         `;
    if (canAfford && !u.unlocked) {
      div.querySelector("button").onclick = () => buyCallback(id);
    }
    upgradesListEl.appendChild(div);
  });
}

export function renderFunctionList() {
  functionListEl.innerHTML = "";
  Object.keys(apiFunctionsData).forEach((funcName) => {
    const btn = document.createElement("button");
    btn.className =
      "w-full text-left p-2 hover:bg-[#18181b] rounded text-sm text-gray-400 hover:text-white transition-colors border-b border-white/5";
    btn.textContent = funcName;
    btn.onclick = () => displayFunctionDetails(funcName);
    functionListEl.appendChild(btn);
  });
  // Load first by default
  displayFunctionDetails(Object.keys(apiFunctionsData)[0]);
}

export function displayFunctionDetails(funcName) {
  const data = apiFunctionsData[funcName];
  if (!data) return;

  functionDetailsEl.innerHTML = `
        <div class="h-full flex flex-col bg-gradient-to-br from-[#18181b] to-[#27272a] p-5 rounded-xl shadow-inner border border-white/5">
            <div class="mb-4 pb-4 border-b border-white/5">
                <h3 class="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-purple-400 mb-2">${funcName}</h3>
                <code class="block bg-black/50 p-3 rounded-lg text-sm text-yellow-400 font-mono shadow-inner border border-yellow-900/30">${data.signature}</code>
            </div>
            
            <p class="text-gray-300 leading-relaxed text-base mb-6 flex-grow">${data.description}</p>
            
            <div class="bg-black/30 p-4 rounded-xl border-l-[4px] border-accent-primary shadow-md">
                <h4 class="text-xs font-bold text-accent-primary uppercase tracking-widest mb-2 flex items-center gap-2">
                   Detalhes Adicionais
                </h4>
                <p class="text-sm text-gray-400 leading-relaxed">${data.details}</p>
            </div>
        </div>
    `;

  // Highlight active in list
  Array.from(functionListEl.children).forEach((btn) => {
    if (btn.textContent === funcName) {
      btn.className =
        "w-full text-left p-3 rounded-lg text-sm transition-all border-l-[3px] border-accent-primary bg-accent-primary/10 text-white font-bold";
    } else {
      btn.className =
        "w-full text-left p-3 rounded-lg text-sm transition-all border-l-[3px] border-transparent text-gray-400 hover:bg-white/5 hover:text-gray-200 block";
    }
  });
}

// --- Bot View ---
// --- Bot View ---
// --- Bot View ---
// --- Bot View ---
let currentBotTab = "active"; // 'active' or 'shop'

export function renderBotView(buyCallback, toggleCallback) {
  if (!botsModal) return;

  // 1. Update Header
  botStatusBadge.textContent = gameState.botFarm.isRunning
    ? "OPERACIONAL"
    : "PAUSADO";
  botStatusBadge.className = `text-xs px-2 py-1 rounded font-mono font-bold tracking-wider ${gameState.botFarm.isRunning ? "bg-emerald-900/50 text-emerald-400 border border-emerald-800" : "bg-red-900/50 text-red-400 border border-red-800"}`;

  // 2. Render Main Content
  const container = botsModal.querySelector(".modal-scrollable");
  if (!container) return;

  // Helper for cost display
  const tierMap = {
    WHEAT: 50,
    CARROT: 100,
    POTATO: 150,
    BELL_PEPPER: 200,
    CORN: 250,
    TURNIP: 300,
    TOMATO: 350,
    PUMPKIN: 400,
    WATERMELON: 450,
    STRAWBERRY: 500,
  };

  // Generate Grids HTML
  let contentHtml = "";

  if (currentBotTab === "active") {
    const activeBots = gameState.botFarm.robots.filter((b) => b.active);
    const inactiveBots = gameState.botFarm.robots.filter((b) => !b.active);

    // --- SECTION 1: ACTIVE LINE ---
    contentHtml += `<div class="mb-6 animate-fade-in">
            <h3 class="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Linha de Produção (${activeBots.length}/${gameState.botFarm.maxRobots})
            </h3>`;

    if (activeBots.length === 0) {
      contentHtml += `<div class="p-6 border border-dashed border-gray-700 rounded-lg text-center text-gray-500 text-sm">
                Nenhum robô operando no momento. <br>
                <span class="text-xs text-gray-600">Ative robôs do Armazém ou compre novos.</span>
            </div>`;
    } else {
      contentHtml += `<div class="grid grid-cols-2 md:grid-cols-4 gap-4">`;
      activeBots.forEach((bot) => {
        // Use original index? No, use ID for toggle.
        const info = cropInfo[bot.type];
        const pct = Math.min(
          100,
          ((bot.progress || 0) / info.growthTime) * 100,
        );
        // Find visible index in main array for selling? Or pass ID to sell?
        // Sell function currently takes Index. We should update sellRobot to take ID or find index by ID.
        // Assuming sellRobot(index) removes by index.
        // The index in gameState.botFarm.robots CHANGEs when we filter.
        // We MUST pass the TRUE index in the main array.
        const trueIndex = gameState.botFarm.robots.indexOf(bot);

        contentHtml += `
                    <div class="bg-[#18181b] p-3 rounded-lg border border-emerald-900/30 flex flex-col items-center gap-2 relative overflow-hidden group hover:border-emerald-500/50 transition-all shadow-lg shadow-emerald-900/10">
                        <div class="absolute bottom-0 left-0 h-1 bg-emerald-500 transition-all duration-300" style="width: ${pct}%"></div>
                        
                        <!-- Deactivate Button -->
                        <button class="absolute top-1 right-1 opacity-100 text-yellow-500 hover:text-white bg-black/60 rounded-full w-6 h-6 flex items-center justify-center hover:scale-110 transition-all" 
                                title="Desativar (Mover para Armazém)" 
                                onclick="window.toggleBotIdCallback(${bot.id})">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3 h-3"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12h-15" /></svg>
                        </button>

                        <div class="text-3xl mt-2 filter drop-shadow-lg">${info.emoji}</div>
                        <div class="text-center">
                            <span class="block text-xs font-bold text-white">BOT-${bot.type.substring(0, 3)}</span>
                            <span class="block text-[10px] text-emerald-400 font-mono">OPERANDO</span>
                        </div>
                    </div>`;
      });
      contentHtml += `</div>`;
    }
    contentHtml += `</div>`; // Close Section 1

    // --- SECTION 2: WAREHOUSE ---
    contentHtml += `<div class="animate-fade-in delay-75">
            <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-gray-600"></span>
                Armazém (${inactiveBots.length})
            </h3>`;

    if (inactiveBots.length === 0) {
      contentHtml += `<div class="p-6 border border-dashed border-gray-800 rounded-lg text-center text-gray-600 text-sm">
                Armazém vazio.
            </div>`;
    } else {
      contentHtml += `<div class="grid grid-cols-3 md:grid-cols-5 gap-3">`;
      inactiveBots.forEach((bot) => {
        const info = cropInfo[bot.type];
        const trueIndex = gameState.botFarm.robots.indexOf(bot);

        contentHtml += `
                     <div class="bg-[#09090b] p-2 rounded-lg border border-gray-800 flex flex-col items-center gap-1 relative group hover:border-gray-600 transition-colors opacity-75 hover:opacity-100">
                        
                        <!-- Activate Button -->
                        <button class="absolute top-1 right-1 text-emerald-500 hover:text-emerald-300 bg-gray-900 rounded-full w-5 h-5 flex items-center justify-center z-10" 
                                title="Ativar" 
                                onclick="window.toggleBotIdCallback(${bot.id})">
                           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3 h-3"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                        </button>
                        
                         <!-- Sell Button (Left) -->
                        <button class="absolute top-1 left-1 text-red-500 hover:text-red-300 bg-gray-900 rounded-full w-5 h-5 flex items-center justify-center z-10" 
                                title="Vender" 
                                onclick="window.sellBotCallback(${trueIndex})">
                           &times;
                        </button>

                        <div class="text-xl grayscale group-hover:grayscale-0 transition-all">${info.emoji}</div>
                        <span class="text-[10px] font-mono text-gray-500">ID:${Math.floor(bot.id).toString().slice(-3)}</span>
                    </div>`;
      });
      contentHtml += `</div>`;
    }
    contentHtml += `</div>`; // Close Section 2
  } else {
    // --- SHOP VIEW ---
    contentHtml = `<div class="grid grid-cols-2 md:grid-cols-3 gap-4 animate-fade-in">`;
    gameState.unlockedCrops.forEach((cropType) => {
      const info = cropInfo[cropType];

      // Calculate specific cost for this type
      const ownedStats = gameState.botFarm.robots.filter(
        (b) => b.type === cropType,
      ).length;
      const baseCost = tierMap[cropType] || 50;
      const nextCost = baseCost * (ownedStats + 1);

      const canAfford = (gameState.farmResources[cropType] || 0) >= nextCost;

      const btnClass = canAfford
        ? "bg-[#27272a] border-gray-600 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-900/20 cursor-pointer text-white"
        : "bg-[#09090b] border-gray-800 opacity-60 cursor-not-allowed text-gray-500";

      const costClass = canAfford ? "text-emerald-400" : "text-red-400";

      contentHtml += `
                <button class="p-4 rounded-lg border flex flex-col items-center gap-3 transition-all relative group ${btnClass}"
                        ${canAfford ? `onclick="window.buyBotCallback('${cropType}')"` : "disabled"}>
                    <div class="text-2xl group-hover:scale-110 transition-transform">${info.emoji}</div>
                    <div class="text-center w-full">
                        <div class="text-xs font-bold uppercase tracking-wider mb-1">Robô de ${info.name}</div>
                        <div class="text-xs font-mono bg-black/30 px-2 py-1 rounded ${costClass} w-full flex justify-between items-center">
                            <span>Price:</span>
                            <span>${nextCost} ${info.emoji}</span>
                        </div>
                        <div class="mt-1 text-[10px] text-gray-500">Você tem: ${ownedStats}</div>
                    </div>
                </button>`;
    });
    contentHtml += `</div>`;
  }

  // Full Template
  container.innerHTML = `
        <div class="p-6">
            <!-- Header & Stats -->
            <div class="flex justify-between items-center mb-6">
                 <div class="flex gap-4 items-center">
                    <div class="bg-[#27272a] px-4 py-2 rounded-lg border border-[#3f3f46]">
                        <span class="block text-[10px] text-gray-500 uppercase font-bold">Capacidade Operacional</span>
                        <span class="text-xl font-mono text-white">
                            ${gameState.botFarm.robots.filter((b) => b.active).length} 
                            <span class="text-gray-600">/</span> 
                            ${gameState.botFarm.maxRobots}
                        </span>
                    </div>
                 </div>
                 
                 <!-- Global Pause -->
                 <button class="flex items-center gap-2 px-4 py-2 rounded-lg transition-all border ${gameState.botFarm.isRunning ? "bg-red-500/10 text-red-400 border-red-900/50 hover:bg-red-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-900/50 hover:bg-emerald-500/20"}"
                    onclick="window.toggleBotCallback()">
                    ${gameState.botFarm.isRunning ? "⏸ PAUSAR FÁBRICA" : "▶ RETOMAR OPERAÇÕES"}
                 </button>
            </div>

            <!-- Tabs -->
            <div class="flex border-b border-gray-800 mb-6">
                <button class="px-6 py-3 text-sm font-bold border-b-2 transition-colors ${currentBotTab === "active" ? "text-white border-accent-primary" : "text-gray-500 border-transparent hover:text-gray-300"}" 
                        onclick="window.setBotTab('active')">
                    GERENCIAMENTO
                </button>
                <button class="px-6 py-3 text-sm font-bold border-b-2 transition-colors ${currentBotTab === "shop" ? "text-white border-accent-primary" : "text-gray-500 border-transparent hover:text-gray-300"}" 
                        onclick="window.setBotTab('shop')">
                    LOJA
                </button>
            </div>

            <!-- Content Area -->
            ${contentHtml}
        </div>
    `;

  if (!window.setBotTab) {
    window.setBotTab = (tab) => {
      currentBotTab = tab;
      renderBotView(buyCallback, toggleCallback);
    };
  }
}

// --- Delete Modal Logic ---
// --- Delete Modal Logic ---
export function openDeleteModal(item) {
  const modal = document.getElementById("delete-modal");
  const slider = document.getElementById("delete-slider");
  const input = document.getElementById("delete-input");
  const icon = document.getElementById("delete-item-icon");
  const nameStr = document.getElementById("delete-item-name");

  if (!modal) return;
  const count = gameState.farmResources[item] || 0;
  if (count <= 0) return;

  currentDeleteItem = item;
  const info = cropInfo[item.replace("_SEED", "")] || {};
  const emoji = item.includes("_SEED")
    ? info.seedEmoji || "🌱"
    : info.emoji || "📦";

  if (icon) icon.textContent = emoji;
  if (nameStr) nameStr.textContent = item.replace("_", " ");

  if (slider && input) {
    slider.max = count;
    slider.value = 1;
    input.max = count;
    input.value = 1;
  }

  modal.classList.remove("hidden");
  modal.classList.add("open");
}

export function closeDeleteModal() {
  const modal = document.getElementById("delete-modal");
  if (modal) {
    modal.classList.remove("open");
    modal.classList.add("hidden");
  }
  currentDeleteItem = null;
}

export function initDeleteModalListeners() {
  const slider = document.getElementById("delete-slider");
  const input = document.getElementById("delete-input");
  const cancel = document.getElementById("delete-cancel-btn");
  const confirm = document.getElementById("delete-confirm-btn");
  const modal = document.getElementById("delete-modal");

  if (!slider || !input || !confirm || !cancel || !modal) return;

  slider.addEventListener("input", (e) => {
    if (input) input.value = e.target.value;
  });
  input.addEventListener("input", (e) => {
    let val = parseInt(e.target.value);
    if (input.max && val > parseInt(input.max)) val = parseInt(input.max);
    if (val < 1) val = 1;
    input.value = val;
    if (slider) slider.value = val;
  });

  cancel.addEventListener("click", closeDeleteModal);

  confirm.addEventListener("click", () => {
    if (currentDeleteItem) {
      const qty = parseInt(input.value);
      handleDiscard(currentDeleteItem, qty);
      closeDeleteModal();
    }
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeDeleteModal();
  });
}

// --- Viewport Interactions ---
export function initViewportInteractions() {
  if (!gameViewportEl || !farmGridEl) return;

  // Zoom (Wheel)
  gameViewportEl.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const zoomSpeed = 0.001;
      const newZoom = viewState.zoom - e.deltaY * zoomSpeed;
      viewState.zoom = Math.min(Math.max(newZoom, 0.2), 3.0); // Clamp zoom 0.5x to 3x
      updateViewportTransform();
    },
    { passive: false },
  );

  // Pan (Drag)
  gameViewportEl.addEventListener("mousedown", (e) => {
    // Only allow left mouse button (0)
    if (e.button !== 0) return;

    e.preventDefault(); // Important: Prevent text selection or native image drag

    viewState.isDragging = true;
    viewState.lastX = e.clientX;
    viewState.lastY = e.clientY;
    gameViewportEl.style.cursor = "grabbing";
    document.body.style.cursor = "grabbing"; // Ensure cursor stays grabbing even if mouse leaves element momentarily
  });

  window.addEventListener("mousemove", (e) => {
    if (!viewState.isDragging) return;
    e.preventDefault();

    const dx = e.clientX - viewState.lastX;
    const dy = e.clientY - viewState.lastY;

    viewState.panX += dx;
    viewState.panY += dy;
    viewState.lastX = e.clientX;
    viewState.lastY = e.clientY;

    updateViewportTransform();
  });

  window.addEventListener("mouseup", () => {
    if (viewState.isDragging) {
      viewState.isDragging = false;
      gameViewportEl.style.cursor = "grab";
      document.body.style.cursor = "";
    }
  });
}

function updateViewportTransform() {
  // Clamp Pan to Keep Grid Visible
  const vpW = gameViewportEl.clientWidth;
  const vpH = gameViewportEl.clientHeight;

  // If not ready
  if (vpW === 0) return;

  // We rely on the explicitly set style width
  const gridW =
    parseInt(farmGridEl.style.width) || gameState.gridSize.width * TILE_SIZE;
  const gridH =
    parseInt(farmGridEl.style.height) || gameState.gridSize.height * TILE_SIZE;

  const scaledW = gridW * viewState.zoom;
  const scaledH = gridH * viewState.zoom;

  // Logic:
  // If Scaled Grid > Viewport: Clamp pan so edges trigger stop.
  // If Scaled Grid < Viewport: Center it.
  // clamp
  if (scaledW < vpW) {
    viewState.panX = (vpW - scaledW) / 2;
  } else {
    const minX = vpW - scaledW;
    const maxX = 0;
    viewState.panX = Math.min(Math.max(viewState.panX, minX), maxX);
  }

  if (scaledH < vpH) {
    viewState.panY = (vpH - scaledH) / 2;
  } else {
    const minY = vpH - scaledH;
    const maxY = 0;
    viewState.panY = Math.min(Math.max(viewState.panY, minY), maxY);
  }

  farmGridEl.style.transform = `translate(${viewState.panX}px, ${viewState.panY}px) scale(${viewState.zoom})`;
}

// This function is not in the provided snippet, but would need to be updated
// to use (TILE_SIZE + GAP_SIZE) for position calculations.
/*
export function updateDroneVisualPosition(drone) {
    const cellWidth = TILE_SIZE + GAP_SIZE;
    const cellHeight = TILE_SIZE + GAP_SIZE;
    drone.element.style.left = `${drone.x * cellWidth}px`;
    drone.element.style.top = `${drone.y * cellHeight}px`;
}
*/

// --- Resize Listener for Viewport ---
// Re-calculate bounds when window resizes
window.addEventListener("resize", () => {
  updateViewportTransform();
});
