import 'dotenv/config';
import { IntegrationService } from './services/IntegrationService';
import { getDb } from './db';
import { integrations, integrationLogs } from '../drizzle/schema';
import { eq, desc } from 'drizzle-orm';

async function test() {
    console.log('--- Testing IntegrationService ---');
    
    const db = await getDb();
    if (!db) {
        console.error('Database not available');
        return;
    }

    // 1. Create a dummy Slack integration if it doesn't exist
    let slack = await db.select().from(integrations).where(eq(integrations.type, 'slack')).then(rows => rows[0]);
    if (!slack) {
        console.log('Creating dummy Slack integration...');
        await db.insert(integrations).values({
            type: 'slack',
            name: 'Test Slack',
            isEnabled: true,
            webhookUrl: 'https://hooks.slack.com/services/test/test/test'
        });
        slack = await db.select().from(integrations).where(eq(integrations.type, 'slack')).then(rows => rows[0]);
    }

    if (!slack) {
        console.error('Failed to create/find Slack integration');
        return;
    }

    console.log(`Using integration ID: ${slack.id}`);

    // 2. Trigger an event
    console.log('Triggering order.completed event...');
    await IntegrationService.triggerEvent('order.completed', { id: 123, total: '45.00' });

    // 3. Verify log entry
    console.log('Verifying log entry...');
    const lastLog = await db.select().from(integrationLogs)
        .where(eq(integrationLogs.integrationId, slack.id))
        .orderBy(desc(integrationLogs.createdAt))
        .limit(1)
        .then(rows => rows[0]);

    if (lastLog) {
        console.log('Log found:');
        console.log(`- Action: ${lastLog.action}`);
        console.log(`- Status: ${lastLog.status}`);
        console.log(`- Message: ${lastLog.message}`);
        console.log('SUCCESS: Integration log created correctly.');
    } else {
        console.error('FAIL: No integration log found.');
    }

    process.exit(0);
}

test().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
