import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
BACKEND_DIR = ROOT_DIR / "backend"

for p in [str(BACKEND_DIR), str(ROOT_DIR)]:
    if p in sys.path:
        sys.path.remove(p)
    sys.path.insert(0, p)

from app.config import settings, Settings

__all__ = ["settings", "Settings"]
