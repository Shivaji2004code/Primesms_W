// [Claude AI] Backward Compatible Credit System — Aug 2025
// This version works with both old and new database schemas
import pool from '../db';

// Credit deduction rates by template category (in Rupees)
export const CREDIT_RATES = {
  MARKETING: 0.80,
  UTILITY: 0.15,
  AUTHENTICATION: 0.15
} as const;

export type TemplateCategory = keyof typeof CREDIT_RATES;

// Credit transaction types
export enum CreditTransactionType {
  DEDUCTION_QUICKSEND = 'DEDUCTION_QUICKSEND',
  DEDUCTION_CUSTOMISE_SMS = 'DEDUCTION_CUSTOMISE_SMS', 
  DEDUCTION_API_DELIVERED = 'DEDUCTION_API_DELIVERED',
  DEDUCTION_DUPLICATE_BLOCKED = 'DEDUCTION_DUPLICATE_BLOCKED',
  ADMIN_ADD = 'ADMIN_ADD',
  ADMIN_DEDUCT = 'ADMIN_DEDUCT',
  REFUND = 'REFUND'
}

interface CreditTransaction {
  userId: string;
  amount: number;
  transactionType: CreditTransactionType;
  templateCategory?: TemplateCategory;
  templateName?: string;
  messageId?: string;
  campaignId?: string;
  description?: string;
}

/**
 * Check if template_category column exists in database
 */
async function hasTemplateCategoryColumn(): Promise<boolean> {
  try {
    const result = await pool.query(`
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'credit_transactions' 
      AND column_name = 'template_category'
    `);
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error checking column existence:', error);
    return false;
  }
}

/**
 * Deduct credits from user account with backward compatibility
 */
export async function deductCredits(transaction: CreditTransaction): Promise<{
  success: boolean;
  newBalance: number;
  transactionId?: string;
}> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Check current balance
    const balanceResult = await client.query(
      'SELECT credit_balance FROM users WHERE id = $1 FOR UPDATE',
      [transaction.userId]
    );
    
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
    const newBalance = Math.round((currentBalance - transaction.amount) * 100) / 100;
    await client.query(
      'UPDATE users SET credit_balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newBalance, transaction.userId]
    );
    
    // Check if template_category column exists
    const hasTemplateCategory = await hasTemplateCategoryColumn();
    
    let transactionResult;
    
    if (hasTemplateCategory) {
      // New schema with template_category column
      console.log('💰 Using NEW schema (with template_category column)');
      transactionResult = await client.query(
        `INSERT INTO credit_transactions 
         (user_id, amount, transaction_type, template_category, template_name, 
          message_id, campaign_id, description, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
         RETURNING id`,
        [
          transaction.userId,
          -transaction.amount,
          transaction.transactionType,
          transaction.templateCategory,
          transaction.templateName,
          transaction.messageId,
          transaction.campaignId,
          transaction.description || `Credit deduction for ${transaction.transactionType}`
        ]
      );
    } else {
      // Old schema without template_category column
      console.log('💰 Using OLD schema (without template_category column)');
      transactionResult = await client.query(
        `INSERT INTO credit_transactions 
         (user_id, amount, transaction_type, template_name, 
          message_id, campaign_id, description, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
         RETURNING id`,
        [
          transaction.userId,
          -transaction.amount,
          transaction.transactionType,
          transaction.templateName,
          transaction.messageId,
          transaction.campaignId,
          transaction.description || `Credit deduction for ${transaction.transactionType} (${transaction.templateCategory})`
        ]
      );
    }
    
    await client.query('COMMIT');
    
    return {
      success: true,
      newBalance,
      transactionId: transactionResult.rows[0].id
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Credit deduction error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Re-export other functions from the original creditSystem
export {
  getCreditRate,
  checkSufficientCredits,
  addCredits,
  getTemplateCategory,
  calculateCreditCost,
  preCheckCreditsForBulk
} from './creditSystem';