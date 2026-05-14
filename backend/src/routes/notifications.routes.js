import { Router } from 'express';

import { authenticate } from '../middleware/auth.js';
import {
  getNotificationPublicKey,
  registerNotificationSubscription,
} from '../controllers/notifications.controller.js';

const router = Router();

router.get('/public-key', authenticate, getNotificationPublicKey);
router.post('/subscriptions', authenticate, registerNotificationSubscription);

export default router;

