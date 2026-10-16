import { Router } from 'express';
import {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  requestPasswordReset,
  resetPassword
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { prisma } from '../database';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.post('/change-password', authenticate, changePassword);

// List active staff users (for assignee dropdowns)
router.get('/users', authenticate, async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { active: true },
      select: { id: true, firstName: true, lastName: true, email: true, role: true, avatarUrl: true },
      orderBy: { firstName: 'asc' },
    });
    return res.json({ users });
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'USERS_ERROR', message: error.message } });
  }
});

export default router;
