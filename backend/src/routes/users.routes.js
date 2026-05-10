import { Router } from 'express';

import {
  getMyProfile,
  getStudents,
  resumeUploadMiddleware,
  updateMyProfile,
  uploadMyResume,
  verifyStudent,
  requestUnlock,
  approveUnlock
} from '../controllers/users.controller.js';
import { authenticate, requireSpc } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/me', getMyProfile);
router.put('/me', updateMyProfile);
router.post('/me/resume', resumeUploadMiddleware, uploadMyResume);
router.post('/me/unlock-request', requestUnlock);
router.get('/students', requireSpc, getStudents);
router.post('/students/:id/verify', requireSpc, verifyStudent);
router.post('/students/:id/unlock', requireSpc, approveUnlock);

export default router;

