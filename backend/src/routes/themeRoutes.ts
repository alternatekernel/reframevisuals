import { Router } from 'express';
import { getTheme, updateTheme, resetTheme } from '../controllers/themeController';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET is public (for public site theme loading)
router.get('/', getTheme);

// PUT, POST, DELETE require authentication
router.use(authenticate);
router.put('/', updateTheme);
router.post('/', updateTheme);
router.delete('/', resetTheme);

export default router;
