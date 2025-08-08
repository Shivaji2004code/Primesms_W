"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
const pg_1 = require("pg");
const url = process.env.DATABASE_URL;
if (!url)
    throw new Error('DATABASE_URL is not set');
const pool = new pg_1.Pool({
    connectionString: url,
});
exports.pool = pool;
(async () => {
    try {
        await pool.query('SELECT 1');
        const { hostname, port } = new URL(url);
        console.log(`[DB] Connected. host=${hostname} port=${port || '5432'}`);
    }
    catch (err) {
        console.error('[DB] Startup probe failed:', err);
        process.exit(1);
    }
})();
exports.default = pool;
//# sourceMappingURL=index.js.map