import os
import sys
from pathlib import Path
from pydantic import BaseModel

DEFAULT_SECRET = "caritas-pets-lgpd-secret-encryption-key-2026"

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
                if k not in os.environ:
                    os.environ[k] = v
    except Exception:
        pass

# Descoberta segura do diretório raiz
ROOT_DIR = Path(__file__).resolve().parent.parent
_load_env_file(ROOT_DIR / ".env")
_load_env_file(ROOT_DIR / ".env.local")

class Settings(BaseModel):
    # Aceita tanto prefixo VITE_ quanto variaveis padrao de backend
    supabase_url: str = (
        os.getenv("VITE_SUPABASE_URL")
        or os.getenv("SUPABASE_URL")
        or os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
    )
    supabase_key: str = (
        os.getenv("VITE_SUPABASE_ANON_KEY")
        or os.getenv("VITE_SUPABASE_PUBLISHABLE_KEY")
        or os.getenv("SUPABASE_ANON_KEY")
        or os.getenv("SUPABASE_PUBLISHABLE_KEY")
        or os.getenv("SUPABASE_KEY", "")
    )
    supabase_service_key: str = (
        os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        or os.getenv("SUPABASE_SERVICE_KEY", "")
    )
    encryption_key: str = os.getenv("ENCRYPTION_KEY", DEFAULT_SECRET)
    port: int = int(os.getenv("PORT", "8000"))
    host: str = os.getenv("HOST", "0.0.0.0")

settings = Settings()
