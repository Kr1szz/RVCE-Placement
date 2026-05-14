import { google } from 'googleapis';

import { env } from './env.js';

const auth = new google.auth.JWT({
  email: env.googleServiceAccount.clientEmail,
  key: env.googleServiceAccount.privateKey,
  scopes: ['https://www.googleapis.com/auth/drive'],
});

export const driveClient = google.drive({ version: 'v3', auth });

export const isDriveConfigured = Boolean(
  env.googleDriveFolderId &&
    env.googleServiceAccount.clientEmail &&
    env.googleServiceAccount.privateKey,
);
