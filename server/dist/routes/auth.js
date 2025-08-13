"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = __importDefault(require("../db"));
const auth_1 = require("../middleware/auth");
const crypto_1 = __importDefault(require("crypto"));
const otpStore = new Map();
setInterval(() => {
    const now = Date.now();
    for (const [username, record] of otpStore.entries()) {
        if (record.expires < now) {
            otpStore.delete(username);
        }
    }
}, 5 * 60 * 1000);
function constantTimeEqual(a, b) {
    const ab = Buffer.from(a ?? '', 'utf8');
    const bb = Buffer.from(b ?? '', 'utf8');
    if (ab.length !== bb.length)
        return false;
    return crypto_1.default.timingSafeEqual(ab, bb);
}
async function sendOtpToUser(phone, otp) {
    try {
        console.log(`🔐 Sending OTP ${otp} to phone: ${phone}`);
        const sendRequest = {
            username: 'primesms',
            templatename: 'forget_password',
            recipient_number: phone,
            var1: otp
        };
        console.log(`📤 Making WhatsApp API call with:`, JSON.stringify(sendRequest, null, 2));
        const response = await fetch('http://localhost:5050/api/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(sendRequest)
        });
        const result = await response.json();
        if (response.ok && result.success) {
            console.log(`✅ OTP sent successfully to ${phone}: ${otp}`);
            console.log(`📱 WhatsApp API Response:`, result.message || 'Message sent');
            return true;
        }
        else {
            console.error(`❌ WhatsApp API Error:`, result.error || result.message || 'Unknown error');
            return false;
        }
    }
    catch (error) {
        console.error('❌ Failed to send OTP via WhatsApp:', error);
        return false;
    }
}
const router = express_1.default.Router();
router.post('/signup', async (req, res) => {
    try {
        const { name, email, username, password, confirmPassword, phoneNumber } = req.body;
        if (!name || !email || !username || !password) {
            return res.status(400).json({ error: 'All required fields must be provided' });
        }
        if (password !== confirmPassword) {
            return res.status(400).json({ error: 'Passwords do not match' });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }
        if (phoneNumber) {
            const phoneRegex = /^\+?[\d\s-()]+$/;
            if (!phoneRegex.test(phoneNumber)) {
                return res.status(400).json({ error: 'Invalid phone number format' });
            }
        }
        const existingUser = await db_1.default.query('SELECT id FROM users WHERE email = $1 OR username = $2', [email, username]);
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ error: 'User with this email or username already exists' });
        }
        const result = await db_1.default.query('INSERT INTO users (name, email, username, password, phone_number, credit_balance) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, username, role, credit_balance, created_at', [name, email, username, password, phoneNumber, 1000]);
        const newUser = result.rows[0];
        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                username: newUser.username,
                role: newUser.role,
                creditBalance: newUser.credit_balance,
                createdAt: newUser.created_at
            }
        });
    }
    catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
