from typing import Any

from pydantic import BaseModel


def dump_models(items: list[BaseModel]) -> list[dict[str, Any]]:
    return [item.model_dump() for item in items]


def dump_optional(item: BaseModel | None) -> dict[str, Any] | None:
    return None if item is None else item.model_dump()
