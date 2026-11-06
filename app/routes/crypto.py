from typing import Optional
from fastapi import APIRouter
from pydantic import BaseModel
from app.services.crypto import (
    encrypt_sensitive_data,
    decrypt_sensitive_data,
    hash_identifier,
    mask_cpf,
    mask_rg,
    mask_phone,
    mask_address,
)

router = APIRouter(prefix="/crypto", tags=["crypto"])

class EncryptRequest(BaseModel):
    plain_text: str
    custom_secret: Optional[str] = None

class DecryptRequest(BaseModel):
    cipher_string: str
    custom_secret: Optional[str] = None

class MaskRequest(BaseModel):
    value: Optional[str] = None
    extra: Optional[str] = None

@router.post("/encrypt")
async def encrypt_data(payload: EncryptRequest):
    return {"result": encrypt_sensitive_data(payload.plain_text, payload.custom_secret)}

@router.post("/decrypt")
async def decrypt_data(payload: DecryptRequest):
    return {"result": decrypt_sensitive_data(payload.cipher_string, payload.custom_secret)}

@router.post("/hash")
async def hash_data(payload: EncryptRequest):
    return {"result": hash_identifier(payload.plain_text)}

@router.post("/mask/cpf")
async def mask_cpf_endpoint(payload: MaskRequest):
    return {"result": mask_cpf(payload.value)}

@router.post("/mask/rg")
async def mask_rg_endpoint(payload: MaskRequest):
    return {"result": mask_rg(payload.value)}

@router.post("/mask/phone")
async def mask_phone_endpoint(payload: MaskRequest):
    return {"result": mask_phone(payload.value)}

@router.post("/mask/address")
async def mask_address_endpoint(payload: MaskRequest):
    return {"result": mask_address(payload.value, payload.extra)}
