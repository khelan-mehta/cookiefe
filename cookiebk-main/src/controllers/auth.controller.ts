import { Request, Response, NextFunction } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../models/User';
import { Vet } from '../models/Vet';
import { generateToken } from '../utils/jwt';
import { env } from '../config/env';
import { ApiError } from '../middlewares/error.middleware';
import { AuthRequest } from '../types';
import { logger } from '../utils/logger';

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export const googleAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      throw ApiError.badRequest('Google ID token is required');
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw ApiError.badRequest('Invalid Google token');
    }

    const { sub: googleId, email, name, picture } = payload;

    let user = await User.findOne({ googleId });

    if (user) {
      const token = generateToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      res.json({
        success: true,
        registered: true,
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          role: user.role,
          phone: user.phone,
        },
      });
      return;
    }

    res.json({
      success: true,
      registered: false,
      tempData: {
        googleId,
        email,
        name,
        avatar: picture,
      },
    });
  } catch (error) {
    logger.error('Google auth error:', error);
    next(error);
  }
};

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { googleId, email, name, avatar, phone, role } = req.body;

    if (!googleId || !email || !name || !phone || !role) {
      throw ApiError.badRequest('All fields are required');
    }

    if (!['user', 'vet'].includes(role)) {
      throw ApiError.badRequest('Invalid role');
    }

    if (!/^\d{10}$/.test(phone)) {
      throw ApiError.badRequest('Invalid phone number. Must be 10 digits.');
    }

    const existingUser = await User.findOne({ $or: [{ googleId }, { email }] });
    if (existingUser) {
      throw ApiError.conflict('User already exists');
    }

    const user = await User.create({
      googleId,
      email,
      name,
      avatar,
      phone,
      role,
    });

    if (role === 'vet') {
      await Vet.create({
        userId: user._id,
        isAvailable: false,
      });
    }

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    res.status(201).json({
      success: true,
      token,
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

export const getMe = async (
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
      },
      vetProfile,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  _req: AuthRequest,
  res: Response
): Promise<void> => {
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
};
