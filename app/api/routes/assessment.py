"""Assessment HTTP endpoints (Kasbnoma quiz flow)."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_test_flow_service
from app.models.catalog import Cluster, Group
from app.models.catalog import QuestionPhase
from app.schemas.readiness import ReadinessQuestionOut, SubmitReadinessIn, SubmitReadinessOut
from app.schemas.results import ResultOut, ScoreBreakdownOut
from app.schemas.results import SpecializationOut
from app.schemas.test_flow import StartTestIn, StartTestOut, SubmitAnswerIn, SubmitTestIn, SubmitTestOut, TestQuestionOut
from app.services.test_flow_service import TestFlowError, TestFlowService

router = APIRouter(tags=["assessment"])


def _handle_domain(err: TestFlowError) -> HTTPException:
    return HTTPException(status_code=400, detail=str(err))


@router.post("/start-test", response_model=StartTestOut)
def start_test(body: StartTestIn, svc: TestFlowService = Depends(get_test_flow_service)):
    try:
        user, result = svc.start_test(body.user_id)
        return StartTestOut(user_id=user.id, session_id=result.id, status=result.status.value)
    except TestFlowError as e:
        raise _handle_domain(e) from e


@router.get("/readiness-questions", response_model=list[ReadinessQuestionOut])
def readiness_questions(
    user_id: uuid.UUID = Query(..., description="User created by POST /start-test"),
    svc: TestFlowService = Depends(get_test_flow_service),
):
    try:
        qs = svc.readiness_questions(user_id)
        return [
            ReadinessQuestionOut(id=q.id, text=q.text, text_tj=q.text_tj, kind=q.readiness_kind) for q in qs
        ]
    except TestFlowError as e:
        raise _handle_domain(e) from e


@router.post("/submit-readiness", response_model=SubmitReadinessOut)
def submit_readiness(body: SubmitReadinessIn, svc: TestFlowService = Depends(get_test_flow_service)):
    answers = {a.question_id: a.choice_index for a in body.answers}
    try:
        payload = svc.submit_readiness(body.user_id, answers)
        return SubmitReadinessOut(**payload)
    except TestFlowError as e:
        raise _handle_domain(e) from e
    except KeyError as e:
        raise HTTPException(status_code=400, detail=f"Missing answer for question: {e}") from e


@router.get("/questions", response_model=list[TestQuestionOut])
def questions(
    user_id: uuid.UUID = Query(..., description="User created by POST /start-test"),
    svc: TestFlowService = Depends(get_test_flow_service),
):
    try:
        qs = svc.main_questions(user_id)
        return [
            TestQuestionOut(id=q.id, text=q.text, text_tj=q.text_tj)
            for q in qs
            if q.phase == QuestionPhase.MAIN
        ]
    except TestFlowError as e:
        raise _handle_domain(e) from e


@router.post("/submit-answer")
def submit_answer(body: SubmitAnswerIn, svc: TestFlowService = Depends(get_test_flow_service)):
    try:
        return svc.submit_answer(body.user_id, body.question_id, body.value)
    except TestFlowError as e:
        raise _handle_domain(e) from e


@router.post("/submit-test", response_model=SubmitTestOut)
def submit_test(body: SubmitTestIn, svc: TestFlowService = Depends(get_test_flow_service)):
    try:
        payload = svc.submit_test(body.user_id)
        return SubmitTestOut(**payload)
    except TestFlowError as e:
        raise _handle_domain(e) from e


@router.get("/result/{user_id}", response_model=ResultOut)
def get_result(user_id: uuid.UUID, db: Session = Depends(get_db), svc: TestFlowService = Depends(get_test_flow_service)):
    row = svc.latest_completed_result(user_id)
    if not row:
        raise HTTPException(status_code=404, detail="No completed result for user")
    breakdown = ScoreBreakdownOut(
        cluster_scores=row.cluster_scores or {},
        group_scores=row.group_scores or {},
        top_cluster_id=row.top_cluster_id,
        top_group_ids=row.top_group_ids or [],
    )
    top_cluster_name = None
    if row.top_cluster_id is not None:
        c = db.get(Cluster, row.top_cluster_id)
        top_cluster_name = c.name if c else None
    specs: list[SpecializationOut] = []
    for gid in row.top_group_ids or []:
        g = db.get(Group, gid)
        if g:
            specs.append(SpecializationOut(id=g.id, name=g.name))
    return ResultOut(
        user_id=user_id,
        session_id=row.id,
        completed_at=row.completed_at,
        readiness_score=row.readiness_score,
        readiness_outcome=row.readiness_outcome,
        readiness_warning=row.readiness_warning,
        adaptive_completed=row.adaptive_completed,
        breakdown=breakdown,
        top_cluster_name=top_cluster_name,
        specializations=specs,
    )
