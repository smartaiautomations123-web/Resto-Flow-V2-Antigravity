import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";

describe("Order Status Tracking", () => {
  let testOrderId: number;
  let testOrderNumber: string;

  beforeAll(async () => {
    // Create test customer
    const customer = await db.createCustomer({
      name: "Tracking Test Customer",
      email: "tracking@example.com",
      phone: "555-0099",
    });

    // Create test order
    testOrderNumber = `TRACK-${Date.now()}`;
    const order = await db.createOrder({
      orderNumber: testOrderNumber,
      customerId: (customer as any)[0].insertId,
      type: "online",
      status: "pending",
      subtotal: "50.00",
      taxAmount: "5.00",
      total: "55.00",
      paymentMethod: "card",
    });

    testOrderId = (order as any)[0].insertId;
  });

  it("should get order by order number", async () => {
    const order = await db.getOrderByOrderNumber(testOrderNumber);
    expect(order).toBeDefined();
    expect(order?.orderNumber).toBe(testOrderNumber);
    expect(order?.status).toBe("pending");
  });

  it("should get order status with items", async () => {
    const order = await db.getOrderStatusWithItems(testOrderNumber);
    expect(order).toBeDefined();
    expect(order?.orderNumber).toBe(testOrderNumber);
    expect(Array.isArray(order?.items)).toBe(true);
  });

  it("should calculate estimated time", async () => {
    const timeEstimate = await db.calculateEstimatedTime(testOrderId);
    expect(timeEstimate).toBeDefined();
    expect(timeEstimate?.estimatedTotalMinutes).toBe(15);
    expect(timeEstimate?.remainingMinutes).toBeGreaterThanOrEqual(0);
    expect(timeEstimate?.percentComplete).toBeGreaterThanOrEqual(0);
    expect(timeEstimate?.percentComplete).toBeLessThanOrEqual(100);
  });

  it("should get order status timeline", async () => {
    const timeline = await db.getOrderStatusTimeline(testOrderId);
    expect(timeline).toBeDefined();
    expect(timeline?.currentStatus).toBe("pending");
    expect(timeline?.statuses).toBeDefined();
    expect(timeline?.statuses.length).toBe(4);
    expect(timeline?.statuses[0].name).toBe("pending");
    expect(timeline?.statuses[0].current).toBe(true);
  });

  it("should update order status", async () => {
    await db.updateOrderStatus(testOrderId, "preparing");
    const order = await db.getOrderByOrderNumber(testOrderNumber);
    expect(order?.status).toBe("preparing");
  });

  it("should update status to ready", async () => {
    await db.updateOrderStatus(testOrderId, "ready");
    const order = await db.getOrderByOrderNumber(testOrderNumber);
    expect(order?.status).toBe("ready");
  });

  it("should update status to completed and set completedAt", async () => {
    await db.updateOrderStatus(testOrderId, "completed");
    const order = await db.getOrderByOrderNumber(testOrderNumber);
    expect(order?.status).toBe("completed");
    expect(order?.completedAt).toBeDefined();
  });

  it("should get timeline after status updates", async () => {
    const timeline = await db.getOrderStatusTimeline(testOrderId);
    expect(timeline?.currentStatus).toBe("completed");
    expect(timeline?.statuses[3].completed).toBe(true);
  });

  it("should return null for non-existent order", async () => {
    const order = await db.getOrderByOrderNumber(`NONEXISTENT-${Date.now()}`);
    expect(order).toBeNull();
  });

  it("should notify on order status change", async () => {
    const notification = await db.notifyOrderStatusChange(testOrderId, "ready");
    expect(notification).toBeDefined();
    expect(notification?.orderNumber).toBe(testOrderNumber);
    expect(notification?.status).toBe("ready");
  });
});
