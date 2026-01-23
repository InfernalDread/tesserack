# Tesserack Web - AI Plays Pokemon (Browser Edition)

A fully client-side AI that plays Pokemon Red, running entirely in your browser using WebGPU.

## Features

- **WebGPU LLM Inference** - Qwen2.5-1.5B runs directly in your browser
- **GameBoy Emulation** - Full Pokemon Red emulation via binjgb
- **Turbo Mode** - Rapid button mashing for dialog/menus
- **LLM Mode** - AI decides 10 actions at a time
- **Co-pilot Controls** - Take over anytime with manual input
- **Persistent Saves** - Autosaves to localStorage

## Requirements

- Modern browser with WebGPU support (Chrome 113+, Edge 113+)
- ~1.5GB for model download (cached after first load)
- Your own Pokemon Red ROM file (.gb)

## Usage

1. Open the page
2. Wait for AI model to download (first time only)
3. Drop your Pokemon Red ROM file
4. Click **Turbo** or **LLM** to start!

## Controls

| Key | Action |
|-----|--------|
| Arrow Keys | D-pad |
| Z | A button |
| X | B button |
| Enter | Start |
| Shift | Select |

## Local Development

```bash
cd web
python -m http.server 8080
# Open http://localhost:8080
```

## Hosting

Deploy the `web/` folder to any static hosting:
- GitHub Pages
- Netlify
- Vercel
- Any web server

## Architecture

```
web/
  index.html          # Main HTML with UI scaffold
  style.css           # Styling
  js/
    app.js            # Main entry point, coordinates all modules
    emulator.js       # binjgb WASM wrapper
    memory-reader.js  # Pokemon Red memory reading
    llm.js            # WebLLM integration
    agent.js          # AI game agent logic
    action-parser.js  # Parse LLM responses to button presses
    storage.js        # localStorage save/load
  lib/
    binjgb.js         # GameBoy emulator
    binjgb.wasm       # Emulator WASM binary
```

## How It Works

1. **Emulator** - binjgb runs the Pokemon Red ROM in WASM
2. **Memory Reader** - Reads game state directly from emulator memory
3. **LLM** - Qwen2.5-1.5B analyzes game state and decides actions
4. **Agent** - Executes button presses and manages game flow
5. **Storage** - Saves progress to browser localStorage
