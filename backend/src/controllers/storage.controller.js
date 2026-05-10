import { getBucket } from '../config/mongodb.js';
import { ApiError } from '../utils/apiError.js';

export const getResume = async (req, res, next) => {
  try {
    const { filename } = req.params;
    const bucket = await getBucket();

    if (!bucket) {
      throw new ApiError(500, 'Storage service unavailable.');
    }

    const files = await bucket.find({ filename }).toArray();
    if (files.length === 0) {
      throw new ApiError(404, 'File not found.');
    }

    const file = files[0];
    res.setHeader('Content-Type', file.contentType || 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${file.filename}"`);

    const downloadStream = bucket.openDownloadStreamByName(filename);
    downloadStream.pipe(res);
  } catch (error) {
    next(error);
  }
};
