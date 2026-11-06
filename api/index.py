import os
import sys
from pathlib import Path

# Padrão oficial da Vercel para Vite + FastAPI:
# Adiciona a raiz do projeto e a pasta backend ao sys.path antes dos imports
ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT_DIR / "backend"

for p in [str(BACKEND_DIR), str(ROOT_DIR)]:
    if p in sys.path:
        sys.path.remove(p)
    sys.path.insert(0, p)

from app.main import app

# Expondo a instância app do FastAPI para o runtime serverless da Vercel
__all__ = ["app"]
