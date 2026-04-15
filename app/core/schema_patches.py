"""Lightweight schema adjustments for dev DBs (no Alembic in this repo)."""

from sqlalchemy import text
from sqlalchemy.engine import Engine


def apply_postgres_patches(engine: Engine) -> None:
    """Adds columns introduced after first deploy (CREATE TABLE IF NOT EXISTS is not enough)."""
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS text_tj TEXT"))
        conn.execute(text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS option_labels JSONB"))
        conn.execute(text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS option_labels_tj JSONB"))
