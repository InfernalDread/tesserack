# Tesserack

AI that plays Pokemon Red using local LLMs.

## Browser Version

Try the fully client-side browser version at: https://sidmohan0.github.io/tesserack/

Runs entirely in your browser using WebGPU for LLM inference. No backend required!

## Features

- **Local LLM Integration** - Uses Ollama for on-device inference
- **Browser Version** - WebGPU-powered, runs entirely client-side
- **GameBoy Emulation** - Full Pokemon Red emulation
- **AI Agent** - LLM analyzes game state and decides actions
- **Multiple Modes** - Turbo mode for dialog, LLM mode for decisions

## Project Structure

```
tesserack/
  main.py               # Python CLI entry point
  agent/                # Python agent code
  llm/                  # Ollama LLM integration
  web/                  # Browser version (WebGPU + WASM)
```

## Quick Start (Browser)

1. Visit https://sidmohan0.github.io/tesserack/
2. Wait for AI model to download (~1.5GB, cached)
3. Drop your Pokemon Red ROM file
4. Click **Turbo** or **LLM** to start!

## Quick Start (Python)

```bash
# Install dependencies
pip install -r requirements.txt

# Start Ollama with a model
ollama run qwen2.5:1.5b

# Run the agent
python main.py
```

## Requirements

### Browser Version
- Chrome 113+ or Edge 113+ (WebGPU support)
- ~1.5GB for model download

### Python Version
- Python 3.8+
- Ollama running locally
- PyBoy for emulation

## License

MIT
