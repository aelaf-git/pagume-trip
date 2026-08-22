from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = "postgresql+psycopg://pagume:pagume@localhost:5432/pagume"
    host: str = "0.0.0.0"
    port: int = 8000
    seed_on_startup: bool = True
    cloudinary_url: str = ""

    # Offline mirror. Empty local_database_url keeps the API on database_url only.
    local_database_url: str = ""
    db_failover_enabled: bool = True
    db_connect_timeout: int = 3
    db_probe_interval: int = 15
    db_sync_auto_push: bool = True


@lru_cache
def get_settings() -> Settings:
    return Settings()
