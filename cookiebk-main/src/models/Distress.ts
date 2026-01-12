import mongoose, { Schema, Document } from 'mongoose';
import { IDistress, IDistressResponse } from '../types';

export interface DistressDocument extends Omit<IDistress, '_id'>, Document {}

const distressResponseSchema = new Schema<IDistressResponse>(
  {
    vetId: {
      type: Schema.Types.ObjectId,
      ref: 'Vet',
      required: true,
    },
    mode: {
      type: String,
      enum: ['vet_coming', 'user_going'],
      required: true,
    },
    estimatedTime: {
      type: Number,
    },
    distance: {
      type: Number,
    },
    message: {
      type: String,
    },
    respondedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const distressSchema = new Schema<DistressDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    imageUrl: {
      type: String,
    },
    description: {
      type: String,
      required: true,
      minlength: 10,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: true,
      },
      address: {
        type: String,
      },
    },
    status: {
      type: String,
      enum: ['pending', 'responded', 'in_progress', 'resolved', 'cancelled'],
      default: 'pending',
    },
    aiAnalysis: {
      severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
      },
      suggestions: [String],
      possibleConditions: [String],
      immediateSteps: [String],
    },
    responses: {
      type: [distressResponseSchema],
      default: [],
    },
    selectedVetId: {
      type: Schema.Types.ObjectId,
      ref: 'Vet',
    },
    responseMode: {
      type: String,
      enum: ['vet_coming', 'user_going'],
    },
    resolvedAt: {
      type: Date,
    },
    // Real-time location tracking (for HTTP polling)
    userCurrentLocation: {
      coordinates: {
        type: [Number],
      },
      updatedAt: {
        type: Date,
      },
    },
    vetCurrentLocation: {
      coordinates: {
        type: [Number],
      },
      updatedAt: {
        type: Date,
      },
    },
    lastPolledAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

distressSchema.index({ location: '2dsphere' });
distressSchema.index({ userId: 1 });
distressSchema.index({ status: 1 });
distressSchema.index({ createdAt: -1 });

export const Distress = mongoose.model<DistressDocument>('Distress', distressSchema);
