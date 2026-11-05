from backend.app.services.validators import (
    only_digits,
    is_valid_cpf,
    is_valid_cnpj,
    mask_cpf,
    mask_cnpj,
    mask_phone,
    mask_cep,
)

def test_only_digits():
    assert only_digits("123.456.789-00") == "12345678900"
    assert only_digits("(61) 98888-7777") == "61988887777"
    assert only_digits("abc-def") == ""

def test_is_valid_cpf():
    assert is_valid_cpf("52998224725") is True
    assert is_valid_cpf("529.982.247-25") is True
    assert is_valid_cpf("11111111111") is False
    assert is_valid_cpf("00000000000") is False
    assert is_valid_cpf("12345678900") is False
    assert is_valid_cpf("123") is False
    assert is_valid_cpf("") is False

def test_is_valid_cnpj():
    assert is_valid_cnpj("11444777000161") is True
    assert is_valid_cnpj("11.444.777/0001-61") is True
    assert is_valid_cnpj("00000000000000") is False
    assert is_valid_cnpj("11111111111111") is False
    assert is_valid_cnpj("12345678901234") is False
    assert is_valid_cnpj("123") is False

def test_masking_functions():
    assert mask_cpf("52998224725") == "529.982.247-25"
    assert mask_cnpj("11444777000161") == "11.444.777/0001-61"
    assert mask_phone("61999998888") == "(61) 99999-8888"
    assert mask_cep("70000000") == "70000-000"

