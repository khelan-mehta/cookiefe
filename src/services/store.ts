import api from './api';

export interface Product {
  _id: string;
  vetId: {
    _id: string;
    clinicName?: string;
    clinicAddress?: string;
  };
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  category?: string;
  isAvailable: boolean;
  createdAt: string;
}

export interface CreateProductData {
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  category?: string;
  isAvailable?: boolean;
}

export interface PaginatedProducts {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const storeService = {
  async getAllProducts(page = 1, limit = 20): Promise<PaginatedProducts> {
    const response = await api.get(`/store?page=${page}&limit=${limit}`);
    return response.data;
  },

  async searchProducts(query: string, category?: string, page = 1): Promise<PaginatedProducts> {
    const params = new URLSearchParams({ page: String(page) });
    if (query) params.append('q', query);
    if (category) params.append('category', category);
    const response = await api.get(`/store/search?${params}`);
    return response.data;
  },

  async getProductById(id: string): Promise<{ product: Product }> {
    const response = await api.get(`/store/${id}`);
    return response.data;
  },

  async getVetProducts(): Promise<{ products: Product[] }> {
    const response = await api.get('/store/my-products');
    return response.data;
  },

  async createProduct(data: CreateProductData): Promise<{ product: Product }> {
    const response = await api.post('/store', data);
    return response.data;
  },

  async updateProduct(id: string, data: Partial<CreateProductData>): Promise<{ product: Product }> {
    const response = await api.put(`/store/${id}`, data);
    return response.data;
  },

  async deleteProduct(id: string): Promise<void> {
    await api.delete(`/store/${id}`);
  },

  async toggleProductAvailability(id: string): Promise<{ isAvailable: boolean }> {
    const response = await api.post(`/store/${id}/toggle-availability`);
    return response.data;
  },
};
