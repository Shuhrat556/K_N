"""Orchestrates session lifecycle: readiness → main → optional adaptive → persisted results."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.answer import AnswerPhase
from app.models.catalog import Question, QuestionPhase
from app.models.result import Result, ResultStatus
from app.repositories.answer_repository import AnswerRepository
from app.repositories.catalog_repository import CatalogRepository
from app.repositories.result_repository import ResultRepository
from app.repositories.user_repository import UserRepository
from app.services.question_selection_service import QuestionSelectionService
from app.services.readiness_service import ReadinessService
from app.services.scoring_service import ScoringService


class TestFlowError(Exception):
    """Domain error translated to HTTP in the API layer."""


class TestFlowService:
    """
    Application service for Kasbnoma assessments.

    A `Result` row acts as the session/attempt container (user session system).
    """

    def __init__(self, db: Session):
        self.db = db
        self.users = UserRepository(db)
        self.results = ResultRepository(db)
        self.answers = AnswerRepository(db)
        self.catalog = CatalogRepository(db)
        self.readiness = ReadinessService()
        self.scoring = ScoringService()
        self.selector = QuestionSelectionService()

    def start_test(self, existing_user_id: uuid.UUID | None = None):
        if existing_user_id is not None:
            user = self.users.get(existing_user_id)
            if not user:
                raise TestFlowError("User not found")
        else:
            user = self.users.create()
        result = self.results.create_for_user(user, ResultStatus.AWAITING_READINESS)
        self.db.commit()
        self.db.refresh(user)
        self.db.refresh(result)
        return user, result

    def _active_result(self, user_id: uuid.UUID) -> Result:
        r = self.results.get_active_for_user(user_id)
        if not r:
            raise TestFlowError("No active assessment session for user")
        return r

    def readiness_questions(self, user_id: uuid.UUID) -> list:
        self._active_result(user_id)  # validates session exists
        return self.catalog.list_readiness_questions()

    def submit_readiness(self, user_id: uuid.UUID, answers: dict[int, int]):
        result = self._active_result(user_id)
        if result.status != ResultStatus.AWAITING_READINESS:
            raise TestFlowError("Readiness already submitted for this session")

        qs = self.catalog.list_readiness_questions()
        if len(qs) != 8:
            raise TestFlowError("Catalog misconfigured: readiness bank must contain 8 questions")

        for q in qs:
            self.answers.upsert(result.id, q.id, answers[q.id], AnswerPhase.READINESS)

        score = self.readiness.total_score(qs, answers)
        outcome, warning = self.readiness.interpret_total(score)

        result.readiness_score = score
        result.readiness_outcome = outcome
        result.readiness_warning = warning

        if outcome == "retry_later":
            result.status = ResultStatus.READINESS_FAILED
            self.db.commit()
            return {
                "readiness_score": score,
                "outcome": outcome,
                "allowed": False,
                "message": "Вы выглядите уставшим. Это может повлиять на результаты опроса. Вы можете повторить опрос позже.",
            }

        result.status = ResultStatus.READY_FOR_MAIN
        self.db.commit()
        return {
            "readiness_score": score,
            "outcome": outcome,
            "allowed": True,
            "warning": warning,
            "message": (
                "Ваше состояние выглядит хорошо. Давайте начнём!"
                if not warning
                else "Ваше состояние среднее. Рекомендация: будьте внимательны во время опроса!"
            ),
        }

    def main_questions(self, user_id: uuid.UUID) -> list:
        result = self._active_result(user_id)
        if result.status == ResultStatus.ADAPTIVE_PENDING:
            return self.adaptive_questions(user_id)

        if result.status not in (ResultStatus.READY_FOR_MAIN, ResultStatus.MAIN_IN_PROGRESS):
            raise TestFlowError("Main questions are not available for the current session state")

        if result.main_question_ids is None:
            bank = [q for q in self.catalog.list_main_questions() if q.phase == QuestionPhase.MAIN]
            result.main_question_ids = self.selector.pick_main_pack_three_per_group(bank)
            result.status = ResultStatus.MAIN_IN_PROGRESS
            self.db.commit()

        ordered = self.catalog.list_questions_by_ids(result.main_question_ids)
        return ordered

    def adaptive_questions(self, user_id: uuid.UUID) -> list:
        result = self._active_result(user_id)
        if result.status != ResultStatus.ADAPTIVE_PENDING:
            raise TestFlowError("Adaptive follow-up is not pending for this session")
        ids = result.adaptive_question_ids or []
        return self.catalog.list_questions_by_ids(ids)

    def submit_answer(self, user_id: uuid.UUID, question_id: int, value: int):
        result = self._active_result(user_id)
        q = self.catalog.get_question(question_id)
        if not q:
            raise TestFlowError("Unknown question")

        if q.phase == QuestionPhase.READINESS:
            raise TestFlowError("Readiness answers are submitted via /submit-readiness")

        if result.status == ResultStatus.MAIN_IN_PROGRESS:
            allowed = set(result.main_question_ids or [])
            if question_id not in allowed:
                raise TestFlowError("Question is not part of the current main battery")
            if value < 0 or value > 4:
                raise TestFlowError("Main answers must be an integer 0..4")
            self.answers.upsert(result.id, question_id, value, AnswerPhase.MAIN)
            self.db.commit()
            return {"stored": True, "phase": "main"}

        if result.status == ResultStatus.ADAPTIVE_PENDING:
            allowed = set(result.adaptive_question_ids or [])
            if question_id not in allowed:
                raise TestFlowError("Question is not part of the adaptive follow-up set")
            if value < 0 or value > 4:
                raise TestFlowError("Adaptive answers must be an integer 0..4")
            self.answers.upsert(result.id, question_id, value, AnswerPhase.ADAPTIVE)
            self.db.commit()
            return {"stored": True, "phase": "adaptive"}

        raise TestFlowError("Answers cannot be accepted in the current session state")

    def submit_test(self, user_id: uuid.UUID) -> dict:
        result = self._active_result(user_id)

        if result.status == ResultStatus.MAIN_IN_PROGRESS:
            return self._finalize_main_or_enter_adaptive(result)

        if result.status == ResultStatus.ADAPTIVE_PENDING:
            return self._finalize_after_adaptive(result)

        raise TestFlowError("submit-test is only valid during main or adaptive phases")

    def _finalize_main_or_enter_adaptive(self, result: Result) -> dict:
        main_ids = list(result.main_question_ids or [])
        if len(main_ids) != 75:
            raise TestFlowError("Main battery is not fully configured")

        answers = self.answers.list_for_result(result.id)
        by_q = {a.question_id: a for a in answers if a.phase == AnswerPhase.MAIN}
        missing = [qid for qid in main_ids if qid not in by_q]
        if missing:
            raise TestFlowError(f"Missing answers for {len(missing)} main question(s)")

        qmap: dict[int, Question] = {q.id: q for q in self.catalog.list_main_questions()}

        cluster_scores, group_scores = self.scoring.aggregate(qmap, answers, phases={AnswerPhase.MAIN})
        breakdown = self.scoring.build_breakdown(cluster_scores, group_scores)

        result.cluster_scores = {str(k): float(v) for k, v in breakdown.cluster_scores.items()}
        result.group_scores = {f"{c}:{g}": float(s) for (c, g), s in breakdown.group_scores.items()}
        result.top_cluster_id = breakdown.top_cluster_id
        result.top_group_ids = breakdown.top_group_ids

        if self.scoring.adaptive_needed(breakdown.cluster_scores, rel_threshold=0.10) and not result.adaptive_completed:
            top_c = breakdown.top_cluster_id
            second_c = breakdown.second_cluster_id
            if second_c is None:
                result.status = ResultStatus.COMPLETED
                result.completed_at = datetime.now(timezone.utc)
                self.db.commit()
                return self._result_payload(result, needs_adaptive=False)

            bank = [q for q in self.catalog.list_main_questions() if q.phase == QuestionPhase.MAIN]
            used = set(main_ids)
            adaptive_ids = self.selector.pick_adaptive_pack(bank, top_c, second_c, used, per_cluster=5)
            result.adaptive_eligible = True
            result.adaptive_cluster_pair = [top_c, second_c]
            result.adaptive_question_ids = adaptive_ids
            result.status = ResultStatus.ADAPTIVE_PENDING
            self.db.commit()
            return {
                "status": "adaptive_required",
                "needs_adaptive": True,
                "reason": "Top two clusters are within 10% of each other; answer 10 follow-up questions.",
                "question_ids": adaptive_ids,
                "preliminary": self._score_snapshot(result),
            }

        result.status = ResultStatus.COMPLETED
        result.completed_at = datetime.now(timezone.utc)
        self.db.commit()
        return self._result_payload(result, needs_adaptive=False)

    def _finalize_after_adaptive(self, result: Result) -> dict:
        adaptive_ids = list(result.adaptive_question_ids or [])
        if len(adaptive_ids) != 10:
            raise TestFlowError("Adaptive battery is not fully configured")

        answers = self.answers.list_for_result(result.id)
        by_q = {a.question_id: a for a in answers if a.phase == AnswerPhase.ADAPTIVE}
        missing = [qid for qid in adaptive_ids if qid not in by_q]
        if missing:
            raise TestFlowError(f"Missing answers for {len(missing)} adaptive question(s)")

        all_ids = list(dict.fromkeys((result.main_question_ids or []) + adaptive_ids))
        qmap = {q.id: q for q in self.catalog.list_questions_by_ids(all_ids)}
        # Ensure full map for scoring
        for q in self.catalog.list_main_questions():
            qmap.setdefault(q.id, q)

        cluster_scores, group_scores = self.scoring.aggregate(
            qmap, answers, phases={AnswerPhase.MAIN, AnswerPhase.ADAPTIVE}
        )
        breakdown = self.scoring.build_breakdown(cluster_scores, group_scores)

        result.cluster_scores = {str(k): float(v) for k, v in breakdown.cluster_scores.items()}
        result.group_scores = {f"{c}:{g}": float(s) for (c, g), s in breakdown.group_scores.items()}
        result.top_cluster_id = breakdown.top_cluster_id
        result.top_group_ids = breakdown.top_group_ids
        result.adaptive_completed = True
        result.status = ResultStatus.COMPLETED
        result.completed_at = datetime.now(timezone.utc)
        self.db.commit()
        return self._result_payload(result, needs_adaptive=False)

    def _score_snapshot(self, result: Result) -> dict:
        return {
            "cluster_scores": result.cluster_scores or {},
            "group_scores": result.group_scores or {},
            "top_cluster_id": result.top_cluster_id,
            "top_group_ids": result.top_group_ids or [],
        }

    def _result_payload(self, result: Result, *, needs_adaptive: bool) -> dict:
        return {
            "status": "completed" if result.status == ResultStatus.COMPLETED else result.status.value,
            "needs_adaptive": needs_adaptive,
            "result": self._score_snapshot(result),
        }

    def latest_completed_result(self, user_id: uuid.UUID) -> Result | None:
        return self.results.get_latest_completed(user_id)
