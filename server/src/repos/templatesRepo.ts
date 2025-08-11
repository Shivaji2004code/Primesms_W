// Template Repository - Database operations for templates
import { Pool } from 'pg';
import pool from '../db';

export interface TemplateUpdateData {
  userId: string;
  name: string;
  language: string;
  status: string;
  category?: string;
  reason?: string | null;
  reviewedAt?: Date | null;
}

export const templatesRepo = {
  /**
   * Upsert template status and category with reviewed_at timestamp
   * This handles the unique constraint (user_id, name) from the existing schema
   */
  async upsertStatusAndCategory(input: TemplateUpdateData): Promise<void> {
    const { userId, name, language, status, category, reason, reviewedAt } = input;
    const client = await pool.connect();
    
    try {
      // First, try to update existing template
      const updateResult = await client.query(`
        UPDATE templates 
        SET 
          status = $1,
          category = CASE 
            WHEN $2 IS NOT NULL THEN $2::varchar(20) 
            ELSE category 
          END,
          rejection_reason = $3,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $4 AND name = $5 AND language = $6
        RETURNING id, name, category
      `, [status, category, reason, userId, name, language]);

      if (updateResult.rows.length > 0) {
        console.log(`✅ [TEMPLATES_REPO] Updated template: ${name} (${language}) -> ${status} for user ${userId}`);
        return;
      }

      // If no rows were updated, try to insert (handles case where webhook arrives before template creation)
      try {
        await client.query(`
          INSERT INTO templates (
            user_id, name, language, status, category, rejection_reason, 
            components, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, 
            '[]'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          )
        `, [userId, name, language, status, category || 'UTILITY', reason]);
        
        console.log(`🆕 [TEMPLATES_REPO] Created template from webhook: ${name} (${language}) for user ${userId}`);
      } catch (insertError: any) {
        // If insert fails due to unique constraint (user_id, name), try updating without language constraint
        if (insertError.code === '23505') { // unique_violation
          console.log(`🔄 [TEMPLATES_REPO] Unique constraint conflict, updating without language filter for ${name}`);
          
          await client.query(`
            UPDATE templates 
            SET 
              status = $1,
              category = CASE 
                WHEN $2 IS NOT NULL THEN $2::varchar(20) 
                ELSE category 
              END,
              rejection_reason = $3,
              language = $4,
              updated_at = CURRENT_TIMESTAMP
            WHERE user_id = $5 AND name = $6
          `, [status, category, reason, language, userId, name]);
          
          console.log(`✅ [TEMPLATES_REPO] Updated existing template (different language): ${name} for user ${userId}`);
        } else {
          throw insertError;
        }
      }
    } finally {
      client.release();
    }
  },

  /**
   * Get template by user, name, and language
   */
  async getByUserNameLanguage(userId: string, name: string, language: string): Promise<any | null> {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT * FROM templates 
        WHERE user_id = $1 AND name = $2 AND language = $3
        LIMIT 1
      `, [userId, name, language]);

      return result.rows.length > 0 ? result.rows[0] : null;
    } finally {
      client.release();
    }
  },

  /**
   * Get all templates for a user
   */
  async getAllByUserId(userId: string): Promise<any[]> {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT id, name, language, status, category, rejection_reason, 
               created_at, updated_at, quality_rating
        FROM templates 
        WHERE user_id = $1
        ORDER BY created_at DESC
      `, [userId]);

      return result.rows;
    } finally {
      client.release();
    }
  }
};

// User Business Info Repository for credentials
export const userBusinessRepo = {
  async getByPhoneNumberIdWithCreds(phoneNumberId: string): Promise<{
    userId: string;
    wabaId?: string;
    accessToken?: string;
  } | null> {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT user_id as "userId", waba_id as "wabaId", access_token as "accessToken"
        FROM user_business_info
        WHERE whatsapp_number_id = $1 AND is_active = true
        LIMIT 1
      `, [phoneNumberId]);

      return result.rows.length > 0 ? result.rows[0] : null;
    } finally {
      client.release();
    }
  },

  async getByWabaIdWithCreds(wabaId: string): Promise<{
    userId: string;
    wabaId?: string;
    accessToken?: string;
  } | null> {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT user_id as "userId", waba_id as "wabaId", access_token as "accessToken"
        FROM user_business_info
        WHERE waba_id = $1 AND is_active = true
        LIMIT 1
      `, [wabaId]);

      return result.rows.length > 0 ? result.rows[0] : null;
    } finally {
      client.release();
    }
  },

  async getCredsByUserId(userId: string): Promise<{
    wabaId?: string;
    accessToken?: string;
  } | null> {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT waba_id as "wabaId", access_token as "accessToken"
        FROM user_business_info
        WHERE user_id = $1 AND is_active = true
        LIMIT 1
      `, [userId]);

      return result.rows.length > 0 ? result.rows[0] : null;
    } finally {
      client.release();
    }
  }
};