from backend.app.services.crypto import (
    encrypt_sensitive_data,
    decrypt_sensitive_data,
    hash_identifier,
    mask_cpf,
    mask_rg,
    mask_phone,
    mask_address,
)

def test_encrypt_decrypt_cycle():
    raw = "529.982.247-25"
    enc = encrypt_sensitive_data(raw)
    assert enc.startswith("enc:v1:")
    dec = decrypt_sensitive_data(enc)
    assert dec == raw

def test_mask_cpf():
    assert mask_cpf("52998224725") == "529.***.***-25"
    assert mask_cpf("529.982.247-25") == "529.***.***-25"
    assert mask_cpf(None) == "—"
    assert mask_cpf("") == "—"

def test_mask_rg():
    assert mask_rg("1234567") == "12***67"
    assert mask_rg(None) == "—"
    assert mask_rg("12") == "***"

def test_mask_phone():
    assert mask_phone("61987654321") == "(61) 9****-4321"
    assert mask_phone("6133445566") == "(61) ****-5566"
    assert mask_phone(None) == "—"

def test_mask_address():
    assert mask_address("QNJ 12 Casa 4, Taguatinga Norte") == "Taguatinga Norte (Endereço exato sob sigilo)"
    assert mask_address(None, "72000000") == "DF (CEP 72000-***)"
    assert mask_address(None, None) == "Brasília/DF (Região protegida)"

def test_hash_identifier():
    h1 = hash_identifier("test-user-agent-1")
    h2 = hash_identifier("test-user-agent-1")
    h3 = hash_identifier("test-user-agent-2")
    assert h1 == h2
    assert h1 != h3
    assert len(h1) == 16

