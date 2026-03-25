import 'dotenv/config';
import { getDb } from './db';
import { sql } from 'drizzle-orm';

async function create() {
    console.log('--- Manually Creating Integration Tables ---');
    const db = await getDb();
    if (!db) return;

    try {
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS \`integrations\` (
                \`id\` int AUTO_INCREMENT NOT NULL,
                \`type\` enum('slack','teams','quickbooks','xero','stripe','square','paypal','uber_eats','doordash','grubhub','webhook','toast','xtra_chef') NOT NULL,
                \`name\` varchar(255) NOT NULL,
                \`isEnabled\` boolean NOT NULL DEFAULT true,
                \`apiKey\` text,
                \`apiSecret\` text,
                \`webhookUrl\` text,
                \`webhookSecret\` text,
                \`config\` text,
                \`lastSyncAt\` timestamp,
                \`lastErrorAt\` timestamp,
                \`lastErrorMessage\` text,
                \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                CONSTRAINT \`integrations_id\` PRIMARY KEY(\`id\`)
            );
        `);
        console.log('Table "integrations" checked/created.');

        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS \`integration_logs\` (
                \`id\` int AUTO_INCREMENT NOT NULL,
                \`integrationId\` int NOT NULL,
                \`action\` varchar(64) NOT NULL,
                \`status\` enum('success','failed','pending') DEFAULT 'pending',
                \`message\` text,
                \`requestData\` text,
                \`responseData\` text,
                \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT \`integration_logs_id\` PRIMARY KEY(\`id\`)
            );
        `);
        console.log('Table "integration_logs" checked/created.');
        console.log('SUCCESS: Tables are ready.');
    } catch (err) {
        console.error('Failed to create tables:', err);
    }
    process.exit(0);
}

create();
