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
    # `CORS_ORIGINS` is comma-separated. We always merge SPA defaults so production is not
    # accidentally locked to localhost-only when CORS_ORIGINS is unset or incomplete.
    configured = [o.strip().rstrip("/") for o in settings.cors_origins.split(",") if o.strip()]
    builtin_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://k-n-7.onrender.com",
    ]
    origins = list(dict.fromkeys(configured + builtin_origins))
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
