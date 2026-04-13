from fastapi import APIRouter

from app.api.routes.admin import router as admin_router
from app.api.routes.assessment import router as assessment_router

api_router = APIRouter()
api_router.include_router(assessment_router)
api_router.include_router(admin_router)
