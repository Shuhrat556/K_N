"""Simple admin endpoints for managing catalog entities."""

from __future__ import annotations

from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.catalog import Cluster, Group, Question, QuestionPhase
from app.schemas.admin import (
    ClusterIn,
    ClusterOut,
    GroupIn,
    GroupOut,
    QuestionIn,
    QuestionOut,
    QuestionUpdate,
    validate_option_labels_for_phase,
)

router = APIRouter(prefix="/admin", tags=["admin"])

_UNSET = object()


def _question_to_out(r: Question) -> QuestionOut:
    return QuestionOut(
        id=r.id,
        phase=r.phase,
        text=r.text,
        text_tj=r.text_tj,
        readiness_kind=r.readiness_kind,
        cluster_id=r.cluster_id,
        group_id=r.group_id,
        sort_order=r.sort_order,
        option_labels=r.option_labels,
        option_labels_tj=r.option_labels_tj,
    )


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
    return [_question_to_out(r) for r in rows]


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
        option_labels=body.option_labels,
        option_labels_tj=body.option_labels_tj,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return _question_to_out(row)


@router.patch("/questions/{question_id}", response_model=QuestionOut)
def patch_question(question_id: int, body: QuestionUpdate, db: Session = Depends(get_db)):
    row = db.get(Question, question_id)
    if not row:
        raise HTTPException(status_code=404, detail="Question not found")

    data: dict[str, Any] = body.model_dump(exclude_unset=True)

    def pick(key: str) -> Any:
        return data[key] if key in data else _UNSET

    ol = pick("option_labels")
    oltj = pick("option_labels_tj")
    if ol is not _UNSET or oltj is not _UNSET:
        next_ol = row.option_labels if ol is _UNSET else ol
        next_oltj = row.option_labels_tj if oltj is _UNSET else oltj
        try:
            validate_option_labels_for_phase(row.phase, next_ol, next_oltj)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e)) from e
        if ol is not _UNSET:
            row.option_labels = ol
        if oltj is not _UNSET:
            row.option_labels_tj = oltj

    if "text" in data:
        row.text = data["text"].strip()
    if "text_tj" in data:
        row.text_tj = (data["text_tj"] or "").strip() or None
    if "sort_order" in data and data["sort_order"] is not None:
        row.sort_order = data["sort_order"]

    if "readiness_kind" in data and row.phase == QuestionPhase.READINESS:
        row.readiness_kind = data["readiness_kind"]

    if row.phase == QuestionPhase.MAIN:
        new_cid = data.get("cluster_id", row.cluster_id)
        new_gid = data.get("group_id", row.group_id)
        if "cluster_id" in data or "group_id" in data:
            if new_cid is None or new_gid is None:
                raise HTTPException(status_code=400, detail="cluster_id and group_id are required for main questions")
            if not db.get(Cluster, new_cid):
                raise HTTPException(status_code=404, detail="Cluster not found")
            grp = db.get(Group, new_gid)
            if not grp or grp.cluster_id != new_cid:
                raise HTTPException(status_code=400, detail="Group not found in selected cluster")
            row.cluster_id = new_cid
            row.group_id = new_gid
    else:
        if "cluster_id" in data or "group_id" in data:
            raise HTTPException(status_code=400, detail="cluster_id/group_id apply only to main-phase questions")

    db.commit()
    db.refresh(row)
    return _question_to_out(row)
