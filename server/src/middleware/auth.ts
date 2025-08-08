import { Request, Response, NextFunction } from 'express';
import pool from '../db';

// Helper to get user data from session userId
const getUserFromSession = async (req: Request) => {
  const session = req.session as any;
  if (!session?.userId) return null;
  
  try {
    const result = await pool.query(
      'SELECT id, name, email, username, role, credit_balance FROM users WHERE id = $1 LIMIT 1',
      [session.userId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching user from session:', error);
    return null;
  }
};

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const session = req.session as any;
  if (!session?.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const user = await getUserFromSession(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // Add user to request for compatibility
  (req.session as any).user = user;
  next();
};

export const requireAuthWithRedirect = async (req: Request, res: Response, next: NextFunction) => {
  const session = req.session as any;
  if (!session?.userId) {
    const isPageRoute = req.headers.accept?.includes('text/html');
    return isPageRoute
      ? res.redirect('/login')
      : res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  
  const user = await getUserFromSession(req);
  if (!user) {
    const isPageRoute = req.headers.accept?.includes('text/html');
    return isPageRoute
      ? res.redirect('/login')
      : res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  
  // Add user to request for compatibility
  (req.session as any).user = user;
  next();
};

export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const session = req.session as any;
  if (!session?.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const user = await getUserFromSession(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  // Add user to request for compatibility
  (req.session as any).user = user;
  next();
};