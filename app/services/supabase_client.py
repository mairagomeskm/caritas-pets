import os
import logging
from typing import Any, Dict, List, Optional
import httpx

logger = logging.getLogger("caritas_pets.supabase")

def _safe_getenv(key: str, default: str = "") -> str:
    """Leitura segura de variavel de ambiente sem crash no import."""
    val = os.getenv(key)
    if val is None or not isinstance(val, str) or val.strip() == "":
        return default
    return val.strip()

# Leitura segura com fallback gracioso para multiplos padroes de nomenclatura
SUPABASE_URL = (
    _safe_getenv("VITE_SUPABASE_URL")
    or _safe_getenv("SUPABASE_URL")
    or _safe_getenv("NEXT_PUBLIC_SUPABASE_URL")
)

SUPABASE_KEY = (
    _safe_getenv("VITE_SUPABASE_ANON_KEY")
    or _safe_getenv("VITE_SUPABASE_PUBLISHABLE_KEY")
    or _safe_getenv("SUPABASE_ANON_KEY")
    or _safe_getenv("SUPABASE_PUBLISHABLE_KEY")
    or _safe_getenv("SUPABASE_KEY")
)

SUPABASE_SERVICE_KEY = (
    _safe_getenv("SUPABASE_SERVICE_ROLE_KEY")
    or _safe_getenv("SUPABASE_SERVICE_KEY")
)

class SupabaseClient:
    def __init__(self, url: str = "", key: str = "") -> None:
        self.base_url = (url or "").rstrip("/")
        self.key = key or ""

    def is_configured(self) -> bool:
        return bool(self.base_url and self.key)

    def _headers(self, auth_token: Optional[str] = None) -> Dict[str, str]:
        token = auth_token or self.key
        return {
            "apikey": self.key,
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }

    async def rpc(self, func_name: str, payload: Dict[str, Any], auth_token: Optional[str] = None) -> Any:
        if not self.is_configured():
            return None
        try:
            url = f"{self.base_url}/rest/v1/rpc/{func_name}"
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(url, json=payload, headers=self._headers(auth_token))
                if resp.status_code >= 400:
                    logger.warning(f"RPC {func_name} falhou: {resp.status_code}")
                    return None
                return resp.json()
        except Exception as exc:
            logger.error(f"Erro ao executar RPC {func_name}: {exc}")
            return None

    async def select(
        self,
        table: str,
        params: Optional[Dict[str, str]] = None,
        auth_token: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        if not self.is_configured():
            return []
        try:
            url = f"{self.base_url}/rest/v1/{table}"
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(url, params=params, headers=self._headers(auth_token))
                if resp.status_code >= 400:
                    logger.warning(f"Select em {table} falhou: {resp.status_code}")
                    return []
                return resp.json()
        except Exception as exc:
            logger.error(f"Erro ao selecionar de {table}: {exc}")
            return []

    async def insert(
        self,
        table: str,
        record: Dict[str, Any],
        auth_token: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        if not self.is_configured():
            return []
        try:
            url = f"{self.base_url}/rest/v1/{table}"
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(url, json=record, headers=self._headers(auth_token))
                if resp.status_code >= 400:
                    logger.warning(f"Insert em {table} falhou: {resp.status_code}")
                    return []
                return resp.json()
        except Exception as exc:
            logger.error(f"Erro ao inserir em {table}: {exc}")
            return []

    async def update(
        self,
        table: str,
        params: Dict[str, str],
        values: Dict[str, Any],
        auth_token: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        if not self.is_configured():
            return []
        try:
            url = f"{self.base_url}/rest/v1/{table}"
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.patch(url, params=params, json=values, headers=self._headers(auth_token))
                if resp.status_code >= 400:
                    logger.warning(f"Update em {table} falhou: {resp.status_code}")
                    return []
                return resp.json()
        except Exception as exc:
            logger.error(f"Erro ao atualizar {table}: {exc}")
            return []

# Inicializacao totalmente segura: NUNCA gera excecao nao tratada no import
try:
    effective_key = SUPABASE_SERVICE_KEY or SUPABASE_KEY
    supabase = SupabaseClient(url=SUPABASE_URL, key=effective_key)
    if not supabase.is_configured():
        print(
            "[Carita's Pets] SupabaseClient inicializado em modo seguro (sem credenciais ativas). "
            "A API Python inicializa sem crash no cold start."
        )
except Exception as exc:
    print(f"[Carita's Pets] Aviso na inicializacao do Supabase: {exc}")
    supabase = SupabaseClient()

def get_supabase_client():
    """Client oficial seguro usando supabase-py caso necessario"""
    if not SUPABASE_URL or not (SUPABASE_SERVICE_KEY or SUPABASE_KEY):
        return None
    try:
        from supabase import create_client
        return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY or SUPABASE_KEY)
    except Exception as exc:
        print(f"[Carita's Pets] Aviso: inicializacao do client supabase-py ignorada: {exc}")
        return None
