"""Selection rules: 3 questions per specialization group (start/middle/end of 8) → 75; adaptive 5+5."""

from __future__ import annotations

import random
from collections import defaultdict
from typing import Optional

from app.models.catalog import Question, QuestionPhase


class QuestionSelectionService:
    """Encapsulates randomization so tests can be seeded deterministically if needed."""

    def __init__(self, rng: Optional[random.Random] = None):
        self._rng = rng or random.Random()

    @staticmethod
    def _positions_for_eight() -> tuple[int, int, int]:
        """Beginning, middle, end indices for an 8-item bank (0-based)."""
        return (0, 4, 7)

    def pick_main_pack_three_per_group(self, all_main: list[Question]) -> list[int]:
        """
        For each (cluster, group), take 3 questions at fixed indices among 8 (0,4,7), shuffle globally.

        Total: 5 clusters × 5 groups × 3 = 75.
        """
        by_group: dict[tuple[int, int], list[Question]] = defaultdict(list)
        for q in all_main:
            if q.cluster_id is None or q.group_id is None:
                continue
            by_group[(q.cluster_id, q.group_id)].append(q)

        chosen: list[int] = []
        for (cid, gid), qs in sorted(by_group.items(), key=lambda kv: (kv[0][0], kv[0][1])):
            ordered = sorted(qs, key=lambda x: x.sort_order)
            if len(ordered) != 8:
                raise ValueError(f"Group cluster={cid} group={gid} must have exactly 8 questions, got {len(ordered)}")
            i0, i1, i2 = self._positions_for_eight()
            for idx in (i0, i1, i2):
                chosen.append(ordered[idx].id)

        if len(chosen) != 75:
            raise ValueError(f"Expected 75 main picks, got {len(chosen)}")

        self._rng.shuffle(chosen)
        return chosen

    def pick_adaptive_pack(
        self,
        all_main: list[Question],
        cluster_a: int,
        cluster_b: int,
        already_used: set[int],
        per_cluster: int = 5,
    ) -> list[int]:
        """5 random unused questions from each of the two ambiguous clusters (10 total)."""

        def pool_for(cid: int) -> list[Question]:
            return [
                q
                for q in all_main
                if q.phase == QuestionPhase.MAIN and q.cluster_id == cid and q.id not in already_used
            ]

        pa, pb = pool_for(cluster_a), pool_for(cluster_b)
        if len(pa) < per_cluster or len(pb) < per_cluster:
            raise ValueError("Not enough unused questions remaining for adaptive follow-up")

        sa = self._rng.sample(pa, per_cluster)
        sb = self._rng.sample(pb, per_cluster)
        out_ids = [q.id for q in sa + sb]
        self._rng.shuffle(out_ids)
        return out_ids
