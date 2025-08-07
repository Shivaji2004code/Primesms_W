import express from 'express';
import { pool } from '../index';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

// Get credits history for current user
router.get('/history', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await pool.query(
      'SELECT COUNT(*) as total FROM credit_transactions WHERE user_id = $1',
      [userId]
    );
    const total = parseInt(countResult.rows[0].total);

    // Get paginated history from credit_transactions table
    const historyResult = await pool.query(
      `SELECT 
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
      LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const history = historyResult.rows.map(row => ({
      id: row.id,
      date: row.created_at.toISOString().split('T')[0], // Format as YYYY-MM-DD
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

  } catch (error) {
    console.error('Get credits history error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch credits history' 
    });
  }
});

// Add credits (admin only or system function)
router.post('/add', requireAuth, async (req, res) => {
  try {
    const { userId, amount, description } = req.body;
    const adminId = req.session.user!.id;

    // Check if current user is admin
    const adminCheck = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [adminId]
    );

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

    // Start transaction
    await pool.query('BEGIN');

    try {
      // Update user balance
      const updateResult = await pool.query(
        'UPDATE users SET credit_balance = credit_balance + $1 WHERE id = $2 RETURNING credit_balance',
        [amount, userId]
      );

      if (updateResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const newBalance = updateResult.rows[0].credit_balance;

      // Add transaction record
      await pool.query(
        `INSERT INTO credit_transactions (user_id, amount, transaction_type, description) 
         VALUES ($1, $2, 'ADMIN_ADD', $3)`,
        [userId, amount, description]
      );

      await pool.query('COMMIT');

      res.json({
        success: true,
        message: 'Credits added successfully',
        newBalance
      });

    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Add credits error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to add credits' 
    });
  }
});

// Deduct credits (system function)
export const deductCredits = async (userId: string, amount: number, description: string) => {
  try {
    await pool.query('BEGIN');

    // Check current balance
    const balanceResult = await pool.query(
      'SELECT credit_balance FROM users WHERE id = $1',
      [userId]
    );

    if (balanceResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const currentBalance = balanceResult.rows[0].credit_balance;
    if (currentBalance < amount) {
      throw new Error('Insufficient credits');
    }

    // Update user balance
    const updateResult = await pool.query(
      'UPDATE users SET credit_balance = credit_balance - $1 WHERE id = $2 RETURNING credit_balance',
      [amount, userId]
    );

    const newBalance = updateResult.rows[0].credit_balance;

    // Add transaction record
    await pool.query(
      `INSERT INTO credit_transactions (user_id, amount, transaction_type, description) 
       VALUES ($1, $2, 'ADMIN_DEDUCT', $3)`,
      [userId, -amount, description]
    );

    await pool.query('COMMIT');
    return { success: true, newBalance };

  } catch (error) {
    await pool.query('ROLLBACK');
    throw error;
  }
};

export default router;