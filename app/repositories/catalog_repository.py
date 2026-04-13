from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.catalog import Cluster, Group, Question, QuestionPhase


class CatalogRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_readiness_questions(self) -> list[Question]:
        stmt = select(Question).where(Question.phase == QuestionPhase.READINESS).order_by(Question.sort_order)
        return list(self.db.execute(stmt).scalars().all())

    def list_main_questions(self) -> list[Question]:
        stmt = (
            select(Question)
            .where(Question.phase == QuestionPhase.MAIN)
            .options(joinedload(Question.cluster), joinedload(Question.group))
        )
        return list(self.db.execute(stmt).scalars().unique().all())

    def get_question(self, question_id: int) -> Question | None:
        return self.db.get(Question, question_id)

    def list_questions_by_ids(self, ids: list[int]) -> list[Question]:
        if not ids:
            return []
        stmt = select(Question).where(Question.id.in_(ids)).options(joinedload(Question.cluster), joinedload(Question.group))
        rows = list(self.db.execute(stmt).scalars().unique().all())
        by_id = {q.id: q for q in rows}
        return [by_id[i] for i in ids if i in by_id]

    def list_clusters(self) -> list[Cluster]:
        return list(self.db.execute(select(Cluster).order_by(Cluster.sort_order)).scalars().all())

    def list_groups_for_clusters(self, cluster_ids: list[int]) -> list[Group]:
        if not cluster_ids:
            return []
        stmt = select(Group).where(Group.cluster_id.in_(cluster_ids)).order_by(Group.cluster_id, Group.sort_order)
        return list(self.db.execute(stmt).scalars().all())
