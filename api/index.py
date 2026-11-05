import sys
from pathlib import Path

# Adiciona o diretorio raiz do projeto ao sys.path para imports do backend
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from backend.app.main import app

# Export para o runtime Serverless Python da Vercel
__all__ = ["app"]
