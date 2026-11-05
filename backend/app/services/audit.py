from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from backend.app.services.supabase_client import supabase

async def log_audit_access(
    action: str,
    actor_id: Optional[str] = None,
    actor_role: str = "user",
    target_user_id: Optional[str] = None,
    resource: str = "profiles",
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
) -> None:
    try:
        record = {
            "actor_id": actor_id,
            "actor_role": actor_role or "user",
            "target_user_id": target_user_id,
            "action": action,
            "resource": resource or "profiles",
            "details": details or {},
            "ip_address": ip_address,
            "user_agent": user_agent or "system",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await supabase.insert("audit_logs", record)
    except Exception:
        pass

async def fetch_subject_audit_trail(user_id: str) -> List[Dict[str, Any]]:
    try:
        params = {
            "or": f"(target_user_id.eq.{user_id},actor_id.eq.{user_id})",
            "order": "created_at.desc",
            "limit": "50",
        }
        return await supabase.select("audit_logs", params)
    except Exception:
        return []

async def fetch_all_audit_logs() -> List[Dict[str, Any]]:
    try:
        params = {
            "order": "created_at.desc",
            "limit": "100",
        }
        return await supabase.select("audit_logs", params)
    except Exception:
        return []

