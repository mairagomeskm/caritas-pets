from fastapi import APIRouter
from pydantic import BaseModel
from backend.app.services.validators import (
    is_valid_cpf,
    is_valid_cnpj,
    mask_cpf,
    mask_cnpj,
    mask_phone,
    mask_cep,
    lookup_cep,
)

router = APIRouter(prefix="/validators", tags=["validators"])

class DocumentRequest(BaseModel):
    document: str

@router.post("/cpf")
async def validate_cpf(payload: DocumentRequest):
    return {"valid": is_valid_cpf(payload.document), "formatted": mask_cpf(payload.document)}

@router.post("/cnpj")
async def validate_cnpj(payload: DocumentRequest):
    return {"valid": is_valid_cnpj(payload.document), "formatted": mask_cnpj(payload.document)}

@router.get("/cep/{cep}")
async def query_cep(cep: str):
    return await lookup_cep(cep)

