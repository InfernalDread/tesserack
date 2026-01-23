# Tesserack

**AI learns to play Pokemon Red entirely in your browser.**

No servers. No API keys. Just WebGPU, neural networks, and nostalgia.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://sidmohan0.github.io/tesserack/)
[![Built with SvelteKit](https://img.shields.io/badge/built%20with-SvelteKit-ff3e00)](https://kit.svelte.dev/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

![Tesserack Screenshot](https://via.placeholder.com/800x400?text=Tesserack+Demo)

## What is this?

Tesserack is an experiment in browser-based AI gaming. It combines:

- **WebGPU LLM Inference** — Runs Qwen 2.5 1.5B locally in your browser
- **In-Browser Neural Network Training** — TensorFlow.js trains a policy network as you play
- **Reinforcement Learning** — Auto-discovers rewards from game events (badges, Pokemon, locations)
- **GameBoy Emulation** — Full Pokemon Red via WebAssembly

The AI starts with zero knowledge and learns through a combination of LLM reasoning and neural network pattern recognition.

## Try It

**[Launch Tesserack →](https://sidmohan0.github.io/tesserack/)**

Requirements:
- Chrome 113+ or Edge 113+ (WebGPU required)
- ~1.5GB download for AI model (cached after first load)
- A Pokemon Red ROM file (.gb)

## How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                        TESSERACK ARCHITECTURE                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │   WebGPU    │    │ TensorFlow  │    │   WASM      │         │
│  │    LLM      │───▶│    .js      │───▶│  Emulator   │         │
│  │  (Qwen 2.5) │    │   Policy    │    │  (binjgb)   │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│        │                  ▲                   │                 │
│        │                  │                   │                 │
│        ▼                  │                   ▼                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │   Generate  │    │   Train on  │    │    Game     │         │
│  │   3 Plans   │    │ Experiences │◀───│    State    │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

1. **LLM generates candidate action plans** based on game state
2. **Neural network scores plans** using learned patterns
3. **Best plan executes** on the emulator
4. **Rewards computed** from game events (new area = +200, badge = +1000)
5. **Experience stored** for training
6. **Auto-training triggers** at 3k, 7k, 15k, 30k steps
7. **Model improves** with each training cycle

## Features

### Three Modes
- **Watch AI** — LLM + neural network plays autonomously
- **Train** — Random exploration to collect training data
- **Play** — Manual control with keyboard/buttons

### Adaptive Reward System
- Auto-discovers checkpoints (badges, Pokemon, locations)
- LLM generates verifiable progress tests
- Visual checkpoint matching with screenshots
- No manual reward engineering needed

### In-Browser Training
- TensorFlow.js trains policy network locally
- Model persists to IndexedDB between sessions
- Progressive improvement: untrained → trained → refined

### Modern Stack
- SvelteKit for clean component architecture
- Lucide icons for professional UI
- Svelte stores for reactive state management
- Static deployment (Vercel/GitHub Pages)

## Development

```bash
# Clone the repo
git clone https://github.com/sidmohan0/tesserack.git
cd tesserack

# Run the SvelteKit version
cd svelte-app
npm install
npm run dev

# Or run the vanilla JS version
cd web
# Serve with any static server
npx serve .
```

## Project Structure

```
tesserack/
├── svelte-app/              # SvelteKit rewrite (recommended)
│   ├── src/
│   │   ├── lib/
│   │   │   ├── components/  # UI components
│   │   │   ├── stores/      # Svelte stores
│   │   │   └── core/        # Game logic modules
│   │   └── routes/          # SvelteKit pages
│   └── static/              # Emulator WASM
├── web/                     # Original vanilla JS version
└── README.md
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | SvelteKit |
| LLM Inference | WebLLM (WebGPU) |
| Neural Network | TensorFlow.js |
| Emulator | binjgb (WASM) |
| Icons | Lucide |
| Deployment | Vercel / GitHub Pages |

## Research Inspiration

This project explores ideas from recent AI research:

- **RLVR** (Reinforcement Learning from Verifiable Rewards) — Using objective game state for rewards
- **LLM-Generated Tests** — Inspired by OlmOCR-2's approach to synthetic reward functions
- **Hybrid LLM + RL** — Combining reasoning (LLM) with pattern recognition (neural net)

## Roadmap

- [x] WebGPU LLM inference
- [x] In-browser neural network training
- [x] Auto-discovery reward system
- [x] SvelteKit rewrite
- [ ] Multi-game support
- [ ] Shareable trained models
- [ ] Battle strategy specialization

## Contributing

Contributions welcome! Some ideas:

- Improve the reward function
- Add more visual checkpoint types
- Optimize training hyperparameters
- Support other Pokemon games

## License

MIT — do whatever you want with it.

---

Built by [@sidmohan0](https://github.com/sidmohan0) with help from Claude.
