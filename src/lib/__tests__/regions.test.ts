import { describe, it, expect } from "vitest";
import { REGIONS } from "../regions";

describe("Regions DF list", () => {
  it("contains essential administrative regions of Federal District", () => {
    expect(REGIONS).toContain("Plano Piloto");
    expect(REGIONS).toContain("Taguatinga");
    expect(REGIONS).toContain("Ceilândia");
    expect(REGIONS).toContain("Águas Claras");
    expect(REGIONS).toContain("Guará");
  });

  it("has non-empty entries and proper count", () => {
    expect(REGIONS.length).toBeGreaterThan(10);
    REGIONS.forEach((region) => {
      expect(typeof region).toBe("string");
      expect(region.trim().length).toBeGreaterThan(0);
    });
  });
});
