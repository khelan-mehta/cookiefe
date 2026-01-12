import { Response, NextFunction } from 'express';
import { s3Service } from '../services/s3.service';
import { ApiError } from '../middlewares/error.middleware';
import { AuthRequest } from '../types';

export const uploadDistressImage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw ApiError.unauthorized();
    }

    if (!req.file) {
      throw ApiError.badRequest('No image file provided');
    }

    const imageUrl = await s3Service.uploadFile(
      req.file.buffer,
      'DISTRESS_IMAGES',
      req.file.mimetype
    );

    res.json({
      success: true,
      imageUrl,
    });
  } catch (error) {
    next(error);
  }
};

export const uploadProductImage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'vet') {
      throw ApiError.forbidden('Only vets can upload product images');
    }

    if (!req.file) {
      throw ApiError.badRequest('No image file provided');
    }

    const imageUrl = await s3Service.uploadFile(
      req.file.buffer,
      'PRODUCT_IMAGES',
      req.file.mimetype
    );

    res.json({
      success: true,
      imageUrl,
    });
  } catch (error) {
    next(error);
  }
};

export const getSignedUploadUrl = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw ApiError.unauthorized();
    }

    const { folder, fileName, mimeType } = req.body;

    if (!folder || !fileName || !mimeType) {
      throw ApiError.badRequest('folder, fileName, and mimeType are required');
    }

    const validFolders = ['DISTRESS_IMAGES', 'PRODUCT_IMAGES'] as const;
    if (!validFolders.includes(folder as typeof validFolders[number])) {
      throw ApiError.badRequest('Invalid folder');
    }

    if (folder === 'PRODUCT_IMAGES' && req.user.role !== 'vet') {
      throw ApiError.forbidden('Only vets can upload product images');
    }

    const result = await s3Service.getSignedUploadUrl(
      folder as 'DISTRESS_IMAGES' | 'PRODUCT_IMAGES',
      fileName,
      mimeType
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};
