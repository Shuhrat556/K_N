"""Simple admin endpoints for managing catalog entities."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import delete, distinct, func, or_, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.answer import Answer
from app.models.catalog import Cluster, Group, Question, QuestionPhase
from app.models.result import Result, ResultStatus
from app.models.user import User
from app.schemas.admin import (
    AdminStatsOut,
    ClusterIn,
    ClusterOut,
    ClusterUpdate,
    GroupIn,
    GroupOut,
    GroupUpdate,
    QuestionIn,
    QuestionOut,
    QuestionUpdate,
    validate_option_labels_for_phase,
)

router = APIRouter(prefix="/admin", tags=["admin"])

_UNSET = object()


def _questions_reference_cluster(db: Session, cluster_id: int) -> bool:
    group_ids_sq = select(Group.id).where(Group.cluster_id == cluster_id)
    n = db.scalar(
        select(func.count())
        .select_from(Question)
        .where(or_(Question.cluster_id == cluster_id, Question.group_id.in_(group_ids_sq)))
    )
    return (n or 0) > 0


def _questions_reference_group(db: Session, group_id: int) -> bool:
    n = db.scalar(select(func.count()).select_from(Question).where(Question.group_id == group_id))
    return (n or 0) > 0


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


@router.patch("/clusters/{cluster_id}", response_model=ClusterOut)
def patch_cluster(cluster_id: int, body: ClusterUpdate, db: Session = Depends(get_db)):
    row = db.get(Cluster, cluster_id)
    if not row:
        raise HTTPException(status_code=404, detail="Cluster not found")
    data = body.model_dump(exclude_unset=True)
    if "code" in data:
        row.code = data["code"].strip()
    if "name" in data:
        row.name = data["name"].strip()
    if "sort_order" in data and data["sort_order"] is not None:
        row.sort_order = data["sort_order"]
    try:
        db.commit()
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Cluster code must be unique") from e
    db.refresh(row)
    return ClusterOut(id=row.id, code=row.code, name=row.name, sort_order=row.sort_order)


@router.delete("/clusters/{cluster_id}", status_code=204)
def delete_cluster(cluster_id: int, db: Session = Depends(get_db)):
    row = db.get(Cluster, cluster_id)
    if not row:
        raise HTTPException(status_code=404, detail="Cluster not found")
    if _questions_reference_cluster(db, cluster_id):
        raise HTTPException(
            status_code=400,
            detail="Cannot delete cluster: reassign or delete questions that use this cluster or its groups first",
        )
    db.delete(row)
    db.commit()


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


@router.patch("/groups/{group_id}", response_model=GroupOut)
def patch_group(group_id: int, body: GroupUpdate, db: Session = Depends(get_db)):
    row = db.get(Group, group_id)
    if not row:
        raise HTTPException(status_code=404, detail="Group not found")
    data = body.model_dump(exclude_unset=True)
    if "cluster_id" in data:
        if not db.get(Cluster, data["cluster_id"]):
            raise HTTPException(status_code=404, detail="Cluster not found")
        new_cid = data["cluster_id"]
        if new_cid != row.cluster_id:
            db.execute(
                update(Question)
                .where(Question.group_id == group_id, Question.phase == QuestionPhase.MAIN)
                .values(cluster_id=new_cid)
            )
            row.cluster_id = new_cid
    if "code" in data:
        row.code = data["code"].strip()
    if "name" in data:
        row.name = data["name"].strip()
    if "sort_order" in data and data["sort_order"] is not None:
        row.sort_order = data["sort_order"]
    try:
        db.commit()
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Group code must be unique inside cluster") from e
    db.refresh(row)
    return GroupOut(id=row.id, cluster_id=row.cluster_id, code=row.code, name=row.name, sort_order=row.sort_order)


@router.delete("/groups/{group_id}", status_code=204)
def delete_group(group_id: int, db: Session = Depends(get_db)):
    row = db.get(Group, group_id)
    if not row:
        raise HTTPException(status_code=404, detail="Group not found")
    if _questions_reference_group(db, group_id):
        raise HTTPException(
            status_code=400,
            detail="Cannot delete group: reassign or delete questions that use this group first",
        )
    db.delete(row)
    db.commit()


@router.get("/stats", response_model=AdminStatsOut)
def admin_stats(db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    day_ago = now - timedelta(days=1)
    week_ago = now - timedelta(days=7)

    total_users = db.scalar(select(func.count()).select_from(User)) or 0
    total_results = db.scalar(select(func.count()).select_from(Result)) or 0
    completed_results = db.scalar(
        select(func.count()).select_from(Result).where(Result.status == ResultStatus.COMPLETED)
    ) or 0

    status_rows = db.execute(select(Result.status, func.count()).group_by(Result.status)).all()
    results_by_status = {status.value: int(cnt) for status, cnt in status_rows}

    results_updated_last_24h = (
        db.scalar(select(func.count()).select_from(Result).where(Result.updated_at >= day_ago)) or 0
    )
    active_users_last_24h = (
        db.scalar(
            select(func.count(distinct(Result.user_id))).select_from(Result).where(Result.updated_at >= day_ago)
        )
        or 0
    )
    users_created_last_7_days = (
        db.scalar(select(func.count()).select_from(User).where(User.created_at >= week_ago)) or 0
    )
    total_questions = db.scalar(select(func.count()).select_from(Question)) or 0
    total_answers = db.scalar(select(func.count()).select_from(Answer)) or 0

    return AdminStatsOut(
        total_users=total_users,
        total_results=total_results,
        results_by_status=results_by_status,
        completed_results=completed_results,
        results_updated_last_24h=results_updated_last_24h,
        active_users_last_24h=active_users_last_24h,
        users_created_last_7_days=users_created_last_7_days,
        total_questions=total_questions,
        total_answers=total_answers,
    )


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


@router.delete("/questions/{question_id}", status_code=204)
def delete_question(question_id: int, db: Session = Depends(get_db)):
    row = db.get(Question, question_id)
    if not row:
        raise HTTPException(status_code=404, detail="Question not found")
    db.execute(delete(Answer).where(Answer.question_id == question_id))
    db.delete(row)
    db.commit()
