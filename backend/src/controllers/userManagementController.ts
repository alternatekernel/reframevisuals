import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '../database';
import { emailService } from '../services/emailService';
import type { AuthRequest } from '../middleware/auth';

const SAFE_ROLES = ['admin', 'manager', 'accountant', 'editor', 'author', 'contributor'];

const safeUserSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  role: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} as const;

const listUserSelect = { ...safeUserSelect, resetTokenNonce: true } as const;

export const listUsers = async (_req: Request, res: Response) => {
  try {
    const rows = await prisma.user.findMany({
      where: { role: { in: SAFE_ROLES } },
      select: listUserSelect,
      orderBy: { createdAt: 'desc' },
    });
    const users = rows.map(({ resetTokenNonce, ...u }) => ({
      ...u,
      pendingInvite: resetTokenNonce !== null,
    }));
    return res.json({ success: true, data: { users } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to load users' });
  }
};

export const inviteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { firstName, lastName, email, role } = req.body || {};
    if (!firstName || !lastName || !email || !role) {
      return res.status(400).json({ success: false, message: 'First name, last name, email, and role are required' });
    }
    if (!SAFE_ROLES.includes(String(role))) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ success: false, message: 'A user with that email already exists' });

    const rawNonce = crypto.randomBytes(32).toString('hex');
    const hashedNonce = crypto.createHash('sha256').update(rawNonce).digest('hex');
    const tempPassword = crypto.randomBytes(10).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        role,
        passwordHash: hashedPassword,
        active: true,
        resetTokenNonce: hashedNonce,
      },
      select: safeUserSelect,
    });

    const token = jwt.sign(
      { id: user.id, action: 'reset_password', nonce: rawNonce },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );
    const resetUrl = `${process.env.BASE_URL}/admin/reset-password?token=${token}`;

    const sent = await emailService.sendEmail(
      email,
      'Welcome to Reframe Visuals',
      `<h3>Welcome, ${firstName}</h3><p>Your account has been created. Use the link below to set your password.</p><p><a href="${resetUrl}" style="background:#000;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;">Set Password</a></p>`
    );
    if (!sent) {
      await prisma.user.delete({ where: { id: user.id } });
      return res.status(500).json({ success: false, message: 'Failed to send invitation email' });
    }

    return res.json({ success: true, data: { user } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to invite user' });
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, role } = req.body || {};

    if (req.user?.id === id && role && role !== req.user?.role) {
      return res.status(400).json({ success: false, message: 'You cannot change your own role' });
    }
    if (role && !SAFE_ROLES.includes(String(role))) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const data: Record<string, string> = {};
    if (firstName !== undefined) {
      if (!String(firstName).trim()) return res.status(400).json({ success: false, message: 'First name cannot be empty' });
      data.firstName = String(firstName).trim();
    }
    if (lastName !== undefined) {
      if (!String(lastName).trim()) return res.status(400).json({ success: false, message: 'Last name cannot be empty' });
      data.lastName = String(lastName).trim();
    }
    if (email !== undefined) {
      if (!String(email).trim()) return res.status(400).json({ success: false, message: 'Email cannot be empty' });
      data.email = String(email).trim();
    }
    if (role !== undefined) data.role = role;

    const user = await prisma.user.update({
      where: { id },
      data,
      select: safeUserSelect,
    });
    return res.json({ success: true, data: { user } });
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(409).json({ success: false, message: 'Email already in use' });
    if (error.code === 'P2025') return res.status(404).json({ success: false, message: 'User not found' });
    return res.status(500).json({ success: false, message: 'Failed to update user' });
  }
};

export const toggleUserActive = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (req.user?.id === id) return res.status(400).json({ success: false, message: 'You cannot deactivate your own account' });
    const user = await prisma.user.findUnique({ where: { id }, select: { id: true, active: true } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const updated = await prisma.user.update({ where: { id }, data: { active: !user.active }, select: safeUserSelect });
    return res.json({ success: true, data: { user: updated } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update status' });
  }
};

export const resetUserPassword = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const rawNonce = crypto.randomBytes(32).toString('hex');
    const hashedNonce = crypto.createHash('sha256').update(rawNonce).digest('hex');
    await prisma.user.update({ where: { id }, data: { resetTokenNonce: hashedNonce } });

    const resetToken = jwt.sign({ id: user.id, action: 'reset_password', nonce: rawNonce }, process.env.JWT_SECRET!, { expiresIn: '1h' });
    const resetUrl = `${process.env.BASE_URL}/admin/reset-password?token=${resetToken}`;

    const sent = await emailService.sendEmail(
      user.email,
      'Password Reset Request',
      `<h3>Reset your password</h3><p>Use the link below to choose a new password. It expires in 1 hour.</p><a href="${resetUrl}" style="background:#000;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;">Reset Password</a>`
    );
    if (!sent) return res.status(500).json({ success: false, message: 'Failed to send reset link' });

    return res.json({ success: true, message: 'Reset link sent' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to send reset link' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (req.user?.id === id) return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    await prisma.user.delete({ where: { id } });
    return res.json({ success: true, message: 'User deleted' });
  } catch (error: any) {
    if (error.code === 'P2025') return res.status(404).json({ success: false, message: 'User not found' });
    return res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
};
