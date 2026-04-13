from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment (.env supported)."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Kasbnoma Career API"
    app_env: str = "development"
    database_url: str = "postgresql+psycopg2://kasbnoma:kasbnoma@localhost:5432/kasbnoma"
    # Comma-separated browser origins for the SPA (e.g. http://localhost:5173). Use "*" only for local dev.
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"


@lru_cache
def get_settings() -> Settings:
    return Settings()
