import { z } from 'zod';

import { upsertNotificationSubscription } from '../repositories/notification.repository.js';
import { getPublicVapidKey } from '../services/notification.service.js';

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export const getNotificationPublicKey = async (_req, res, next) => {
  try {
    res.json(getPublicVapidKey());
  } catch (error) {
    next(error);
  }
};

export const registerNotificationSubscription = async (req, res, next) => {
  try {
    const subscription = subscriptionSchema.parse(req.body.subscription);
    await upsertNotificationSubscription({
      userId: req.auth.userId,
      subscription,
    });

    res.json({ subscribed: true });
  } catch (error) {
    next(error);
  }
};
