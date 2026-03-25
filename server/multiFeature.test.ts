import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";

describe("Multi-Location, Combos, and Labour Management", () => {
  let locationId: number;
  let comboId: number;
  let staffId: number;

  beforeAll(async () => {
    const result = await db.createLocation("Test Location", "123 Main St", "555-1234", "test@example.com", "UTC");
    locationId = (result as any)[0].insertId;
  });

  describe("Locations", () => {
    it("should create a location", async () => {
      const result = await db.createLocation("New Location", "456 Oak Ave", "555-5678");
      expect(result).toBeDefined();
    });

    it("should get all locations", async () => {
      const locations = await db.getLocations();
      expect(Array.isArray(locations)).toBe(true);
      expect(locations.length).toBeGreaterThan(0);
    });

    it("should get location by id", async () => {
      const location = await db.getLocationById(locationId);
      expect(location).toBeDefined();
      expect(location?.name).toBe("Test Location");
    });
  });

  describe("Combos", () => {
    it("should create a combo", async () => {
      const result = await db.createCombo(locationId, "Test Combo", "15.99", "19.99", "4.00");
      comboId = (result as any)[0].insertId;
      expect(result).toBeDefined();
    });

    it("should get all combos", async () => {
      const combos = await db.getCombos(locationId);
      expect(Array.isArray(combos)).toBe(true);
    });

    it("should get combo by id", async () => {
      const combo = await db.getComboById(comboId);
      expect(combo).toBeDefined();
      expect(combo?.name).toBe("Test Combo");
    });
  });

  describe("Labour Management", () => {
    it("should create labour compliance rules", async () => {
      const result = await db.createLabourCompliance(locationId, 40, 30, 40, "1.5");
      expect(result).toBeDefined();
    });

    it("should get labour compliance", async () => {
      const compliance = await db.getLabourCompliance(locationId);
      expect(compliance).toBeDefined();
      expect(compliance?.maxHoursPerWeek).toBe(40);
    });

    it("should create overtime alert", async () => {
      const result = await db.createOvertimeAlert(1, new Date(), "45", "5");
      expect(result).toBeDefined();
    });

    it("should create labour budget", async () => {
      const result = await db.createLabourBudget(locationId, 2, 2026, "160", "3200");
      expect(result).toBeDefined();
    });
  });
});
