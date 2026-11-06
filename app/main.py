import os
import sys
from pathlib import Path

# Garante que a raiz do projeto esteja no sys.path mesmo em ambientes serverless da Vercel
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

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
        "service": "Python Backend",
        "supabase_configured": bool(settings.supabase_url and settings.supabase_key),
    }

# Configuracao de caminhos estaticos com resolucao absoluta
DIST_DIR = ROOT_DIR / "dist"
PUBLIC_DIR = ROOT_DIR / "public"

if (DIST_DIR / "assets").is_dir():
    app.mount("/assets", StaticFiles(directory=str(DIST_DIR / "assets")), name="assets")

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    for candidate in [
        PUBLIC_DIR / "favicon.ico",
        PUBLIC_DIR / "favicon.png",
        DIST_DIR / "favicon.ico",
        DIST_DIR / "favicon.png",
    ]:
        if candidate.is_file():
            return FileResponse(candidate)
    return Response(status_code=204)

@app.get("/", include_in_schema=False)
async def serve_root():
    index_file = DIST_DIR / "index.html"
    if index_file.is_file():
        return FileResponse(index_file)
    return {
        "status": "ok",
        "platform": "Carita's Pets",
        "service": "Python Backend",
        "message": "Carita's Pets Backend ativo.",
    }

@app.get("/{full_path:path}", include_in_schema=False)
async def catch_all_spa(full_path: str):
    # Nao intercepta rotas da API
    if full_path.startswith("api"):
        return JSONResponse(status_code=404, content={"detail": f"Rota '/{full_path}' nao encontrada"})

    # Tenta servir arquivo estatico compilado
    candidate_dist = DIST_DIR / full_path
    if candidate_dist.is_file():
        return FileResponse(candidate_dist)

    # Tenta servir arquivo publico
    candidate_pub = PUBLIC_DIR / full_path
    if candidate_pub.is_file():
        return FileResponse(candidate_pub)

    # Fallback de SPA para o index.html
    index_file = DIST_DIR / "index.html"
    if index_file.is_file():
        return FileResponse(index_file)

    return JSONResponse(status_code=404, content={"detail": f"Caminho '/{full_path}' nao encontrado"})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.host, port=settings.port, reload=True)
