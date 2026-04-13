from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class AnswerPhase(str, enum.Enum):
    READINESS = "readiness"
    MAIN = "main"
    ADAPTIVE = "adaptive"


class Answer(Base):
    """One stored response for a question within a test session (Result)."""

    __tablename__ = "answers"
    __table_args__ = (UniqueConstraint("result_id", "question_id", name="uq_answer_result_question"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    result_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("results.id", ondelete="CASCADE"), nullable=False, index=True
    )
    question_id: Mapped[int] = mapped_column(ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    # Raw answer: readiness uses 0/1/2 encoding; main/adaptive uses Likert 0-4.
    value: Mapped[int] = mapped_column(Integer, nullable=False)
    phase: Mapped[AnswerPhase] = mapped_column(Enum(AnswerPhase), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    result: Mapped["Result"] = relationship(back_populates="answers")
    question: Mapped["Question"] = relationship(back_populates="answers")
