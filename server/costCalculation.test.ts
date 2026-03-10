import { describe, it, expect, beforeAll } from "vitest";
import { getDb } from "./db";
import { menuItems, ingredients, recipes } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Automatic Plate Cost Calculation", () => {
  let menuItemId: number;
  let ingredientId1: number;
  let ingredientId2: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create test ingredients
    const ing1 = await db.insert(ingredients).values({
      name: "Chicken Breast",
      unit: "kg",
      currentStock: 10,
      costPerUnit: 5.5,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    ingredientId1 = ing1[0].insertId as number;

    const ing2 = await db.insert(ingredients).values({
      name: "Olive Oil",
      unit: "L",
      currentStock: 5,
      costPerUnit: 8.0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    ingredientId2 = ing2[0].insertId as number;

    // Create test menu item
    const item = await db.insert(menuItems).values({
      categoryId: 1,
      name: "Grilled Chicken",
      description: "Fresh grilled chicken breast",
      price: 15.99,
      cost: 0,
      taxRate: 10,
      isAvailable: true,
      station: "grill",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    menuItemId = item[0].insertId as number;

    // Create recipes
    await db.insert(recipes).values({
      menuItemId,
      ingredientId: ingredientId1,
      quantity: 0.3, // 300g chicken
    });

    await db.insert(recipes).values({
      menuItemId,
      ingredientId: ingredientId2,
      quantity: 0.05, // 50ml oil
    });
  });

  it("should calculate menu item cost from recipes", async () => {
    const { calculateMenuItemCost } = await import("./db");
    const cost = await calculateMenuItemCost(menuItemId);

    // Expected: (0.3 * 5.5) + (0.05 * 8.0) = 1.65 + 0.4 = 2.05
    expect(cost).toBeCloseTo(2.05, 2);
  });

  it("should update menu item cost in database", async () => {
    const { updateMenuItemCost } = await import("./db");
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const updatedCost = await updateMenuItemCost(menuItemId);

    // Verify the cost was updated in the database
    const item = await db
      .select()
      .from(menuItems)
      .where(eq(menuItems.id, menuItemId))
      .limit(1);

    expect(item[0].cost).toBeDefined();
    expect(parseFloat(item[0].cost as any)).toBeCloseTo(2.05, 2);
    expect(updatedCost).toBeCloseTo(2.05, 2);
  });

  it("should get cost analysis with recipe breakdown", async () => {
    const { getMenuItemCostAnalysis } = await import("./db");
    const analysis = await getMenuItemCostAnalysis(menuItemId);

    expect(analysis).toBeDefined();
    expect(analysis?.id).toBe(menuItemId);
    expect(analysis?.name).toBe("Grilled Chicken");
    expect(analysis?.price).toBe(15.99);
    expect(analysis?.cost).toBeCloseTo(2.05, 2);
    expect(analysis?.margin).toBeCloseTo(13.94, 2);
    expect(analysis?.marginPercent).toBeCloseTo(87.18, 1);
    expect(analysis?.recipeBreakdown).toHaveLength(2);
  });

  it("should show correct ingredient breakdown in analysis", async () => {
    const { getMenuItemCostAnalysis } = await import("./db");
    const analysis = await getMenuItemCostAnalysis(menuItemId);

    if (!analysis) throw new Error("Analysis not found");

    const chickenItem = analysis.recipeBreakdown.find(
      (r: any) => r.ingredientName === "Chicken Breast"
    );
    expect(chickenItem).toBeDefined();
    expect(chickenItem?.quantity).toBe(0.3);
    expect(chickenItem?.costPerUnit).toBe(5.5);
    expect(chickenItem?.totalCost).toBeCloseTo(1.65, 2);

    const oilItem = analysis.recipeBreakdown.find(
      (r: any) => r.ingredientName === "Olive Oil"
    );
    expect(oilItem).toBeDefined();
    expect(oilItem?.quantity).toBe(0.05);
    expect(oilItem?.costPerUnit).toBe(8.0);
    expect(oilItem?.totalCost).toBeCloseTo(0.4, 2);
  });

  it("should update all menu item costs", async () => {
    const { updateAllMenuItemCosts } = await import("./db");
    const result = await updateAllMenuItemCosts();

    expect(result.updated).toBeGreaterThan(0);
    expect(Array.isArray(result.items)).toBe(true);
    expect(result.items.some((i: any) => i.id === menuItemId)).toBe(true);
  }, 30000);

  it("should handle menu items with no recipes", async () => {
    const { calculateMenuItemCost } = await import("./db");
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create a menu item with no recipes
    const item = await db.insert(menuItems).values({
      categoryId: 1,
      name: "Bottled Water",
      price: 2.99,
      cost: 0,
      isAvailable: true,
      station: "general",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const noRecipeItemId = item[0].insertId as number;

    const cost = await calculateMenuItemCost(noRecipeItemId);
    expect(cost).toBe(0);
  });

  it("should return null for non-existent menu item in cost analysis", async () => {
    const { getMenuItemCostAnalysis } = await import("./db");
    const result = await getMenuItemCostAnalysis(99999);

    expect(result).toBeNull();
  });

  it("should calculate correct margin percentage", async () => {
    const { getMenuItemCostAnalysis } = await import("./db");
    const analysis = await getMenuItemCostAnalysis(menuItemId);

    if (!analysis) throw new Error("Analysis not found");

    // Margin % = (price - cost) / price * 100
    // = (15.99 - 2.05) / 15.99 * 100 = 87.18%
    const expectedMarginPercent = ((15.99 - 2.05) / 15.99) * 100;
    expect(analysis.marginPercent).toBeCloseTo(expectedMarginPercent, 1);
  });
});
