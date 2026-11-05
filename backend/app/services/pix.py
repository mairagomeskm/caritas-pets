import re
import unicodedata
from typing import Optional

def _f(tag: str, value: str) -> str:
    return f"{tag}{len(value):02d}{value}"

def _ascii(text: str) -> str:
    normalized = unicodedata.normalize("NFD", text)
    stripped = "".join(c for c in normalized if unicodedata.category(c) != "Mn")
    cleaned = re.sub(r"[^A-Za-z0-9 ]", "", stripped)
    return cleaned

def crc16(payload: str) -> str:
    crc = 0xFFFF
    for char in payload:
        crc ^= ord(char) << 8
        for _ in range(8):
            if crc & 0x8000:
                crc = ((crc << 1) ^ 0x1021) & 0xFFFF
            else:
                crc = (crc << 1) & 0xFFFF
    return f"{crc:04X}"

def generate_pix_payload(
    key: str,
    name: str,
    city: Optional[str] = None,
    amount: Optional[float] = None,
    txid: Optional[str] = None,
) -> str:
    gui = _f("00", "br.gov.bcb.pix") + _f("01", key.strip())
    safe_name = _ascii(name)[:25] or "Caritas Pets"
    safe_city = _ascii(city or "Brasilia")[:15]
    safe_txid = (txid or "***")[:25]

    payload = (
        _f("00", "01")
        + _f("26", gui)
        + _f("52", "0000")
        + _f("53", "986")
    )

    if amount is not None and amount > 0:
        payload += _f("54", f"{amount:.2f}")

    payload += (
        _f("58", "BR")
        + _f("59", safe_name)
        + _f("60", safe_city)
        + _f("62", _f("05", safe_txid))
        + "6304"
    )

    return payload + crc16(payload)

