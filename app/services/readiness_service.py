"""Readiness phase scoring: maps answers to [-1,0,+1] and aggregates to [-8,+8]."""

from app.models.catalog import Question, ReadinessKind


class ReadinessService:
    """Pure readiness scoring rules (kept framework-free for unit testing)."""

    @staticmethod
    def choice_to_score(question: Question, choice_index: int) -> int:
        """
        choice_index encoding (client contract):
        - For NEGATIVE/POSITIVE: 0=Yes, 1=Partly, 2=No
        - For EMOTIONAL: 0=Happy, 1=Uncertain, 2=Fear
        """
        if question.readiness_kind is None:
            raise ValueError("Readiness questions must have readiness_kind set")

        kind = question.readiness_kind
        if kind == ReadinessKind.NEGATIVE:
            # Yes=-1, Partly=0, No=+1
            return {0: -1, 1: 0, 2: 1}[choice_index]
        if kind == ReadinessKind.POSITIVE:
            # Yes=+1, Partly=0, No=-1
            return {0: 1, 1: 0, 2: -1}[choice_index]
        if kind == ReadinessKind.EMOTIONAL:
            # Happy=+1, Uncertain=0, Fear=-1
            return {0: 1, 1: 0, 2: -1}[choice_index]
        raise ValueError(f"Unsupported readiness kind: {kind}")

    @staticmethod
    def total_score(questions: list[Question], answers_by_qid: dict[int, int]) -> int:
        total = 0
        for q in questions:
            if q.id not in answers_by_qid:
                raise ValueError(f"Missing answer for question {q.id}")
            total += ReadinessService.choice_to_score(q, answers_by_qid[q.id])
        return total

    @staticmethod
    def interpret_total(score: int) -> tuple[str, bool]:
        """
        Returns (outcome, warning_flag).

        - score >= +3 → allow
        - between -2 and +2 → allow with warning
        - score <= -3 → retry later
        """
        if score >= 3:
            return "allow", False
        if score <= -3:
            return "retry_later", False
        return "allow_warning", True
