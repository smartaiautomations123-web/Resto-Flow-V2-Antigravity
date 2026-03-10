import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock db module
vi.mock("./db", () => ({
  listSuppliers: vi.fn().mockResolvedValue([
    { id: 1, name: "Capital Seaboard", contactName: "John", email: "john@cs.com", phone: "555-0001", address: "123 Main St", notes: null, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  ]),
  listVendorProducts: vi.fn().mockResolvedValue([
    { id: 1, supplierId: 1, vendorCode: "12345", description: "SALMON FILLET 4/5#", packSize: "4/5#", packUnit: "lb", packQty: "20", unitPricePer: "lb", currentCasePrice: "89.50", currentUnitPrice: "4.4750", lastUpdated: new Date(), createdAt: new Date(), updatedAt: new Date() },
    { id: 2, supplierId: 1, vendorCode: "67890", description: "SHRIMP 16/20 IQF 5#", packSize: "5#", packUnit: "lb", packQty: "5", unitPricePer: "lb", currentCasePrice: "45.00", currentUnitPrice: "9.0000", lastUpdated: new Date(), createdAt: new Date(), updatedAt: new Date() },
  ]),
  getVendorProductById: vi.fn().mockResolvedValue(
    { id: 1, supplierId: 1, vendorCode: "12345", description: "SALMON FILLET 4/5#", packSize: "4/5#", packUnit: "lb", packQty: "20", unitPricePer: "lb", currentCasePrice: "89.50", currentUnitPrice: "4.4750", lastUpdated: new Date(), createdAt: new Date(), updatedAt: new Date() },
  ),
  getVendorProductMappings: vi.fn().mockResolvedValue([
    { id: 1, vendorProductId: 1, ingredientId: 10, createdAt: new Date() },
  ]),
  createVendorProductMapping: vi.fn().mockResolvedValue({ id: 2 }),
  deleteVendorProductMapping: vi.fn().mockResolvedValue(undefined),
  updateVendorProduct: vi.fn().mockResolvedValue(undefined),
  listPriceUploads: vi.fn().mockResolvedValue([
    { id: 1, supplierId: 1, fileName: "order-guide.pdf", fileUrl: "https://example.com/file.pdf", dateRangeStart: "02/03/2025", dateRangeEnd: "02/09/2025", status: "applied", totalItems: 180, newItems: 5, priceChanges: 12, errorMessage: null, createdAt: new Date(), updatedAt: new Date() },
  ]),
  getPriceUploadById: vi.fn().mockResolvedValue(
    { id: 1, supplierId: 1, fileName: "order-guide.pdf", fileUrl: "https://example.com/file.pdf", dateRangeStart: "02/03/2025", dateRangeEnd: "02/09/2025", status: "review", totalItems: 180, newItems: 5, priceChanges: 12, errorMessage: null, createdAt: new Date(), updatedAt: new Date() },
  ),
  getPriceUploadItems: vi.fn().mockResolvedValue([
    { id: 1, uploadId: 1, vendorCode: "12345", description: "SALMON FILLET 4/5#", casePrice: "92.00", unitPrice: "4.60", packSize: "4/5#", calculatedUnitPrice: "4.60", previousCasePrice: "89.50", priceChange: "2.50", isNew: false, vendorProductId: 1, createdAt: new Date() },
    { id: 2, uploadId: 1, vendorCode: "99999", description: "NEW PRODUCT TEST", casePrice: "25.00", unitPrice: null, packSize: "1/10#", calculatedUnitPrice: null, previousCasePrice: null, priceChange: null, isNew: true, vendorProductId: null, createdAt: new Date() },
  ]),
  applyPriceUpload: vi.fn().mockResolvedValue({ totalItems: 180, newItems: 5, priceChanges: 12 }),
  listPriceHistory: vi.fn().mockResolvedValue([
    { id: 1, vendorProductId: 1, uploadId: 1, casePrice: "89.50", unitPrice: "4.4750", recordedAt: new Date("2025-02-03") },
    { id: 2, vendorProductId: 1, uploadId: 2, casePrice: "92.00", unitPrice: "4.6000", recordedAt: new Date("2025-02-10") },
  ]),
}));

function createTestContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("vendorProducts router", () => {
  it("lists vendor products", async () => {
    const caller = appRouter.createCaller(createTestContext());
    const result = await caller.vendorProducts.list({ supplierId: 1 });
    expect(result).toHaveLength(2);
    expect(result[0].vendorCode).toBe("12345");
  });

  it("lists all vendor products without filter", async () => {
    const caller = appRouter.createCaller(createTestContext());
    const result = await caller.vendorProducts.list();
    expect(result).toHaveLength(2);
  });

  it("gets a single vendor product", async () => {
    const caller = appRouter.createCaller(createTestContext());
    const result = await caller.vendorProducts.get({ id: 1 });
    expect(result.vendorCode).toBe("12345");
    expect(result.currentCasePrice).toBe("89.50");
  });

  it("updates vendor product pack info", async () => {
    const caller = appRouter.createCaller(createTestContext());
    await caller.vendorProducts.update({ id: 1, packUnit: "lb", packQty: "20" });
    const db = await import("./db");
    expect(db.updateVendorProduct).toHaveBeenCalledWith(1, { packUnit: "lb", packQty: "20" });
  });
});

describe("vendorMappings router", () => {
  it("lists vendor product mappings", async () => {
    const caller = appRouter.createCaller(createTestContext());
    const result = await caller.vendorMappings.list({ supplierId: 1 });
    expect(result).toHaveLength(1);
    expect(result[0].ingredientId).toBe(10);
  });

  it("creates a mapping", async () => {
    const caller = appRouter.createCaller(createTestContext());
    const result = await caller.vendorMappings.create({ vendorProductId: 2, ingredientId: 20 });
    expect(result.id).toBe(2);
  });

  it("deletes a mapping", async () => {
    const caller = appRouter.createCaller(createTestContext());
    await caller.vendorMappings.delete({ id: 1 });
    const db = await import("./db");
    expect(db.deleteVendorProductMapping).toHaveBeenCalledWith(1);
  });
});

describe("priceUploads router", () => {
  it("lists price uploads", async () => {
    const caller = appRouter.createCaller(createTestContext());
    const result = await caller.priceUploads.list({ supplierId: 1 });
    expect(result).toHaveLength(1);
    expect(result[0].fileName).toBe("order-guide.pdf");
    expect(result[0].totalItems).toBe(180);
  });

  it("gets a single price upload", async () => {
    const caller = appRouter.createCaller(createTestContext());
    const result = await caller.priceUploads.get({ id: 1 });
    expect(result.status).toBe("review");
  });

  it("lists price upload items", async () => {
    const caller = appRouter.createCaller(createTestContext());
    const result = await caller.priceUploads.items({ uploadId: 1 });
    expect(result).toHaveLength(2);
    expect(result[0].vendorCode).toBe("12345");
    expect(result[0].priceChange).toBe("2.50");
    expect(result[1].isNew).toBe(true);
  });

  it("applies a price upload", async () => {
    const caller = appRouter.createCaller(createTestContext());
    const result = await caller.priceUploads.applyPrices({ uploadId: 1 });
    expect(result.totalItems).toBe(180);
    expect(result.newItems).toBe(5);
    expect(result.priceChanges).toBe(12);
  });
});

describe("priceHistory router", () => {
  it("lists price history for a vendor product", async () => {
    const caller = appRouter.createCaller(createTestContext());
    const result = await caller.priceHistory.list({ vendorProductId: 1 });
    expect(result).toHaveLength(2);
    expect(result[0].casePrice).toBe("89.50");
    expect(result[1].casePrice).toBe("92.00");
  });

  it("lists price history with custom limit", async () => {
    const caller = appRouter.createCaller(createTestContext());
    const result = await caller.priceHistory.list({ vendorProductId: 1, limit: 10 });
    expect(result).toHaveLength(2);
  });
});
