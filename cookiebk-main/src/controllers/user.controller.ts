import { Response, NextFunction } from 'express';
import { User } from '../models/User';
import { Vet } from '../models/Vet';
import { Distress } from '../models/Distress';
import { ApiError } from '../middlewares/error.middleware';
import { AuthRequest } from '../types';

export const getProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw ApiError.unauthorized();
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    let vetProfile = null;
    if (user.role === 'vet') {
      vetProfile = await Vet.findOne({ userId: user._id });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        phone: user.phone,
        createdAt: user.createdAt,
      },
      vetProfile,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw ApiError.unauthorized();
    }

    const { name, phone, avatar } = req.body;

    const updateData: Partial<{ name: string; phone: string; avatar: string }> = {};

    if (name) updateData.name = name;
    if (phone) {
      if (!/^\d{10}$/.test(phone)) {
        throw ApiError.badRequest('Invalid phone number');
      }
      updateData.phone = phone;
    }
    if (avatar) updateData.avatar = avatar;

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateVetProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'vet') {
      throw ApiError.forbidden('Only vets can update vet profile');
    }

    const { clinicName, clinicAddress, location, specializations, isAvailable } =
      req.body;

    const updateData: Record<string, unknown> = {};

    if (clinicName !== undefined) updateData.clinicName = clinicName;
    if (clinicAddress !== undefined) updateData.clinicAddress = clinicAddress;
    if (location) {
      updateData.location = {
        type: 'Point',
        coordinates: [location.lng, location.lat],
      };
    }
    if (specializations !== undefined) updateData.specializations = specializations;
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable;

    const vetProfile = await Vet.findOneAndUpdate(
      { userId: req.user._id },
      updateData,
      { new: true }
    );

    if (!vetProfile) {
      throw ApiError.notFound('Vet profile not found');
    }

    res.json({
      success: true,
      vetProfile,
    });
  } catch (error) {
    next(error);
  }
};

export const getDistressHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw ApiError.unauthorized();
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const distresses = await Distress.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('selectedVetId', 'clinicName')
      .lean();

    const total = await Distress.countDocuments({ userId: req.user._id });

    res.json({
      success: true,
      distresses,
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

export const toggleVetAvailability = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'vet') {
      throw ApiError.forbidden('Only vets can toggle availability');
    }

    const vetProfile = await Vet.findOne({ userId: req.user._id });
    if (!vetProfile) {
      throw ApiError.notFound('Vet profile not found');
    }

    vetProfile.isAvailable = !vetProfile.isAvailable;
    await vetProfile.save();

    res.json({
      success: true,
      isAvailable: vetProfile.isAvailable,
    });
  } catch (error) {
    next(error);
  }
};
