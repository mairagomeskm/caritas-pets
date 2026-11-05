import hashlib
import re
import secrets
from typing import Optional
from Crypto.Cipher import AES
from Crypto.Protocol.KDF import PBKDF2
from Crypto.Hash import SHA256

from backend.app.config import settings

def _derive_key(secret: str, salt: bytes) -> bytes:
    return PBKDF2(secret, salt, dkLen=32, count=100000, hmac_hash_module=SHA256)

def encrypt_sensitive_data(plain_text: str, custom_secret: Optional[str] = None) -> str:
    if not plain_text:
        return plain_text

    secret = custom_secret or settings.encryption_key
    salt = secrets.token_bytes(16)
    iv = secrets.token_bytes(12)
    key = _derive_key(secret, salt)

    cipher = AES.new(key, AES.MODE_GCM, nonce=iv)
    ciphertext, tag = cipher.encrypt_and_digest(plain_text.encode("utf-8"))
    payload = ciphertext + tag

    return f"enc:v1:{salt.hex()}:{iv.hex()}:{payload.hex()}"

def decrypt_sensitive_data(cipher_string: str, custom_secret: Optional[str] = None) -> str:
    if not cipher_string or not cipher_string.startswith("enc:v1:"):
        return cipher_string

    parts = cipher_string.split(":")
    if len(parts) != 5:
        return cipher_string

    try:
        salt = bytes.fromhex(parts[2])
        iv = bytes.fromhex(parts[3])
        payload = bytes.fromhex(parts[4])
        if len(payload) < 16:
            return cipher_string

        ciphertext = payload[:-16]
        tag = payload[-16:]

        secret = custom_secret or settings.encryption_key
        key = _derive_key(secret, salt)
        cipher = AES.new(key, AES.MODE_GCM, nonce=iv)
        return cipher.decrypt_and_verify(ciphertext, tag).decode("utf-8")
    except Exception:
        return "[DADO PROTEGIDO]"

def hash_identifier(input_str: str) -> str:
    if not input_str:
        return ""
    digest = hashlib.sha256(input_str.encode("utf-8")).hexdigest()
    return digest[:16]

def mask_cpf(cpf: Optional[str]) -> str:
    if not cpf:
        return "—"
    clean = re.sub(r"\D", "", cpf)
    if len(clean) != 11:
        return "***.***.***-**"
    return f"{clean[:3]}.***.***-{clean[9:]}"

def mask_rg(rg: Optional[str]) -> str:
    if not rg:
        return "—"
    clean = rg.strip()
    if len(clean) < 5:
        return "***"
    return f"{clean[:2]}***{clean[-2:]}"

def mask_phone(phone: Optional[str]) -> str:
    if not phone:
        return "—"
    digits = re.sub(r"\D", "", phone)
    if len(digits) == 11:
        return f"({digits[:2]}) {digits[2]}****-{digits[7:]}"
    if len(digits) == 10:
        return f"({digits[:2]}) ****-{digits[6:]}"
    return "(61) *****-****"

def mask_address(address: Optional[str], cep: Optional[str] = None) -> str:
    if not address and not cep:
        return "Brasília/DF (Região protegida)"
    if not address:
        cep_prefix = cep[:5] if cep else "00000"
        return f"DF (CEP {cep_prefix}-***)"

    parts = address.split(",")
    if len(parts) > 1:
        last = parts[-1].strip()
        if last:
            return f"{last} (Endereço exato sob sigilo)"
    return f"{address[:10]}... (Protegido por privacidade)"

