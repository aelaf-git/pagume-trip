from __future__ import annotations

from typing import Any

MAX_TRANSCRIPT_MESSAGES = 12
MAX_MESSAGE_CHARS = 400


def _role_label(message: Any) -> str | None:
    role = getattr(message, "type", None) or getattr(message, "role", None)
    if role in ("human", "user"):
        return "User"
    if role in ("ai", "assistant"):
        return "Pagume"
    return None


def _clip(text: str, limit: int = MAX_MESSAGE_CHARS) -> str:
    text = text.strip()
    if len(text) <= limit:
        return text
    return text[: limit - 1] + "…"


def format_transcript(messages: list[Any] | None, *, limit: int = MAX_TRANSCRIPT_MESSAGES) -> str:
    """Compact prior turns for LLM context. Newest messages are kept."""
    lines: list[str] = []
    for message in list(messages or [])[-limit:]:
        label = _role_label(message)
        content = getattr(message, "content", None)
        if not label or not content:
            continue
        lines.append(f"{label}: {_clip(str(content))}")
    return "\n".join(lines) if lines else "(no prior turns)"


def public_messages(messages: list[Any] | None) -> list[dict[str, str]]:
    """Frontend-safe chat history: user/assistant turns only."""
    out: list[dict[str, str]] = []
    for message in messages or []:
        label = _role_label(message)
        content = getattr(message, "content", None)
        if not label or not content:
            continue
        role = "user" if label == "User" else "assistant"
        out.append({"role": role, "content": str(content)})
    return out


def human_message_count(messages: list[Any] | None) -> int:
    return sum(1 for message in (messages or []) if _role_label(message) == "User")
