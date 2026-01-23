// app.js - Main entry point for Tesserack
import { Emulator } from './emulator.js';

console.log('Tesserack loading...');

// DOM elements
const romDrop = document.getElementById('rom-drop');
const romInput = document.getElementById('rom-input');
const gameCanvas = document.getElementById('game-canvas');
const statusText = document.getElementById('status-text');
const turboBtn = document.getElementById('turbo-btn');
const llmBtn = document.getElementById('llm-btn');
const stopBtn = document.getElementById('stop-btn');
const saveBtn = document.getElementById('save-btn');
const loadBtn = document.getElementById('load-btn');
const gameStateDiv = document.getElementById('game-state');

// Manual control buttons
const manualButtons = document.querySelectorAll('[data-btn]');
const turboABtn = document.getElementById('turbo-a-btn');

// State
let emulator = null;
let turboAInterval = null;
let savedState = null;

// ROM drop handling
romDrop.addEventListener('click', () => romInput.click());
romDrop.addEventListener('dragover', (e) => {
    e.preventDefault();
    romDrop.classList.add('dragover');
});
romDrop.addEventListener('dragleave', () => {
    romDrop.classList.remove('dragover');
});
romDrop.addEventListener('drop', (e) => {
    e.preventDefault();
    romDrop.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) loadROM(file);
});
romInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) loadROM(file);
});

async function loadROM(file) {
    statusText.textContent = `Loading ${file.name}...`;

    try {
        const buffer = await file.arrayBuffer();
        console.log('ROM loaded:', buffer.byteLength, 'bytes');

        // Create and initialize emulator
        emulator = new Emulator(gameCanvas);
        await emulator.loadROM(buffer);

        // Hide drop zone, show canvas
        romDrop.style.display = 'none';
        gameCanvas.style.display = 'block';

        // Enable buttons
        turboBtn.disabled = false;
        llmBtn.disabled = false;
        saveBtn.disabled = false;
        loadBtn.disabled = false;
        stopBtn.disabled = false;

        // Set up frame callback to update game state display
        emulator.frameCallback = updateGameStateDisplay;

        // Start emulator display loop
        emulator.start();

        statusText.textContent = 'ROM loaded! Use controls or click Turbo/LLM to start AI.';
        updateGameStateDisplay();
    } catch (err) {
        statusText.textContent = `Error: ${err.message}`;
        console.error('Failed to load ROM:', err);
    }
}

// Update game state display (basic info for now)
function updateGameStateDisplay() {
    if (!emulator) {
        gameStateDiv.textContent = 'Waiting for ROM...';
        return;
    }

    // Read some basic Pokemon Red memory locations
    // These are well-known addresses for Pokemon Red
    try {
        const regs = emulator.getRegisters();

        // Pokemon Red specific addresses (example)
        // 0xD163 = Player X position in map
        // 0xD164 = Player Y position in map
        // 0xD35E = Current map ID
        const playerX = emulator.readMemory(0xD362);
        const playerY = emulator.readMemory(0xD361);
        const mapId = emulator.readMemory(0xD35E);

        gameStateDiv.innerHTML = `
            <div>PC: 0x${regs.PC.toString(16).toUpperCase().padStart(4, '0')}</div>
            <div>Map: ${mapId} | Pos: (${playerX}, ${playerY})</div>
        `;
    } catch (e) {
        gameStateDiv.textContent = 'Emulator running...';
    }
}

// Button handlers
turboBtn.addEventListener('click', () => {
    statusText.textContent = 'Turbo mode running... (AI not yet implemented)';
    // TODO: Start turbo mode with random/heuristic inputs
});

llmBtn.addEventListener('click', () => {
    statusText.textContent = 'LLM mode... (WebLLM not yet integrated)';
    // TODO: Start LLM-driven mode
});

stopBtn.addEventListener('click', () => {
    if (emulator) {
        emulator.stop();
        statusText.textContent = 'Emulator stopped';
    }
    // Stop turbo A if running
    if (turboAInterval) {
        clearInterval(turboAInterval);
        turboAInterval = null;
    }
});

saveBtn.addEventListener('click', () => {
    if (emulator) {
        try {
            savedState = emulator.saveState();
            // Also save to localStorage
            localStorage.setItem('tesserack_savestate', JSON.stringify(Array.from(savedState)));
            statusText.textContent = 'State saved!';
        } catch (e) {
            statusText.textContent = `Save failed: ${e.message}`;
            console.error('Save state error:', e);
        }
    }
});

loadBtn.addEventListener('click', () => {
    if (emulator) {
        try {
            // Try to load from memory first, then localStorage
            let stateToLoad = savedState;
            if (!stateToLoad) {
                const stored = localStorage.getItem('tesserack_savestate');
                if (stored) {
                    stateToLoad = new Uint8Array(JSON.parse(stored));
                }
            }

            if (stateToLoad) {
                emulator.loadState(stateToLoad);
                statusText.textContent = 'State loaded!';
            } else {
                statusText.textContent = 'No saved state found';
            }
        } catch (e) {
            statusText.textContent = `Load failed: ${e.message}`;
            console.error('Load state error:', e);
        }
    }
});

// Manual controls handling
manualButtons.forEach(btn => {
    const buttonName = btn.dataset.btn;

    // Mouse events
    btn.addEventListener('mousedown', () => {
        if (emulator) emulator.setButton(buttonName, true);
    });
    btn.addEventListener('mouseup', () => {
        if (emulator) emulator.setButton(buttonName, false);
    });
    btn.addEventListener('mouseleave', () => {
        if (emulator) emulator.setButton(buttonName, false);
    });

    // Touch events for mobile
    btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (emulator) emulator.setButton(buttonName, true);
    });
    btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        if (emulator) emulator.setButton(buttonName, false);
    });
});

// Turbo A button
turboABtn.addEventListener('mousedown', () => {
    if (emulator && !turboAInterval) {
        turboAInterval = setInterval(() => {
            emulator.pressButton('a', 50);
        }, 100);
    }
});
turboABtn.addEventListener('mouseup', () => {
    if (turboAInterval) {
        clearInterval(turboAInterval);
        turboAInterval = null;
    }
});
turboABtn.addEventListener('mouseleave', () => {
    if (turboAInterval) {
        clearInterval(turboAInterval);
        turboAInterval = null;
    }
});

// Keyboard controls
const keyMap = {
    'ArrowUp': 'up',
    'ArrowDown': 'down',
    'ArrowLeft': 'left',
    'ArrowRight': 'right',
    'KeyZ': 'b',
    'KeyX': 'a',
    'Enter': 'start',
    'ShiftRight': 'select',
    'Tab': 'select'
};

window.addEventListener('keydown', (e) => {
    if (emulator && keyMap[e.code]) {
        e.preventDefault();
        emulator.setButton(keyMap[e.code], true);
    }
});

window.addEventListener('keyup', (e) => {
    if (emulator && keyMap[e.code]) {
        e.preventDefault();
        emulator.setButton(keyMap[e.code], false);
    }
});

console.log('Tesserack ready');
