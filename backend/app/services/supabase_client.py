from typing import Any, Dict, List, Optional
import httpx
from backend.app.config import settings

class SupabaseClient:
    def __init__(self) -> None:
        self.base_url = (settings.supabase_url or "").rstrip("/")
        self.key = settings.supabase_service_key or settings.supabase_key or ""

    def _headers(self, auth_token: Optional[str] = None) -> Dict[str, str]:
        token = auth_token or self.key
        headers = {
            "apikey": self.key,
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }
        return headers

    async def rpc(self, func_name: str, payload: Dict[str, Any], auth_token: Optional[str] = None) -> Any:
        url = f"{self.base_url}/rest/v1/rpc/{func_name}"
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, json=payload, headers=self._headers(auth_token))
            if resp.status_code >= 400:
                raise RuntimeError(f"RPC {func_name} failed: {resp.status_code} {resp.text}")
            return resp.json()

    async def select(
        self,
        table: str,
        params: Optional[Dict[str, str]] = None,
        auth_token: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        url = f"{self.base_url}/rest/v1/{table}"
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(url, params=params, headers=self._headers(auth_token))
            if resp.status_code >= 400:
                raise RuntimeError(f"Select from {table} failed: {resp.status_code} {resp.text}")
            return resp.json()

    async def insert(
        self,
        table: str,
        record: Dict[str, Any],
        auth_token: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        url = f"{self.base_url}/rest/v1/{table}"
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, json=record, headers=self._headers(auth_token))
            if resp.status_code >= 400:
                raise RuntimeError(f"Insert into {table} failed: {resp.status_code} {resp.text}")
            return resp.json()

    async def update(
        self,
        table: str,
        params: Dict[str, str],
        values: Dict[str, Any],
        auth_token: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        url = f"{self.base_url}/rest/v1/{table}"
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.patch(url, params=params, json=values, headers=self._headers(auth_token))
            if resp.status_code >= 400:
                raise RuntimeError(f"Update {table} failed: {resp.status_code} {resp.text}")
            return resp.json()

supabase = SupabaseClient()

