from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session


class Base(DeclarativeBase):
    """SQLAlchemy declarative base for all ORM models."""


def build_engine(database_url: str):
    # pool_pre_ping helps recover from stale connections behind PgBouncer / NAT.
    return create_engine(
        database_url,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
        future=True,
    )


def build_session_factory(engine):
    return sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False, future=True)


def get_session_local(engine, session_factory) -> Generator[Session, None, None]:
    db: Session = session_factory()
    try:
        yield db
    finally:
        db.close()
