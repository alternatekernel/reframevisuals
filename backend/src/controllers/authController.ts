import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../database';
import { emailService } from '../services/emailService';
import { fireLoginNotifications, fireSignupNotifications } from '../services/notificationService';

// ── Password Complexity Validation ──────────────────────────────
// Minimum 8 characters, at least one digit or special character.
function validatePasswordComplexity(password: string): { ok: boolean; message: string } {
  if (!password || password.length < 8) {
    return { ok: false, message: 'Password must be at least 8 characters long.' };
  }
  if (!/[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { ok: false, message: 'Password must contain at least one digit or special character.' };
  }
  return { ok: true, message: '' };
}

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// Generate JWT token with tenantId
const generateToken = async (user: { id: string; email: string; role: string; tenantId?: string | null }): Promise<string> => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    const errorMsg = 'FATAL: JWT_SECRET is not defined. Cannot generate secure tokens.';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
  
  const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'];
  
  // Fetch actual tenantId from database for non-platform users
  let actualTenantId = 'platform';
  
  if (user.role !== 'admin' && user.role !== 'manager' && user.role !== 'accountant') {
    const customer = await prisma.customer.findFirst({
      where: { 
        OR: [
          { email: user.email },
          { contactEmail: user.email }
        ]
      },
      select: { tenantId: true }
    });
    actualTenantId = customer?.tenantId || user.id;
  }
  
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role,
      tenantId: actualTenantId
    },
    secret,
    { expiresIn }
  );
};

// 1. Register new user (INDUSTRY STANDARD: Links to Customer/CRM automatically)
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    const complexity = validatePasswordComplexity(password);
    if (!complexity.ok) {
      return res.status(400).json({ success: false, message: complexity.message });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'This email is already registered.' });
    }

    // Hash password with industry standard complexity (Round 12)
    const hashedPassword = await bcrypt.hash(password, 12);

    const nameParts = name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    const tenantId = `tn_${Math.random().toString(36).substring(2, 11)}`;

    // DATABASE TRANSACTION: Create User and Customer record together
    const result = await prisma.$transaction(async (tx) => {
      // Create Customer (CRM Record)
      const customer = await tx.customer.create({
        data: {
          tenantId,
          name,
          email,
          status: 'active',
          isGuest: false,
          // Assign next customer number
          customerNumber: (await tx.customer.count()) + 101
        }
      });

      // Create User Account
      const user = await tx.user.create({
        data: {
          firstName,
          lastName,
          email,
          passwordHash: hashedPassword,
          role: 'user',
          customerId: customer.id
        }
      });

      // Create initial theme
      await tx.themeSetting.create({ data: { userId: user.id } });

      return { user, customer };
    });

    // Notify admin
    emailService.sendEmail(
      process.env.ADMIN_EMAIL || 'hello@reframevisuals.com',
      `[NEW USER] ${name} Registered`,
      `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p>`
    ).catch((err) => console.error('[Auth] Registration admin email failed:', err?.message || err));

    const customerCode = `CLT${String(result.customer.customerNumber).padStart(3, '0')}`;
    fireSignupNotifications({
      id: result.customer.id,
      name: result.customer.name,
      email: result.customer.email,
      customerCode,
      customerNumber: result.customer.customerNumber,
      source: 'Main signup',
      createdAt: result.customer.createdAt,
    });

    // Generate token
    const token = await generateToken({
      id: result.user.id,
      email: result.user.email,
      role: result.user.role,
    });

    return res.status(201).json({
      success: true,
      message: 'Account deployed successfully',
      data: {
        user: {
          id: result.user.id,
          name: `${result.user.firstName} ${result.user.lastName}`.trim(),
          email: result.user.email,
          role: result.user.role,
          avatarUrl: result.user.avatarUrl || null,
        },
        token,
      },
    });
  } catch (error: any) {
    console.error('Register error:', error);
    return res.status(500).json({ success: false, message: 'Failed to deploy account' });
  }
};

