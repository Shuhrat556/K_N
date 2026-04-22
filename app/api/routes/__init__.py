from fastapi import APIRouter

from app.api.routes.academic import admin_router as academic_admin_router
from app.api.routes.academic import public_router as academic_public_router
from app.api.routes.admin import router as admin_router
from app.api.routes.assessment import router as assessment_router

api_router = APIRouter()
api_router.include_router(assessment_router)
api_router.include_router(admin_router)
api_router.include_router(academic_admin_router)
api_router.include_router(academic_public_router)
