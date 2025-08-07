import express from 'express';
import { pool } from '../index';
import { CreateUserRequest, LoginRequest, User, SessionUser } from '../types';
import { requireAuth } from '../middleware/auth';

// In-memory OTP store (username -> {otp, phone, expires, lastSent})
interface OtpRecord {
  otp: string;
  phone: string;
  expires: number;
  lastSent: number;
}

const otpStore = new Map<string, OtpRecord>();

// Clean expired OTPs every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [username, record] of otpStore.entries()) {
    if (record.expires < now) {
      otpStore.delete(username);
    }
  }
}, 5 * 60 * 1000);

// API Response interface
interface ApiResponse {
  success?: boolean;
  message?: string;
  error?: string;
}

// Helper function to send OTP via WhatsApp using authentication template
async function sendOtpToUser(phone: string, otp: string): Promise<boolean> {
  try {
    console.log(`🔐 Sending OTP ${otp} to phone: ${phone}`);
    
    // Use the authentication template "edi_mp" with user "harsha" for testing
    const sendRequest = {
      username: 'harsha',
      templatename: 'edi_mp', // Authentication template
      recipient_number: phone,
      var1: otp // OTP code as first variable
    };

    console.log(`📤 Making WhatsApp API call with:`, JSON.stringify(sendRequest, null, 2));

    // Make internal API call to send the OTP
    const response = await fetch('http://localhost:5050/api/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sendRequest)
    });

    const result = await response.json() as ApiResponse;
    
    if (response.ok && result.success) {
      console.log(`✅ OTP sent successfully to ${phone}: ${otp}`);
      console.log(`📱 WhatsApp API Response:`, result.message || 'Message sent');
      return true;
    } else {
      console.error(`❌ WhatsApp API Error:`, result.error || result.message || 'Unknown error');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Failed to send OTP via WhatsApp:', error);
    return false;
  }
}

const router = express.Router();

// Signup route
router.post('/signup', async (req, res) => {
  try {
    const { name, email, username, password, confirmPassword, phoneNumber }: CreateUserRequest = req.body;

    // Validation
    if (!name || !email || !username || !password) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Phone number validation (optional)
    if (phoneNumber) {
      const phoneRegex = /^\+?[\d\s-()]+$/;
      if (!phoneRegex.test(phoneNumber)) {
        return res.status(400).json({ error: 'Invalid phone number format' });
      }
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'User with this email or username already exists' });
    }

    // Create user (storing password as plain text for simplicity as per requirements)
    const result = await pool.query(
      'INSERT INTO users (name, email, username, password, phone_number, credit_balance) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, username, role, credit_balance, created_at',
      [name, email, username, password, phoneNumber, 1000] // Default 1000 credits for new users
    );

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

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { username, password }: LoginRequest = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user by username
    const result = await pool.query(
      'SELECT id, name, email, username, password, role, credit_balance FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user: User = result.rows[0];

    // Check password (plain text comparison as per requirements)
    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create session
    const sessionUser: SessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role
    };

    req.session.user = sessionUser;

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        creditBalance: user.credit_balance
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user (protected route)
router.get('/me', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user!.id;

    const result = await pool.query(
      'SELECT id, name, email, username, role, credit_balance, created_at FROM users WHERE id = $1',
      [userId]
    );

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

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout route
router.post('/logout', requireAuth, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Could not log out' });
    }
    
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out successfully' });
  });
});

// Forgot password - send OTP
router.post('/forgot-password', async (req, res) => {
  try {
    const { username, phone } = req.body;

    if (!username || !phone) {
      return res.status(400).json({ 
        success: false, 
        error: 'Username and phone number are required' 
      });
    }

    // Validate phone format (basic E.164 check)
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid phone number format. Use international format (e.g., +911234567890)' 
      });
    }

    // Find user by username and verify phone number
    const result = await pool.query(
      'SELECT id, username, phone_number FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    const user = result.rows[0];
    
    // Check if phone number matches (handle both with and without country code)
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

    // Check rate limiting (prevent resend within 60 seconds)
    const existingRecord = otpStore.get(username);
    const now = Date.now();
    
    if (existingRecord && (now - existingRecord.lastSent) < 60000) {
      const remainingTime = Math.ceil((60000 - (now - existingRecord.lastSent)) / 1000);
      return res.status(429).json({ 
        success: false, 
        error: `Please wait ${remainingTime} seconds before requesting a new OTP` 
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = now + 5 * 60 * 1000; // 5 minutes

    // Store OTP
    otpStore.set(username, {
      otp,
      phone: phone,
      expires,
      lastSent: now
    });

    // Send OTP via WhatsApp
    const otpSent = await sendOtpToUser(phone, otp);
    
    if (!otpSent) {
      // Remove OTP from store if sending failed
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

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Verify OTP
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
      // Clean up expired OTP
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

    // OTP is valid - extend expiry for password reset (10 minutes)
    record.expires = now + 10 * 60 * 1000;
    
    console.log(`✅ OTP verified successfully for user: ${username}`);

    return res.json({ 
      success: true, 
      resetAllowed: true,
      message: 'OTP verified successfully'
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Update profile route (name and email only)
router.put('/update-profile', requireAuth, async (req, res) => {
  try {
    const { name, email } = req.body;
    const userId = req.session.user!.id;

    if (!name || !email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name and email are required' 
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid email format' 
      });
    }

    // Check if email is already taken by another user
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [email, userId]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ 
        success: false, 
        error: 'Email is already in use' 
      });
    }

    // Update user profile
    const result = await pool.query(
      'UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING id, name, email, username, role, credit_balance, created_at',
      [name, email, userId]
    );

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

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Reset password after OTP verification
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

    // Check if user has verified OTP
    const record = otpStore.get(username);
    const now = Date.now();

    if (!record || record.expires < now) {
      return res.status(400).json({ 
        success: false, 
        error: 'OTP verification required or expired. Please start the process again.' 
      });
    }

    // Update password in database (storing as plain text as per requirements)
    const result = await pool.query(
      'UPDATE users SET password = $1 WHERE username = $2 RETURNING id, username',
      [newPassword, username]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    // Clean up OTP record
    otpStore.delete(username);

    console.log(`🔐 Password reset successfully for user: ${username}`);

    return res.json({ 
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

export default router;