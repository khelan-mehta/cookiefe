import { Response, NextFunction } from 'express';
import { ApiError } from '../middlewares/error.middleware';
import { AuthRequest } from '../types';
import { Distress } from '../models/Distress';
import { Vet } from '../models/Vet';

export const updateLocation = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw ApiError.unauthorized();
    }

    const { distressId, coordinates } = req.body;

    if (!distressId || !coordinates || coordinates.length !== 2) {
      throw ApiError.badRequest('distressId and coordinates are required');
    }

    const distress = await Distress.findById(distressId);
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
      throw ApiError.forbidden('Not authorized to update location for this distress');
    }

    // Save location to database for HTTP polling
    const now = new Date();
    if (isOwner) {
      await Distress.findByIdAndUpdate(distressId, {
        userCurrentLocation: {
          coordinates,
          updatedAt: now,
        },
      });
    } else if (isSelectedVet) {
      await Distress.findByIdAndUpdate(distressId, {
        vetCurrentLocation: {
          coordinates,
          updatedAt: now,
        },
      });
    }

    res.json({
      success: true,
      message: 'Location updated',
    });
  } catch (error) {
    next(error);
  }
};

export const updateVetLocation = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'vet') {
      throw ApiError.forbidden('Only vets can update their location');
    }

    const { coordinates } = req.body;

    if (!coordinates || coordinates.length !== 2) {
      throw ApiError.badRequest('coordinates are required');
    }

    const vetProfile = await Vet.findOneAndUpdate(
      { userId: req.user._id },
      {
        location: {
          type: 'Point',
          coordinates,
        },
      },
      { new: true }
    );

    if (!vetProfile) {
      throw ApiError.notFound('Vet profile not found');
    }

    res.json({
      success: true,
      message: 'Location updated',
      location: vetProfile.location,
    });
  } catch (error) {
    next(error);
  }
};

// HTTP Polling endpoint - get distress updates including locations
export const pollDistressUpdates = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw ApiError.unauthorized();
    }

    const { distressId } = req.params;
    const { since } = req.query; // Optional timestamp to get updates since

    const distress = await Distress.findById(distressId)
      .populate('userId', 'name phone')
      .populate('selectedVetId', 'clinicName clinicAddress location')
      .populate('responses.vetId', 'clinicName clinicAddress');

    if (!distress) {
      throw ApiError.notFound('Distress not found');
    }

    // Check authorization - user must be owner or a responding vet
    const isOwner = distress.userId._id.toString() === req.user._id.toString();
    let isRespondingVet = false;

    if (req.user.role === 'vet') {
      const vet = await Vet.findOne({ userId: req.user._id });
      if (vet) {
        isRespondingVet = distress.responses.some(
          (r) => r.vetId.toString() === vet._id.toString()
        ) || distress.selectedVetId?._id.toString() === vet._id.toString();
      }
    }

    if (!isOwner && !isRespondingVet) {
      throw ApiError.forbidden('Not authorized to view this distress');
    }

    // Update last polled timestamp
    await Distress.findByIdAndUpdate(distressId, { lastPolledAt: new Date() });

    // Build response with location data
    const response: {
      success: boolean;
      distress: typeof distress;
      locations: {
        user: { coordinates: [number, number]; updatedAt: Date } | null;
        vet: { coordinates: [number, number]; updatedAt: Date } | null;
      };
      hasUpdates: boolean;
    } = {
      success: true,
      distress,
      locations: {
        user: distress.userCurrentLocation?.coordinates
          ? {
              coordinates: distress.userCurrentLocation.coordinates as [number, number],
              updatedAt: distress.userCurrentLocation.updatedAt!,
            }
          : null,
        vet: distress.vetCurrentLocation?.coordinates
          ? {
              coordinates: distress.vetCurrentLocation.coordinates as [number, number],
              updatedAt: distress.vetCurrentLocation.updatedAt!,
            }
          : null,
      },
      hasUpdates: true,
    };

    // Check if there are updates since the provided timestamp
    if (since) {
      const sinceDate = new Date(since as string);
      const hasLocationUpdates =
        (distress.userCurrentLocation?.updatedAt &&
          distress.userCurrentLocation.updatedAt > sinceDate) ||
        (distress.vetCurrentLocation?.updatedAt &&
          distress.vetCurrentLocation.updatedAt > sinceDate);
      const hasDistressUpdates = distress.updatedAt > sinceDate;
      response.hasUpdates = hasLocationUpdates || hasDistressUpdates;
    }

    res.json(response);
  } catch (error) {
    next(error);
  }
};

// HTTP Polling endpoint for vets - get nearby distresses
export const pollNearbyDistresses = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'vet') {
      throw ApiError.forbidden('Only vets can access this endpoint');
    }

    const { since } = req.query;

    const vetProfile = await Vet.findOne({ userId: req.user._id });
    if (!vetProfile || !vetProfile.location?.coordinates) {
      throw ApiError.badRequest('Vet location not set');
    }

    const maxDistance = 50000; // 50km radius

    const query: {
      status: { $in: string[] };
      location: {
        $near: {
          $geometry: { type: string; coordinates: number[] };
          $maxDistance: number;
        };
      };
      createdAt?: { $gt: Date };
    } = {
      status: { $in: ['pending', 'responded'] },
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: vetProfile.location.coordinates,
          },
          $maxDistance: maxDistance,
        },
      },
    };

    // Only get distresses created/updated since last poll
    if (since) {
      query.createdAt = { $gt: new Date(since as string) };
    }

    const distresses = await Distress.find(query)
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      distresses,
      hasUpdates: distresses.length > 0,
    });
  } catch (error) {
    next(error);
  }
};
