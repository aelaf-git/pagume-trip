"""Portal settings — same DATABASE_URL as the main API, asyncpg for async sessions."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict

from pagume_api.config import get_settings as get_main_settings


def _to_asyncpg(url: str) -> str:
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgresql+psycopg://"):
        url = url.replace("postgresql+psycopg://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif url.startswith("sqlite:///"):
        # aiosqlite for tests when main URL is sqlite
        url = url.replace("sqlite:///", "sqlite+aiosqlite:///", 1)
    if "?" in url and "asyncpg" in url:
        base, query = url.split("?", 1)
        params = []
        for param in query.split("&"):
            if param.startswith("sslmode="):
                val = param.split("=", 1)[1]
                params.append(f"ssl={val}")
            elif param.startswith("ssl="):
                params.append(param)
        url = f"{base}?{'&'.join(params)}" if params else base
    return url


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")

    PROJECT_NAME: str = "Pagume Trip API"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "your-super-secret-key-that-should-be-changed-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        return _to_asyncpg(get_main_settings().database_url)


@lru_cache
def get_portal_settings() -> Settings:
    return Settings()


settings = get_portal_settings()
