import api from './api';

interface LocationData {
  coordinates: [number, number];
  updatedAt: string;
}

interface DistressPollResponse {
  success: boolean;
  distress: {
    _id: string;
    status: string;
    responses: unknown[];
    selectedVetId?: {
      _id: string;
      clinicName?: string;
      clinicAddress?: string;
      location?: {
        coordinates: [number, number];
      };
    };
    updatedAt: string;
  };
  locations: {
    user: LocationData | null;
    vet: LocationData | null;
  };
  hasUpdates: boolean;
}

interface NearbyDistressesPollResponse {
  success: boolean;
  distresses: unknown[];
  hasUpdates: boolean;
}

export const locationService = {
  async updateDistressLocation(distressId: string, coordinates: [number, number]): Promise<void> {
    await api.post('/location/update', { distressId, coordinates });
  },

  async updateVetLocation(coordinates: [number, number]): Promise<void> {
    await api.post('/location/vet-update', { coordinates });
  },

  // HTTP Polling methods (replacing WebSocket)
  async pollDistressUpdates(distressId: string, since?: string): Promise<DistressPollResponse> {
    const params = since ? { since } : {};
    const response = await api.get<DistressPollResponse>(`/location/poll/${distressId}`, { params });
    return response.data;
  },

  async pollNearbyDistresses(since?: string): Promise<NearbyDistressesPollResponse> {
    const params = since ? { since } : {};
    const response = await api.get<NearbyDistressesPollResponse>('/location/poll-nearby', { params });
    return response.data;
  },

  getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      });
    });
  },

  watchPosition(
    onSuccess: (position: GeolocationPosition) => void,
    onError: (error: GeolocationPositionError) => void
  ): number {
    return navigator.geolocation.watchPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000,
    });
  },

  clearWatch(watchId: number): void {
    navigator.geolocation.clearWatch(watchId);
  },
};
