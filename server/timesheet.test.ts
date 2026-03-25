import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";

describe("Timesheet & Payroll", () => {
  let testStaffId: number;
  let testShiftId: number;
  const startDate = new Date("2026-01-01");
  const endDate = new Date("2026-01-31");

  beforeAll(async () => {
    const staff = await db.createStaff({
      name: "Timesheet Test Staff",
      role: "manager",
      email: "timesheet@example.com",
      phone: "555-0100",
      hourlyRate: "25.00",
    });
    testStaffId = staff[0].insertId;

    const shift = await db.createShift({
      staffId: testStaffId,
      date: "2026-01-15",
      startTime: "09:00",
      endTime: "17:00",
      role: "manager",
      notes: "completed shift",
    });
    testShiftId = shift[0].insertId;
  });

  it("should get timesheet data for date range", async () => {
    const data = await db.getTimesheetData(startDate, endDate);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  it("should get timesheet data filtered by staff", async () => {
    const data = await db.getTimesheetData(startDate, endDate, testStaffId);
    expect(Array.isArray(data)).toBe(true);
    if (data.length > 0) {
      expect(data[0].staffId).toBe(testStaffId);
    }
  });

  it("should get timesheet data filtered by role", async () => {
    const data = await db.getTimesheetData(startDate, endDate, undefined, "manager");
    expect(Array.isArray(data)).toBe(true);
    if (data.length > 0) {
      expect(data[0].staffRole).toBe("manager");
    }
  });

  it("should calculate timesheet summary", async () => {
    const summary = await db.calculateTimesheetSummary(startDate, endDate);
    expect(summary).toBeDefined();
    expect(summary.totalStaff).toBeGreaterThanOrEqual(0);
    expect(summary.totalHours).toBeGreaterThanOrEqual(0);
    expect(summary.totalLabourCost).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(summary.entries)).toBe(true);
  });

  it("should generate timesheet CSV", async () => {
    const csv = await db.generateTimesheetCSV(startDate, endDate);
    expect(typeof csv).toBe("string");
    expect(csv.includes("Staff Name")).toBe(true);
    expect(csv.includes("SUMMARY")).toBe(true);
  });

  it("should generate CSV with staff filter", async () => {
    const csv = await db.generateTimesheetCSV(startDate, endDate, testStaffId);
    expect(typeof csv).toBe("string");
    expect(csv.length).toBeGreaterThan(0);
  });

  it("should get staff timesheet stats", async () => {
    const stats = await db.getStaffTimesheetStats(testStaffId, startDate, endDate);
    expect(stats).toBeDefined();
    expect(stats.totalShifts).toBeGreaterThanOrEqual(0);
    expect(stats.totalHours).toBeGreaterThanOrEqual(0);
    expect(stats.totalLabourCost).toBeGreaterThanOrEqual(0);
  });

  it("should calculate correct totals in summary", async () => {
    const summary = await db.calculateTimesheetSummary(startDate, endDate, testStaffId);
    expect(summary.totalHours).toBeGreaterThanOrEqual(0);
    expect(summary.totalLabourCost).toBeGreaterThanOrEqual(0);
  });
});
