import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FiAlertCircle, FiShoppingBag, FiUser, FiMapPin, FiActivity, FiStar, FiHeart } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { Layout } from '../../components/layout/Layout';
import { Card, CardBody } from '../../components/common/Card';
import { Loader } from '../../components/common/Loader';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/user';
import { distressService, type Distress } from '../../services/distress';
import { locationService } from '../../services/location';
import { ROUTES } from '../../utils/constants';
import { formatDistance, formatDateTime } from '../../utils/validators';

export const VetDashboard = () => {
  const { user, vetProfile, updateVetProfile } = useAuth();
  const [nearbyDistresses, setNearbyDistresses] = useState<Distress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTogglingAvailability, setIsTogglingAvailability] = useState(false);
  const [locationStatus, setLocationStatus] = useState<'unknown' | 'updating' | 'updated' | 'error'>('unknown');
  const locationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const updateVetLocation = useCallback(async () => {
    try {
      setLocationStatus('updating');
      const position = await locationService.getCurrentPosition();
      const coordinates: [number, number] = [
        position.coords.longitude,
        position.coords.latitude,
      ];
      await locationService.updateVetLocation(coordinates);
      setLocationStatus('updated');
      console.log('Vet location updated:', coordinates);
    } catch (error) {
      console.error('Failed to update vet location:', error);
      setLocationStatus('error');
    }
  }, []);

  const startLocationHeartbeat = useCallback(() => {
    updateVetLocation();
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
    }
    locationIntervalRef.current = setInterval(updateVetLocation, 30000);
  }, [updateVetLocation]);

  const stopLocationHeartbeat = useCallback(() => {
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (vetProfile?.isAvailable) {
      startLocationHeartbeat();
    }
    return () => stopLocationHeartbeat();
  }, [vetProfile?.isAvailable, startLocationHeartbeat, stopLocationHeartbeat]);

  useEffect(() => {
    loadNearbyDistresses();
  }, []);

  const loadNearbyDistresses = async () => {
    try {
      const data = await distressService.getNearbyDistresses();
      setNearbyDistresses(data.distresses);
    } catch (err) {
      console.error('Failed to load distresses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAvailability = async () => {
    setIsTogglingAvailability(true);
    try {
      const result = await userService.toggleVetAvailability();
      updateVetProfile({
        ...vetProfile!,
        isAvailable: result.isAvailable,
      });

      if (result.isAvailable) {
        startLocationHeartbeat();
        setTimeout(loadNearbyDistresses, 1000);
        toast.success('You are now available to respond');
      } else {
        stopLocationHeartbeat();
        toast.success('You are now unavailable');
      }
    } catch (err) {
      toast.error('Failed to update availability');
      console.error(err);
    } finally {
      setIsTogglingAvailability(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Welcome Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#FFCDC9] rounded-full flex items-center justify-center border-4 border-white shadow-[0_4px_0_#FDACAC]">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                <FiHeart className="h-8 w-8 text-[#FD7979]" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#5D4E4E]">
                Hello, Dr. {user?.name?.split(' ')[0]}!
              </h1>
              <p className="text-[#5D4E4E] opacity-70">
                {vetProfile?.clinicName || 'Set up your clinic profile'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Location Status Indicator */}
            {vetProfile?.isAvailable && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border-2 ${
                locationStatus === 'updated' ? 'bg-[#D1FAE5] text-[#065F46] border-[#A7F3D0]' :
                locationStatus === 'updating' ? 'bg-[#FEEAC9] text-[#5D4E4E] border-[#FFCDC9]' :
                locationStatus === 'error' ? 'bg-red-50 text-[#E05A5A] border-red-200' :
                'bg-[#FEEAC9] text-[#5D4E4E] border-[#FFCDC9]'
              }`}>
                <FiMapPin className="h-3 w-3" />
                {locationStatus === 'updated' ? 'Location synced' :
                 locationStatus === 'updating' ? 'Syncing...' :
                 locationStatus === 'error' ? 'Location error' :
                 'Getting location...'}
              </div>
            )}

            {/* Availability Toggle */}
            <button
              onClick={handleToggleAvailability}
              disabled={isTogglingAvailability}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold transition-all shadow-[0_4px_0] hover:shadow-[0_6px_0] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[0_2px_0] ${
                vetProfile?.isAvailable
                  ? 'bg-[#10B981] text-white shadow-[#059669] hover:shadow-[#059669] active:shadow-[#059669]'
                  : 'bg-[#FFCDC9] text-[#5D4E4E] shadow-[#FDACAC] hover:shadow-[#FDACAC] active:shadow-[#FDACAC]'
              }`}
            >
              <FiActivity className="h-4 w-4" />
              {vetProfile?.isAvailable ? 'Available' : 'Unavailable'}
            </button>
          </div>
        </div>

        {/* Setup Alert */}
        {!vetProfile?.clinicName && (
          <Card className="mb-6 bg-[#FEEAC9] border-[#FFCDC9]">
            <CardBody className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-full">
                <FiAlertCircle className="h-5 w-5 text-[#FD7979]" />
              </div>
              <p className="text-[#5D4E4E]">
                Complete your profile to appear in search results.{' '}
                <Link to={ROUTES.PROFILE} className="underline font-semibold text-[#FD7979]">
                  Set up now
                </Link>
              </p>
            </CardBody>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardBody className="text-center py-5">
              <div className="w-12 h-12 mx-auto mb-3 bg-[#FFCDC9] rounded-full flex items-center justify-center border-2 border-[#FDACAC]">
                <FiAlertCircle className="h-6 w-6 text-[#FD7979]" />
              </div>
              <p className="text-3xl font-bold text-[#FD7979]">
                {nearbyDistresses.length}
              </p>
              <p className="text-sm text-[#5D4E4E] opacity-70">Active Alerts</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center py-5">
              <div className="w-12 h-12 mx-auto mb-3 bg-[#FEEAC9] rounded-full flex items-center justify-center border-2 border-[#FFCDC9]">
                <FiHeart className="h-6 w-6 text-[#FD7979]" />
              </div>
              <p className="text-3xl font-bold text-[#5D4E4E]">
                {vetProfile?.reviewCount || 0}
              </p>
              <p className="text-sm text-[#5D4E4E] opacity-70">Responses</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center py-5">
              <div className="w-12 h-12 mx-auto mb-3 bg-[#FEEAC9] rounded-full flex items-center justify-center border-2 border-[#FFCDC9]">
                <FiStar className="h-6 w-6 text-[#FD7979]" />
              </div>
              <p className="text-3xl font-bold text-[#5D4E4E]">
                {vetProfile?.rating?.toFixed(1) || '-'}
              </p>
              <p className="text-sm text-[#5D4E4E] opacity-70">Rating</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center py-5">
              <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center border-2 ${
                vetProfile?.isAvailable ? 'bg-[#D1FAE5] border-[#A7F3D0]' : 'bg-[#FEEAC9] border-[#FFCDC9]'
              }`}>
                <FiActivity className={`h-6 w-6 ${vetProfile?.isAvailable ? 'text-[#10B981]' : 'text-[#FDACAC]'}`} />
              </div>
              <p className="text-3xl font-bold text-[#5D4E4E]">
                {vetProfile?.isAvailable ? 'Yes' : 'No'}
              </p>
              <p className="text-sm text-[#5D4E4E] opacity-70">Available</p>
            </CardBody>
          </Card>
        </div>

        {/* Nearby Emergencies */}
        <Card className="mb-6">
          <CardBody>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-[#5D4E4E] flex items-center gap-2">
                <FiAlertCircle className="h-5 w-5 text-[#FD7979]" />
                Nearby Emergencies
              </h2>
              <Link
                to={ROUTES.VET_DISTRESS_LIST}
                className="text-[#FD7979] text-sm font-medium hover:underline"
              >
                View all
              </Link>
            </div>

            {isLoading ? (
              <div className="py-8 flex justify-center">
                <Loader />
              </div>
            ) : nearbyDistresses.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-[#FEEAC9] rounded-full flex items-center justify-center border-2 border-[#FFCDC9]">
                  <FiAlertCircle className="h-8 w-8 text-[#FDACAC]" />
                </div>
                <p className="text-[#5D4E4E] opacity-70">No active emergencies nearby</p>
              </div>
            ) : (
              <div className="space-y-3">
                {nearbyDistresses.slice(0, 3).map((distress) => (
                  <Link
                    key={distress._id}
                    to={`${ROUTES.VET_DISTRESS_LIST}?id=${distress._id}`}
                    className="block p-4 bg-[#FFF9F0] rounded-xl hover:bg-[#FEEAC9] transition-colors border-2 border-[#FEEAC9]"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-[#5D4E4E] line-clamp-2 font-medium">
                          {distress.description}
                        </p>
                        <p className="text-sm text-[#5D4E4E] opacity-70 mt-1">
                          {formatDateTime(distress.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        {distress.distance !== undefined && (
                          <span className="px-3 py-1 bg-[#FD7979] text-white rounded-full text-sm font-semibold">
                            {formatDistance(distress.distance)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Link to={ROUTES.VET_STORE}>
            <Card hoverable className="h-full">
              <CardBody className="text-center py-6">
                <div className="w-14 h-14 mx-auto mb-3 bg-[#FEEAC9] rounded-full flex items-center justify-center border-2 border-[#FFCDC9]">
                  <FiShoppingBag className="h-7 w-7 text-[#FD7979]" />
                </div>
                <h3 className="font-bold text-[#5D4E4E]">My Store</h3>
                <p className="text-sm text-[#5D4E4E] opacity-70 mt-1">Manage products</p>
              </CardBody>
            </Card>
          </Link>

          <Link to={ROUTES.PROFILE}>
            <Card hoverable className="h-full">
              <CardBody className="text-center py-6">
                <div className="w-14 h-14 mx-auto mb-3 bg-[#FEEAC9] rounded-full flex items-center justify-center border-2 border-[#FFCDC9]">
                  <FiUser className="h-7 w-7 text-[#FD7979]" />
                </div>
                <h3 className="font-bold text-[#5D4E4E]">Profile</h3>
                <p className="text-sm text-[#5D4E4E] opacity-70 mt-1">Clinic settings</p>
              </CardBody>
            </Card>
          </Link>
        </div>
      </div>
    </Layout>
  );
};
