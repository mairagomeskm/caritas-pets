from typing import Optional
from fastapi import APIRouter
from pydantic import BaseModel
from app.services.pix import generate_pix_payload

router = APIRouter(prefix="/pix", tags=["pix"])

class PixPayloadRequest(BaseModel):
    key: str
    name: str
    city: Optional[str] = "Brasilia"
    amount: Optional[float] = None
    txid: Optional[str] = "***"

@router.post("/payload")
async def create_pix_payload(payload: PixPayloadRequest):
    code = generate_pix_payload(
        key=payload.key,
        name=payload.name,
        city=payload.city,
        amount=payload.amount,
        txid=payload.txid,
    )
    return {"payload": code}
