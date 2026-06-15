import pkg from 'pg';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

const { Pool } = pkg;

console.log('Testing PostgreSQL connectivity...');
console.log('Target URL:', process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('sslmode=require') || process.env.DATABASE_URL?.includes('neon.tech')
    ? { rejectUnauthorized: false }
    : false
});

try {
  const start = Date.now();
  const res = await pool.query('SELECT NOW() as current_time');
  const elapsed = Date.now() - start;
  
  console.log('=========================================');
  console.log('🟢 CONNECTION SUCCESSFUL!');
  console.log('Response Time:', elapsed, 'ms');
  console.log('Server Timestamp:', res.rows[0].current_time);
  console.log('=========================================');
  
} catch (err) {
  console.error('=========================================');
  console.error('🔴 CONNECTION FAILED!');
  console.error('Error details:', err.message);
  console.error('=========================================');
} finally {
  await pool.end();
}
