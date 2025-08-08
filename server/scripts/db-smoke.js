"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../src/db");
(async () => {
    try {
        await db_1.pool.query('SELECT 1');
        console.log('db-smoke: OK');
        process.exit(0);
    }
    catch (e) {
        console.error('db-smoke: FAIL', e);
        process.exit(1);
    }
})();
//# sourceMappingURL=db-smoke.js.map