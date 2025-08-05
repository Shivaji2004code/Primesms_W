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
// [Claude AI] Credit System Enhancement — Aug 2025
const index_1 = require("../index");
// Credit deduction rates by template category (in Rupees)
exports.CREDIT_RATES = {
    MARKETING: 0.80,
    UTILITY: 0.15,
    AUTHENTICATION: 0.15
};
// Credit transaction types
var CreditTransactionType;
(function (CreditTransactionType) {
    CreditTransactionType["DEDUCTION_QUICKSEND"] = "DEDUCTION_QUICKSEND";
    CreditTransactionType["DEDUCTION_CUSTOMISE_SMS"] = "DEDUCTION_CUSTOMISE_SMS";
    CreditTransactionType["DEDUCTION_API_DELIVERED"] = "DEDUCTION_API_DELIVERED";
    CreditTransactionType["ADMIN_ADD"] = "ADMIN_ADD";
    CreditTransactionType["ADMIN_DEDUCT"] = "ADMIN_DEDUCT";
    CreditTransactionType["REFUND"] = "REFUND";
})(CreditTransactionType || (exports.CreditTransactionType = CreditTransactionType = {}));
/**
 * Get the credit rate for a template category
 */
function getCreditRate(category) {
    return exports.CREDIT_RATES[category];
}
/**
 * Check if user has sufficient credit balance
 */
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
/**
 * Deduct credits from user account with transaction logging
 */
async function deductCredits(transaction) {
    const client = await index_1.pool.connect();
    try {
        await client.query('BEGIN');
        // Check current balance
        const balanceResult = await client.query('SELECT credit_balance FROM users WHERE id = $1 FOR UPDATE', [transaction.userId]);
        if (balanceResult.rows.length === 0) {
            throw new Error('User not found');
        }
        const currentBalance = balanceResult.rows[0].credit_balance;
        // Check if sufficient credits
        if (currentBalance < transaction.amount) {
            await client.query('ROLLBACK');
            return {
                success: false,
                newBalance: currentBalance
            };
        }
        // Deduct credits
        const newBalance = Math.round((currentBalance - transaction.amount) * 100) / 100; // Round to 2 decimal places
        await client.query('UPDATE users SET credit_balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newBalance, transaction.userId]);
        // Log the transaction
        const transactionResult = await client.query(`INSERT INTO credit_transactions 
       (user_id, amount, transaction_type, template_category, template_name, 
        message_id, campaign_id, description, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
       RETURNING id`, [
            transaction.userId,
            -transaction.amount, // Negative for deduction
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
/**
 * Add credits to user account (for admin use)
 */
async function addCredits(transaction) {
    const client = await index_1.pool.connect();
    try {
        await client.query('BEGIN');
        // Get current balance
        const balanceResult = await client.query('SELECT credit_balance FROM users WHERE id = $1 FOR UPDATE', [transaction.userId]);
        if (balanceResult.rows.length === 0) {
            throw new Error('User not found');
        }
        const currentBalance = balanceResult.rows[0].credit_balance;
        // Add credits
        const newBalance = Math.round((currentBalance + transaction.amount) * 100) / 100; // Round to 2 decimal places
        await client.query('UPDATE users SET credit_balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newBalance, transaction.userId]);
        // Log the transaction
        const transactionResult = await client.query(`INSERT INTO credit_transactions 
       (user_id, amount, transaction_type, template_category, template_name, 
        message_id, campaign_id, description, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
       RETURNING id`, [
            transaction.userId,
            transaction.amount, // Positive for addition
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
/**
 * Get template category from template name
 */
async function getTemplateCategory(userId, templateName) {
    const result = await index_1.pool.query('SELECT category FROM templates WHERE user_id = $1 AND name = $2', [userId, templateName]);
    if (result.rows.length === 0) {
        return null;
    }
    return result.rows[0].category;
}
/**
 * Calculate credit cost for sending messages using a template
 */
async function calculateCreditCost(userId, templateName, messageCount = 1) {
    const category = await getTemplateCategory(userId, templateName);
    if (!category) {
        throw new Error('Template not found');
    }
    const ratePerMessage = getCreditRate(category);
    const totalCost = Math.round((ratePerMessage * messageCount) * 100) / 100; // Round to 2 decimal places
    return {
        cost: totalCost,
        category
    };
}
/**
 * Pre-check credits for bulk operations
 */
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