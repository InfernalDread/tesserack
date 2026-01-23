"""Parse LLM responses into game actions."""

import re


VALID_BUTTONS = {"a", "b", "start", "select", "up", "down", "left", "right"}


def parse_response(response: str) -> tuple[str, list[str]]:
    """Parse LLM response into reasoning and actions.

    Args:
        response: Raw LLM output

    Returns:
        Tuple of (reasoning, list of button names)
    """
    # Extract reasoning (everything before ACTION:)
    reasoning = response.strip()
    actions = []

    # Look for ACTION: line
    match = re.search(r'ACTION:\s*(.+?)(?:\n|$)', response, re.IGNORECASE)
    if match:
        action_str = match.group(1)
        # Split reasoning from action
        action_start = response.lower().find("action:")
        if action_start > 0:
            reasoning = response[:action_start].strip()

        # Parse button sequence
        buttons = re.split(r'[,\s]+', action_str.lower())
        actions = [b.strip() for b in buttons if b.strip() in VALID_BUTTONS]

    # Default to pressing 'a' if no valid actions found
    if not actions:
        actions = ["a"]

    return reasoning, actions
