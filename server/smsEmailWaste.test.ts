import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";

describe("SMS, Email Campaigns, and Waste Tracking", () => {
  let staffId: number;

  beforeAll(async () => {
    const s = await db.createStaff({ name: "Test Staff", role: "manager" });
    staffId = (s as any)[0].insertId;
  });
  it("should update SMS settings", async () => {
    const result = await db.updateSmsSettings({ isEnabled: true });
    expect(result).toBeDefined();
  });

  it("should send SMS message", async () => {
    const result = await db.sendSmsMessage(1, "+1234567890", "Test message", "order_ready");
    expect(result).toBeDefined();
  });

  it("should create email template", async () => {
    const result = await db.createEmailTemplate("Test Template", "Test Subject", "<html>Test</html>");
    expect(result).toBeDefined();
  });

  it("should get email templates", async () => {
    const templates = await db.getEmailTemplates();
    expect(Array.isArray(templates)).toBe(true);
  });

  it("should create email campaign", async () => {
    const result = await db.createEmailCampaign("Test Campaign", 1, 1);
    expect(result).toBeDefined();
  });

  it("should get email campaigns", async () => {
    const campaigns = await db.getEmailCampaigns();
    expect(Array.isArray(campaigns)).toBe(true);
  });

  it("should log waste", async () => {
    const result = await db.logWaste(1, "10", "kg", "spoilage", "50.00", "Test waste", staffId);
    expect(result).toBeDefined();
  });

  it("should get waste logs", async () => {
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = new Date();
    const logs = await db.getWasteLogs(startDate, endDate);
    expect(Array.isArray(logs)).toBe(true);
  });

  it("should get waste by reason", async () => {
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = new Date();
    const stats = await db.getWasteByReason(startDate, endDate);
    expect(Array.isArray(stats)).toBe(true);
  });

  it("should get total waste cost", async () => {
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = new Date();
    const cost = await db.getTotalWasteCost(startDate, endDate);
    expect(typeof cost === "number").toBe(true);
  });
});
