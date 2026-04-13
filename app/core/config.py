from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment (.env supported)."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Kasbnoma Career API"
    app_env: str = "development"
    database_url: str = "postgresql+psycopg2://kasbnoma:kasbnoma@localhost:5432/kasbnoma"
    # Comma-separated browser origins for the SPA (e.g. http://localhost:5173). Use "*" only for local dev.
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    @field_validator("database_url", mode="before")
    @classmethod
    def normalize_database_url(cls, value: str) -> str:
        """
        Render and other providers often expose PostgreSQL URLs as:
        - postgres://...
        - postgresql://...
        SQLAlchemy in this project expects the psycopg2 dialect prefix.
        """
        if not isinstance(value, str):
            return value
        if value.startswith("postgres://"):
            return value.replace("postgres://", "postgresql+psycopg2://", 1)
        if value.startswith("postgresql://"):
            return value.replace("postgresql://", "postgresql+psycopg2://", 1)
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
