"""Lightweight schema adjustments for dev DBs (no Alembic in this repo)."""

from sqlalchemy import text
from sqlalchemy.engine import Engine


def apply_postgres_patches(engine: Engine) -> None:
    """Adds columns introduced after first deploy (CREATE TABLE IF NOT EXISTS is not enough)."""
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS text_tj TEXT"))
        conn.execute(text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS option_labels JSONB"))
        conn.execute(text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS option_labels_tj JSONB"))
        conn.execute(text("ALTER TABLE universities ADD COLUMN IF NOT EXISTS serial_no INTEGER"))
        conn.execute(text("ALTER TABLE universities ADD COLUMN IF NOT EXISTS region VARCHAR(128)"))
        conn.execute(text("ALTER TABLE universities ADD COLUMN IF NOT EXISTS phone VARCHAR(128)"))
        conn.execute(text("ALTER TABLE universities ADD COLUMN IF NOT EXISTS source_sheet VARCHAR(255)"))
        conn.execute(text("ALTER TABLE faculties ADD COLUMN IF NOT EXISTS code VARCHAR(32)"))
        conn.execute(text("ALTER TABLE faculties ADD COLUMN IF NOT EXISTS source_sheet VARCHAR(255)"))
        conn.execute(text("ALTER TABLE specialties ADD COLUMN IF NOT EXISTS admission_quota VARCHAR(512)"))
        conn.execute(text("ALTER TABLE specialties ADD COLUMN IF NOT EXISTS excel_id INTEGER"))
        conn.execute(text("ALTER TABLE specialties ADD COLUMN IF NOT EXISTS entry_key VARCHAR(255)"))
        conn.execute(text("ALTER TABLE specialties ADD COLUMN IF NOT EXISTS degree VARCHAR(255)"))
        conn.execute(text("ALTER TABLE specialties ADD COLUMN IF NOT EXISTS is_free BOOLEAN"))
        conn.execute(text("ALTER TABLE specialties ADD COLUMN IF NOT EXISTS price INTEGER"))
        conn.execute(text("UPDATE specialties SET entry_key = CONCAT('legacy:', id::text) WHERE entry_key IS NULL"))
        conn.execute(text("ALTER TABLE specialties ALTER COLUMN entry_key SET NOT NULL"))
        conn.execute(text("DROP INDEX IF EXISTS ix_specialties_entry_key"))
        conn.execute(text("DROP INDEX IF EXISTS ix_specialties_excel_id"))
        conn.execute(text("ALTER TABLE specialties DROP CONSTRAINT IF EXISTS uq_specialty_faculty_name_code"))
        conn.execute(text("ALTER TABLE specialties DROP CONSTRAINT IF EXISTS uq_specialty_entry_key"))
        conn.execute(text("ALTER TABLE specialties ADD CONSTRAINT uq_specialty_entry_key UNIQUE (entry_key)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_specialties_excel_id ON specialties (excel_id)"))
