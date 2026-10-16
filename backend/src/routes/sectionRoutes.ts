import { Router } from 'express';
import { getAllSections, getSection, upsertSection, deleteSection } from '../controllers/sectionController';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET routes are public
router.get('/', getAllSections);
router.get('/:sectionId', getSection);

// Modification routes require authentication
router.put('/:sectionId', authenticate, upsertSection);
router.post('/:sectionId', authenticate, upsertSection);
router.delete('/:sectionId', authenticate, deleteSection);

export default router;
