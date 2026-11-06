from fastapi import APIRouter
from pydantic import BaseModel
from app.services.retention import run_retention_lifecycle_job

router = APIRouter(prefix="/retention", tags=["retention"])

class RetentionRequest(BaseModel):
    days_threshold: int = 60

@router.post("/run")
async def trigger_retention(payload: RetentionRequest = RetentionRequest()):
    return await run_retention_lifecycle_job(payload.days_threshold)
