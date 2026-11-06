import os
import sys
from pathlib import Path
from pydantic import BaseModel

DEFAULT_SECRET = "caritas-pets-lgpd-secret-encryption-key-2026"

def _safe_get_env(key: str, default: str = "") -> str:
    """Leitura segura de variavel de ambiente sem crash se nao existir ou estiver vazia."""
    val = os.getenv(key)
    if val is None or not isinstance(val, str) or val.strip() == "":
        return default
    return val.strip()

def _parse_port() -> int:
    raw = os.getenv("PORT", "8000")
    if raw and isinstance(raw, str) and raw.strip().isdigit():
        return int(raw.strip())
    return 8000

# Descoberta segura do diretorio raiz
ROOT_DIR = Path(__file__).resolve().parent.parent

def _load_env_file(filepath: Path) -> None:
    try:
        if not filepath.exists() or not filepath.is_file():
            return
        with open(filepath, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                k = k.strip()
                v = v.strip().strip("\"'")
                if k and not os.getenv(k):
                    os.environ[k] = v
    except Exception:
        pass

_load_env_file(ROOT_DIR / ".env")
_load_env_file(ROOT_DIR / ".env.local")

# Leitura segura e compativel com multiplos nomes de variaveis
SUPABASE_URL = (
    _safe_get_env("VITE_SUPABASE_URL")
    or _safe_get_env("SUPABASE_URL")
    or _safe_get_env("NEXT_PUBLIC_SUPABASE_URL")
)

SUPABASE_KEY = (
    _safe_get_env("VITE_SUPABASE_ANON_KEY")
    or _safe_get_env("VITE_SUPABASE_PUBLISHABLE_KEY")
    or _safe_get_env("SUPABASE_ANON_KEY")
    or _safe_get_env("SUPABASE_PUBLISHABLE_KEY")
    or _safe_get_env("SUPABASE_KEY")
)

SUPABASE_SERVICE_KEY = (
    _safe_get_env("SUPABASE_SERVICE_ROLE_KEY")
    or _safe_get_env("SUPABASE_SERVICE_KEY")
)

ENCRYPTION_KEY = _safe_get_env("ENCRYPTION_KEY", DEFAULT_SECRET)
PORT = _parse_port()
HOST = _safe_get_env("HOST", "0.0.0.0")

# Validacao clara no cold start para logs da Vercel sem crash
missing_vars = []
if not SUPABASE_URL:
    missing_vars.append("VITE_SUPABASE_URL / SUPABASE_URL")
if not SUPABASE_KEY:
    missing_vars.append("VITE_SUPABASE_ANON_KEY / SUPABASE_ANON_KEY")

if missing_vars:
    print(
        f"[Carita's Pets] AVISO COLD-START: Variaveis de ambiente nao encontradas: {', '.join(missing_vars)}. "
        "A aplicacao inicializou em modo seguro (degrade gracioso). "
        "Configure-as em Settings -> Environment Variables na Vercel."
    )
else:
    print("[Carita's Pets] Conexao com Supabase configurada com sucesso!")

class Settings(BaseModel):
    supabase_url: str = SUPABASE_URL
    supabase_key: str = SUPABASE_KEY
    supabase_service_key: str = SUPABASE_SERVICE_KEY
    encryption_key: str = ENCRYPTION_KEY
    port: int = PORT
    host: str = HOST

settings = Settings()
