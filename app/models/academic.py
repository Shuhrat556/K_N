from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class University(Base):
    __tablename__ = "universities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    city: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    district: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False
    )

    faculties: Mapped[list["Faculty"]] = relationship(back_populates="university", cascade="all, delete-orphan")


class Faculty(Base):
    __tablename__ = "faculties"
    __table_args__ = (UniqueConstraint("university_id", "name", name="uq_faculty_university_name"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    university_id: Mapped[int] = mapped_column(ForeignKey("universities.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False
    )

    university: Mapped["University"] = relationship(back_populates="faculties")
    specialties: Mapped[list["Specialty"]] = relationship(back_populates="faculty", cascade="all, delete-orphan")


class Specialty(Base):
    __tablename__ = "specialties"
    __table_args__ = (
        UniqueConstraint("faculty_id", "name", "code", name="uq_specialty_faculty_name_code"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    faculty_id: Mapped[int] = mapped_column(ForeignKey("faculties.id", ondelete="CASCADE"), index=True)
    code: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    name: Mapped[str] = mapped_column(Text, nullable=False, index=True)
    study_mode: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    language: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    tuition: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    source_sheet: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False
    )

    faculty: Mapped["Faculty"] = relationship(back_populates="specialties")
