import { Response, NextFunction } from 'express';
import { Distress } from '../models/Distress';
import { Vet } from '../models/Vet';
import { User } from '../models/User';
import { ApiError } from '../middlewares/error.middleware';
import { AuthRequest } from '../types';
import { socketService } from '../services/socket.service';
import { mapsService } from '../services/maps.service';
import { logger } from '../utils/logger';

const SEARCH_RADIUS_KM = 50;

export const createDistress = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw ApiError.unauthorized();
    }

    const { imageUrl, description, location } = req.body;

    if (!description || description.length < 10) {
      throw ApiError.badRequest('Description must be at least 10 characters');
    }

    if (!location || !location.coordinates) {
      throw ApiError.badRequest('Location is required');
    }

    const activeDistress = await Distress.findOne({
      userId: req.user._id,
      status: { $in: ['pending', 'responded', 'in_progress'] },
    });

    if (activeDistress) {
      throw ApiError.conflict('You already have an active distress call');
    }

    const distress = await Distress.create({
      userId: req.user._id,
      imageUrl,
      description,
      location: {
        type: 'Point',
        coordinates: location.coordinates,
        address: location.address,
      },
      // ✅ Initialize userCurrentLocation for tracking
      userCurrentLocation: {
        type: 'Point',
        coordinates: location.coordinates,
        updatedAt: new Date(),
      },
      status: 'pending',
    });

    const nearbyVets = await Vet.find({
      isAvailable: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: location.coordinates,
          },
          $maxDistance: SEARCH_RADIUS_KM * 1000,
        },
      },
    }).limit(20);

    socketService.notifyNewDistress(
      distress._id.toString(),
      location.coordinates
    );

    logger.info(`Distress created: ${distress._id}, notified ${nearbyVets.length} vets`);

    res.status(201).json({
      success: true,
      distress: {
        id: distress._id,
        status: distress.status,
        createdAt: distress.createdAt,
      },
      nearbyVetsCount: nearbyVets.length,
    });
  } catch (error) {
    next(error);
  }
};

export const getDistress = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw ApiError.unauthorized();
    }

    const { id } = req.params;

    const distress = await Distress.findById(id)
      .populate('userId', 'name phone avatar')
      .populate('responses.vetId', 'clinicName clinicAddress')
      .populate('selectedVetId', 'clinicName clinicAddress location userId');

    if (!distress) {
      throw ApiError.notFound('Distress not found');
    }

    const isOwner = distress.userId._id.toString() === req.user._id.toString();
    const isRespondingVet = distress.responses.some(
      (r) => r.vetId.toString() === req?.user?._id.toString()
    );

    if (!isOwner && !isRespondingVet && req.user.role !== 'vet') {
      throw ApiError.forbidden('Not authorized to view this distress');
    }

    res.json({
      success: true,
      distress,
    });
  } catch (error) {
    next(error);
  }
};

export const getActiveDistress = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw ApiError.unauthorized();
    }

    const distress = await Distress.findOne({
      userId: req.user._id,
      status: { $in: ['pending', 'responded', 'in_progress'] },
    })
      .populate('responses.vetId', 'clinicName clinicAddress')
      .populate('selectedVetId', 'clinicName clinicAddress location userId');

    res.json({
      success: true,
      distress,
    });
  } catch (error) {
    next(error);
  }
};

