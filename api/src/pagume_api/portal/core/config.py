"""Portal settings — same DATABASE_URL as the main API, asyncpg for async sessions."""

from functools import lru_cache
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

from pydantic_settings import BaseSettings, SettingsConfigDict

from pagume_api.config import get_settings as get_main_settings


def _to_asyncpg(url: str) -> str:
    """Convert sync SQLAlchemy URL to asyncpg.

    Neon URLs use libpq params (sslmode, channel_binding). SQLAlchemy's asyncpg
    dialect accepts ``ssl=`` in the URL, not ``sslmode=``.
    """
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgresql+psycopg://"):
        url = url.replace("postgresql+psycopg://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif url.startswith("sqlite:///"):
        return url.replace("sqlite:///", "sqlite+aiosqlite:///", 1)

    if "asyncpg" not in url:
        return url

    parsed = urlparse(url)
    params: dict[str, str] = {}
    for key, value in parse_qsl(parsed.query, keep_blank_values=True):
        if key == "channel_binding":
            continue
        if key == "sslmode":
            # asyncpg/SQLAlchemy want ssl=, not sslmode=
            mode = (value or "").lower()
            if mode in {"disable", "allow"}:
                params["ssl"] = "false"
            else:
                params["ssl"] = "require"
            continue
        if key == "ssl":
            params["ssl"] = value
            continue
        params[key] = value

    host = (parsed.hostname or "").lower()
    if "neon.tech" in host and "ssl" not in params:
        params["ssl"] = "require"

    return urlunparse(parsed._replace(query=urlencode(params)))


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
