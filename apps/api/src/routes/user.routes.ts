import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/role.middleware.js';

const router = Router();
const userController = new UserController();

// All routes require authentication
router.use(authenticate);

// Any authenticated user can get their own profile
router.get('/me', userController.getMe);

// Admin-only routes
router.get('/', requireAdmin, userController.getAll);
router.get('/:id', requireAdmin, userController.getById);
router.post('/', requireAdmin, userController.create);
router.put('/:id', requireAdmin, userController.update);
router.delete('/:id', requireAdmin, userController.delete);

export default router;
