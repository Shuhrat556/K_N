import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.answer import Answer, AnswerPhase


class AnswerRepository:
    def __init__(self, db: Session):
        self.db = db

    def upsert(self, result_id: uuid.UUID, question_id: int, value: int, phase: AnswerPhase) -> Answer:
        existing = self.db.execute(
            select(Answer).where(Answer.result_id == result_id, Answer.question_id == question_id)
        ).scalar_one_or_none()
        if existing:
            existing.value = value
            existing.phase = phase
            self.db.flush()
            return existing
        row = Answer(result_id=result_id, question_id=question_id, value=value, phase=phase)
        self.db.add(row)
        self.db.flush()
        return row

    def list_for_result(self, result_id: uuid.UUID) -> list[Answer]:
        stmt = select(Answer).where(Answer.result_id == result_id)
        return list(self.db.execute(stmt).scalars().all())
