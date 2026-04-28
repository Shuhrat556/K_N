"""FastAPI entrypoint for Kasbnoma."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import api_router
from app.core.config import get_settings
from app.core.database import Base, build_engine, build_session_factory
from app.core.schema_patches import apply_postgres_patches
from app.seed.seed_catalog import seed_if_empty


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    engine = build_engine(settings.database_url)
    session_factory = build_session_factory(engine)

    # Dev convenience: in production prefer Alembic migrations instead of create_all.
    Base.metadata.create_all(bind=engine)
    apply_postgres_patches(engine)

    db = session_factory()
    try:
        seed_if_empty(db)
        db.commit()
    finally:
        db.close()

    app.state.engine = engine
    app.state.SessionLocal = session_factory
    yield
    engine.dispose()


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_name, lifespan=lifespan)

    # CORS must be registered early so it wraps all routes/middleware added after it.
    # `CORS_ORIGINS` is comma-separated and should be set per environment.
    configured = [o.strip().rstrip("/") for o in settings.cors_origins.split(",") if o.strip()]
    origins = list(dict.fromkeys(configured))
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health")
    def health():
        return {"status": "ok"}

    app.include_router(api_router)
    return app


app = create_app()
