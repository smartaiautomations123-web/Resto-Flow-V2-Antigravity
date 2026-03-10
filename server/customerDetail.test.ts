import { describe, it, expect, beforeAll } from "vitest";
import { getDb } from "./db";
import { customers, orders, orderItems } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Customer Detail View", () => {
  let customerId: number;
  let orderId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create test customer
    const customerResult = await db.insert(customers).values({
      name: "Test Customer",
      email: "test@example.com",
      phone: "555-1234",
      notes: "Test notes",
      birthday: "01-15",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    customerId = customerResult[0].insertId as number;

    // Create test order
    const orderResult = await db.insert(orders).values({
      orderNumber: "TEST-001",
      customerId,
      tableId: 1,
      type: "dine_in",
      status: "completed",
      total: 100,
      subtotal: 85,
      taxAmount: 15,
      discountAmount: 0,
      serviceCharge: 0,
      tipAmount: 0,
      paymentMethod: "cash",
      paymentStatus: "paid",
      notes: "Test order",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    orderId = orderResult[0].insertId as number;

    // Create order items
    await db.insert(orderItems).values({
      orderId,
      menuItemId: 1,
      name: "Test Item",
      quantity: 2,
      unitPrice: 42.5,
      totalPrice: 85,
      notes: "No onions",
      modifiers: JSON.stringify({ size: "large" }),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  it("should fetch customer with order history", async () => {
    const { getCustomerWithOrderHistory } = await import("./db");
    const result = await getCustomerWithOrderHistory(customerId);

    expect(result).toBeDefined();
    expect(result?.name).toBe("Test Customer");
    expect(result?.email).toBe("test@example.com");
    expect(result?.orderHistory).toHaveLength(1);
    expect(result?.orderHistory[0].orderNumber).toBe("TEST-001");
  });

  it("should fetch order with items", async () => {
    const { getOrderWithItems } = await import("./db");
    const result = await getOrderWithItems(orderId);

    expect(result).toBeDefined();
    expect(result?.orderNumber).toBe("TEST-001");
    expect(result?.items).toHaveLength(1);
    expect(result?.items[0].itemName).toBe("Test Item");
    expect(result?.items[0].quantity).toBe(2);
  });

  it("should fetch loyalty points history", async () => {
    const { getLoyaltyPointsHistory } = await import("./db");
    const result = await getLoyaltyPointsHistory(customerId);

    expect(result).toBeDefined();
    expect(Array.isArray(result?.orderHistory)).toBe(true);
    expect(result?.orderHistory).toHaveLength(1);
    expect(parseFloat(result?.orderHistory[0].total as any)).toBe(100);
  });

  it("should create order from customer order", async () => {
    const { createOrderFromCustomerOrder } = await import("./db");
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const newOrderId = await createOrderFromCustomerOrder(customerId, orderId);

    expect(newOrderId).toBeDefined();
    expect(typeof newOrderId.id).toBe("number");

    // Verify new order was created
    const newOrder = await db
      .select()
      .from(orders)
      .where(eq(orders.id, newOrderId.id))
      .limit(1);

    expect(newOrder).toHaveLength(1);
    expect(newOrder[0].customerId).toBe(customerId);
    expect(newOrder[0].status).toBe("pending");

    // Verify items were copied
    const newItems = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, newOrderId.id));

    expect(newItems).toHaveLength(1);
    expect(newItems[0].name).toBe("Test Item");
    expect(newItems[0].quantity).toBe(2);
  });

  it("should return null for non-existent customer", async () => {
    const { getCustomerWithOrderHistory } = await import("./db");
    const result = await getCustomerWithOrderHistory(99999);

    expect(result).toBeNull();
  });

  it("should return null for non-existent order", async () => {
    const { getOrderWithItems } = await import("./db");
    const result = await getOrderWithItems(99999);

    expect(result).toBeNull();
  });

  it("should return empty array for customer with no orders", async () => {
    const { getLoyaltyPointsHistory } = await import("./db");
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create customer with no orders
    const newCustomer = await db.insert(customers).values({
      name: "No Orders Customer",
      email: "noorders@example.com",
      birthday: "06-20",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const newCustomerId = newCustomer[0].insertId as number;

    const result = await getLoyaltyPointsHistory(newCustomerId);

    expect(result).toBeDefined();
    expect(Array.isArray(result?.orderHistory)).toBe(true);
    expect(result?.orderHistory).toHaveLength(0);
  });
});
