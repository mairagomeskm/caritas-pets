import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from backend.app.middleware import CsrfProtectionMiddleware, ErrorHandlingMiddleware
from backend.app.routes import retention, audit, crypto, pix, validators

app = FastAPI(
    title="Carita's Pets API",
    description="Backend em Python para a plataforma Carita's Pets (Adoção, LGPD, Vaquinhas)",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(CsrfProtectionMiddleware)
app.add_middleware(ErrorHandlingMiddleware)

app.include_router(retention.router, prefix="/api")
app.include_router(audit.router, prefix="/api")
app.include_router(crypto.router, prefix="/api")
app.include_router(pix.router, prefix="/api")
app.include_router(validators.router, prefix="/api")

@app.get("/api/health")
@app.get("/api")
@app.get("/")
async def health_check():
    return {"status": "ok", "platform": "Carita's Pets", "service": "Python Backend"}

static_dir = Path(__file__).resolve().parent.parent.parent / ".output" / "public"
if static_dir.exists() and (static_dir / "assets").is_dir():
    app.mount("/assets", StaticFiles(directory=static_dir / "assets"), name="assets")

if static_dir.exists():
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = static_dir / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        index_file = static_dir / "index.html"
        if index_file.exists():
            return FileResponse(index_file)
        return JSONResponse({"status": "running"}, status_code=200)

if __name__ == "__main__":
    import uvicorn
    from backend.app.config import settings
    uvicorn.run("backend.app.main:app", host=settings.host, port=settings.port, reload=True)

