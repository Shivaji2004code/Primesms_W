"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const index_1 = require("../index");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// All admin routes require admin authentication
router.use(auth_1.requireAdmin);
// Get all users with pagination
router.get('/users', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        // Get total count
        const countResult = await index_1.pool.query('SELECT COUNT(*) FROM users');
        const totalUsers = parseInt(countResult.rows[0].count);
        // Get users
        const result = await index_1.pool.query('SELECT id, name, email, username, phone_number, role, credit_balance, created_at, updated_at FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
        const users = result.rows.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            username: user.username,
            phoneNumber: user.phone_number,
            role: user.role,
            creditBalance: user.credit_balance,
            createdAt: user.created_at,
            updatedAt: user.updated_at
        }));
        res.json({
            users,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalUsers / limit),
                totalUsers,
                hasNext: page < Math.ceil(totalUsers / limit),
                hasPrev: page > 1
            }
        });
    }
    catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get specific user by ID
router.get('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await index_1.pool.query('SELECT id, name, email, username, phone_number, role, credit_balance, created_at, updated_at FROM users WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const user = result.rows[0];
        res.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                username: user.username,
                phoneNumber: user.phone_number,
                role: user.role,
                creditBalance: user.credit_balance,
                createdAt: user.created_at,
                updatedAt: user.updated_at
            }
        });
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Create new user manually (admin only)
router.post('/users', async (req, res) => {
    try {
        const { name, email, username, password, phoneNumber, role, creditBalance } = req.body;
        // Validation
        if (!name || !email || !username || !password) {
            return res.status(400).json({ error: 'Name, email, username, and password are required' });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }
        // Role validation
        if (role && !['user', 'admin'].includes(role)) {
            return res.status(400).json({ error: 'Role must be either "user" or "admin"' });
        }
        // Check if user already exists
        const existingUser = await index_1.pool.query('SELECT id FROM users WHERE email = $1 OR username = $2', [email, username]);
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ error: 'User with this email or username already exists' });
        }
        // Create user
        const result = await index_1.pool.query('INSERT INTO users (name, email, username, password, phone_number, role, credit_balance) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, name, email, username, phone_number, role, credit_balance, created_at', [name, email, username, password, phoneNumber, role || 'user', creditBalance || 1000]);
        const newUser = result.rows[0];
        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                username: newUser.username,
                phoneNumber: newUser.phone_number,
                role: newUser.role,
                creditBalance: newUser.credit_balance,
                createdAt: newUser.created_at
            }
        });
    }
    catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Update user
router.put('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, username, password, phoneNumber, role, creditBalance } = req.body;
        // Check if user exists
        const existingUser = await index_1.pool.query('SELECT id FROM users WHERE id = $1', [id]);
        if (existingUser.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Build dynamic query based on provided fields
        const updateFields = [];
        const values = [];
        let paramCount = 1;
        if (name !== undefined) {
            updateFields.push(`name = $${paramCount++}`);
            values.push(name);
        }
        if (email !== undefined) {
            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ error: 'Invalid email format' });
            }
            // Check if email is already taken by another user
            const emailCheck = await index_1.pool.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, id]);
            if (emailCheck.rows.length > 0) {
                return res.status(409).json({ error: 'Email is already taken by another user' });
            }
            updateFields.push(`email = $${paramCount++}`);
            values.push(email);
        }
        if (username !== undefined) {
            // Check if username is already taken by another user
            const usernameCheck = await index_1.pool.query('SELECT id FROM users WHERE username = $1 AND id != $2', [username, id]);
            if (usernameCheck.rows.length > 0) {
                return res.status(409).json({ error: 'Username is already taken by another user' });
            }
            updateFields.push(`username = $${paramCount++}`);
            values.push(username);
        }
        if (password !== undefined) {
            if (password.length < 6) {
                return res.status(400).json({ error: 'Password must be at least 6 characters long' });
            }
            updateFields.push(`password = $${paramCount++}`);
            values.push(password);
        }
        if (phoneNumber !== undefined) {
            updateFields.push(`phone_number = $${paramCount++}`);
            values.push(phoneNumber);
        }
        if (role !== undefined) {
            if (!['user', 'admin'].includes(role)) {
                return res.status(400).json({ error: 'Role must be either "user" or "admin"' });
            }
            updateFields.push(`role = $${paramCount++}`);
            values.push(role);
        }
        if (creditBalance !== undefined) {
            if (creditBalance < 0) {
                return res.status(400).json({ error: 'Credit balance cannot be negative' });
            }
            updateFields.push(`credit_balance = $${paramCount++}`);
            values.push(creditBalance);
        }
        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }
        // Add updated_at
        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);
        const query = `
      UPDATE users 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramCount} 
      RETURNING id, name, email, username, phone_number, role, credit_balance, created_at, updated_at
    `;
        const result = await index_1.pool.query(query, values);
        const updatedUser = result.rows[0];
        res.json({
            message: 'User updated successfully',
            user: {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                username: updatedUser.username,
                phoneNumber: updatedUser.phone_number,
                role: updatedUser.role,
                creditBalance: updatedUser.credit_balance,
                createdAt: updatedUser.created_at,
                updatedAt: updatedUser.updated_at
            }
        });
    }
    catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Delete user
