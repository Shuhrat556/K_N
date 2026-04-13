from __future__ import annotations

import enum
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ResultStatus(str, enum.Enum):
    """Session lifecycle for a single assessment attempt."""

    AWAITING_READINESS = "awaiting_readiness"
    READINESS_FAILED = "readiness_failed"  # score <= -3 → suggest retry later
    READY_FOR_MAIN = "ready_for_main"  # allowed to proceed (with or without warning)
    MAIN_IN_PROGRESS = "main_in_progress"
    ADAPTIVE_PENDING = "adaptive_pending"
    COMPLETED = "completed"


class Result(Base):
    """
    One assessment session per row.

    Stores selection metadata (which 75 + optional 10), rolling JSON score snapshots,
    and denormalized final recommendation fields for fast reads.
    """

    __tablename__ = "results"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    status: Mapped[ResultStatus] = mapped_column(Enum(ResultStatus), nullable=False, index=True)

    readiness_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    readiness_outcome: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)  # allow | allow_warning | retry_later
    readiness_warning: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    main_question_ids: Mapped[Optional[List[Any]]] = mapped_column(JSONB, nullable=True)
    adaptive_question_ids: Mapped[Optional[List[Any]]] = mapped_column(JSONB, nullable=True)
    adaptive_cluster_pair: Mapped[Optional[List[Any]]] = mapped_column(JSONB, nullable=True)  # [cluster_a_id, cluster_b_id]

    adaptive_eligible: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    adaptive_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    cluster_scores: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)  # {"1": 12.5, ...} string keys for JSON
    group_scores: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)  # {"1:10": 4.0, ...} cluster_id:group_id

    top_cluster_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    top_group_ids: Mapped[Optional[List[Any]]] = mapped_column(JSONB, nullable=True)  # ordered specialization ids

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["User"] = relationship(back_populates="results")
    answers: Mapped[list["Answer"]] = relationship(back_populates="result", cascade="all, delete-orphan")
