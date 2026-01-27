# Tesserack

Experimental reinforcement learning infrastructure for studying hierarchical task decomposition in game environments.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://sidmohan0.github.io/tesserack/)

> **Lab Mode (Experimental)**
> This repository contains experimental reinforcement learning infrastructure for studying credit assignment via deterministic reward specifications. Results are exploratory and configurations may change.

## Overview

Tesserack is a research test bed exploring hierarchical approaches to game-playing: a language model handles task decomposition while a policy network learns execution. The environment is Pokemon Red, chosen for its deterministic mechanics and well-documented memory layout.

**Two interfaces:**

| | Browser | Lab |
|---|---------|-----|
| **Purpose** | Interactive demo | Research experiments |
| **Setup** | Zero (just open it) | Python environment |
| **Models** | WebLLM (1-3B) or API | Any (local or API) |
| **Speed** | Real-time | 10x+ (headless) |
| **Location** | `app/` | `lab/` |

## Browser Version

Zero-setup demo running entirely client-side via WebGPU.

```bash
cd app
npm install
npm run dev
```

**Requirements:** Chrome/Edge 113+ (WebGPU), Pokemon Red ROM

**Features:**
- Language model via WebLLM or external APIs (OpenAI, Groq, local)
- Policy network training visualization
- Game state inspection

## Lab (Experimental)

For running experiments, comparing configurations, and exploring training dynamics.

```bash
cd lab
pip install -r requirements.txt
python scripts/run_experiment.py --rom pokemon_red.gb
```

**Requirements:** Python 3.10+, Pokemon Red ROM, Ollama (or other LLM backend)

**Features:**
- Headless execution at 10x+ speed
- Swappable model backends
- Experiment logging and metrics
- Configurable reward specifications

See [lab/README.md](lab/README.md) for details.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     HIERARCHICAL LOOP                        │
│                                                              │
│   ┌─────────────┐         ┌─────────────┐                   │
│   │     LLM     │  tasks  │   Policy    │  actions          │
│   │  (Planner)  │────────▶│  (Executor) │─────────▶ Game    │
│   └─────────────┘         └─────────────┘                   │
│         ▲                       │                            │
│         │                       │ learns                     │
│         │   objective          ▼                            │
│   ┌─────────────┐         ┌─────────────┐                   │
│   │  Strategy   │         │ Experience  │                   │
│   │   Guide     │         │   Buffer    │                   │
│   └─────────────┘         └─────────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

**LLM Layer:** Issues task-level goals ("Navigate to Pewter City", "Train to level 14")

**Policy Layer:** Executes micro-actions to achieve tasks, learns from experience

**The Harness:** Manages game state, detects task completion, logs everything

## Current Focus

Exploring whether hierarchical task decomposition enables small models (3B parameters) to make meaningful progress through early-game milestones.

**Milestones under study:**
- [ ] Brock (Boulder Badge)
- [ ] Misty (Cascade Badge)

## Links

- [Live Demo](https://sidmohan0.github.io/tesserack/)
- [Design Doc](docs/plans/2026-01-26-test-bed-harness-design.md)

## License

MIT

---

Built by [Sid Mohan](https://github.com/sidmohan0)
