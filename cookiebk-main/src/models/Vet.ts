import mongoose, { Schema, Document } from 'mongoose';
import { IVet } from '../types';

export interface VetDocument extends Omit<IVet, '_id'>, Document {}

const vetSchema = new Schema<VetDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    clinicName: {
      type: String,
    },
    clinicAddress: {
      type: String,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
    },
    isAvailable: {
      type: Boolean,
      default: false,
    },
    specializations: {
      type: [String],
      default: [],
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

vetSchema.index({ location: '2dsphere' });
vetSchema.index({ userId: 1 });
vetSchema.index({ isAvailable: 1 });

export const Vet = mongoose.model<VetDocument>('Vet', vetSchema);
