from langchain_openai import ChatOpenAI

from pagume_agents.config import Settings, get_settings


def get_chat_model(settings: Settings | None = None) -> ChatOpenAI:
    """Chat model via Groq's OpenAI-compatible API (or any OpenAI-compatible base URL)."""
    settings = settings or get_settings()
    if not settings.llm_api_key:
        raise ValueError(
            "Missing Groq API key. Set GROQ_API_KEY or LLM_API_KEY in agents/.env "
            "(https://console.groq.com/keys)."
        )
    kwargs: dict = {
        "model": settings.llm_model,
        "api_key": settings.llm_api_key,
        "temperature": 0,
    }
    if settings.llm_base_url:
        kwargs["base_url"] = settings.llm_base_url
    return ChatOpenAI(**kwargs)
