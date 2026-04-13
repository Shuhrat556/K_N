"""FastAPI dependency providers (DB session + application services)."""

from collections.abc import Generator
from typing import Annotated

from fastapi import Depends, Request
from sqlalchemy.orm import Session

from app.services.test_flow_service import TestFlowService


def get_db(request: Request) -> Generator[Session, None, None]:
    SessionLocal = request.app.state.SessionLocal
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_test_flow_service(db: Annotated[Session, Depends(get_db)]) -> TestFlowService:
    return TestFlowService(db)
