import { Request, Response, NextFunction } from 'express';
import { Product } from '../models/Product';
import { Vet } from '../models/Vet';
import { ApiError } from '../middlewares/error.middleware';
import { AuthRequest } from '../types';
import { s3Service } from '../services/s3.service';

export const getAllProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const products = await Product.find({ isAvailable: true })
      .populate('vetId', 'clinicName clinicAddress')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Product.countDocuments({ isAvailable: true });

    res.json({
      success: true,
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const searchProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { q, category } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { isAvailable: true };

    if (q) {
      query.$text = { $search: q as string };
    }

    if (category) {
      query.category = category;
    }

    const products = await Product.find(query)
      .populate('vetId', 'clinicName clinicAddress')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id)
      .populate('vetId', 'clinicName clinicAddress userId')
      .lean();

    if (!product) {
      throw ApiError.notFound('Product not found');
    }

    res.json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
};

export const getVetProducts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'vet') {
      throw ApiError.forbidden('Only vets can access their products');
    }

    const vetProfile = await Vet.findOne({ userId: req.user._id });
    if (!vetProfile) {
      throw ApiError.notFound('Vet profile not found');
    }

    const products = await Product.find({ vetId: vetProfile._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      products,
    });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'vet') {
      throw ApiError.forbidden('Only vets can create products');
    }

    const vetProfile = await Vet.findOne({ userId: req.user._id });
    if (!vetProfile) {
      throw ApiError.notFound('Vet profile not found');
    }

    const { name, description, price, category, imageUrl, isAvailable } = req.body;

    if (!name || price === undefined) {
      throw ApiError.badRequest('Name and price are required');
    }

    if (price < 0) {
      throw ApiError.badRequest('Price must be non-negative');
    }

    const product = await Product.create({
      vetId: vetProfile._id,
      name,
      description,
      price,
      category,
      imageUrl,
      isAvailable: isAvailable !== false,
    });

    res.status(201).json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'vet') {
      throw ApiError.forbidden('Only vets can update products');
    }

    const { id } = req.params;
    const { name, description, price, category, imageUrl, isAvailable } = req.body;

    const vetProfile = await Vet.findOne({ userId: req.user._id });
    if (!vetProfile) {
      throw ApiError.notFound('Vet profile not found');
    }

    const product = await Product.findById(id);
    if (!product) {
      throw ApiError.notFound('Product not found');
    }

    if (product.vetId.toString() !== vetProfile._id.toString()) {
      throw ApiError.forbidden('You can only update your own products');
    }

    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) {
      if (price < 0) {
        throw ApiError.badRequest('Price must be non-negative');
      }
      product.price = price;
    }
    if (category !== undefined) product.category = category;
    if (imageUrl !== undefined) product.imageUrl = imageUrl;
    if (isAvailable !== undefined) product.isAvailable = isAvailable;

    await product.save();

    res.json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'vet') {
      throw ApiError.forbidden('Only vets can delete products');
    }

    const { id } = req.params;

    const vetProfile = await Vet.findOne({ userId: req.user._id });
    if (!vetProfile) {
      throw ApiError.notFound('Vet profile not found');
    }

    const product = await Product.findById(id);
    if (!product) {
      throw ApiError.notFound('Product not found');
    }

    if (product.vetId.toString() !== vetProfile._id.toString()) {
      throw ApiError.forbidden('You can only delete your own products');
    }

    if (product.imageUrl) {
      await s3Service.deleteFile(product.imageUrl);
    }

    await product.deleteOne();

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const toggleProductAvailability = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'vet') {
      throw ApiError.forbidden('Only vets can update product availability');
    }

    const { id } = req.params;

    const vetProfile = await Vet.findOne({ userId: req.user._id });
    if (!vetProfile) {
      throw ApiError.notFound('Vet profile not found');
    }

    const product = await Product.findById(id);
    if (!product) {
      throw ApiError.notFound('Product not found');
    }

    if (product.vetId.toString() !== vetProfile._id.toString()) {
      throw ApiError.forbidden('You can only update your own products');
    }

    product.isAvailable = !product.isAvailable;
    await product.save();

    res.json({
      success: true,
      isAvailable: product.isAvailable,
    });
  } catch (error) {
    next(error);
  }
};
