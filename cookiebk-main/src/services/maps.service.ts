import { env } from '../config/env';
import { logger } from '../utils/logger';

interface DistanceResult {
  distance: number; // in km
  duration: number; // in minutes
}

interface Coordinates {
  lat: number;
  lng: number;
}

class MapsService {
  private apiKey = env.GOOGLE_MAPS_API_KEY;

  async getDistance(
    origin: Coordinates,
    destination: Coordinates
  ): Promise<DistanceResult | null> {
    try {
      const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json');
      url.searchParams.append('origins', `${origin.lat},${origin.lng}`);
      url.searchParams.append('destinations', `${destination.lat},${destination.lng}`);
      url.searchParams.append('key', this.apiKey);
      url.searchParams.append('units', 'metric');

      const response = await fetch(url.toString());
      const data = await response.json();

      if (data.status !== 'OK' || !data.rows?.[0]?.elements?.[0]) {
        logger.warn('Maps API error:', data.status);
        return null;
      }

      const element = data.rows[0].elements[0];
      if (element.status !== 'OK') {
        return null;
      }

      return {
        distance: element.distance.value / 1000, // meters to km
        duration: Math.ceil(element.duration.value / 60), // seconds to minutes
      };
    } catch (error) {
      logger.error('Maps service error:', error);
      return null;
    }
  }

  async getAddressFromCoords(coords: Coordinates): Promise<string | null> {
    try {
      const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
      url.searchParams.append('latlng', `${coords.lat},${coords.lng}`);
      url.searchParams.append('key', this.apiKey);

      const response = await fetch(url.toString());
      const data = await response.json();

      if (data.status !== 'OK' || !data.results?.[0]) {
        return null;
      }

      return data.results[0].formatted_address;
    } catch (error) {
      logger.error('Geocoding error:', error);
      return null;
    }
  }

  calculateHaversineDistance(
    coord1: Coordinates,
    coord2: Coordinates
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(coord2.lat - coord1.lat);
    const dLng = this.toRad(coord2.lng - coord1.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(coord1.lat)) *
        Math.cos(this.toRad(coord2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

export const mapsService = new MapsService();
