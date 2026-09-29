import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './pool.js';

const dir = path.dirname(fileURLToPath(import.meta.url));
const sql = fs.readFileSync(path.join(dir, 'schema.sql'), 'utf8');

try {
  await pool.query(sql);
  console.log('✅ تم إنشاء الجداول بنجاح');
} catch (e) {
  console.error('❌ فشل إنشاء الجداول:', e.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
