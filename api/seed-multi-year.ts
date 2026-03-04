import { Router } from "express";
import { getDb } from "../server/db";
import { orders, orderItems, menuItems, menuCategories } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { subMonths, addDays, getMonth } from "date-fns";

export const seedMultiYearRouter = Router();

seedMultiYearRouter.post("/seed-multi-year", async (req, res) => {
    try {
        console.log("Starting multi-year data seed...");
        const db = await getDb();

        // 1. Ensure we have basic categories and items to attach orders to
        let cats = await db.select().from(menuCategories);
        if (cats.length === 0) {
            await db.insert(menuCategories).values([
                { name: "Ice Cream & Desserts", description: "Cold sweet treats" },
                { name: "Hot Soups & Stews", description: "Warm winter comfort food" },
                { name: "Burgers & Mains", description: "Standard year-round mains" }
            ]);
            cats = await db.select().from(menuCategories);
        }

        const iceCreamCatId = cats.find((c: any) => c.name.includes("Ice Cream"))?.id || cats[0].id;
        const soupCatId = cats.find((c: any) => c.name.includes("Soup"))?.id || cats[1].id;
        const burgerCatId = cats.find((c: any) => c.name.includes("Burger"))?.id || cats[2].id;

        let items = await db.select().from(menuItems);
        if (items.length === 0) {
            await db.insert(menuItems).values([
                { categoryId: iceCreamCatId, name: "Vanilla Cone", price: "4.50", isAvailable: true, station: "dessert" },
                { categoryId: soupCatId, name: "Tomato Basil Soup", price: "7.00", isAvailable: true, station: "general" },
                { categoryId: burgerCatId, name: "Classic Cheeseburger", price: "12.00", isAvailable: true, station: "grill" }
            ]);
            items = await db.select().from(menuItems);
        }

        const iceCreamId = items.find((i: any) => i.name.includes("Vanilla"))?.id || items[0].id;
        const soupId = items.find((i: any) => i.name.includes("Soup"))?.id || items[1].id;
        const burgerId = items.find((i: any) => i.name.includes("Burger"))?.id || items[2].id;

        // 2. Generate 3 years of daily orders (approx 1000 days)
        const totalDays = 365 * 3;
        const endDate = new Date();
        const startDate = subMonths(endDate, 36);

        let currentDate = startDate;
        let totalOrdersCreated = 0;

        console.log(`Generating data from ${startDate.toDateString()} to ${endDate.toDateString()} `);

        // We will process in batches to avoid overwhelming the DB
        for (let i = 0; i < totalDays; i++) {
            const currentMonth = getMonth(currentDate); // 0 = Jan, 11 = Dec
            const isSummer = currentMonth >= 5 && currentMonth <= 7; // June, July, Aug
            const isWinter = currentMonth === 11 || currentMonth <= 1; // Dec, Jan, Feb

            // Determine baseline orders for the day (30-50)
            const dailyOrderCount = Math.floor(Math.random() * 20) + 30;

            for (let o = 0; o < dailyOrderCount; o++) {
                // Create the order
                const [orderResult] = await db.insert(orders).values({
                    orderNumber: `MOCK-${currentDate.getFullYear()}${(currentMonth + 1).toString().padStart(2, '0')}${currentDate.getDate().toString().padStart(2, '0')}-${o}`,
                    status: "completed",
                    type: "dine_in",
                    paymentMethod: "card",
                    paymentStatus: "paid",
                    total: "0", // We will calculate this based on items
                    subtotal: "0",
                    taxAmount: "0",
                    createdAt: currentDate,
                }) as any;

                const orderId = orderResult.insertId;
                let orderTotal = 0;

                // Create Order Items with deep seasonal bias

                // 1. The Baseline Burger (Always sells okay)
                const burgerQty = Math.floor(Math.random() * 2) + 1;
                await db.insert(orderItems).values({
                    orderId,
                    menuItemId: burgerId,
                    name: "Classic Cheeseburger",
                    quantity: burgerQty,
                    unitPrice: "12.00",
                    totalPrice: (12 * burgerQty).toFixed(2),
                    status: "served"
                });
                orderTotal += 12 * burgerQty;

                // 2. The Ice Cream (Massive spike in summer, drops in winter)
                let iceCreamProbability = 0.2; // 20% chance normally
                if (isSummer) iceCreamProbability = 0.8; // 80% chance in summer
                if (isWinter) iceCreamProbability = 0.05; // 5% chance in winter

                if (Math.random() < iceCreamProbability) {
                    const icQty = isSummer ? Math.floor(Math.random() * 3) + 2 : 1; // Buy more per order in summer
                    await db.insert(orderItems).values({
                        orderId,
                        menuItemId: iceCreamId,
                        name: "Vanilla Cone",
                        quantity: icQty,
                        unitPrice: "4.50",
                        totalPrice: (4.5 * icQty).toFixed(2),
                        status: "served"
                    });
                    orderTotal += 4.5 * icQty;
                }

                // 3. The Soup (Massive spike in winter, drops in summer)
                let soupProbability = 0.2;
                if (isWinter) soupProbability = 0.7; // 70% chance in winter
                if (isSummer) soupProbability = 0.02; // 2% chance in summer

                if (Math.random() < soupProbability) {
                    const sQty = isWinter ? Math.floor(Math.random() * 2) + 1 : 1;
                    await db.insert(orderItems).values({
                        orderId,
                        menuItemId: soupId,
                        name: "Tomato Basil Soup",
                        quantity: sQty,
                        unitPrice: "7.00",
                        totalPrice: (7 * sQty).toFixed(2),
                        status: "served"
                    });
                    orderTotal += 7 * sQty;
                }

                await db.update(orders).set({
                    total: orderTotal.toFixed(2),
                    subtotal: orderTotal.toFixed(2),
                    taxAmount: "0"
                }).where(eq(orders.id, orderId));
                totalOrdersCreated++;
            }

            // Move to next day
            currentDate = addDays(currentDate, 1);

            if (i % 100 === 0) {
                console.log(`Processed ${i} days...`);
            }
        }

        console.log(`Successfully generated ${totalOrdersCreated} seasonal orders over 3 years.`);
        res.json({ success: true, message: `Seeded ${totalOrdersCreated} seasonal orders over 3 years.` });

    } catch (error: any) {
        console.error("Failed to seed multi-year data:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});
