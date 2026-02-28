import {
  initializeUpgrades,
  initializeGrid,
  gameState,
  saveGame,
  loadGame,
  resetGame,
} from "./js/state.js";
import * as UI from "./js/ui.js";
import {
  gameLoop,
  toggleCodeExecution,
  handleBuyUpgrade,
  buyRobot,
  sellRobot,
  toggleRobot,
} from "./js/game.js";
import { API } from "./js/api.js";

window.sellBotCallback = sellRobot; // Expose to window for inline onclick HTML

document.addEventListener("DOMContentLoaded", () => {
  // 1. Init Data
  initializeUpgrades();
  initializeGrid();

  // Load Save
  if (loadGame()) {
    UI.logToConsole("💾 Jogo carregado com sucesso!", "info");
  } else {
    UI.logToConsole("Sistema carregado. Bem-vindo à Fazenda Pro.", "info");
  }

  // 2. Init UI
  UI.initSettingsListeners(); // Init Settings
  UI.renderTabs();
  UI.renderInventoryDrawer();
  UI.render(); // Initial Render
  UI.initViewportInteractions(); // Init Pan/Zoom
  UI.updateDroneVisualPosition(
    gameState.drone.x,
    gameState.drone.y,
    gameState.gridSize.width,
    gameState.gridSize.height,
    false,
  );

  // 3. Bind Global Events

  // Persistence
  if (UI.resetBtn) UI.resetBtn.addEventListener("click", resetGame);

  // Auto-Save Loop (10s)
  setInterval(() => {
    saveGame();
  }, 10000);

  // Safety Render (1s)
  setInterval(() => UI.render(), 1000);

  // Run / Stop
  UI.runBtn.addEventListener("click", () => toggleCodeExecution(API));

  // Inventory Drawer
  UI.inventoryFab.addEventListener("click", UI.toggleInventory);
  UI.closeInventoryBtn.addEventListener("click", UI.toggleInventory);
  UI.initDeleteModalListeners(); // Bind Delete Modal Events

  // Tech Tree Modal
  let activeTechTab = "land";
  UI.techBtn.addEventListener("click", () => {
    UI.techModal.classList.add("open"); // Using 'open' class for opacity logic now
    UI.techModal.classList.remove("hidden", "opacity-0"); // Keep compatibility if CSS specific
    UI.updateTechModalContent(activeTechTab, handleBuyUpgradeWrapper);
  });

  UI.closeModalBtn.addEventListener("click", () => {
    UI.techModal.classList.remove("open");
    UI.techModal.classList.add("hidden");
  });

  // Close on click outside (Tech Modal)
  UI.techModal.addEventListener("click", (e) => {
    if (e.target === UI.techModal) {
      UI.techModal.classList.remove("open");
      UI.techModal.classList.add("hidden");
    }
  });

  // Tech Tabs
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".tab-btn")
        .forEach((b) =>
          b.classList.remove(
            "active",
            "text-accent-primary",
            "border-b-2",
            "border-accent-primary",
          ),
        );
      btn.classList.add(
        "active",
        "text-accent-primary",
        "border-b-2",
        "border-accent-primary",
      );
      activeTechTab = btn.dataset.tab;
      UI.updateTechModalContent(activeTechTab, handleBuyUpgradeWrapper);
    });
  });

  // Help Modal
  UI.helpBtn.addEventListener("click", () => {
    UI.helpModal.classList.add("open");
    UI.helpModal.classList.remove("hidden");
    UI.renderFunctionList();
  });
  UI.closeHelpModalBtn.addEventListener("click", () => {
    UI.helpModal.classList.remove("open");
    UI.helpModal.classList.add("hidden");
  });

  // Close on click outside (Help Modal)
  UI.helpModal.addEventListener("click", (e) => {
    if (e.target === UI.helpModal) {
      UI.helpModal.classList.remove("open");
      UI.helpModal.classList.add("hidden");
    }
  });

  // --- BOTS MODAL LOGIC ---
  // --- BOTS MODAL LOGIC ---
  function toggleBotOperation() {
    gameState.botFarm.isRunning = !gameState.botFarm.isRunning;
    UI.renderBotView(wrapperBuyRobot, toggleBotOperation);
    saveGame();
  }

  // Expose for UI innerHTML
  window.toggleBotCallback = toggleBotOperation;

  // Wrappers to refresh Bot View immediately
  function wrapperBuyRobot(type) {
    if (buyRobot(type)) {
      // If success
      UI.renderBotView(wrapperBuyRobot, toggleBotOperation); // Re-render modal
      saveGame();
    }
  }

  // Expose for UI innerHTML
  window.buyBotCallback = wrapperBuyRobot;

  // Wrapper for individual bot toggle
  window.toggleBotIdCallback = (id) => {
    toggleRobot(id); // Imported from game.js? Need to check imports
    UI.renderBotView(wrapperBuyRobot, toggleBotOperation);
    saveGame();
  };

  window.sellBotCallback = (index) => {
    sellRobot(index);
    UI.renderBotView(wrapperBuyRobot, toggleBotOperation);
    saveGame();
  };

  if (UI.botsBtn) {
    UI.botsBtn.addEventListener("click", () => {
      UI.botsModal.classList.add("open");
      UI.botsModal.classList.remove("hidden");
      UI.renderBotView(wrapperBuyRobot, toggleBotOperation);
    });
  }

  if (UI.closeBotsBtn) {
    UI.closeBotsBtn.addEventListener("click", () => {
      UI.botsModal.classList.remove("open");
      UI.botsModal.classList.add("hidden");
    });
  }

  // Close on click outside (Bots Modal)
  if (UI.botsModal) {
    UI.botsModal.addEventListener("click", (e) => {
      if (e.target === UI.botsModal) {
        UI.botsModal.classList.remove("open");
        UI.botsModal.classList.add("hidden");
      }
    });
  }

  // 4. Wrapper for Upgrades to refresh UI
  function handleBuyUpgradeWrapper(id) {
    const success = handleBuyUpgrade(id, null); // We don't pass tab, we handle UI refresh here
    if (success) {
      UI.renderTabs(); // In case we bought a console
      UI.updateTechModalContent(activeTechTab, handleBuyUpgradeWrapper);
      saveGame(); // I'll call it here.
    }
  }

  // 5. Start Loop
  requestAnimationFrame(gameLoop);
});
