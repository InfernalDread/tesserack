"""Main game agent that orchestrates LLM and emulator."""

import asyncio
from typing import Callable

from agent.emulator import Emulator
from agent.context_manager import ContextManager
from agent.action_parser import parse_response
from llm.base import LLMBackend


SYSTEM_PROMPT = """You are playing Pokemon Red. Your goal is to become the Pokemon Champion by defeating the Elite Four.

Analyze the current game state and decide what to do next. Think step by step about:
1. Where you are and what's happening
2. What your immediate goal should be
3. What buttons to press to achieve that goal

Format your response EXACTLY as:
REASONING: <your step-by-step thinking>
ACTION: <button sequence>

Valid buttons: a, b, start, select, up, down, left, right
Separate multiple buttons with commas.
Example: ACTION: up, up, left, a

REASONING:"""


class GameAgent:
    """Orchestrates the LLM playing Pokemon Red."""

    def __init__(
        self,
        llm: LLMBackend,
        emulator: Emulator,
        max_history: int = 5,
    ):
        self.llm = llm
        self.emulator = emulator
        self.context = ContextManager(max_turns=max_history)
        self.running = False
        self.callbacks: list[Callable] = []

    def add_callback(self, callback: Callable):
        """Add a callback for state updates."""
        self.callbacks.append(callback)

    def _build_prompt(self, state: dict, collision_map: str | None) -> str:
        """Build the full prompt for the LLM."""
        parts = [SYSTEM_PROMPT, ""]

        # Add context from previous turns
        context = self.context.build_context()
        if context:
            parts.append(context)
            parts.append("")

        # Current state
        parts.append("CURRENT GAME STATE:")
        parts.append(f"Location: {state['location']}")
        parts.append(f"Coordinates: {state['coordinates']}")
        parts.append(f"Money: ${state['money']}")
        parts.append(f"Badges: {', '.join(state['badges']) if state['badges'] else 'None'}")

        # Party
        parts.append("\nPOKEMON PARTY:")
        for pokemon in state['party']:
            parts.append(f"  {pokemon}")

        # Items (abbreviated)
        if state['items']:
            items_str = ", ".join(f"{name} x{qty}" for name, qty in state['items'][:10])
            parts.append(f"\nITEMS: {items_str}")

        # Valid moves
        valid_moves = self.emulator.get_valid_moves()
        parts.append(f"\nVALID MOVES: {', '.join(valid_moves)}")

        # Collision map
        if collision_map:
            parts.append(f"\nMAP (# = wall, . = walkable, ^v<> = you):\n{collision_map}")

        # Dialog
        if state['dialog'].strip():
            parts.append(f"\nDIALOG: {state['dialog']}")

        parts.append("\nREASONING:")

        return "\n".join(parts)

    async def step(self) -> dict:
        """Execute one agent step: observe -> think -> act."""
        # 1. Get current state
        state = self.emulator.get_state()
        collision_map = self.emulator.get_collision_map()
        screenshot = self.emulator.get_screenshot_base64()

        # 2. Build prompt
        prompt = self._build_prompt(state, collision_map)

        # 3. Get LLM response
        response = self.llm.generate(prompt, max_tokens=512)

        # 4. Parse response
        reasoning, actions = parse_response(response)

        # 5. Execute actions
        self.emulator.press_buttons(actions)

        # 6. Update context
        self.context.add_turn(
            location=state['location'],
            reasoning=reasoning,
            action=actions,
        )

        # 7. Build update for callbacks
        update = {
            "screenshot": screenshot,
            "state": state,
            "reasoning": reasoning,
            "action": actions,
            "raw_response": response,
        }

        # 8. Notify callbacks
        for callback in self.callbacks:
            if asyncio.iscoroutinefunction(callback):
                await callback(update)
            else:
                callback(update)

        return update

    async def run(self, steps: int | None = None, delay: float = 0.5):
        """Run the agent loop.

        Args:
            steps: Number of steps to run (None = infinite)
            delay: Delay between steps in seconds
        """
        self.running = True
        count = 0

        while self.running:
            if steps is not None and count >= steps:
                break

            await self.step()
            count += 1

            if delay > 0:
                await asyncio.sleep(delay)

    def stop(self):
        """Stop the agent loop."""
        self.running = False
