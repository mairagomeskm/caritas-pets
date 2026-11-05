from backend.app.services.pix import generate_pix_payload

def test_pix_required_fields():
    payload = generate_pix_payload(
        key="contato@caritas.org",
        name="Caritas Pets",
        city="Brasilia",
    )
    assert "br.gov.bcb.pix" in payload
    assert "contato@caritas.org" in payload
    assert "Caritas Pets" in payload
    assert "Brasilia" in payload
    assert len(payload) > 50

def test_pix_formatted_amount():
    payload = generate_pix_payload(
        key="12345678900",
        name="Resgate Animal",
        city="Brasilia",
        amount=50.0,
    )
    assert "540550.00" in payload

def test_pix_accent_normalization():
    payload = generate_pix_payload(
        key="12345678900",
        name="Associação Protetora São Francisco",
        city="Brasília",
    )
    assert "ã" not in payload
    assert "í" not in payload
    assert "Associacao" in payload
    assert "Brasilia" in payload

