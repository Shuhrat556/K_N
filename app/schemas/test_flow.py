from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class StartTestIn(BaseModel):
    """Optionally continue a known user; always starts a fresh assessment attempt."""

    user_id: Optional[uuid.UUID] = None


class StartTestOut(BaseModel):
    user_id: uuid.UUID
    session_id: uuid.UUID
    status: str


class QuestionOut(BaseModel):
    """Full question payload (internal / admin)."""

    id: int
    text: str
    text_tj: Optional[str] = None
    cluster_id: Optional[int] = None
    group_id: Optional[int] = None


class TestQuestionOut(BaseModel):
    """Examinee-facing payload: no cluster/group identifiers."""

    id: int
    text: str
    text_tj: Optional[str] = None
    # When set, length 5: Likert labels for values 0..4.
    option_labels: Optional[list[str]] = None
    option_labels_tj: Optional[list[str]] = None


class SubmitAnswerIn(BaseModel):
    user_id: uuid.UUID
    question_id: int
    # Main/adaptive Likert scale 0..4
    value: int = Field(ge=0, le=4)


class SubmitTestIn(BaseModel):
    user_id: uuid.UUID


class SubmitTestOut(BaseModel):
    status: str
    needs_adaptive: bool
    question_ids: Optional[List[int]] = None
    reason: Optional[str] = None
    preliminary: Optional[Dict[str, Any]] = None
    result: Optional[Dict[str, Any]] = None
