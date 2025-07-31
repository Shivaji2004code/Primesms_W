import express from 'express';
import { pool } from '../index';
import { CreateUserRequest, LoginRequest, User, SessionUser } from '../types';
import { requireAuth } from '../middleware/auth';

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

export default router;