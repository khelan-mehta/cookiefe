import { useCallback, useState, useEffect } from 'react';
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

export const LiveMap = ({
  userLocation,
  vetLocation,
  showRoute = false,
  onMapClick,
  className = '',
}: LiveMapProps) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  const [directions, setDirections] =
    useState<google.maps.DirectionsResult | null>(null);

  const center = userLocation || vetLocation || defaultCenter;

  const fetchDirections = useCallback(() => {
    if (!showRoute || !userLocation || !vetLocation || !isLoaded) return;

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
      }
    );
  }, [showRoute, userLocation, vetLocation, isLoaded]);

  useEffect(() => {
    fetchDirections();
  }, [fetchDirections]);

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
        center={center}
        zoom={14}
        options={mapOptions}
        onClick={handleMapClick}
      >
        {userLocation && (
          <Marker
            position={userLocation}
            icon={{
              url: 'data:image/svg+xml,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#FD7979" width="40" height="40">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
              `),
              scaledSize: new google.maps.Size(40, 40),
            }}
            title="Your Location"
          />
        )}

        {vetLocation && (
          <Marker
            position={vetLocation}
            icon={{
              url: 'data:image/svg+xml,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#10B981" width="40" height="40">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
              `),
              scaledSize: new google.maps.Size(40, 40),
            }}
            title="Vet Location"
          />
        )}

        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              polylineOptions: {
                strokeColor: '#FD7979',
                strokeWeight: 4,
              },
              suppressMarkers: true,
            }}
          />
        )}
      </GoogleMap>
    </div>
  );
};
