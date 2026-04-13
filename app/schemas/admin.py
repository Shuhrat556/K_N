from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field

from app.models.catalog import QuestionPhase, ReadinessKind


class ClusterIn(BaseModel):
    code: str = Field(min_length=1, max_length=64)
    name: str = Field(min_length=1, max_length=255)
    sort_order: int = 0


class ClusterOut(BaseModel):
    id: int
    code: str
    name: str
    sort_order: int


class GroupIn(BaseModel):
    cluster_id: int
    code: str = Field(min_length=1, max_length=64)
    name: str = Field(min_length=1, max_length=255)
    sort_order: int = 0


class GroupOut(BaseModel):
    id: int
    cluster_id: int
    code: str
    name: str
    sort_order: int


class QuestionIn(BaseModel):
    phase: QuestionPhase
    text: str = Field(min_length=1)
    text_tj: Optional[str] = None
    readiness_kind: Optional[ReadinessKind] = None
    cluster_id: Optional[int] = None
    group_id: Optional[int] = None
    sort_order: int = 0


class QuestionOut(BaseModel):
    id: int
    phase: QuestionPhase
    text: str
    text_tj: Optional[str] = None
    readiness_kind: Optional[ReadinessKind] = None
    cluster_id: Optional[int] = None
    group_id: Optional[int] = None
    sort_order: int
