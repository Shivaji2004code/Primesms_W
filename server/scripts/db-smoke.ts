import { pool } from '../src/db';

(async () => {
  try {
    await pool.query('SELECT 1');
    console.log('db-smoke: OK');
    process.exit(0);
  } catch (e) {
    console.error('db-smoke: FAIL', e);
    process.exit(1);
  }
})();