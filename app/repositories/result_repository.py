from __future__ import annotations

import uuid

from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.models.result import Result, ResultStatus
from app.models.user import User


class ResultRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_for_user(self, user: User, status: ResultStatus = ResultStatus.AWAITING_READINESS) -> Result:
        row = Result(user_id=user.id, status=status)
        self.db.add(row)
        self.db.flush()
        return row

    def get(self, result_id: uuid.UUID) -> Result | None:
        return self.db.get(Result, result_id)

    def get_active_for_user(self, user_id: uuid.UUID) -> Result | None:
        """Latest non-terminal session (excludes completed and failed readiness)."""
        stmt = (
            select(Result)
            .where(Result.user_id == user_id)
            .where(Result.status != ResultStatus.COMPLETED)
            .where(Result.status != ResultStatus.READINESS_FAILED)
            .order_by(desc(Result.created_at))
            .limit(1)
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def get_latest_completed(self, user_id: uuid.UUID) -> Result | None:
        """Latest completed attempt (answers not eager-loaded — GET /result does not need them)."""
        stmt = (
            select(Result)
            .where(Result.user_id == user_id)
            .where(Result.status == ResultStatus.COMPLETED)
            .order_by(desc(Result.completed_at))
            .limit(1)
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def list_for_user(self, user_id: uuid.UUID, limit: int = 10) -> list[Result]:
        stmt = select(Result).where(Result.user_id == user_id).order_by(desc(Result.created_at)).limit(limit)
        return list(self.db.execute(stmt).scalars().all())
