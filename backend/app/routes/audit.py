from typing import Any, Dict, Optional
from fastapi import APIRouter
from pydantic import BaseModel
from backend.app.services.audit import (
    log_audit_access,
    fetch_subject_audit_trail,
    fetch_all_audit_logs,
)

router = APIRouter(prefix="/audit", tags=["audit"])

class AuditLogRequest(BaseModel):
    action: str
    actor_id: Optional[str] = None
    actor_role: str = "user"
    target_user_id: Optional[str] = None
    resource: str = "profiles"
    details: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None

@router.post("/log")
async def create_audit_log(payload: AuditLogRequest):
    await log_audit_access(
        action=payload.action,
        actor_id=payload.actor_id,
        actor_role=payload.actor_role,
        target_user_id=payload.target_user_id,
        resource=payload.resource,
        details=payload.details,
        ip_address=payload.ip_address,
        user_agent=payload.user_agent,
    )
    return {"ok": True}

@router.get("/subject/{user_id}")
async def get_subject_trail(user_id: str):
    return await fetch_subject_audit_trail(user_id)

@router.get("/logs")
async def get_all_logs():
    return await fetch_all_audit_logs()

