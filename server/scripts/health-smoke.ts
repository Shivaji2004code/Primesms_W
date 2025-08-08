// server/scripts/health-smoke.ts
import pool from '../src/db';

(async () => {
  try {
    await pool.query('SELECT 1');
    console.log('health-smoke: OK');
    process.exit(0);
  } catch (e) {
    console.error('health-smoke: FAIL', e);
    process.exit(1);
  }
})();