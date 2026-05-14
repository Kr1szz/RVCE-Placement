import { query } from '../config/db.js';

const normalizeSubscription = (row) => ({
  id: row.id,
  userId: row.user_id,
  endpoint: row.endpoint,
  subscription: row.subscription,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const upsertNotificationSubscription = async ({ userId, subscription }) => {
  const { endpoint, expirationTime = null } = subscription;
  const { rows } = await query(
    `INSERT INTO "notification_subscriptions" (
      "user_id",
      "endpoint",
      "subscription",
      "expiration_time",
      "created_at",
      "updated_at"
    ) VALUES ($1, $2, $3::jsonb, $4, NOW(), NOW())
    ON CONFLICT ("endpoint") DO UPDATE
      SET "user_id" = EXCLUDED."user_id",
          "subscription" = EXCLUDED."subscription",
          "expiration_time" = EXCLUDED."expiration_time",
          "updated_at" = NOW()
    RETURNING *`,
    [userId, endpoint, JSON.stringify(subscription), expirationTime],
  );

  return normalizeSubscription(rows[0]);
};

export const listNotificationSubscriptionsForUsers = async (userIds) => {
  if (!userIds.length) return [];

  const { rows } = await query(
    `SELECT * FROM "notification_subscriptions"
      WHERE "user_id" = ANY($1::int[])
      ORDER BY "updated_at" DESC`,
    [userIds],
  );

  return rows.map(normalizeSubscription);
};

export const deleteNotificationSubscriptionByEndpoint = async (endpoint) => {
  await query('DELETE FROM "notification_subscriptions" WHERE "endpoint" = $1', [
    endpoint,
  ]);
};
