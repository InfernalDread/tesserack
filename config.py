from pathlib import Path

# Paths
MODEL_PATH = "/Users/sidmohan/Library/Application Support/ai.threadfork.app/models/Qwen3-4B-Instruct-2507-Q4_K_M.gguf"
ROM_PATH = "pokemon.gb"

# LLM settings
CONTEXT_SIZE = 4096
MAX_TOKENS = 512
N_GPU_LAYERS = -1  # -1 = use all layers on GPU (Metal)

# Agent settings
MAX_HISTORY_TURNS = 5

# Web server
WEB_HOST = "0.0.0.0"
WEB_PORT = 8000
