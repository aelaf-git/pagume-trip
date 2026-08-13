from functools import lru_cache
from typing import Literal

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

GROQ_BASE_URL = "https://api.groq.com/openai/v1"
GROQ_DEFAULT_MODEL = "openai/gpt-oss-20b"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    llm_base_url: str = GROQ_BASE_URL
    llm_api_key: str = Field(
        default="",
        validation_alias=AliasChoices("LLM_API_KEY", "GROQ_API_KEY"),
    )
    llm_model: str = GROQ_DEFAULT_MODEL

    inventory_client: Literal["mock", "http"] = "mock"
    pagume_api_base_url: str = ""

    use_llm: bool = False

    host: str = "0.0.0.0"
    port: int = 8100


@lru_cache
def get_settings() -> Settings:
    return Settings()
