import { useState, useEffect, useCallback } from 'react';
import { locationService } from '../services/location';

interface LocationState {
  coordinates: [number, number] | null;
  address: string | null;
  error: string | null;
  isLoading: boolean;
}

export const useLocation = (watch = false) => {
  const [state, setState] = useState<LocationState>({
    coordinates: null,
    address: null,
    error: null,
    isLoading: true,
  });

  const getLocation = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const position = await locationService.getCurrentPosition();
      const coords: [number, number] = [
        position.coords.longitude,
        position.coords.latitude,
      ];
      setState({
        coordinates: coords,
        address: null,
        error: null,
        isLoading: false,
      });
      return coords;
    } catch (err) {
      const errorMessage =
        err instanceof GeolocationPositionError
          ? getGeolocationErrorMessage(err)
          : 'Failed to get location';
      setState({
        coordinates: null,
        address: null,
        error: errorMessage,
        isLoading: false,
      });
      return null;
    }
  }, []);

  useEffect(() => {
    getLocation();
  }, [getLocation]);

  useEffect(() => {
    if (!watch) return;

    const watchId = locationService.watchPosition(
      (position) => {
        setState((prev) => ({
          ...prev,
          coordinates: [position.coords.longitude, position.coords.latitude],
          error: null,
        }));
      },
      (err) => {
        setState((prev) => ({
          ...prev,
          error: getGeolocationErrorMessage(err),
        }));
      }
    );

    return () => {
      locationService.clearWatch(watchId);
    };
  }, [watch]);

  return {
    ...state,
    refresh: getLocation,
  };
};

function getGeolocationErrorMessage(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'Location permission denied. Please enable location access.';
    case error.POSITION_UNAVAILABLE:
      return 'Location unavailable. Please try again.';
    case error.TIMEOUT:
      return 'Location request timed out. Please try again.';
    default:
      return 'Failed to get location.';
  }
}
