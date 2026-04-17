from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field, model_validator

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


class ClusterUpdate(BaseModel):
    code: Optional[str] = Field(default=None, min_length=1, max_length=64)
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    sort_order: Optional[int] = None


class GroupUpdate(BaseModel):
    cluster_id: Optional[int] = None
    code: Optional[str] = Field(default=None, min_length=1, max_length=64)
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    sort_order: Optional[int] = None


class AdminStatsOut(BaseModel):
    total_users: int
    total_results: int
    results_by_status: dict[str, int]
    completed_results: int
    results_updated_last_24h: int
    active_users_last_24h: int
    users_created_last_7_days: int
    total_questions: int
    total_answers: int


def validate_option_labels_for_phase(phase: QuestionPhase, labels: Optional[list], labels_tj: Optional[list]) -> None:
    n = 3 if phase == QuestionPhase.READINESS else 5
    if labels is not None:
        if not isinstance(labels, list) or len(labels) != n or not all(isinstance(x, str) for x in labels):
            raise ValueError(f"option_labels must be a list of {n} strings for phase={phase.value}")
    if labels_tj is not None:
        if not isinstance(labels_tj, list) or len(labels_tj) != n or not all(isinstance(x, str) for x in labels_tj):
            raise ValueError(f"option_labels_tj must be a list of {n} strings for phase={phase.value}")


class QuestionIn(BaseModel):
    phase: QuestionPhase
    text: str = Field(min_length=1)
    text_tj: Optional[str] = None
    readiness_kind: Optional[ReadinessKind] = None
    cluster_id: Optional[int] = None
    group_id: Optional[int] = None
    sort_order: int = 0
    option_labels: Optional[list[str]] = None
    option_labels_tj: Optional[list[str]] = None

    @model_validator(mode="after")
    def _labels_match_phase(self):
        validate_option_labels_for_phase(self.phase, self.option_labels, self.option_labels_tj)
        return self


class QuestionUpdate(BaseModel):
    text: Optional[str] = Field(default=None, min_length=1)
    text_tj: Optional[str] = None
    readiness_kind: Optional[ReadinessKind] = None
    cluster_id: Optional[int] = None
    group_id: Optional[int] = None
    sort_order: Optional[int] = None
    option_labels: Optional[list[str]] = None
    option_labels_tj: Optional[list[str]] = None

    @model_validator(mode="after")
    def _labels_lengths(self):
        # Length is validated in route against existing row.phase when applying.
        if self.option_labels is not None and not all(isinstance(x, str) for x in self.option_labels):
            raise ValueError("option_labels must be a list of strings")
        if self.option_labels_tj is not None and not all(isinstance(x, str) for x in self.option_labels_tj):
            raise ValueError("option_labels_tj must be a list of strings")
        return self


class QuestionOut(BaseModel):
    id: int
    phase: QuestionPhase
    text: str
    text_tj: Optional[str] = None
    readiness_kind: Optional[ReadinessKind] = None
    cluster_id: Optional[int] = None
    group_id: Optional[int] = None
    sort_order: int
    option_labels: Optional[list[str]] = None
    option_labels_tj: Optional[list[str]] = None
