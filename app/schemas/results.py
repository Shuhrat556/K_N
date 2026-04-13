from __future__ import annotations

import uuid
from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, Field


class SpecializationOut(BaseModel):
    id: int
    name: str


class ScoreBreakdownOut(BaseModel):
    cluster_scores: Dict[str, float] = Field(default_factory=dict)
    group_scores: Dict[str, float] = Field(default_factory=dict)
    top_cluster_id: Optional[int] = None
    top_group_ids: List[int] = Field(default_factory=list)


class ResultOut(BaseModel):
    user_id: uuid.UUID
    session_id: uuid.UUID
    completed_at: Optional[datetime] = None
    readiness_score: Optional[int] = None
    readiness_outcome: Optional[str] = None
    readiness_warning: Optional[bool] = None
    adaptive_completed: bool
    breakdown: ScoreBreakdownOut
    top_cluster_name: Optional[str] = None
    specializations: List[SpecializationOut] = Field(default_factory=list)
