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

# Middlewares de segurança e CORS
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

# Diretórios estáticos do Frontend Vite compilado e assets públicos
DIST_DIR = ROOT_DIR / "dist"
PUBLIC_DIR = ROOT_DIR / "public"

# Monta a pasta de assets gerada pelo Vite se existir
assets_dir = DIST_DIR / "assets"
if assets_dir.is_dir():
    app.mount("/assets", StaticFiles(directory=str(assets_dir), check_dir=False), name="assets")

# Monta também a pasta de pets se existir
pets_dir = PUBLIC_DIR / "pets"
if pets_dir.is_dir():
    app.mount("/pets", StaticFiles(directory=str(pets_dir), check_dir=False), name="pets")

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    for candidate in [
        DIST_DIR / "favicon.ico",
        PUBLIC_DIR / "favicon.ico",
        DIST_DIR / "favicon.png",
        PUBLIC_DIR / "favicon.png",
    ]:
        if candidate.is_file():
            return FileResponse(candidate)
    return Response(status_code=204)

# Rota raiz: serve o index.html compilado pelo Vite
@app.get("/", include_in_schema=False)
async def serve_root():
    index_file = DIST_DIR / "index.html"
    if index_file.is_file():
        return FileResponse(index_file)
    return JSONResponse(
        content={
            "status": "ok",
            "service": "Carita's Pets API",
            "message": "Frontend não compilado. Execute o build do Vite (npm run build).",
        }
    )

# Fallback de SPA: captura rotas do cliente e redireciona para index.html
@app.get("/{full_path:path}", include_in_schema=False)
async def catch_all_spa(full_path: str):
    # Nunca intercepta chamadas sob /api
    if full_path == "api" or full_path.startswith("api/"):
        return JSONResponse(
            status_code=404,
            content={"detail": f"Rota '/{full_path}' não encontrada"},
        )

    # 1. Se for um arquivo estático compilado em dist
    candidate_dist = DIST_DIR / full_path
    if candidate_dist.is_file():
        return FileResponse(candidate_dist)

    # 2. Se for um arquivo estático na pasta public
    candidate_pub = PUBLIC_DIR / full_path
    if candidate_pub.is_file():
        return FileResponse(candidate_pub)

    # 3. Fallback de SPA para o index.html do Vite
    index_file = DIST_DIR / "index.html"
    if index_file.is_file():
        return FileResponse(index_file)

    return JSONResponse(
        status_code=404,
        content={"detail": f"Caminho '/{full_path}' não encontrado e index.html indisponível."},
    )

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", str(settings.port)))
    uvicorn.run("app.main:app", host=settings.host, port=port, reload=False)
