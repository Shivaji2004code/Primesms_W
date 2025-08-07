import { Request, Response, NextFunction } from 'express';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

export const requireAuthWithRedirect = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.user) {
    const isPageRoute = req.headers.accept?.includes('text/html');
    return isPageRoute
      ? res.redirect('/login')
      : res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  next();
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  next();
};