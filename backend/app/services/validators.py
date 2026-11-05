import re
from typing import Any, Dict
import httpx

def only_digits(v: str) -> str:
    return re.sub(r"\D", "", v)

def is_valid_cpf(raw: str) -> bool:
    c = only_digits(raw)
    if len(c) != 11 or len(set(c)) == 1:
        return False

    def calc(length: int) -> int:
        s = sum(int(c[i]) * (length + 1 - i) for i in range(length))
        remainder = (s * 10) % 11
        return 0 if remainder == 10 else remainder

    return calc(9) == int(c[9]) and calc(10) == int(c[10])

def is_valid_cnpj(raw: str) -> bool:
    c = only_digits(raw)
    if len(c) != 14 or len(set(c)) == 1:
        return False

    def calc(length: int) -> int:
        weights = (
            [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
            if length == 12
            else [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        )
        s = sum(weights[i] * int(c[i]) for i in range(length))
        remainder = s % 11
        return 0 if remainder < 2 else 11 - remainder

    return calc(12) == int(c[12]) and calc(13) == int(c[13])

def mask_cpf(v: str) -> str:
    d = only_digits(v)[:11]
    if len(d) <= 3:
        return d
    if len(d) <= 6:
        return f"{d[:3]}.{d[3:]}"
    if len(d) <= 9:
        return f"{d[:3]}.{d[3:6]}.{d[6:]}"
    return f"{d[:3]}.{d[3:6]}.{d[6:9]}-{d[9:]}"

def mask_cnpj(v: str) -> str:
    d = only_digits(v)[:14]
    if len(d) <= 2:
        return d
    if len(d) <= 5:
        return f"{d[:2]}.{d[2:]}"
    if len(d) <= 8:
        return f"{d[:2]}.{d[2:5]}.{d[5:]}"
    if len(d) <= 12:
        return f"{d[:2]}.{d[2:5]}.{d[5:8]}/{d[8:]}"
    return f"{d[:2]}.{d[2:5]}.{d[5:8]}/{d[8:12]}-{d[12:]}"

def mask_phone(v: str) -> str:
    d = only_digits(v)[:11]
    if len(d) <= 2:
        return d
    if len(d) <= 7:
        return f"({d[:2]}) {d[2:]}"
    return f"({d[:2]}) {d[2:-4]}-{d[-4:]}"

def mask_cep(v: str) -> str:
    d = only_digits(v)[:8]
    if len(d) <= 5:
        return d
    return f"{d[:5]}-{d[5:]}"

async def lookup_cep(raw: str) -> Dict[str, Any]:
    c = only_digits(raw)
    if len(c) != 8:
        return {"ok": False, "error": "CEP deve ter 8 números."}

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(f"https://viacep.com.br/ws/{c}/json/")
            data = resp.json()

        if data.get("erro"):
            return {"ok": False, "error": "CEP não encontrado."}

        uf = data.get("uf", "")
        if uf not in ("DF", "GO"):
            return {"ok": False, "error": "Atendemos apenas DF e entorno."}

        address_parts = [
            data.get("logradouro"),
            data.get("bairro"),
            f"{data.get('localidade')}/{uf}",
        ]
        address = ", ".join(p for p in address_parts if p)

        return {"ok": True, "uf": uf, "address": address}
    except Exception:
        return {"ok": False, "error": "Não foi possível consultar o CEP agora."}

