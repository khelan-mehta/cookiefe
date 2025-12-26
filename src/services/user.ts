import api from './api';
import type { User, VetProfile } from './auth';
import type { Distress } from './distress';

export interface UpdateProfileData {
  name?: string;
  phone?: string;
  avatar?: string;
}

export interface UpdateVetProfileData {
  clinicName?: string;
  clinicAddress?: string;
  location?: {
    lat: number;
    lng: number;
  };
  specializations?: string[];
  isAvailable?: boolean;
}

export interface DistressHistory {
  distresses: Distress[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const userService = {
  async getProfile(): Promise<{ user: User; vetProfile?: VetProfile }> {
    const response = await api.get('/user/profile');
    return response.data;
  },

  async updateProfile(data: UpdateProfileData): Promise<{ user: User }> {
    const response = await api.put('/user/profile', data);
    return response.data;
  },

  async updateVetProfile(data: UpdateVetProfileData): Promise<{ vetProfile: VetProfile }> {
    const response = await api.put('/user/vet-profile', data);
    return response.data;
  },

  async getDistressHistory(page = 1, limit = 10): Promise<DistressHistory> {
    const response = await api.get(`/user/history?page=${page}&limit=${limit}`);
    return response.data;
  },

  async toggleVetAvailability(): Promise<{ isAvailable: boolean }> {
    const response = await api.post('/user/toggle-availability');
    return response.data;
  },
};
