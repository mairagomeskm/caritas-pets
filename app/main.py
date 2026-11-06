import os
import sys
from pathlib import Path

# Suporte universal a sys.path: tanto da raiz quanto da pasta backend
CURRENT_DIR = Path(__file__).resolve().parent
ROOT_DIR = CURRENT_DIR.parent
BACKEND_DIR = ROOT_DIR / "backend"

# Garante que ROOT_DIR fique na frente do sys.path para priorizar imports corretos
for p in [str(BACKEND_DIR), str(ROOT_DIR)]:
    if p in sys.path:
        sys.path.remove(p)
    sys.path.insert(0, p)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.middleware import CsrfProtectionMiddleware, ErrorHandlingMiddleware
from app.routes import retention, audit, crypto, pix, validators
from app.config import settings

app = FastAPI(
    title="Carita's Pets API",
    description="Backend em Python para a plataforma Carita's Pets (Adoção, LGPD, Vaquinhas)",
    version="1.0.0",
)

# Middlewares de seguranca e CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(CsrfProtectionMiddleware)
app.add_middleware(ErrorHandlingMiddleware)

# Rotas de API
app.include_router(retention.router, prefix="/api")
app.include_router(audit.router, prefix="/api")
app.include_router(crypto.router, prefix="/api")
app.include_router(pix.router, prefix="/api")
app.include_router(validators.router, prefix="/api")

@app.get("/api/health")
@app.get("/api")
async def health_check():
    return {
        "status": "ok",
        "platform": "Carita's Pets",
        "service": "Python Backend API",
        "supabase_configured": bool(settings.supabase_url and settings.supabase_key),
    }

# Endpoint leve para caso uma requisicao direta caia na funcao serverless
@app.get("/", include_in_schema=False)
async def root_fallback():
    return {
        "status": "ok",
        "service": "Carita's Pets API",
        "message": "Frontend estático é servido diretamente pelo Vite/CDN da Vercel.",
    }

# Desativa no ambiente Vercel qualquer montagem de StaticFiles ou FileResponse para 'dist'
# Na Vercel os arquivos estáticos do Vite são servidos pela CDN e o StaticFiles causa crash
# imediato no cold start (RuntimeError: Directory does not exist).
IS_VERCEL = os.getenv("VERCEL") == "1" or bool(os.getenv("VERCEL_ENV"))
if not IS_VERCEL:
    DIST_DIR = ROOT_DIR / "dist"
    assets_dir = DIST_DIR / "assets"
    if assets_dir.is_dir():
        from fastapi.staticfiles import StaticFiles
        app.mount("/assets", StaticFiles(directory=str(assets_dir), check_dir=False), name="assets")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.host, port=settings.port, reload=True)