function sendErr(res, status, code, extra = {}) {
    return res.status(status).json({ error: code, ...extra });
}
router.post('/login', async (req, res) => {
    const started = Date.now();
    try {
        const { username, password } = req.body ?? {};
        console.log('[AUTH] input:', { username, hasPassword: Boolean(password) });
        if (!username || !password)
            return sendErr(res, 400, 'MISSING_CREDENTIALS');
        let rows;
        try {
            const sql = 'SELECT id, username, password, name, email, role, credit_balance FROM users WHERE username = $1 LIMIT 1';
            rows = (await db_1.default.query(sql, [username])).rows;
            console.log('[AUTH] db rows:', { rowsLen: rows.length, keys: rows[0] ? Object.keys(rows[0]) : [] });
        }
        catch (dbErr) {
            console.error('[AUTH] DB_QUERY_FAILED:', dbErr);
            return sendErr(res, 500, 'DB_QUERY_FAILED');
        }
        const user = rows[0];
        if (!user)
            return sendErr(res, 401, 'USER_NOT_FOUND');
        if (typeof user.password !== 'string') {
            console.error('[AUTH] PASSWORD_FIELD_INVALID:', { keys: Object.keys(user), passwordType: typeof user.password });
            return sendErr(res, 500, 'PASSWORD_FIELD_INVALID');
        }
        const passwordMatch = constantTimeEqual(password, user.password);
        if (!passwordMatch)
            return sendErr(res, 401, 'INVALID_PASSWORD');
        try {
            req.session.userId = user.id;
            req.session.save((err) => {
                if (err) {
                    console.error('[AUTH] SESSION_SAVE_FAILED:', err);
                    return sendErr(res, 500, 'SESSION_SAVE_FAILED');
                }
                console.log('[AUTH] login ok:', { userId: user.id, ms: Date.now() - started });
                return res.status(200).json({
                    ok: true,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        username: user.username,
                        role: user.role,
                        creditBalance: user.credit_balance
                    }
                });
            });
        }
        catch (sessErr) {
            console.error('[AUTH] SESSION_BLOCK_THROW:', sessErr);
            return sendErr(res, 500, 'SESSION_BLOCK_THROW');
        }
    }
    catch (err) {
        console.error('[AUTH] UNCAUGHT:', err);
        return sendErr(res, 500, 'UNCAUGHT');
    }
});
router.get('/me', auth_1.requireAuth, async (req, res) => {
    try {
        const session = req.session;
        const userId = session.userId;
        const result = await db_1.default.query('SELECT id, name, email, username, role, credit_balance, created_at FROM users WHERE id = $1', [userId]);
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
                role: user.role,
                creditBalance: user.credit_balance,
                createdAt: user.created_at
            }
        });
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/logout', auth_1.requireAuth, (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({ error: 'Could not log out' });
        }
        res.clearCookie('psid');
        res.json({ message: 'Logged out successfully' });
    });
});
router.post('/forgot-password', async (req, res) => {
    try {
        const { username, phone } = req.body;
        if (!username || !phone) {
            return res.status(400).json({
                success: false,
                error: 'Username and phone number are required'
            });
        }
        const phoneRegex = /^\+[1-9]\d{1,14}$/;
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid phone number format. Use international format (e.g., +911234567890)'
            });
        }
        const result = await db_1.default.query('SELECT id, username, phone_number FROM users WHERE username = $1', [username]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        const user = result.rows[0];
        const userPhone = user.phone_number;
        const phoneMatch = userPhone === phone ||
            userPhone === phone.replace(/^\+91/, '') ||
            `+91${userPhone}` === phone;
        if (!phoneMatch) {
            return res.status(404).json({
                success: false,
                error: 'Phone number does not match our records'
            });
        }
        const existingRecord = otpStore.get(username);
        const now = Date.now();
        if (existingRecord && (now - existingRecord.lastSent) < 60000) {
            const remainingTime = Math.ceil((60000 - (now - existingRecord.lastSent)) / 1000);
            return res.status(429).json({
                success: false,
                error: `Please wait ${remainingTime} seconds before requesting a new OTP`
            });
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = now + 5 * 60 * 1000;
        otpStore.set(username, {
            otp,
            phone: phone,
            expires,
            lastSent: now
        });
        const otpSent = await sendOtpToUser(phone, otp);
        if (!otpSent) {
            otpStore.delete(username);
            return res.status(500).json({
                success: false,
                error: 'Failed to send OTP. Please try again.'
            });
        }
        console.log(`🔐 OTP generated for user ${username}: ${otp} (expires in 5 minutes)`);
        return res.json({
            success: true,
            otpSent: true,
            message: 'OTP sent to your WhatsApp number'
        });
    }
    catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
router.post('/verify-otp', (req, res) => {
    try {
        const { username, otp } = req.body;
        if (!username || !otp) {
            return res.status(400).json({
                success: false,
                error: 'Username and OTP are required'
            });
        }
        const record = otpStore.get(username);
        const now = Date.now();
        if (!record) {
            return res.status(400).json({
                success: false,
                error: 'No OTP found. Please request a new OTP.'
            });
        }
        if (record.expires < now) {
            otpStore.delete(username);
            return res.status(400).json({
                success: false,
                error: 'OTP has expired. Please request a new one.'
            });
        }
        if (record.otp !== otp) {
            return res.status(400).json({
                success: false,
                error: 'Invalid OTP. Please try again.'
            });
        }
        record.expires = now + 10 * 60 * 1000;
        console.log(`✅ OTP verified successfully for user: ${username}`);
        return res.json({
            success: true,
            resetAllowed: true,
            message: 'OTP verified successfully'
        });
    }
    catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
router.put('/update-profile', auth_1.requireAuth, async (req, res) => {
    try {
        const { name, email } = req.body;
        const session = req.session;
        const userId = session.userId;
        if (!name || !email) {
            return res.status(400).json({
                success: false,
                error: 'Name and email are required'
            });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid email format'
            });
        }
        const existingUser = await db_1.default.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, userId]);
        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                error: 'Email is already in use'
            });
        }
        const result = await db_1.default.query('UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING id, name, email, username, role, credit_balance, created_at', [name, email, userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        const updatedUser = result.rows[0];
        return res.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                username: updatedUser.username,
                role: updatedUser.role,
                creditBalance: updatedUser.credit_balance,
                createdAt: updatedUser.created_at
            }
        });
    }
    catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
router.post('/reset-password', async (req, res) => {
    try {
        const { username, newPassword } = req.body;
        if (!username || !newPassword) {
            return res.status(400).json({
                success: false,
                error: 'Username and new password are required'
            });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'Password must be at least 6 characters long'
            });
        }
        const record = otpStore.get(username);
        const now = Date.now();
        if (!record || record.expires < now) {
            return res.status(400).json({
                success: false,
                error: 'OTP verification required or expired. Please start the process again.'
            });
        }
        const result = await db_1.default.query('UPDATE users SET password = $1 WHERE username = $2 RETURNING id, username', [newPassword, username]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        otpStore.delete(username);
        console.log(`🔐 Password reset successfully for user: ${username}`);
        return res.json({
            success: true,
            message: 'Password reset successfully'
        });
    }
    catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
router.get('/__ping', (_req, res) => res.json({ ok: true, route: '/api/auth/__ping' }));
exports.default = router;
//# sourceMappingURL=auth.js.map