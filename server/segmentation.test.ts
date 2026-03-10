import { describe, it, expect } from "vitest";

describe("Customer Segmentation", () => {
  it("should create a customer segment", async () => {
    const { createSegment } = await import("./db");
    const result = await createSegment("VIP Customers", "High-value customers", "#ff0000");
    expect(result).toBeDefined();
  });

  it("should list all segments", async () => {
    const { getSegments } = await import("./db");
    const segments = await getSegments();
    expect(Array.isArray(segments)).toBe(true);
  });

  it("should get segment by id", async () => {
    const { createSegment, getSegmentById } = await import("./db");
    const created = await createSegment("Test Segment", "Test description", "#0000ff");
    const segmentId = (created as any)[0].insertId;
    const segment = await getSegmentById(segmentId);
    expect(segment).toBeDefined();
  });

  it("should update segment", async () => {
    const { createSegment, updateSegment } = await import("./db");
    const created = await createSegment("Original Name", "Original description", "#00ff00");
    const segmentId = (created as any)[0].insertId;
    const result = await updateSegment(segmentId, "Updated Name", "Updated description", "#ffff00");
    expect(result).toBeDefined();
  });

  it("should get segment member count", async () => {
    const { createSegment, getSegmentMemberCount } = await import("./db");
    const segment = await createSegment("Count Test", "", "#3b82f6");
    const segmentId = (segment as any)[0].insertId;
    const count = await getSegmentMemberCount(segmentId);
    expect(typeof count).toBe("number");
  });

  it("should export segment customers", async () => {
    const { createSegment, exportSegmentCustomers } = await import("./db");
    const segment = await createSegment("Export Test", "", "#3b82f6");
    const segmentId = (segment as any)[0].insertId;
    const exported = await exportSegmentCustomers(segmentId);
    expect(Array.isArray(exported)).toBe(true);
  });

  it("should create a campaign", async () => {
    const { createCampaign } = await import("./db");
    const result = await createCampaign("Test Campaign", "email", "Test content", undefined, "Test Subject");
    expect(result).toBeDefined();
  });

  it("should list all campaigns", async () => {
    const { getCampaigns } = await import("./db");
    const campaigns = await getCampaigns();
    expect(Array.isArray(campaigns)).toBe(true);
  });

  it("should get campaign stats", async () => {
    const { createCampaign, getCampaignStats } = await import("./db");
    const created = await createCampaign("Stats Test", "email", "Test content");
    const campaignId = (created as any)[0].insertId;
    const stats = await getCampaignStats(campaignId);
    expect(stats).toHaveProperty("pending");
    expect(stats).toHaveProperty("sent");
  });

  it("should get campaign recipients", async () => {
    const { createCampaign, getCampaignRecipients } = await import("./db");
    const created = await createCampaign("Recipients Test", "email", "Test content");
    const campaignId = (created as any)[0].insertId;
    const recipients = await getCampaignRecipients(campaignId);
    expect(Array.isArray(recipients)).toBe(true);
  });

  it("should delete campaign", async () => {
    const { createCampaign, deleteCampaign } = await import("./db");
    const created = await createCampaign("Delete Test", "email", "Test content");
    const campaignId = (created as any)[0].insertId;
    const result = await deleteCampaign(campaignId);
    expect(result).toBeDefined();
  });
});
