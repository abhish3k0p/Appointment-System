import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { env } from '../config.js';
import User from '../models/User.js';

// Password utilities
export const hashPassword = async (pwd) => bcrypt.hash(pwd, 10);
export const verifyPassword = async (pwd, hash) => bcrypt.compare(pwd, hash);

// JWT token signing
export const signToken = (user) =>
  jwt.sign(
    { sub: user._id, role: user.role, name: user.name },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );

// Auth middleware: verify JWT, load user, attach to req.user
export async function authRequired(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Missing token' });

    const payload = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findById(payload.sub).lean();
    if (!user) return res.status(401).json({ message: 'User not found' });
    if (!user.active) return res.status(403).json({ message: 'Account is inactive' });

    req.user = { id: user._id.toString(), role: user.role, name: user.name, hospitalId: user.hospitalId?.toString(), permissions: user.permissions || [] };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// Role-based access control middleware
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient role' });
    }
    next();
  };
}

// Permission-based access control middleware (extendable)
export function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    if (!req.user.permissions.includes(permission)) {
      return res.status(403).json({ message: 'Forbidden: insufficient permission' });
    }
    next();
  };
}

// Alternate role checking middleware with simplified name
export const allowRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
  next();
};
