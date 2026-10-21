import { describe, it, expect } from "vitest";
import { maskCPF, maskRG, maskPhone, maskAddress, hashIdentifier } from "../crypto";

describe("LGPD Privacy & Crypto Masking Suite", () => {
  it("masks CPF correctly preserving only 3 prefix digits and 2 suffix digits", () => {
    expect(maskCPF("52998224725")).toBe("529.***.***-25");
    expect(maskCPF("529.982.247-25")).toBe("529.***.***-25");
    expect(maskCPF(null)).toBe("—");
    expect(maskCPF("")).toBe("—");
  });

  it("masks RG properly", () => {
    expect(maskRG("1234567")).toBe("12***67");
    expect(maskRG(null)).toBe("—");
    expect(maskRG("12")).toBe("***");
  });

  it("masks Phone numbers properly hiding middle digits", () => {
    expect(maskPhone("61987654321")).toBe("(61) 9****-4321");
    expect(maskPhone(null)).toBe("—");
  });

  it("masks residential address hiding street/lot/house numbers", () => {
    expect(maskAddress("QNJ 12 Casa 4, Taguatinga Norte")).toBe(
      "Taguatinga Norte (Endereço exato sob sigilo)",
    );
    expect(maskAddress(null, "72000000")).toBe("DF (CEP 72000-***)");
    expect(maskAddress(null, null)).toBe("Brasília/DF (Região protegida)");
  });

  it("generates consistent hash for anonymization", async () => {
    const hash1 = await hashIdentifier("test-user-agent-1");
    const hash2 = await hashIdentifier("test-user-agent-1");
    const hash3 = await hashIdentifier("test-user-agent-2");

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
    expect(hash1.length).toBe(16);
  });
});
