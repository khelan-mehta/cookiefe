import mongoose, { Schema, Document } from 'mongoose';
import { IProduct } from '../types';

export interface ProductDocument extends Omit<IProduct, '_id'>, Document {}

const productSchema = new Schema<ProductDocument>(
  {
    vetId: {
      type: Schema.Types.ObjectId,
      ref: 'Vet',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    imageUrl: {
      type: String,
    },
    category: {
      type: String,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index({ vetId: 1 });
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ isAvailable: 1 });

export const Product = mongoose.model<ProductDocument>('Product', productSchema);