router.delete('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // Prevent deleting the current admin user
        if (req.session.user.id === id) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }
        const result = await index_1.pool.query('DELETE FROM users WHERE id = $1 RETURNING id, name, username', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const deletedUser = result.rows[0];
        res.json({
            message: 'User deleted successfully',
            deletedUser: {
                id: deletedUser.id,
                name: deletedUser.name,
                username: deletedUser.username
            }
        });
    }
    catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get admin dashboard statistics
router.get('/stats', async (req, res) => {
    try {
        const queries = await Promise.all([
            index_1.pool.query('SELECT COUNT(*) as total FROM users'),
            index_1.pool.query('SELECT COUNT(*) as admins FROM users WHERE role = $1', ['admin']),
            index_1.pool.query('SELECT COUNT(*) as regular_users FROM users WHERE role = $1', ['user']),
            index_1.pool.query('SELECT SUM(credit_balance) as total_credits FROM users'),
            index_1.pool.query('SELECT COUNT(*) as new_users_today FROM users WHERE created_at >= CURRENT_DATE'),
        ]);
        const stats = {
            totalUsers: parseInt(queries[0].rows[0].total),
            adminUsers: parseInt(queries[1].rows[0].admins),
            regularUsers: parseInt(queries[2].rows[0].regular_users),
            totalCredits: parseInt(queries[3].rows[0].total_credits) || 0,
            newUsersToday: parseInt(queries[4].rows[0].new_users_today)
        };
        res.json({ stats });
    }
    catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get user details with business info
router.get('/users/:id/details', async (req, res) => {
    try {
        const { id } = req.params;
        // Get user basic info
        const userResult = await index_1.pool.query('SELECT id, name, email, username, phone_number, role, credit_balance, created_at, updated_at FROM users WHERE id = $1', [id]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const user = userResult.rows[0];
        // Get business info
        const businessResult = await index_1.pool.query(`SELECT id, user_id, business_name, whatsapp_number, whatsapp_number_id, 
       waba_id, access_token, webhook_url, webhook_verify_token, is_active, 
       created_at, updated_at 
       FROM user_business_info WHERE user_id = $1`, [id]);
        const userWithBusiness = {
            id: user.id,
            name: user.name,
            email: user.email,
            username: user.username,
            password: user.password,
            phone_number: user.phone_number,
            role: user.role,
            credit_balance: user.credit_balance,
            created_at: user.created_at,
            updated_at: user.updated_at,
        };
        if (businessResult.rows.length > 0) {
            const business = businessResult.rows[0];
            userWithBusiness.businessInfo = {
                id: business.id,
                userId: business.user_id,
                businessName: business.business_name,
                whatsappNumber: business.whatsapp_number,
                whatsappNumberId: business.whatsapp_number_id,
                wabaId: business.waba_id,
                accessToken: business.access_token,
                webhookUrl: business.webhook_url,
                webhookVerifyToken: business.webhook_verify_token,
                isActive: business.is_active,
                createdAt: business.created_at,
                updatedAt: business.updated_at,
            };
        }
        // Convert to frontend-friendly format
        const responseUser = {
            id: userWithBusiness.id,
            name: userWithBusiness.name,
            email: userWithBusiness.email,
            username: userWithBusiness.username,
            phoneNumber: userWithBusiness.phone_number,
            role: userWithBusiness.role,
            creditBalance: userWithBusiness.credit_balance,
            createdAt: userWithBusiness.created_at,
            updatedAt: userWithBusiness.updated_at,
            businessInfo: userWithBusiness.businessInfo ? {
                id: userWithBusiness.businessInfo.id,
                userId: userWithBusiness.businessInfo.userId,
                businessName: userWithBusiness.businessInfo.businessName,
                whatsappNumber: userWithBusiness.businessInfo.whatsappNumber,
                whatsappNumberId: userWithBusiness.businessInfo.whatsappNumberId,
                wabaId: userWithBusiness.businessInfo.wabaId,
                accessToken: userWithBusiness.businessInfo.accessToken,
                webhookUrl: userWithBusiness.businessInfo.webhookUrl,
                webhookVerifyToken: userWithBusiness.businessInfo.webhookVerifyToken,
                isActive: userWithBusiness.businessInfo.isActive,
                createdAt: userWithBusiness.businessInfo.createdAt,
                updatedAt: userWithBusiness.businessInfo.updatedAt,
            } : undefined
        };
        res.json({ user: responseUser });
    }
    catch (error) {
        console.error('Get user details error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get user's business info
router.get('/users/:id/business-info', async (req, res) => {
    try {
        const { id } = req.params;
        // Verify user exists
        const userCheck = await index_1.pool.query('SELECT id FROM users WHERE id = $1', [id]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const result = await index_1.pool.query(`SELECT id, user_id, business_name, whatsapp_number, whatsapp_number_id, 
       waba_id, access_token, webhook_url, webhook_verify_token, is_active, 
       created_at, updated_at 
       FROM user_business_info WHERE user_id = $1`, [id]);
        if (result.rows.length === 0) {
            return res.json({ businessInfo: null });
        }
        const business = result.rows[0];
        const businessInfo = {
            id: business.id,
            userId: business.user_id,
            businessName: business.business_name,
            whatsappNumber: business.whatsapp_number,
            whatsappNumberId: business.whatsapp_number_id,
            wabaId: business.waba_id,
            accessToken: business.access_token,
            webhookUrl: business.webhook_url,
            webhookVerifyToken: business.webhook_verify_token,
            isActive: business.is_active,
            createdAt: business.created_at,
            updatedAt: business.updated_at,
        };
        res.json({ businessInfo });
    }
    catch (error) {
        console.error('Get business info error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Update/Create user's business info
router.put('/users/:id/business-info', async (req, res) => {
    try {
        const { id } = req.params;
        const { businessName, whatsappNumber, whatsappNumberId, wabaId, accessToken, webhookUrl, webhookVerifyToken, isActive } = req.body;
        // Verify user exists
        const userCheck = await index_1.pool.query('SELECT id FROM users WHERE id = $1', [id]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Validation
        if (whatsappNumber && !/^\+?[\d\s-()]+$/.test(whatsappNumber)) {
            return res.status(400).json({ error: 'Invalid WhatsApp number format' });
        }
        if (webhookUrl && !/^https?:\/\/.+/.test(webhookUrl)) {
            return res.status(400).json({ error: 'Webhook URL must be a valid HTTP/HTTPS URL' });
        }
        // Check if business info already exists
        const existingResult = await index_1.pool.query('SELECT id FROM user_business_info WHERE user_id = $1', [id]);
        let result;
        if (existingResult.rows.length > 0) {
            // Update existing record
            result = await index_1.pool.query(`UPDATE user_business_info 
         SET business_name = $2, whatsapp_number = $3, whatsapp_number_id = $4,
             waba_id = $5, access_token = $6, webhook_url = $7, 
             webhook_verify_token = $8, is_active = $9, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $1
         RETURNING id, user_id, business_name, whatsapp_number, whatsapp_number_id, 
                   waba_id, access_token, webhook_url, webhook_verify_token, is_active, 
                   created_at, updated_at`, [id, businessName, whatsappNumber, whatsappNumberId, wabaId, accessToken,
                webhookUrl, webhookVerifyToken, isActive ?? true]);
        }
        else {
            // Create new record
            result = await index_1.pool.query(`INSERT INTO user_business_info 
         (user_id, business_name, whatsapp_number, whatsapp_number_id, waba_id, 
          access_token, webhook_url, webhook_verify_token, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id, user_id, business_name, whatsapp_number, whatsapp_number_id, 
                   waba_id, access_token, webhook_url, webhook_verify_token, is_active, 
                   created_at, updated_at`, [id, businessName, whatsappNumber, whatsappNumberId, wabaId, accessToken,
                webhookUrl, webhookVerifyToken, isActive ?? true]);
        }
        const business = result.rows[0];
        const businessInfo = {
            id: business.id,
            userId: business.user_id,
            businessName: business.business_name,
            whatsappNumber: business.whatsapp_number,
            whatsappNumberId: business.whatsapp_number_id,
            wabaId: business.waba_id,
            accessToken: business.access_token,
            webhookUrl: business.webhook_url,
            webhookVerifyToken: business.webhook_verify_token,
            isActive: business.is_active,
            createdAt: business.created_at,
            updatedAt: business.updated_at,
        };
        res.json({
            message: 'Business information updated successfully',
            businessInfo
        });
    }
    catch (error) {
        console.error('Update business info error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=admin.js.map