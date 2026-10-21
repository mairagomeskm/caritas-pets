import { describe, it, expect } from "vitest";
import { pixPayload } from "../pix";

describe("PIX BR Code Generator", () => {
  it("generates a valid static PIX payload with required fields", () => {
    const payload = pixPayload({
      key: "contato@caritas.org",
      name: "Caritas Pets",
      city: "Brasilia",
    });

    expect(payload).toContain("br.gov.bcb.pix");
    expect(payload).toContain("contato@caritas.org");
    expect(payload).toContain("Caritas Pets");
    expect(payload).toContain("Brasilia");
    // Payload ends with 4-hex checksum
    expect(payload.length).toBeGreaterThan(50);
  });

  it("formats amount when specified", () => {
    const payload = pixPayload({
      key: "12345678900",
      name: "Resgate Animal",
      city: "Brasilia",
      amount: 50.0,
    });

    // Tag 54 corresponds to Transaction Amount
    expect(payload).toContain("540550.00");
  });

  it("normalizes accents in name and city", () => {
    const payload = pixPayload({
      key: "12345678900",
      name: "Associação Protetora São Francisco",
      city: "Brasília",
    });

    expect(payload).not.toContain("ã");
    expect(payload).not.toContain("í");
    expect(payload).toContain("Associacao");
    expect(payload).toContain("Brasilia");
  });
});
