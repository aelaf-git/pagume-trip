from typing import Any


def maybe_react_agent(
    llm: Any | None,
    tools: list,
    prompt: str,
    use_llm: bool,
) -> Any | None:
    if not (use_llm and llm is not None):
        return None
    from langgraph.prebuilt import create_react_agent

    return create_react_agent(llm, tools, prompt=prompt)
