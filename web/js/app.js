// app.js - Main entry point
console.log('Tesserack loading...');

// DOM elements
const romDrop = document.getElementById('rom-drop');
const romInput = document.getElementById('rom-input');
const gameCanvas = document.getElementById('game-canvas');
const statusText = document.getElementById('status-text');

// State
let romLoaded = false;

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
    const buffer = await file.arrayBuffer();
    console.log('ROM loaded:', buffer.byteLength, 'bytes');

    // TODO: Initialize emulator with ROM
    romLoaded = true;
    romDrop.style.display = 'none';
    gameCanvas.style.display = 'block';
    statusText.textContent = 'ROM loaded. Loading AI model...';

    // TODO: Initialize WebLLM
}

console.log('Tesserack ready');
