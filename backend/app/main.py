import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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

if __name__ == "__main__":
    import uvicorn
    from backend.app.config import settings
    uvicorn.run("backend.app.main:app", host=settings.host, port=settings.port, reload=True)

