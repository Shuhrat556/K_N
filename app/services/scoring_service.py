"""Main and adaptive test scoring: Likert mapping, cluster/group aggregates, recommendations."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable

from app.models.answer import Answer, AnswerPhase
from app.models.catalog import Question, QuestionPhase


@dataclass(frozen=True)
class ScoreBreakdown:
    cluster_scores: dict[int, float]
    group_scores: dict[tuple[int, int], float]  # (cluster_id, group_id)
    top_cluster_id: int
    second_cluster_id: int | None
    top_group_ids: list[int]


class ScoringService:
    """Likert 0..4 → weight -2..+2; sums per cluster and per (cluster, group)."""

    LIKERT_WEIGHT = {0: -2, 1: -1, 2: 0, 3: 1, 4: 2}

    @classmethod
    def likert_weight(cls, value: int) -> int:
        if value not in cls.LIKERT_WEIGHT:
            raise ValueError("Main/adaptive answers must be integers 0..4")
        return cls.LIKERT_WEIGHT[value]

    @classmethod
    def aggregate(
        cls,
        questions_by_id: dict[int, Question],
        answers: Iterable[Answer],
        *,
        phases: set[AnswerPhase] | None = None,
    ) -> tuple[dict[int, float], dict[tuple[int, int], float]]:
        cluster_scores: dict[int, float] = {}
        group_scores: dict[tuple[int, int], float] = {}

        phases = phases or {AnswerPhase.MAIN, AnswerPhase.ADAPTIVE}

        for ans in answers:
            if ans.phase not in phases:
                continue
            q = questions_by_id.get(ans.question_id)
            if not q or q.phase != QuestionPhase.MAIN:
                continue
            if q.cluster_id is None or q.group_id is None:
                continue
            w = float(cls.likert_weight(ans.value))
            cid, gid = q.cluster_id, q.group_id
            cluster_scores[cid] = cluster_scores.get(cid, 0.0) + w
            key = (cid, gid)
            group_scores[key] = group_scores.get(key, 0.0) + w

        return cluster_scores, group_scores

    @staticmethod
    def top_two_clusters(cluster_scores: dict[int, float]) -> tuple[int | None, int | None]:
        if not cluster_scores:
            return None, None
        ordered = sorted(cluster_scores.items(), key=lambda kv: kv[1], reverse=True)
        top_id, top_val = ordered[0]
        second_id = ordered[1][0] if len(ordered) > 1 else None
        return top_id, second_id

    @staticmethod
    def adaptive_needed(cluster_scores: dict[int, float], rel_threshold: float = 0.10) -> bool:
        """
        If top-2 clusters are within `rel_threshold` relative gap of the leader, add 10 questions.

        Uses (c1 - c2) / c1 < threshold when c1 > 0; if c1 == 0, adaptive is not meaningful → False.
        """
        if len(cluster_scores) < 2:
            return False
        ordered = sorted(cluster_scores.values(), reverse=True)
        c1, c2 = ordered[0], ordered[1]
        if c1 <= 0:
            return False
        return (c1 - c2) / c1 < rel_threshold

    @classmethod
    def recommend_groups(cls, cluster_id: int, group_scores: dict[tuple[int, int], float]) -> list[int]:
        """
        Pick top 1–2 specializations inside the winning cluster.

        Always include rank-1. Include rank-2 if it is close (>= 90% of leader when leader>0,
        or absolute gap <= 1.0 otherwise).
        """
        scoped = [(g, s) for (c, g), s in group_scores.items() if c == cluster_id]
        if not scoped:
            return []
        scoped.sort(key=lambda t: t[1], reverse=True)
        best_g, best_s = scoped[0]
        out = [best_g]
        if len(scoped) == 1:
            return out
        second_g, second_s = scoped[1]
        if best_s > 0 and second_s >= 0.9 * best_s:
            out.append(second_g)
        elif best_s <= 0 and (best_s - second_s) <= 1.0:
            # Low-signal tie-breaker: still surface two close options.
            out.append(second_g)
        return out

    @classmethod
    def build_breakdown(
        cls, cluster_scores: dict[int, float], group_scores: dict[tuple[int, int], float]
    ) -> ScoreBreakdown:
        top_c, second_c = cls.top_two_clusters(cluster_scores)
        if top_c is None:
            raise ValueError("Cannot build breakdown without cluster scores")
        top_groups = cls.recommend_groups(top_c, group_scores)
        return ScoreBreakdown(
            cluster_scores=dict(cluster_scores),
            group_scores=dict(group_scores),
            top_cluster_id=top_c,
            second_cluster_id=second_c,
            top_group_ids=top_groups,
        )
