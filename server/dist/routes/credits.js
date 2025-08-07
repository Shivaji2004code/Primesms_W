"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deductCredits = void 0;
const express_1 = __importDefault(require("express"));
const index_1 = require("../index");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.get('/balance', auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.session.user.id;
        const result = await index_1.pool.query('SELECT credit_balance FROM users WHERE id = $1', [userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const balance = parseFloat(result.rows[0].credit_balance);
        res.json({
            balance,
            user: {
                id: userId,
                creditBalance: balance
            }
        });
    }
    catch (error) {
        console.error('Get balance error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/history', auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.session.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const countResult = await index_1.pool.query('SELECT COUNT(*) as total FROM credit_transactions WHERE user_id = $1', [userId]);
        const total = parseInt(countResult.rows[0].total);
        const historyResult = await index_1.pool.query(`SELECT 
        id,
        amount,
        transaction_type,
        template_category,
        template_name,
        message_id,
        campaign_id,
        description,
        created_at
      FROM credit_transactions 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3`, [userId, limit, offset]);
        const history = historyResult.rows.map(row => ({
            id: row.id,
            date: row.created_at.toISOString().split('T')[0],
            type: row.transaction_type,
            amount: parseFloat(row.amount),
            templateCategory: row.template_category,
            templateName: row.template_name,
            messageId: row.message_id,
            campaignId: row.campaign_id,
            description: row.description,
            timestamp: row.created_at
        }));
        res.json({
            success: true,
            history,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    }
    catch (error) {
        console.error('Get credits history error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch credits history'
        });
    }
});
router.post('/add', auth_1.requireAuth, async (req, res) => {
    try {
        const { userId, amount, description } = req.body;
        const adminId = req.session.user.id;
        const adminCheck = await index_1.pool.query('SELECT role FROM users WHERE id = $1', [adminId]);
        if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Admin access required'
            });
        }
        if (!userId || !amount || amount <= 0 || !description) {
            return res.status(400).json({
                success: false,
                error: 'Valid userId, amount, and description are required'
            });
        }
        await index_1.pool.query('BEGIN');
        try {
            const updateResult = await index_1.pool.query('UPDATE users SET credit_balance = credit_balance + $1 WHERE id = $2 RETURNING credit_balance', [amount, userId]);
            if (updateResult.rows.length === 0) {
                throw new Error('User not found');
            }
            const newBalance = updateResult.rows[0].credit_balance;
            await index_1.pool.query(`INSERT INTO credit_transactions (user_id, amount, transaction_type, description) 
         VALUES ($1, $2, 'ADMIN_ADD', $3)`, [userId, amount, description]);
            await index_1.pool.query('COMMIT');
            res.json({
                success: true,
                message: 'Credits added successfully',
                newBalance
            });
        }
        catch (error) {
            await index_1.pool.query('ROLLBACK');
            throw error;
        }
    }
    catch (error) {
        console.error('Add credits error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add credits'
        });
    }
});
const deductCredits = async (userId, amount, description) => {
    try {
        await index_1.pool.query('BEGIN');
        const balanceResult = await index_1.pool.query('SELECT credit_balance FROM users WHERE id = $1', [userId]);
        if (balanceResult.rows.length === 0) {
            throw new Error('User not found');
        }
        const currentBalance = balanceResult.rows[0].credit_balance;
        if (currentBalance < amount) {
            throw new Error('Insufficient credits');
        }
        const updateResult = await index_1.pool.query('UPDATE users SET credit_balance = credit_balance - $1 WHERE id = $2 RETURNING credit_balance', [amount, userId]);
        const newBalance = updateResult.rows[0].credit_balance;
        await index_1.pool.query(`INSERT INTO credit_transactions (user_id, amount, transaction_type, description) 
       VALUES ($1, $2, 'ADMIN_DEDUCT', $3)`, [userId, -amount, description]);
        await index_1.pool.query('COMMIT');
        return { success: true, newBalance };
    }
    catch (error) {
        await index_1.pool.query('ROLLBACK');
        throw error;
    }
};
exports.deductCredits = deductCredits;
exports.default = router;
//# sourceMappingURL=credits.js.map