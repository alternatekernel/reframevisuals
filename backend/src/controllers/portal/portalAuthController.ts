import { Request as _Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../../database';
import { safeError } from '../../utils/errors';
import { clearCustomerPresence } from '../../utils/presence';
import { fireLoginNotifications, fireSignupNotifications } from '../../services/notificationService';

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    const errorMsg = 'FATAL: JWT_SECRET is not defined. Portal authentication disabled for safety.';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
  return secret;
};

const JWT_SECRET = getJwtSecret();
const COOKIE_NAME = 'portal_token';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
// Lazily instantiated so the server still boots if Google OAuth isn't configured.
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;
const generateTenantId = () => `tenant-${randomBytes(6).toString('base64url')}`;

const setPortalCookie = (res: Response, token: string) => {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const portalLogin = async (req: _Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const customer = await prisma.customer.findUnique({
      where: { email },
    });

    if (!customer || !customer.passwordHash) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, customer.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const customerCode = `CLT${String(customer.customerNumber).padStart(3, '0')}`;
    const sessionIp = (req.headers['x-forwarded-for'] as string || '').split(',')[0].trim() || req.ip || '';
    const sessionUa = req.headers['user-agent'] || '';

    // Fire-and-forget: log session activity and update lastIp
    Promise.all([
      prisma.activity.create({
        data: {
          tenantId: customer.tenantId,
          customerId: customer.id,
          type: 'session',
          message: JSON.stringify({ ip: sessionIp, userAgent: sessionUa, action: 'login' }),
          authorName: 'System',
        },
      }),
      prisma.customer.update({
        where: { id: customer.id },
        data: { lastIp: sessionIp || undefined },
      }),
    ]).catch(() => {});

    fireLoginNotifications({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      customerCode,
      customerNumber: customer.customerNumber,
      source: 'Customer portal login',
      ip: req.ip,
      createdAt: new Date(),
    });

    const token = jwt.sign(
      { id: customer.id, email: customer.email, type: 'portal', customerNumber: customer.customerNumber },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      data: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        isGuest: customer.isGuest,
        avatarUrl: customer.avatarUrl,
        onboardingCompleted: customer.onboardingCompleted,
        customerCode,
        token
      }
    });
  } catch (error: any) {
    console.error('[PortalAuth] Error:', error.message);
    return res.status(500).json({ success: false, message: safeError(error) });
  }
};

export const portalRegister = async (req: _Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const existing = await prisma.customer.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Account already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // SQLite doesn't support autoincrement on non-PK fields — compute MAX+1 manually
    const maxResult = await prisma.customer.aggregate({ _max: { customerNumber: true } });
    const nextNumber = (maxResult._max.customerNumber ?? 0) + 1;

    const customer = await prisma.customer.create({
      data: {
        name,
        email,
        passwordHash,
        isGuest: false,
        status: 'active',
        customerNumber: nextNumber,
        tenantId: generateTenantId()
      }
    });

    // Format as CLT042, CLT100, etc.
    const customerCode = `CLT${String(nextNumber).padStart(3, '0')}`;

    fireSignupNotifications({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      customerCode,
      customerNumber: customer.customerNumber,
      source: 'Customer portal signup',
      createdAt: customer.createdAt,
    });

    const token = jwt.sign(
      { id: customer.id, email: customer.email, type: 'portal', customerNumber: customer.customerNumber },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      success: true,
      data: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        avatarUrl: customer.avatarUrl,
        onboardingCompleted: customer.onboardingCompleted,
        customerCode,
        token
      }
    });
  } catch (error: any) {
    console.error('[PortalAuth] Error:', error.message);
    return res.status(500).json({ success: false, message: safeError(error) });
  }
};

