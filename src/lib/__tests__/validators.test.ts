import { describe, it, expect } from "vitest";
import {
  onlyDigits,
  isValidCPF,
  isValidCNPJ,
  maskCPF,
  maskCNPJ,
  maskPhone,
  maskCEP,
} from "../validators";

describe("Validators Unit Suite", () => {
  describe("onlyDigits", () => {
    it("strips non-numeric characters properly", () => {
      expect(onlyDigits("123.456.789-00")).toBe("12345678900");
      expect(onlyDigits("(61) 98888-7777")).toBe("61988887777");
      expect(onlyDigits("abc-def")).toBe("");
    });
  });

  describe("isValidCPF", () => {
    it("accepts mathematically valid CPFs", () => {
      // Known valid test CPFs
      expect(isValidCPF("52998224725")).toBe(true);
      expect(isValidCPF("529.982.247-25")).toBe(true);
    });

    it("rejects invalid or forged CPFs", () => {
      expect(isValidCPF("11111111111")).toBe(false);
      expect(isValidCPF("00000000000")).toBe(false);
      expect(isValidCPF("12345678900")).toBe(false);
      expect(isValidCPF("123")).toBe(false);
      expect(isValidCPF("")).toBe(false);
    });
  });

  describe("isValidCNPJ", () => {
    it("accepts mathematically valid CNPJs", () => {
      // Known valid test CNPJ
      expect(isValidCNPJ("11444777000161")).toBe(true);
      expect(isValidCNPJ("11.444.777/0001-61")).toBe(true);
    });

    it("rejects invalid or forged CNPJs", () => {
      expect(isValidCNPJ("00000000000000")).toBe(false);
      expect(isValidCNPJ("11111111111111")).toBe(false);
      expect(isValidCNPJ("12345678901234")).toBe(false);
      expect(isValidCNPJ("123")).toBe(false);
    });
  });

  describe("Masking functions", () => {
    it("masks CPF correctly", () => {
      expect(maskCPF("52998224725")).toBe("529.982.247-25");
    });

    it("masks CNPJ correctly", () => {
      expect(maskCNPJ("11444777000161")).toBe("11.444.777/0001-61");
    });

    it("masks Phone correctly", () => {
      expect(maskPhone("61999998888")).toBe("(61) 99999-8888");
    });

    it("masks CEP correctly", () => {
      expect(maskCEP("70000000")).toBe("70000-000");
    });
  });
});
