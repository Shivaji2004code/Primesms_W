"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreditTransactionType = exports.CREDIT_RATES = void 0;
exports.getCreditRate = getCreditRate;
exports.checkSufficientCredits = checkSufficientCredits;
exports.deductCredits = deductCredits;
exports.addCredits = addCredits;
exports.getTemplateCategory = getTemplateCategory;
exports.calculateCreditCost = calculateCreditCost;
exports.preCheckCreditsForBulk = preCheckCreditsForBulk;
const index_1 = require("../index");
exports.CREDIT_RATES = {
    MARKETING: 0.80,
    UTILITY: 0.15,
    AUTHENTICATION: 0.15
};
var CreditTransactionType;
(function (CreditTransactionType) {
    CreditTransactionType["DEDUCTION_QUICKSEND"] = "DEDUCTION_QUICKSEND";
    CreditTransactionType["DEDUCTION_CUSTOMISE_SMS"] = "DEDUCTION_CUSTOMISE_SMS";
    CreditTransactionType["DEDUCTION_API_DELIVERED"] = "DEDUCTION_API_DELIVERED";
    CreditTransactionType["DEDUCTION_DUPLICATE_BLOCKED"] = "DEDUCTION_DUPLICATE_BLOCKED";
    CreditTransactionType["ADMIN_ADD"] = "ADMIN_ADD";
    CreditTransactionType["ADMIN_DEDUCT"] = "ADMIN_DEDUCT";
    CreditTransactionType["REFUND"] = "REFUND";
})(CreditTransactionType || (exports.CreditTransactionType = CreditTransactionType = {}));
function getCreditRate(category) {
    return exports.CREDIT_RATES[category];
}
async function checkSufficientCredits(userId, requiredAmount) {
    const result = await index_1.pool.query('SELECT credit_balance FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) {
        throw new Error('User not found');
    }
    const currentBalance = result.rows[0].credit_balance;
    return {
        sufficient: currentBalance >= requiredAmount,
        currentBalance
    };
}
async function deductCredits(transaction) {
    const client = await index_1.pool.connect();
    try {
        await client.query('BEGIN');
        const balanceResult = await client.query('SELECT credit_balance FROM users WHERE id = $1 FOR UPDATE', [transaction.userId]);
        if (balanceResult.rows.length === 0) {
            throw new Error('User not found');
        }
        const currentBalance = balanceResult.rows[0].credit_balance;
        if (currentBalance < transaction.amount) {
            await client.query('ROLLBACK');
            return {
                success: false,
                newBalance: currentBalance
            };
        }
        const newBalance = Math.round((currentBalance - transaction.amount) * 100) / 100;
        await client.query('UPDATE users SET credit_balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newBalance, transaction.userId]);
        const transactionResult = await client.query(`INSERT INTO credit_transactions 
       (user_id, amount, transaction_type, template_category, template_name, 
        message_id, campaign_id, description, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
       RETURNING id`, [
            transaction.userId,
            -transaction.amount,
            transaction.transactionType,
            transaction.templateCategory,
            transaction.templateName,
            transaction.messageId,
            transaction.campaignId,
            transaction.description || `Credit deduction for ${transaction.transactionType}`
        ]);
        await client.query('COMMIT');
        return {
            success: true,
            newBalance,
            transactionId: transactionResult.rows[0].id
        };
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error('Credit deduction error:', error);
        throw error;
    }
    finally {
        client.release();
    }
}
async function addCredits(transaction) {
    const client = await index_1.pool.connect();
    try {
        await client.query('BEGIN');
        const balanceResult = await client.query('SELECT credit_balance FROM users WHERE id = $1 FOR UPDATE', [transaction.userId]);
        if (balanceResult.rows.length === 0) {
            throw new Error('User not found');
        }
        const currentBalance = balanceResult.rows[0].credit_balance;
        const newBalance = Math.round((currentBalance + transaction.amount) * 100) / 100;
        await client.query('UPDATE users SET credit_balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newBalance, transaction.userId]);
        const transactionResult = await client.query(`INSERT INTO credit_transactions 
       (user_id, amount, transaction_type, template_category, template_name, 
        message_id, campaign_id, description, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
       RETURNING id`, [
            transaction.userId,
            transaction.amount,
            transaction.transactionType,
            transaction.templateCategory,
            transaction.templateName,
            transaction.messageId,
            transaction.campaignId,
            transaction.description || `Credit addition: ${transaction.transactionType}`
        ]);
        await client.query('COMMIT');
        return {
            success: true,
            newBalance,
            transactionId: transactionResult.rows[0].id
        };
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error('Credit addition error:', error);
        throw error;
    }
    finally {
        client.release();
    }
}
async function getTemplateCategory(userId, templateName) {
    const result = await index_1.pool.query('SELECT category FROM templates WHERE user_id = $1 AND name = $2', [userId, templateName]);
    if (result.rows.length === 0) {
        return null;
    }
    return result.rows[0].category;
}
async function calculateCreditCost(userId, templateName, messageCount = 1) {
    const category = await getTemplateCategory(userId, templateName);
    if (!category) {
        throw new Error('Template not found');
    }
    const ratePerMessage = getCreditRate(category);
    const totalCost = Math.round((ratePerMessage * messageCount) * 100) / 100;
    return {
        cost: totalCost,
        category
    };
}
async function preCheckCreditsForBulk(userId, templateName, messageCount) {
    const { cost, category } = await calculateCreditCost(userId, templateName, messageCount);
    const { sufficient, currentBalance } = await checkSufficientCredits(userId, cost);
    return {
        sufficient,
        requiredCredits: cost,
        currentBalance,
        category
    };
}
//# sourceMappingURL=creditSystem.js.map