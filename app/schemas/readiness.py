from __future__ import annotations

import uuid
from typing import List, Optional

from pydantic import BaseModel, Field

from app.models.catalog import ReadinessKind


class ReadinessQuestionOut(BaseModel):
    id: int
    text: str
    text_tj: Optional[str] = None
    kind: ReadinessKind

    model_config = {"from_attributes": True}


class ReadinessAnswerItem(BaseModel):
    question_id: int
    # 0=Yes/Happy, 1=Partly/Uncertain, 2=No/Fear (see ReadinessService contract)
    choice_index: int = Field(ge=0, le=2)


class SubmitReadinessIn(BaseModel):
    user_id: uuid.UUID
    answers: List[ReadinessAnswerItem]


class SubmitReadinessOut(BaseModel):
    readiness_score: int
    outcome: str
    allowed: bool
    warning: Optional[bool] = None
    message: Optional[str] = None
