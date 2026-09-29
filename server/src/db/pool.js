import pg from 'pg';

// DATE يُرجع كنص YYYY-MM-DD (بدون تحويل المنطقة الزمنية)
pg.types.setTypeParser(1082, (v) => v);
// NUMERIC و BIGINT كأرقام
pg.types.setTypeParser(1700, (v) => parseFloat(v));
pg.types.setTypeParser(20, (v) => parseInt(v, 10));

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

export const query = (text, params) => pool.query(text, params);