export const portalGoogleAuth = async (req: _Request, res: Response) => {
  try {
    if (!googleClient || !GOOGLE_CLIENT_ID) {
      console.error('[PortalAuth] Google sign-in attempted but GOOGLE_CLIENT_ID is not configured.');
      return res.status(503).json({ success: false, message: 'Google sign-in is not available right now.' });
    }

    const { credential } = req.body;
    if (!credential || typeof credential !== 'string') {
      return res.status(400).json({ success: false, message: 'Missing Google credential' });
    }

    // Verify the ID token signature + audience against Google's public keys.
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (verifyErr: any) {
      console.warn('[PortalAuth] Google token verification failed.');
      return res.status(401).json({ success: false, message: 'Invalid Google credential' });
    }

    if (!payload?.sub || !payload.email) {
      return res.status(401).json({ success: false, message: 'Google account is missing required information' });
    }
    if (payload.email_verified === false) {
      return res.status(401).json({ success: false, message: 'Your Google email is not verified' });
    }

    const googleId = payload.sub;
    const email = payload.email.toLowerCase();
    const name = payload.name || email.split('@')[0];

    // Match by Google ID first, then fall back to email so existing password
    // accounts get linked rather than duplicated.
    let customer = await prisma.customer.findFirst({
      where: { OR: [{ googleId }, { email }] },
    });

    let isNewAccount = false;

    if (!customer) {
      isNewAccount = true;
      // SQLite doesn't support autoincrement on non-PK fields — compute MAX+1 manually
      const maxResult = await prisma.customer.aggregate({ _max: { customerNumber: true } });
      const nextNumber = (maxResult._max.customerNumber ?? 0) + 1;

      customer = await prisma.customer.create({
        data: {
          name,
          email,
          googleId,
          avatarUrl: payload.picture || null,
          isGuest: false,
          status: 'active',
          customerNumber: nextNumber,
          tenantId: generateTenantId(),
        },
      });
    } else if (!customer.googleId) {
      // Existing email account (password-based or guest) — link the Google ID.
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: { 
          googleId, 
          isGuest: false,
          ...(!customer.avatarUrl && payload.picture ? { avatarUrl: payload.picture } : {})
        },
      });
    }

    const customerCode = `CLT${String(customer.customerNumber).padStart(3, '0')}`;
    const gOAuthIp = (req.headers['x-forwarded-for'] as string || '').split(',')[0].trim() || req.ip || '';
    const gOAuthUa = req.headers['user-agent'] || '';

    Promise.all([
      prisma.activity.create({
        data: {
          tenantId: customer.tenantId,
          customerId: customer.id,
          type: 'session',
          message: JSON.stringify({ ip: gOAuthIp, userAgent: gOAuthUa, action: isNewAccount ? 'signup' : 'login', provider: 'google' }),
          authorName: 'System',
        },
      }),
      prisma.customer.update({
        where: { id: customer.id },
        data: { lastIp: gOAuthIp || undefined },
      }),
    ]).catch(() => {});

    if (isNewAccount) {
      fireSignupNotifications({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        customerCode,
        customerNumber: customer.customerNumber,
        source: 'Google OAuth signup',
        createdAt: customer.createdAt,
      });
    } else {
      fireLoginNotifications({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        customerCode,
        customerNumber: customer.customerNumber,
        source: 'Google OAuth login',
        ip: req.ip,
        createdAt: new Date(),
      });
    }

    const token = jwt.sign(
      { id: customer.id, email: customer.email, type: 'portal', customerNumber: customer.customerNumber },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    setPortalCookie(res, token);

    return res.status(isNewAccount ? 201 : 200).json({
      success: true,
      data: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        isGuest: customer.isGuest,
        avatarUrl: customer.avatarUrl,
        onboardingCompleted: customer.onboardingCompleted,
        customerCode,
        token,
      },
    });
  } catch (error: any) {
    console.error('[PortalAuth] Google auth error:', error.message);
    return res.status(500).json({ success: false, message: safeError(error) });
  }
};

export const portalLogout = (req: any, res: Response) => {
  clearCustomerPresence(req.customer?.id);
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });
  return res.json({ success: true, message: 'Logged out successfully' });
};

export const getPortalMe = async (req: any, res: Response) => {
  try {
    if (!req.customer?.id || req.customer?.isGuest) {
      return res.json({ success: true, data: null });
    }
    const customer = await prisma.customer.findUnique({
      where: { id: req.customer.id },
      select: {
        id: true,
        name: true,
        email: true,
        isGuest: true,
        status: true,
        customerNumber: true,
        companyName: true,
        avatarUrl: true,
        contactEmail: true,
        contactPhone: true,
        industry: true,
        onboardingCompleted: true,
      }
    });

    if (!customer) {
      return res.json({ success: true, data: null });
    }

    const customerCode = `CLT${String(customer.customerNumber).padStart(3, '0')}`;
    return res.json({ success: true, data: { ...customer, customerCode } });
  } catch (error: any) {
    console.error('[PortalAuth] GetMe error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch profile.' });
  }
};

export const updatePortalProfile = async (req: any, res: Response) => {
  try {
    if (!req.customer?.id || req.customer?.isGuest) {
      return res.status(401).json({ success: false, message: 'Login required' });
    }

    const allowed = ['name', 'companyName', 'contactEmail', 'contactPhone', 'industry', 'avatarUrl', 'onboardingCompleted'] as const;
    const data: Record<string, any> = {};
    allowed.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(req.body || {}, key)) {
        const value = req.body[key];
        if (key === 'onboardingCompleted') {
          data[key] = value === true || value === 'true' || value === 1;
        } else if (key === 'avatarUrl') {
          data[key] = value === null || value === '' ? null : String(value).trim();
        } else {
          data[key] = value === null || value === '' ? null : String(value).trim().slice(0, 180);
        }
      }
    });

    if (req.body?.email) {
      data.email = String(req.body.email).trim().toLowerCase().slice(0, 180);
    }

    const customer = await prisma.customer.update({
      where: { id: req.customer.id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        isGuest: true,
        status: true,
        customerNumber: true,
        companyName: true,
        avatarUrl: true,
        contactEmail: true,
        contactPhone: true,
        industry: true,
        onboardingCompleted: true,
      }
    });

    const customerCode = `CLT${String(customer.customerNumber).padStart(3, '0')}`;
    return res.json({ success: true, data: { ...customer, customerCode } });
  } catch (error: any) {
    console.error('[PortalAuth] Profile update error:', error.message);
    if (error.code === 'P2002') return res.status(409).json({ success: false, message: 'Email already in use' });
    return res.status(400).json({ success: false, message: safeError(error) });
  }
};

export const deletePortalProfile = async (req: any, res: Response) => {
  try {
    if (!req.customer?.id || req.customer?.isGuest) {
      return res.status(401).json({ success: false, message: 'Login required' });
    }

    await prisma.customer.update({
      where: { id: req.customer.id },
      data: {
        name: null,
        companyName: null,
        contactEmail: null,
        contactPhone: null,
        industry: null,
      },
    });

    return res.json({ success: true, message: 'Profile data cleared' });
  } catch (error: any) {
    console.error('[PortalAuth] Profile delete error:', error.message);
    return res.status(400).json({ success: false, message: safeError(error) });
  }
};
