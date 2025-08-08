"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../src/db"));
(async () => {
    try {
        await db_1.default.query('SELECT 1');
        console.log('health-smoke: OK');
        process.exit(0);
    }
    catch (e) {
        console.error('health-smoke: FAIL', e);
        process.exit(1);
    }
})();
//# sourceMappingURL=health-smoke.js.map