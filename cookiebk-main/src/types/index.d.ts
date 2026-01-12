import { Request } from 'express';
import { Types } from 'mongoose';

export interface IUser {
  _id: Types.ObjectId;
  googleId: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  role: 'user' | 'vet';
  createdAt: Date;
  updatedAt: Date;
}

export interface IVet {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  clinicName?: string;
  clinicAddress?: string;
  location?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  isAvailable: boolean;
  specializations?: string[];
  rating?: number;
  reviewCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDistress {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  imageUrl?: string;
  description: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
    address?: string;
  };
  status: 'pending' | 'responded' | 'in_progress' | 'resolved' | 'cancelled';
  aiAnalysis?: {
    severity: 'low' | 'medium' | 'high' | 'critical';
    suggestions: string[];
    possibleConditions?: string[];
    immediateSteps?: string[];
  };
  responses: IDistressResponse[];
  selectedVetId?: Types.ObjectId;
  responseMode?: 'vet_coming' | 'user_going';
  resolvedAt?: Date;
  // Real-time location tracking (for HTTP polling)
  userCurrentLocation?: {
    coordinates: [number, number];
    updatedAt: Date;
  };
  vetCurrentLocation?: {
    coordinates: [number, number];
    updatedAt: Date;
  };
  lastPolledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDistressResponse {
  vetId: Types.ObjectId;
  mode: 'vet_coming' | 'user_going';
  estimatedTime?: number; // in minutes
  distance?: number; // in km
  message?: string;
  respondedAt: Date;
}

export interface IProduct {
  _id: Types.ObjectId;
  vetId: Types.ObjectId;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  category?: string;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthRequest extends Request {
  user?: IUser;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export interface LocationUpdate {
  distressId: string;
  userId: string;
  coordinates: [number, number];
  timestamp: Date;
}

export interface AIAnalysisRequest {
  imageUrl?: string;
  description: string;
}

export interface AIAnalysisResponse {
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestions: string[];
  possibleConditions: string[];
  immediateSteps: string[];
  disclaimer: string;
}
