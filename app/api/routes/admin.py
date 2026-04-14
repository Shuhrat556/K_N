"""Simple admin endpoints for managing catalog entities."""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.catalog import Cluster, Group, Question, QuestionPhase
from app.schemas.admin import ClusterIn, ClusterOut, GroupIn, GroupOut, QuestionIn, QuestionOut

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/clusters", response_model=list[ClusterOut])
def list_clusters(db: Session = Depends(get_db)):
    rows = db.execute(select(Cluster).order_by(Cluster.sort_order, Cluster.id)).scalars().all()
    return [ClusterOut(id=r.id, code=r.code, name=r.name, sort_order=r.sort_order) for r in rows]


@router.post("/clusters", response_model=ClusterOut)
def create_cluster(body: ClusterIn, db: Session = Depends(get_db)):
    row = Cluster(code=body.code.strip(), name=body.name.strip(), sort_order=body.sort_order)
    db.add(row)
    try:
        db.commit()
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Cluster code must be unique") from e
    db.refresh(row)
    return ClusterOut(id=row.id, code=row.code, name=row.name, sort_order=row.sort_order)


@router.get("/groups", response_model=list[GroupOut])
def list_groups(cluster_id: Optional[int] = Query(default=None), db: Session = Depends(get_db)):
    stmt = select(Group)
    if cluster_id is not None:
        stmt = stmt.where(Group.cluster_id == cluster_id)
    stmt = stmt.order_by(Group.cluster_id, Group.sort_order, Group.id)
    rows = db.execute(stmt).scalars().all()
    return [
        GroupOut(id=r.id, cluster_id=r.cluster_id, code=r.code, name=r.name, sort_order=r.sort_order) for r in rows
    ]


@router.post("/groups", response_model=GroupOut)
def create_group(body: GroupIn, db: Session = Depends(get_db)):
    if not db.get(Cluster, body.cluster_id):
        raise HTTPException(status_code=404, detail="Cluster not found")
    row = Group(
        cluster_id=body.cluster_id,
        code=body.code.strip(),
        name=body.name.strip(),
        sort_order=body.sort_order,
    )
    db.add(row)
    try:
        db.commit()
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Group code must be unique inside cluster") from e
    db.refresh(row)
    return GroupOut(id=row.id, cluster_id=row.cluster_id, code=row.code, name=row.name, sort_order=row.sort_order)


@router.get("/questions", response_model=list[QuestionOut])
def list_questions(
    phase: Optional[QuestionPhase] = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    stmt = select(Question)
    if phase is not None:
        stmt = stmt.where(Question.phase == phase)
    stmt = stmt.order_by(Question.id.desc()).limit(limit)
    rows = db.execute(stmt).scalars().all()
    return [
        QuestionOut(
            id=r.id,
            phase=r.phase,
            text=r.text,
            text_tj=r.text_tj,
            readiness_kind=r.readiness_kind,
            cluster_id=r.cluster_id,
            group_id=r.group_id,
            sort_order=r.sort_order,
        )
        for r in rows
    ]


@router.post("/questions", response_model=QuestionOut)
def create_question(body: QuestionIn, db: Session = Depends(get_db)):
    if body.phase == QuestionPhase.READINESS:
        if body.readiness_kind is None:
            raise HTTPException(status_code=400, detail="readiness_kind is required for readiness questions")
        cluster_id = None
        group_id = None
    else:
        if body.cluster_id is None or body.group_id is None:
            raise HTTPException(status_code=400, detail="cluster_id and group_id are required for main questions")
        if not db.get(Cluster, body.cluster_id):
            raise HTTPException(status_code=404, detail="Cluster not found")
        grp = db.get(Group, body.group_id)
        if not grp or grp.cluster_id != body.cluster_id:
            raise HTTPException(status_code=400, detail="Group not found in selected cluster")
        cluster_id = body.cluster_id
        group_id = body.group_id

    row = Question(
        phase=body.phase,
        text=body.text.strip(),
        text_tj=(body.text_tj or "").strip() or None,
        readiness_kind=body.readiness_kind if body.phase == QuestionPhase.READINESS else None,
        cluster_id=cluster_id,
        group_id=group_id,
        sort_order=body.sort_order,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return QuestionOut(
        id=row.id,
        phase=row.phase,
        text=row.text,
        text_tj=row.text_tj,
        readiness_kind=row.readiness_kind,
        cluster_id=row.cluster_id,
        group_id=row.group_id,
        sort_order=row.sort_order,
    )
