import { useEffect, useRef, useCallback, useState } from 'react';
import api from '../services/api';

interface LocationData {
  coordinates: [number, number];
  updatedAt: string;
}

interface DistressUpdate {
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
  userCurrentLocation?: LocationData;
  vetCurrentLocation?: LocationData;
  updatedAt: string;
}

interface PollResponse {
  success: boolean;
  distress: DistressUpdate;
  locations: {
    user: LocationData | null;
    vet: LocationData | null;
  };
  hasUpdates: boolean;
}

interface NearbyDistressesResponse {
  success: boolean;
  distresses: unknown[];
  hasUpdates: boolean;
}

interface UsePollingOptions {
  distressId?: string;
  pollingInterval?: number; // in milliseconds, default 3000 (3 seconds)
  onLocationUpdate?: (data: { coordinates: [number, number]; userId?: string }) => void;
  onVetResponse?: (data: { distressId: string; response: unknown }) => void;
  onDistressUpdated?: (data: { distressId: string; distress: DistressUpdate }) => void;
  onResponseAccepted?: (data: { distressId: string }) => void;
  onResponseDeclined?: (data: { distressId: string }) => void;
  onDistressResolved?: (data: { distressId: string }) => void;
  onNewDistress?: (data: { distresses: unknown[] }) => void;
  enabled?: boolean;
}

export const usePolling = (options: UsePollingOptions = {}) => {
  const {
    distressId,
    pollingInterval = 3000,
    onLocationUpdate,
    onDistressUpdated,
    onDistressResolved,
    onNewDistress,
    enabled = true,
  } = options;

  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastPollTimeRef = useRef<string | null>(null);
  const previousStatusRef = useRef<string | null>(null);
  const previousResponseCountRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isStoppedRef = useRef(false);

  // Function to stop polling
  const stopPolling = useCallback(() => {
    isStoppedRef.current = true;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  // Poll for distress updates (for users tracking an emergency)
  const pollDistressUpdates = useCallback(async () => {
    if (!distressId || isStoppedRef.current) return;

    try {
      const params = lastPollTimeRef.current
        ? { since: lastPollTimeRef.current }
        : {};

      const response = await api.get<PollResponse>(
        `/location/poll/${distressId}`,
        { params }
      );

      // Check if polling was stopped during the request
      if (isStoppedRef.current) return;

      const { distress, locations, hasUpdates } = response.data;

      // Update last poll time
      lastPollTimeRef.current = new Date().toISOString();

      if (hasUpdates) {
        // Check for location updates
        if (locations.vet && onLocationUpdate) {
          onLocationUpdate({
            coordinates: locations.vet.coordinates,
          });
        }

        // Check for status changes
        if (previousStatusRef.current !== distress.status) {
          if ((distress.status === 'resolved' || distress.status === 'cancelled') && onDistressResolved) {
            // Stop polling immediately when resolved or cancelled
            stopPolling();
            onDistressResolved({ distressId });
            return;
          }
          previousStatusRef.current = distress.status;
        }

        // Check for new responses
        if (distress.responses.length !== previousResponseCountRef.current) {
          previousResponseCountRef.current = distress.responses.length;
        }

        // Notify of general distress updates
        if (onDistressUpdated) {
          onDistressUpdated({ distressId, distress });
        }
      }

      setError(null);
    } catch (err) {
      console.error('Polling error:', err);
      setError('Failed to fetch updates');
    }
  }, [distressId, onLocationUpdate, onDistressUpdated, onDistressResolved, stopPolling]);

  // Poll for nearby distresses (for vets)
  const pollNearbyDistresses = useCallback(async () => {
    if (isStoppedRef.current) return;

    try {
      const params = lastPollTimeRef.current
        ? { since: lastPollTimeRef.current }
        : {};

      const response = await api.get<NearbyDistressesResponse>(
        '/location/poll-nearby',
        { params }
      );

      // Check if polling was stopped during the request
      if (isStoppedRef.current) return;

      const { distresses, hasUpdates } = response.data;

      lastPollTimeRef.current = new Date().toISOString();

      if (hasUpdates && onNewDistress) {
        onNewDistress({ distresses });
      }

      setError(null);
    } catch (err) {
      console.error('Polling error:', err);
      setError('Failed to fetch nearby distresses');
    }
  }, [onNewDistress]);

  // Start polling
  useEffect(() => {
    // Reset the stopped flag when starting fresh
    isStoppedRef.current = false;

    if (!enabled) {
      stopPolling();
      return;
    }

    // Determine which polling function to use
    const pollFn = distressId ? pollDistressUpdates : onNewDistress ? pollNearbyDistresses : null;

    if (!pollFn) return;

    // Initial poll
    pollFn();
    setIsPolling(true);

    // Set up interval
    intervalRef.current = setInterval(pollFn, pollingInterval);

    return () => {
      stopPolling();
    };
  }, [enabled, distressId, pollingInterval, pollDistressUpdates, pollNearbyDistresses, onNewDistress, stopPolling]);

  // Update location via HTTP POST
  const updateLocation = useCallback(
    async (data: { distressId: string; coordinates: [number, number] }) => {
      try {
        await api.post('/location/update', {
          distressId: data.distressId,
          coordinates: data.coordinates,
        });
      } catch (err) {
        console.error('Failed to update location:', err);
      }
    },
    []
  );

  // Manually trigger a poll
  const refresh = useCallback(() => {
    if (distressId) {
      pollDistressUpdates();
    } else if (onNewDistress) {
      pollNearbyDistresses();
    }
  }, [distressId, pollDistressUpdates, pollNearbyDistresses, onNewDistress]);

  return {
    isPolling,
    error,
    updateLocation,
    refresh,
    stopPolling,
  };
};
