from __future__ import annotations

import enum
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Enum, ForeignKey, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.answer import Answer


class QuestionPhase(str, enum.Enum):
    READINESS = "readiness"
    MAIN = "main"


class ReadinessKind(str, enum.Enum):
    """How readiness answers map to contribution scores."""

    NEGATIVE = "negative"  # Yes=-1, Partly=0, No=+1
    POSITIVE = "positive"  # Yes=+1, Partly=0, No=-1
    EMOTIONAL = "emotional"  # Happy=+1, Uncertain=0, Fear=-1


class Cluster(Base):
    """High-level career domain (5 clusters in the product design)."""

    __tablename__ = "clusters"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    groups: Mapped[list["Group"]] = relationship(back_populates="cluster", cascade="all, delete-orphan")
    questions: Mapped[list["Question"]] = relationship(back_populates="cluster")


class Group(Base):
    """Specialization (group) inside a cluster — 5 per cluster in the seed catalog."""

    __tablename__ = "groups"
    __table_args__ = (UniqueConstraint("cluster_id", "code", name="uq_group_cluster_code"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    cluster_id: Mapped[int] = mapped_column(ForeignKey("clusters.id", ondelete="CASCADE"), nullable=False, index=True)
    code: Mapped[str] = mapped_column(String(64), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    cluster: Mapped["Cluster"] = relationship(back_populates="groups")
    questions: Mapped[list["Question"]] = relationship(back_populates="group")


class Question(Base):
    """Question bank: 8 readiness items + 200 main-pool items (5×5×8)."""

    __tablename__ = "questions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    phase: Mapped[QuestionPhase] = mapped_column(Enum(QuestionPhase), nullable=False, index=True)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    text_tj: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    readiness_kind: Mapped[Optional[ReadinessKind]] = mapped_column(Enum(ReadinessKind), nullable=True)
    cluster_id: Mapped[Optional[int]] = mapped_column(ForeignKey("clusters.id", ondelete="SET NULL"), nullable=True)
    group_id: Mapped[Optional[int]] = mapped_column(ForeignKey("groups.id", ondelete="SET NULL"), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    # Optional per-question answer labels: length 3 (readiness) or 5 (main / Likert 0..4 order).
    option_labels: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    option_labels_tj: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)

    cluster: Mapped[Optional["Cluster"]] = relationship(back_populates="questions")
    group: Mapped[Optional["Group"]] = relationship(back_populates="questions")
    answers: Mapped[list["Answer"]] = relationship(back_populates="question")
