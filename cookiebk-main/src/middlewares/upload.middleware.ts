import multer from 'multer';
import { Request } from 'express';
import { ApiError } from './error.middleware';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const storage = multer.memoryStorage();

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'));
  }
};

export const uploadSingle = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
}).single('image');

export const uploadMultiple = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5,
  },
}).array('images', 5);

export const handleMulterError = (
  error: Error,
  _req: Request,
  res: import('express').Response,
  next: import('express').NextFunction
): void => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
      return;
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      res.status(400).json({ message: 'Too many files. Maximum is 5.' });
      return;
    }
    res.status(400).json({ message: error.message });
    return;
  }
  next(error);
};
