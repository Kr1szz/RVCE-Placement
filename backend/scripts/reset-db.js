import pg from 'pg';
import 'dotenv/config';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemaPath = join(__dirname, '..', 'database', 'schema.sql');
const sql = readFileSync(schemaPath, 'utf8');

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

async function reset() {
  try {
    await client.connect();
    console.log('🔌 Connected to database');
    
    console.log('🗑️ Dropping existing tables (CASCADE)...');
    // We drop the public schema and recreate it to ensure everything (tables, types, indexes) is gone
    await client.query('DROP SCHEMA public CASCADE;');
    await client.query('CREATE SCHEMA public;');
    await client.query('GRANT ALL ON SCHEMA public TO public;');
    // In case the user is not 'postgres', we might need to ensure they have access, 
    // but usually in local dev 'public' is enough.
    
    console.log('🏗️ Applying fresh schema from schema.sql...');
    await client.query(sql);
    
    console.log('✅ Database has been reset and recreated successfully!');
  } catch (err) {
    console.error('❌ Reset failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

reset();
