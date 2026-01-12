import { useCallback, useState, useEffect, useMemo, memo } from 'react';
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  DirectionsRenderer,
} from '@react-google-maps/api';
import { GOOGLE_MAPS_API_KEY } from '../../utils/constants';
import { Loader } from '../common/Loader';

interface Location {
  lat: number;
  lng: number;
}

interface LiveMapProps {
  userLocation?: Location;
  vetLocation?: Location;
  showRoute?: boolean;
  onMapClick?: (location: Location) => void;
  className?: string;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 20.5937,
  lng: 78.9629,
};

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
  styles: [
    {
      featureType: 'all',
      elementType: 'geometry',
      stylers: [{ saturation: -20 }]
    },
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }]
    }
  ]
};

// Pre-encoded SVG icons as constants to avoid recreation
const USER_MARKER_SVG = 'data:image/svg+xml,' + encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#FD7979" width="40" height="40">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
  </svg>
`);

const VET_MARKER_SVG = 'data:image/svg+xml,' + encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#10B981" width="40" height="40">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
  </svg>
`);

const LiveMapComponent = ({
  userLocation,
  vetLocation,
  showRoute = false,
  onMapClick,
  className = '',
}: LiveMapProps) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directionsRequested, setDirectionsRequested] = useState(false);

  // Store initial center - only set once on mount to prevent map jumping
  const [initialCenter] = useState<Location>(() => 
    userLocation || vetLocation || defaultCenter
  );

  // Memoize marker icons - only create once when map is loaded
  const userMarkerIcon = useMemo(() => {
    if (!isLoaded || typeof google === 'undefined') return undefined;
    return {
      url: USER_MARKER_SVG,
      scaledSize: new google.maps.Size(40, 40),
    };
  }, [isLoaded]);

  const vetMarkerIcon = useMemo(() => {
    if (!isLoaded || typeof google === 'undefined') return undefined;
    return {
      url: VET_MARKER_SVG,
      scaledSize: new google.maps.Size(40, 40),
    };
  }, [isLoaded]);

  // Memoize direction renderer options - never changes
  const directionsOptions = useMemo(() => ({
    polylineOptions: {
      strokeColor: '#FD7979',
      strokeWeight: 4,
    },
    suppressMarkers: true,
  }), []);

  // Fetch directions with debouncing and request tracking
  useEffect(() => {
    if (!showRoute || !userLocation || !vetLocation || !isLoaded || directionsRequested) {
      return;
    }

    // Debounce directions fetch
    const timeoutId = setTimeout(() => {
      setDirectionsRequested(true);
      
      const directionsService = new google.maps.DirectionsService();
      directionsService.route(
        {
          origin: userLocation,
          destination: vetLocation,
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === 'OK' && result) {
            setDirections(result);
          }
          // Allow new request after 20 seconds
          setTimeout(() => setDirectionsRequested(false), 20000);
        }
      );
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [
    showRoute, 
    userLocation?.lat, 
    userLocation?.lng, 
    vetLocation?.lat, 
    vetLocation?.lng, 
    isLoaded,
    directionsRequested
  ]);

  // Reset directions request flag when route is disabled
  useEffect(() => {
    if (!showRoute) {
      setDirectionsRequested(false);
      setDirections(null);
    }
  }, [showRoute]);

  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (onMapClick && e.latLng) {
        onMapClick({
          lat: e.latLng.lat(),
          lng: e.latLng.lng(),
        });
      }
    },
    [onMapClick]
  );

  const onLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Fit bounds when both locations are available (only when map instance changes)
  useEffect(() => {
    if (map && userLocation && vetLocation) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(userLocation);
      bounds.extend(vetLocation);
      map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
    }
  }, [map]); // Only depend on map instance, not locations

  if (loadError) {
    return (
      <div className={`flex items-center justify-center bg-[#FEEAC9] rounded-xl ${className}`}>
        <div className="text-center p-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-[#FFCDC9] rounded-full flex items-center justify-center">
            <span className="text-[#FD7979] text-2xl font-bold">!</span>
          </div>
          <p className="text-[#5D4E4E] font-medium">Failed to load map</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`flex items-center justify-center bg-[#FEEAC9] rounded-xl ${className}`}>
        <Loader text="Loading map..." />
      </div>
    );
  }

  return (
    <div className={`rounded-xl overflow-hidden border-2 border-[#FFCDC9] ${className}`}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={initialCenter}
        zoom={14}
        options={mapOptions}
        onClick={handleMapClick}
        onLoad={onLoad}
        onUnmount={onUnmount}
      >
        {userLocation && userMarkerIcon && (
          <Marker
            position={userLocation}
            icon={userMarkerIcon}
            title="Your Location"
          />
        )}

        {vetLocation && vetMarkerIcon && (
          <Marker
            position={vetLocation}
            icon={vetMarkerIcon}
            title="Vet Location"
          />
        )}

        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={directionsOptions}
          />
        )}
      </GoogleMap>
    </div>
  );
};

// Helper function to compare locations
const locationsEqual = (
  loc1: Location | undefined, 
  loc2: Location | undefined
): boolean => {
  if (!loc1 && !loc2) return true;
  if (!loc1 || !loc2) return false;
  return loc1.lat === loc2.lat && loc1.lng === loc2.lng;
};

// Wrap with memo and custom comparison to prevent unnecessary re-renders
export const LiveMap = memo(LiveMapComponent, (prevProps, nextProps) => {
  const userLocSame = locationsEqual(prevProps.userLocation, nextProps.userLocation);
  const vetLocSame = locationsEqual(prevProps.vetLocation, nextProps.vetLocation);
  const showRouteSame = prevProps.showRoute === nextProps.showRoute;
  const classNameSame = prevProps.className === nextProps.className;
  const onMapClickSame = prevProps.onMapClick === nextProps.onMapClick;

  // Return true if props are equal (no re-render needed)
  return userLocSame && vetLocSame && showRouteSame && classNameSame && onMapClickSame;
});