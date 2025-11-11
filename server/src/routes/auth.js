import express from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { hashPassword, verifyPassword, signToken, authRequired } from '../middleware/auth.js';
import bcrypt from "bcryptjs";

const authRoutes = express.Router();

// Patient self-register
authRoutes.post('/register', async (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string().min(2),
      email: z.string().email(),
      phone: z.string().min(10, "Phone number is required"),
      password: z.string().min(6),
    });
    const { name, email, phone, password, role } = schema.parse(req.body);

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'Email already in use' });

    const user = await User.create({
      name,
      email,
      phone,
      passwordHash: await hashPassword(password),
      role,
    });

    const token = signToken(user);
    res.status(201).json({ token, user: { id: user._id, name: user.name, role: user.role } });
  } catch (err) {
    next(err);
  }
});

// Login (email + password)
authRoutes.post('/login', async (req, res, next) => {
  try {
    const schema = z.object({ email: z.string().email(), password: z.string().min(6) });
    const { email, password } = schema.parse(req.body);

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    // Support both external comparePassword and legacy hash-based check
    const ok =
      typeof user.comparePassword === 'function'
        ? await user.comparePassword(password)
        : await verifyPassword(password, user.passwordHash);

    if (!ok) return res.status(401).json({ message: 'Invalid email or password' });

    // JWT with role
    const token = signToken(user);
    res.json({ token, role: user.role, user: { id: user._id, name: user.name, role: user.role } });
  } catch (err) {
    next(err);
  }
});

// Get current logged-in user
authRoutes.get('/me', authRequired, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

authRoutes.post("/change-password", authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { currentPassword, newPassword } = req.body;
    

    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) return res.status(400).json({ message: "Old password is incorrect" });

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ message: "Failed to change password" });
  }
});

export default authRoutes;