export const respondToDistress = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'vet') {
      throw ApiError.forbidden('Only vets can respond to distress calls');
    }

    const { id } = req.params;
    const { mode, message } = req.body;

    if (!['vet_coming', 'user_going'].includes(mode)) {
      throw ApiError.badRequest('Invalid response mode');
    }

    const distress = await Distress.findById(id);
    if (!distress) {
      throw ApiError.notFound('Distress not found');
    }

    if (distress.selectedVetId) {
      throw ApiError.conflict('This distress has already been assigned');
    }

    const vetProfile = await Vet.findOne({ userId: req.user._id });
    if (!vetProfile) {
      throw ApiError.notFound('Vet profile not found');
    }

    const alreadyResponded = distress.responses.some(
      (r) => r.vetId.toString() === vetProfile._id.toString()
    );
    if (alreadyResponded) {
      throw ApiError.conflict('You have already responded to this distress');
    }

    let distance: number | undefined;
    let estimatedTime: number | undefined;

    if (vetProfile.location?.coordinates) {
      const vetCoords = {
        lat: vetProfile.location.coordinates[1],
        lng: vetProfile.location.coordinates[0],
      };
      const distressCoords = {
        lat: distress.location.coordinates[1],
        lng: distress.location.coordinates[0],
      };

      const result = await mapsService.getDistance(vetCoords, distressCoords);
      if (result) {
        distance = result.distance;
        estimatedTime = result.duration;
      } else {
        distance = mapsService.calculateHaversineDistance(vetCoords, distressCoords);
        estimatedTime = Math.ceil(distance * 2);
      }
    }

    distress.responses.push({
      vetId: vetProfile._id,
      mode,
      distance,
      estimatedTime,
      message,
      respondedAt: new Date(),
    });

    if (distress.status === 'pending') {
      distress.status = 'responded';
    }

    await distress.save();

    const user = await User.findById(distress.userId);
    if (user) {
      socketService.notifyVetResponse(id, user._id.toString(), {
        vetId: vetProfile._id,
        mode,
        distance,
        estimatedTime,
        clinicName: vetProfile.clinicName,
      });
    }

    res.json({
      success: true,
      message: 'Response submitted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const selectVet = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw ApiError.unauthorized();
    }

    const { id } = req.params;
    const { vetId, mode } = req.body;

    const distress = await Distress.findById(id);
    if (!distress) {
      throw ApiError.notFound('Distress not found');
    }

    if (distress.userId.toString() !== req.user._id.toString()) {
      throw ApiError.forbidden('Only the owner can select a vet');
    }

    if (distress.selectedVetId) {
      throw ApiError.conflict('A vet has already been selected');
    }

    const response = distress.responses.find(
      (r) => r.vetId.toString() === vetId
    );
    if (!response) {
      throw ApiError.notFound('Vet response not found');
    }

    distress.selectedVetId = vetId;
    distress.responseMode = mode || response.mode;
    distress.status = 'in_progress';
    await distress.save();

    const selectedVet = await Vet.findById(vetId);
    const otherVetIds = distress.responses
      .filter((r) => r.vetId.toString() !== vetId)
      .map((r) => r.vetId.toString());

    if (selectedVet) {
      socketService.notifyVetSelected(id, selectedVet.userId.toString(), otherVetIds);
    }

    res.json({
      success: true,
      message: 'Vet selected successfully',
      distress: {
        id: distress._id,
        status: distress.status,
        selectedVetId: distress.selectedVetId,
        responseMode: distress.responseMode,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const resolveDistress = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw ApiError.unauthorized();
    }

    const { id } = req.params;

    const distress = await Distress.findById(id);
    if (!distress) {
      throw ApiError.notFound('Distress not found');
    }

    const isOwner = distress.userId.toString() === req.user._id.toString();
    let isSelectedVet = false;

    if (distress.selectedVetId) {
      const vet = await Vet.findById(distress.selectedVetId);
      isSelectedVet = vet?.userId.toString() === req.user._id.toString();
    }

    if (!isOwner && !isSelectedVet) {
      throw ApiError.forbidden('Not authorized to resolve this distress');
    }

    distress.status = 'resolved';
    distress.resolvedAt = new Date();
    await distress.save();

    socketService.notifyDistressResolved(id);

    res.json({
      success: true,
      message: 'Distress resolved successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const cancelDistress = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw ApiError.unauthorized();
    }

    const { id } = req.params;

    const distress = await Distress.findById(id);
    if (!distress) {
      throw ApiError.notFound('Distress not found');
    }

    if (distress.userId.toString() !== req.user._id.toString()) {
      throw ApiError.forbidden('Only the owner can cancel');
    }

    if (distress.status === 'resolved' || distress.status === 'cancelled') {
      throw ApiError.badRequest('Distress is already resolved or cancelled');
    }

    distress.status = 'cancelled';
    await distress.save();

    res.json({
      success: true,
      message: 'Distress cancelled',
    });
  } catch (error) {
    next(error);
  }
};

export const getNearbyDistresses = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'vet') {
      throw ApiError.forbidden('Only vets can view nearby distresses');
    }

    const vetProfile = await Vet.findOne({ userId: req.user._id });
    if (!vetProfile?.location?.coordinates) {
      throw ApiError.badRequest('Please set your location first');
    }

    const distresses = await Distress.find({
      status: { $in: ['pending', 'responded'] },
      selectedVetId: { $exists: false },
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: vetProfile.location.coordinates,
          },
          $maxDistance: SEARCH_RADIUS_KM * 1000,
        },
      },
    })
      .populate('userId', 'name avatar')
      .limit(20)
      .lean();

    const distressesWithDistance = distresses.map((d) => {
      const distance = mapsService.calculateHaversineDistance(
        {
          lat: vetProfile.location!.coordinates[1],
          lng: vetProfile.location!.coordinates[0],
        },
        {
          lat: d.location.coordinates[1],
          lng: d.location.coordinates[0],
        }
      );
      return { ...d, distance: Math.round(distance * 10) / 10 };
    });

    res.json({
      success: true,
      distresses: distressesWithDistance,
    });
  } catch (error) {
    next(error);
  }
};

export const updateAIAnalysis = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw ApiError.unauthorized();
    }

    const { id } = req.params;
    const { aiAnalysis } = req.body;

    const distress = await Distress.findById(id);
    if (!distress) {
      throw ApiError.notFound('Distress not found');
    }

    if (distress.userId.toString() !== req.user._id.toString()) {
      throw ApiError.forbidden('Not authorized');
    }

    distress.aiAnalysis = aiAnalysis;
    await distress.save();

    res.json({
      success: true,
      aiAnalysis: distress.aiAnalysis,
    });
  } catch (error) {
    next(error);
  }
};
