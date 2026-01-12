import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface IChatHistory {
  userId: mongoose.Types.ObjectId;
  distressId?: mongoose.Types.ObjectId;
  messages: IChatMessage[];
  query: string;
  animalType?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  contactNumber?: string;
  resolved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatHistoryDocument extends Omit<IChatHistory, '_id'>, Document {}

const chatMessageSchema = new Schema<IChatMessage>(
  {
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const chatHistorySchema = new Schema<ChatHistoryDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    distressId: {
      type: Schema.Types.ObjectId,
      ref: 'Distress',
    },
    messages: {
      type: [chatMessageSchema],
      default: [],
    },
    query: {
      type: String,
      required: true,
    },
    animalType: {
      type: String,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
    },
    contactNumber: {
      type: String,
    },
    resolved: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for finding similar queries
chatHistorySchema.index({ query: 'text' });
chatHistorySchema.index({ userId: 1, createdAt: -1 });
chatHistorySchema.index({ severity: 1 });

export const ChatHistory = mongoose.model<ChatHistoryDocument>('ChatHistory', chatHistorySchema);
