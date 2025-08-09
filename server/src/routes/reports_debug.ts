// DEBUG VERSION OF REPORTS ENDPOINT
// Use this to replace the reports endpoint temporarily for debugging

import express from 'express';
import pool from '../db';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

// DEBUG: Enhanced reports endpoint with detailed logging
router.get('/reports', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user!.id;
    console.log(`🔍 [REPORTS DEBUG] User ID: ${userId}`);
    
    const { 
      page = 1, 
      limit = 50, 
      dateFrom = '',
      dateTo = '',
      recipientNumber = '',
      template = '',
      status = 'all',
      export: exportFormat = 'false' 
    } = req.query;
    
    console.log(`🔍 [REPORTS DEBUG] Query params:`, { page, limit, dateFrom, dateTo, recipientNumber, template, status });
    
    const offset = (Number(page) - 1) * Number(limit);
    
    // First, check if user has any campaigns
    const campaignCheck = await pool.query(
      'SELECT COUNT(*) as count FROM campaign_logs WHERE user_id = $1',
      [userId]
    );
    console.log(`🔍 [REPORTS DEBUG] User has ${campaignCheck.rows[0].count} campaigns`);
    
    // Check if user has any message logs through campaigns
    const messageCheck = await pool.query(
      `SELECT COUNT(*) as count 
       FROM campaign_logs cl 
       JOIN message_logs ml ON cl.id = ml.campaign_id 
       WHERE cl.user_id = $1`,
      [userId]
    );
    console.log(`🔍 [REPORTS DEBUG] User has ${messageCheck.rows[0].count} messages`);
    
    // Build WHERE conditions (simplified first)
    let whereConditions = 'WHERE cl.user_id = $1';
    const params: any[] = [userId];
    let paramCount = 1;
    
    // Date range filter
    if (dateFrom && dateFrom.toString().trim()) {
      paramCount++;
      whereConditions += ` AND ml.created_at >= $${paramCount}`;
      params.push(dateFrom.toString());
      console.log(`🔍 [REPORTS DEBUG] Added dateFrom filter: ${dateFrom}`);
    }
    
    if (dateTo && dateTo.toString().trim()) {
      paramCount++;
      whereConditions += ` AND ml.created_at <= $${paramCount}::date + interval '1 day'`;
      params.push(dateTo.toString());
      console.log(`🔍 [REPORTS DEBUG] Added dateTo filter: ${dateTo}`);
    }
    
    // Recipient number filter
    if (recipientNumber && recipientNumber.toString().trim()) {
      paramCount++;
      whereConditions += ` AND ml.recipient_number ILIKE $${paramCount}`;
      params.push(`%${recipientNumber.toString().trim()}%`);
      console.log(`🔍 [REPORTS DEBUG] Added recipient filter: ${recipientNumber}`);
    }
    
    // Template filter
    if (template && template.toString().trim()) {
      paramCount++;
      whereConditions += ` AND cl.template_used = $${paramCount}`;
      params.push(template.toString());
      console.log(`🔍 [REPORTS DEBUG] Added template filter: ${template}`);
    }
    
    // Status filter
    if (status && status !== 'all') {
      paramCount++;
      whereConditions += ` AND ml.status = $${paramCount}`;
      params.push(status.toString());
      console.log(`🔍 [REPORTS DEBUG] Added status filter: ${status}`);
    }
    
    // Simplified query without user_business_info join
    const reportsQuery = `
      SELECT 
        ml.id,
        cl.campaign_name,
        cl.template_used,
        cl.phone_number_id as from_number,
        ml.recipient_number,
        ml.status,
        ml.error_message,
        ml.sent_at,
        ml.delivered_at,
        ml.read_at,
        ml.created_at
      FROM campaign_logs cl
      JOIN message_logs ml ON cl.id = ml.campaign_id
      ${whereConditions}
      ORDER BY ml.created_at DESC
      ${exportFormat && exportFormat !== 'false' ? '' : `LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`}
    `;
    
    if (!exportFormat || exportFormat === 'false') {
      params.push(Number(limit), offset);
    }
    
    console.log(`🔍 [REPORTS DEBUG] Query:`, reportsQuery);
    console.log(`🔍 [REPORTS DEBUG] Params:`, params);
    
    const reportsResult = await pool.query(reportsQuery, params);
    console.log(`🔍 [REPORTS DEBUG] Query returned ${reportsResult.rows.length} rows`);
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM campaign_logs cl
      JOIN message_logs ml ON cl.id = ml.campaign_id
      ${whereConditions}
    `;
    
    const countResult = await pool.query(countQuery, params.slice(0, paramCount));
    const totalReports = parseInt(countResult.rows[0].total);
    
    console.log(`🔍 [REPORTS DEBUG] Total count: ${totalReports}`);
    
    // Transform data
    const reports = reportsResult.rows.map(row => ({
      id: row.id,
      campaign: row.campaign_name,
      template: row.template_used,
      from: row.from_number || 'Unknown',
      recipient: row.recipient_number,
      status: row.status,
      sentAt: row.sent_at,
      deliveredAt: row.delivered_at,
      readAt: row.read_at,
      error: row.error_message,
      createdAt: row.created_at
    }));
    
    console.log(`🔍 [REPORTS DEBUG] Transformed ${reports.length} reports`);
    
    // Handle export formats
    if (exportFormat && exportFormat !== 'false') {
      if (exportFormat === 'csv') {
        const csv = await import('csv-stringify');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="reports.csv"');
        
        const csvString = await csv.stringify(reports, {
          header: true,
          columns: {
            campaign: 'Campaign',
            template: 'Template', 
            from: 'From',
            recipient: 'Recipient',
            status: 'Status',
            sentAt: 'Sent At',
            error: 'Error'
          }
        });
        
        return res.send(csvString);
      }
    }
    
    res.json({
      success: true,
      data: reports,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalReports / Number(limit)),
        totalReports,
        limit: Number(limit)
      }
    });
    
  } catch (error) {
    console.error('🔍 [REPORTS DEBUG] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch reports',
      debug: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;