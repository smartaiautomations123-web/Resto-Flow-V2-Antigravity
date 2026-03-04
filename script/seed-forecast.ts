import { eq } from 'drizzle-orm';
import { db } from '../server/db';
import { forecastingData, stockPerformanceAlerts } from '../drizzle/schema';

// This script ensures the forecasting system has data to show
// in the event the AI generation fails or the user hasn't clicked generate yet.

async function seedForecastingData() {
    console.log("Seeding Forecasting Data...");

    // Check if we already have data
    const existing = await db.select().from(forecastingData);
    if (existing.length > 5) {
        console.log("Forecasting data already exists. Skipping.");
        // We still might want to clear out old stock alerts for demo purposes
        await db.delete(stockPerformanceAlerts);
        process.exit(0);
    }

    const today = new Date();

    try {
        // Seed 7 days of forecast
        for (let i = 0; i < 7; i++) {
            const targetDate = new Date(today);
            targetDate.setDate(today.getDate() + i);
            const dateStr = targetDate.toISOString().split('T')[0];
            const dayOfWeekName = targetDate.toLocaleDateString('en-US', { weekday: 'long' });

            // Random realistic fake data
            const baseRev = 1500 + (Math.random() * 1000);
            const isWeekend = dayOfWeekName === 'Friday' || dayOfWeekName === 'Saturday' || dayOfWeekName === 'Sunday';
            const rev = isWeekend ? baseRev * 1.5 : baseRev;
            const weatherScore = Math.random() > 0.8 ? -15 : (Math.random() > 0.5 ? 5 : 0);
            const evScore = (isWeekend && Math.random() > 0.6) ? 25 : 0;

            await db.insert(forecastingData).values({
                date: dateStr,
                dayOfWeek: dayOfWeekName,
                forecastedRevenue: rev.toFixed(2),
                forecastedOrders: Math.floor(rev / 35),
                projectedLabourHours: (rev / 45).toFixed(2),
                projectedLabourCost: ((rev / 45) * 18).toFixed(2), // Assume $18/hr avg
                weatherImpactScore: weatherScore.toFixed(2),
                eventImpactScore: evScore.toFixed(2),
                confidence: (85 + Math.random() * 10).toFixed(2)
            });
        }

        console.log("Seeding complete.");
    } catch (err) {
        console.error("Failed to seed", err);
    }
    process.exit(0);
}

seedForecastingData();
