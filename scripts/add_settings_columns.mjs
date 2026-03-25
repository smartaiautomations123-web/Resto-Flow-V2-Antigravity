import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const connectionUrl = process.env.DATABASE_URL;
  // Basic parsing for the TiDB URL
  const match = connectionUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
  if (!match) throw new Error('Could not parse DATABASE_URL');
  
  const [, user, password, host, port, database] = match;

  const connection = await mysql.createConnection({
    host,
    port: parseInt(port),
    user,
    password,
    database,
    ssl: {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true
    }
  });
  
  console.log('Adding columns to system_settings...');
  try {
    await connection.execute("ALTER TABLE `system_settings` ADD COLUMN `primaryColor` varchar(32) DEFAULT '#e11d48'");
    console.log('Added primaryColor');
  } catch (e) { console.log('primaryColor might already exist'); }

  try {
    await connection.execute("ALTER TABLE `system_settings` ADD COLUMN `fontFamily` varchar(64) DEFAULT 'Inter'");
    console.log('Added fontFamily');
  } catch (e) { console.log('fontFamily might already exist'); }

  try {
    await connection.execute("ALTER TABLE `system_settings` ADD COLUMN `borderRadius` varchar(16) DEFAULT '0.5rem'");
    console.log('Added borderRadius');
  } catch (e) { console.log('borderRadius might already exist'); }

  console.log('Adding columns to receipt_settings...');
  try {
    await connection.execute("ALTER TABLE `receipt_settings` ADD COLUMN `templateType` enum('classic', 'modern', 'minimalist') DEFAULT 'classic'");
    console.log('Added templateType');
  } catch (e) { console.log('templateType might already exist'); }

  try {
    await connection.execute("ALTER TABLE `receipt_settings` ADD COLUMN `customCss` text");
    console.log('Added customCss');
  } catch (e) { console.log('customCss might already exist'); }

  await connection.end();
  console.log('Done!');
}

main().catch(console.error);