// 2. Login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.active || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = await generateToken(user);
    fireLoginNotifications({
      id: user.customerId || user.id,
      name: `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      role: user.role,
      source: 'Main login',
      ip: req.ip,
      createdAt: new Date(),
    });

    return res.json({
      success: true,
      data: {
        user: { id: user.id, name: `${user.firstName} ${user.lastName}`.trim(), email: user.email, role: user.role, avatarUrl: user.avatarUrl || null },
        token,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Login failed' });
  }
};

// 3. Password Recovery (NEW: Industry Standard Flow)
export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    // Security: Don't reveal if user exists
    if (!user) {
      return res.json({ success: true, message: 'If an account exists with that email, a reset link has been sent.' });
    }

    // Generate a single-use nonce: store hashed version in DB, send raw in the token.
    // This invalidates the token after first use (M1 fix).
    const rawNonce = crypto.randomBytes(32).toString('hex');
    const hashedNonce = crypto.createHash('sha256').update(rawNonce).digest('hex');

    await prisma.user.update({
      where: { id: user.id },
      data: { resetTokenNonce: hashedNonce },
    });

    // Generate 1-hour reset token embedding the raw nonce
    const resetToken = jwt.sign(
      { id: user.id, action: 'reset_password', nonce: rawNonce },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    const role = String(user.role || '').toLowerCase();
    const isAdminUser = ['admin', 'staff', 'manager', 'superadmin'].includes(role);
    const resetPath = isAdminUser ? '/admin/reset-password' : '/reset-password';
    const resetUrl = `${process.env.BASE_URL}${resetPath}?token=${resetToken}`;

    await emailService.sendEmail(
      email,
      'Password Reset Request',
      `
        <h3>Reset your password</h3>
        <p>You requested a password reset. Click the button below to choose a new password. This link expires in 1 hour.</p>
        <a href="${resetUrl}" style="background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Reset Password</a>
        <p>If you did not request this, please ignore this email.</p>
      `
    );

    return res.json({ success: true, message: 'Reset link sent to your email.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to process reset request' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ success: false, message: 'Token and new password required' });

    const complexity = validatePasswordComplexity(newPassword);
    if (!complexity.ok) {
      return res.status(400).json({ success: false, message: complexity.message });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    if (decoded.action !== 'reset_password') throw new Error('Invalid token type');
    if (!decoded.nonce) throw new Error('Token missing nonce — re-request a reset link');

    // Verify the nonce matches what's stored in the DB (single-use check)
    const user = await prisma.user.findUnique({ where: { id: decoded.id }, select: { resetTokenNonce: true } });
    if (!user || !user.resetTokenNonce) throw new Error('Reset token already used or expired');

    const expectedHash = crypto.createHash('sha256').update(decoded.nonce).digest('hex');
    if (user.resetTokenNonce !== expectedHash) throw new Error('Reset token nonce mismatch');

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    // Clear the nonce atomically with the password update to prevent replay
    await prisma.user.update({
      where: { id: decoded.id },
      data: { passwordHash: hashedPassword, resetTokenNonce: null },
    });

    return res.json({ success: true, message: 'Password updated successfully. You can now sign in.' });
  } catch (error) {
    return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Not authenticated' });
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const { passwordHash, ...userWithoutPassword } = user;
    return res.json({ success: true, data: userWithoutPassword });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching profile' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Not authenticated' });
    const { name, avatarUrl } = req.body;
    let updateData: any = {};
    if (name) {
      const parts = name.split(' ');
      updateData.firstName = parts[0] || '';
      updateData.lastName = parts.slice(1).join(' ') || '';
    }
    if (avatarUrl !== undefined) {
      updateData.avatarUrl = avatarUrl || null;
    }
    const user = await prisma.user.update({ where: { id: req.user.id }, data: updateData });
    const { passwordHash, ...safeUser } = user;
    return res.json({ success: true, data: safeUser });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Update failed' });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Not authenticated' });
    const { currentPassword, newPassword } = req.body;

    const complexity = validatePasswordComplexity(newPassword);
    if (!complexity.ok) {
      return res.status(400).json({ success: false, message: complexity.message });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      return res.status(401).json({ success: false, message: 'Current password incorrect' });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.user.id }, data: { passwordHash: hashedPassword } });
    return res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Change failed' });
  }
};
