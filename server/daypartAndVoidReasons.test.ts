import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";

describe("Dayparts & Void Reasons", () => {
  let testDaypartId: number;
  let testMenuItemId: number;

  beforeAll(async () => {
    const daypart = await db.createDaypart({ name: `Test Breakfast ${Date.now()}`, startTime: "07:00", endTime: "11:00" });
    testDaypartId = daypart[0].insertId;

    const category = await db.createMenuCategory({ name: "Test Category", description: "Test", sortOrder: 1 });
    const categoryId = category[0].insertId;

    const menuItem = await db.createMenuItem({
      name: "Test Item",
      categoryId: categoryId,
      price: "10.00",
      cost: "3.00",
      description: "Test item",
    });
    testMenuItemId = menuItem[0].insertId;
  });

  it("should create daypart", async () => {
    const daypart = await db.createDaypart({ name: `Test Lunch ${Date.now()}`, startTime: "11:00", endTime: "15:00" });
    expect(daypart[0].insertId).toBeGreaterThan(0);
  });

  it("should get active dayparts", async () => {
    const dayparts = await db.getDayparts();
    expect(Array.isArray(dayparts)).toBe(true);
    expect(dayparts.length).toBeGreaterThan(0);
  });

  it("should set menu item daypart price", async () => {
    const result = await db.setMenuItemDaypartPrice(testMenuItemId, testDaypartId, "12.00");
    expect(result).toBeDefined();
  });

  it("should get menu item daypart prices", async () => {
    const prices = await db.getMenuItemAllDaypartPrices(testMenuItemId);
    expect(Array.isArray(prices)).toBe(true);
  });

  it("should record order void", async () => {
    const result = await db.recordOrderVoid(1, "customer_request", "Customer requested void", 1);
    expect(result).toBeDefined();
  });

  it("should get void reason stats", async () => {
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = new Date();
    const stats = await db.getVoidReasonStats(startDate, endDate);
    expect(Array.isArray(stats)).toBe(true);
  });

  it("should get void reason report", async () => {
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = new Date();
    const report = await db.getVoidReasonReport(startDate, endDate);
    expect(Array.isArray(report)).toBe(true);
  });
});
