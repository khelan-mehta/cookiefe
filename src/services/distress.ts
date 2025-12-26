import api from './api';

export interface AIAnalysis {
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestions: string[];
  possibleConditions?: string[];
  immediateSteps?: string[];
}

export interface DistressResponse {
  vetId: string;
  mode: 'vet_coming' | 'user_going';
  estimatedTime?: number;
  distance?: number;
  message?: string;
  respondedAt: string;
}

export interface Distress {
  _id: string;
  userId: {
    _id: string;
    name: string;
    phone?: string;
    avatar?: string;
  };
  imageUrl?: string;
  description: string;
  location: {
    type: string;
    coordinates: [number, number];
    address?: string;
  };
  status: 'pending' | 'responded' | 'in_progress' | 'resolved' | 'cancelled';
  aiAnalysis?: AIAnalysis;
  responses: DistressResponse[];
  selectedVetId?: {
    _id: string;
    clinicName?: string;
    clinicAddress?: string;
    location?: {
      type: string;
      coordinates: [number, number];
    };
  };
  responseMode?: 'vet_coming' | 'user_going';
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
  distance?: number;
}

export interface CreateDistressData {
  imageUrl?: string;
  description: string;
  location: {
    coordinates: [number, number];
    address?: string;
  };
}

export const distressService = {
  async createDistress(data: CreateDistressData): Promise<{ distress: { id: string }; nearbyVetsCount: number }> {
    const response = await api.post('/distress/call', data);
    return response.data;
  },

  async getDistress(id: string): Promise<{ distress: Distress }> {
    const response = await api.get(`/distress/${id}`);
    return response.data;
  },

  async getActiveDistress(): Promise<{ distress: Distress | null }> {
    const response = await api.get('/distress/active');
    return response.data;
  },

  async respondToDistress(id: string, mode: 'vet_coming' | 'user_going', message?: string): Promise<void> {
    await api.post(`/distress/${id}/respond`, { mode, message });
  },

  async selectVet(id: string, vetId: string, mode?: string): Promise<{ distress: Distress }> {
    const response = await api.post(`/distress/${id}/select`, { vetId, mode });
    return response.data;
  },

  async resolveDistress(id: string): Promise<void> {
    await api.post(`/distress/${id}/resolve`);
  },

  async cancelDistress(id: string): Promise<void> {
    await api.post(`/distress/${id}/cancel`);
  },

  async getNearbyDistresses(): Promise<{ distresses: Distress[] }> {
    const response = await api.get('/distress/nearby');
    return response.data;
  },

  async updateAIAnalysis(id: string, aiAnalysis: AIAnalysis): Promise<void> {
    await api.put(`/distress/${id}/ai-analysis`, { aiAnalysis });
  },
};
