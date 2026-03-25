import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as db from "./db";

describe("Order History & Receipt Printing", () => {
  let testOrderId: number;

  beforeAll(async () => {
    // Create test customer
    const customer = await db.createCustomer({
      name: "Test Customer",
      email: "test@example.com",
      phone: "555-0001",
      loyaltyPoints: 100,
    });

    // Create test order
    const order = await db.createOrder({
      orderNumber: `TEST-${Date.now()}`,
      customerId: customer[0].insertId,
      type: "takeaway",
      status: "completed",
      subtotal: "50.00",
      taxAmount: "5.00",
      total: "55.00",
      paymentMethod: "cash",
    });

    testOrderId = order[0].insertId;

    // Add test items
    await db.addOrderItem({
      orderId: testOrderId,
      menuItemId: 1,
      name: "Item 1",
      quantity: 2,
      unitPrice: "20.00",
      totalPrice: "40.00",
      notes: "No onions",
    });

    await db.addOrderItem({
      orderId: testOrderId,
      menuItemId: 2,
      name: "Item 2",
      quantity: 1,
      unitPrice: "10.00",
      totalPrice: "10.00",
    });
  });

  it("should retrieve order history with filters", async () => {
    const history = await db.getOrderHistory({ status: "completed" });
    expect(history).toBeDefined();
    expect(history.length).toBeGreaterThan(0);
  });

  it("should search orders by order number", async () => {
    const results = await db.searchOrders("TEST-");
    expect(results).toBeDefined();
    expect(results.length).toBeGreaterThan(0);
  });

  it("should get order details for receipt", async () => {
    const receipt = await db.getOrderDetailsForReceipt(testOrderId);
    expect(receipt).toBeDefined();
    expect(receipt?.orderNumber).toBeDefined();
    expect(receipt?.items).toBeDefined();
    expect(receipt?.items.length).toBe(2);
  });

  it("should generate receipt data", async () => {
    const receiptData = await db.generateReceiptData(testOrderId);
    expect(receiptData).toBeDefined();
    expect(receiptData?.orderNumber).toBeDefined();
    expect(receiptData?.total).toBeDefined();
    expect(receiptData?.items.length).toBe(2);
  });

  it("should generate thermal receipt format", async () => {
    const thermalReceipt = await db.generateThermalReceiptFormat(testOrderId);
    expect(thermalReceipt).toBeDefined();
    expect(thermalReceipt).toContain("RECEIPT");
    expect(thermalReceipt).toContain("TOTAL");
    expect(thermalReceipt).toContain("$55.00");
  });

  it("should generate PDF receipt HTML", async () => {
    const pdfHTML = await db.generatePDFReceiptHTML(testOrderId);
    expect(pdfHTML).toBeDefined();
    expect(pdfHTML).toContain("<!DOCTYPE html>");
    expect(pdfHTML).toContain("RECEIPT");
    expect(pdfHTML).toContain("Test Customer");
  });

  it("should get orders by customer", async () => {
    const customer = await db.createCustomer({
      name: "Customer 2",
      email: "customer2@example.com",
      phone: "555-0002",
    });

    const order = await db.createOrder({
      orderNumber: `CUST2-${Date.now()}`,
      customerId: customer[0].insertId,
      type: "takeaway",
      status: "completed",
      subtotal: "30.00",
      taxAmount: "3.00",
      total: "33.00",
      paymentMethod: "card",
    });

    const orders = await db.getOrdersByCustomer(customer[0].insertId);
    expect(orders).toBeDefined();
    expect(orders.length).toBeGreaterThan(0);
  });

  it("should get orders by date range", async () => {
    const today = new Date().toISOString().split("T")[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

    const orders = await db.getOrdersByDateRange(today, tomorrow);
    expect(orders).toBeDefined();
  });

  it("should handle receipt generation for non-existent order", async () => {
    const receipt = await db.generateReceiptData(99999);
    expect(receipt).toBeNull();
  });
});
