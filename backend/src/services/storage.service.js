import fs from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';

import { env } from '../config/env.js';
import { getBucket } from '../config/mongodb.js';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

const inferFileExtension = (fileName) => {
  const extension = path.extname(fileName ?? '').toLowerCase();

  if (!extension || extension.length > 12) {
    return '.pdf';
  }

  return extension;
};

const buildResumeFileName = ({ userName, userId, fileName }) => {
  const extension = inferFileExtension(fileName);
  
  if (!userName) return `User_${userId}_Resume${extension}`;

  const cleanName = userName
    .split(/[^a-zA-Z0-9]/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('_');

  return `${cleanName}_Resume${extension}`;
};

export const uploadResume = async ({
  buffer,
  fileName,
  mimeType,
  existingUrl,
  userId,
  userName,
}) => {
  const resumeName = buildResumeFileName({ userName, userId, fileName });

  // 1. Try MongoDB GridFS
  try {
    const bucket = await getBucket();
    if (bucket) {
      // Delete existing file if any
      const existingFiles = await bucket.find({ filename: resumeName }).toArray();
      for (const file of existingFiles) {
        await bucket.delete(file._id);
      }

      // Upload new file
      const uploadStream = bucket.openUploadStream(resumeName, {
        contentType: mimeType,
        metadata: { userId },
      });

      const readableStream = new Readable();
      readableStream.push(buffer);
      readableStream.push(null);

      await new Promise((resolve, reject) => {
        readableStream.pipe(uploadStream)
          .on('error', reject)
          .on('finish', resolve);
      });

      return `http://localhost:${env.port}/api/resumes/${resumeName}`;
    }
  } catch (error) {
    console.error('MongoDB GridFS upload failed, falling back to local:', error);
  }

  // 2. Fallback to Local Storage
  try {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create uploads directory:', error);
  }

  const filePath = path.join(UPLOADS_DIR, resumeName);
  
  if (existingUrl && existingUrl.includes('/uploads/')) {
    try {
      const oldFileName = existingUrl.split('/').pop();
      if (oldFileName && oldFileName !== resumeName) {
        const oldFilePath = path.join(UPLOADS_DIR, oldFileName);
        await fs.unlink(oldFilePath);
      }
    } catch (error) {
      // Ignore if file doesn't exist
    }
  }

  await fs.writeFile(filePath, buffer);

  return `http://localhost:${env.port}/uploads/${resumeName}`;
};
