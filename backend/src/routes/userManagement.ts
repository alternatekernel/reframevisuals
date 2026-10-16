import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { deleteUser, inviteUser, listUsers, resetUserPassword, toggleUserActive, updateUser } from '../controllers/userManagementController';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/', listUsers);
router.post('/invite', inviteUser);
router.put('/:id', updateUser);
router.patch('/:id/deactivate', toggleUserActive);
router.post('/:id/reset-password', resetUserPassword);
router.delete('/:id', deleteUser);

export default router;
