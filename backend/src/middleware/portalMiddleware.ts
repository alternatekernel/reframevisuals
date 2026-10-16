import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    const errorMsg = 'FATAL: JWT_SECRET is not defined. Portal middleware disabled.';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
  return secret;
};

// No top-level getJwtSecret() call to avoid race condition with dotenv
const COOKIE_NAME = 'portal_token';

// A guest ID only ever comes from the client as an unsigned header, so its format
// is the only thing separating an anonymous visitor from a registered customer.
// Registered customers have cuid IDs; accepting a loose `[A-Za-z0-9_-]{8,100}`
// pattern here let anyone claim a customer's identity by passing their ID as
// X-Guest-ID, which exposed their chat history. Match only the formats the
// clients actually generate: UUID, `guest_<alnum>`, and the legacy `guest-<alnum>`.
const GUEST_ID_PATTERNS = [
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  /^guest_[a-z0-9]{8,90}$/i,
  /^guest-[a-z0-9-]{8,90}$/i,
];

export const isGuestIdFormat = (value: unknown): value is string =>
  typeof value === 'string' && GUEST_ID_PATTERNS.some((pattern) => pattern.test(value));

export const protectPortal = (req: any, res: Response, next: NextFunction) => {
  let token = req.cookies[COOKIE_NAME];

  // Fallback to Authorization header if cookie is missing
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }

  try {
    const secret = getJwtSecret();
    const decoded: any = jwt.verify(token, secret);
    req.customer = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

export const optionalPortalAuth = (req: any, _res: Response, next: NextFunction) => {
  let token = req.cookies[COOKIE_NAME];

  // Fallback to Authorization header if cookie is missing
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  const guestId = req.headers['x-guest-id'] || req.headers['X-Guest-ID'];

  if (token) {
    try {
      const secret = getJwtSecret();
      const decoded: any = jwt.verify(token, secret);
      req.customer = decoded;
      return next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        // Mark the request so routes can return 401 rather than silently
        // treating an authenticated user as a guest.
        req.portalTokenExpired = true;
      }
      // Continue even if token is invalid, but don't set customer from it
    }
  }

  // Only fall back to guest ID when no (even expired) token was present.
  // An expired token means the user was logged in and needs to re-authenticate.
  if (!req.portalTokenExpired && typeof guestId === 'string' && isGuestIdFormat(guestId)) {
    req.customer = { id: guestId, isGuest: true };
    // Identity came from a client-supplied header, not a signed token. Routes that
    // expose customer-owned data must never widen this beyond guest-owned records.
    req.customerFromGuestHeader = true;
  }

  return next();
};
