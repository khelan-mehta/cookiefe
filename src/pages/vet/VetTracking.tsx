import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { FiCheck, FiX, FiPhone, FiMapPin, FiNavigation, FiArrowLeft, FiAlertCircle } from "react-icons/fi";
import { Layout } from "../../components/layout/Layout";
import { Card, CardBody } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Loader } from "../../components/common/Loader";
import { LiveMap } from "../../components/map/LiveMap";
import { AIGuidancePanel } from "../../components/distress/AIGuidancePanel";
import { AIChatbot, AIFloatingButton } from "../../components/distress/AIChatbot";
import { ConfirmModal } from "../../components/common/Modal";
import { usePolling } from "../../hooks/usePolling";
import { useAuth } from "../../context/AuthContext";
import { locationService } from "../../services/location";
import { distressService, type Distress } from "../../services/distress";
import { ROUTES, DISTRESS_STATUS } from "../../utils/constants";

export const VetTracking = () => {
  const navigate = useNavigate();
  const { distressId } = useParams<{ distressId: string }>();
  const { vetProfile } = useAuth();
  const [distress, setDistress] = useState<Distress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [vetLiveLocation, setVetLiveLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [wasDeclined, setWasDeclined] = useState(false);
  const [showAIChatbot, setShowAIChatbot] = useState(false);
  const locationWatchRef = useRef<number | null>(null);

  // Load distress details
  const loadDistress = useCallback(async () => {
    if (!distressId) return;

    try {
      const result = await distressService.getDistress(distressId);
      setDistress(result.distress);

      // Check if this vet was selected or declined
      if (result.distress.selectedVetId && vetProfile) {
        // Check if current vet is the selected one
        if (result.distress.selectedVetId._id !== vetProfile._id) {
          setWasDeclined(true);
        }
      }

      // Set initial user location from distress
      if (result.distress.location?.coordinates) {
        setUserLocation({
          lng: result.distress.location.coordinates[0],
          lat: result.distress.location.coordinates[1],
        });
      }
    } catch (err) {
      console.error("Failed to load distress:", err);
      toast.error("Failed to load emergency details");
      navigate(ROUTES.VET_DISTRESS_LIST);
    } finally {
      setIsLoading(false);
    }
  }, [distressId, navigate, vetProfile]);

  useEffect(() => {
    loadDistress();
  }, [loadDistress]);

  // Send vet location updates when in progress
  const sendVetLocation = useCallback(async (coords: [number, number]) => {
    if (!distressId || !distress?.selectedVetId) return;
    try {
      await locationService.updateDistressLocation(distressId, coords);
      console.log('Vet location sent:', coords);
    } catch (error) {
      console.error('Failed to send vet location:', error);
    }
  }, [distressId, distress?.selectedVetId]);

  // Watch vet's location and send updates
  useEffect(() => {
    if (!distressId || !distress?.selectedVetId || wasDeclined) return;

    const watchId = locationService.watchPosition(
      (position) => {
        const coords: [number, number] = [
          position.coords.longitude,
          position.coords.latitude,
        ];
        setVetLiveLocation({ lng: coords[0], lat: coords[1] });
        sendVetLocation(coords);
      },
      (error) => {
        console.error('Location watch error:', error);
      }
    );

    locationWatchRef.current = watchId;

    return () => {
      if (locationWatchRef.current !== null) {
        locationService.clearWatch(locationWatchRef.current);
        locationWatchRef.current = null;
      }
    };
  }, [distressId, distress?.selectedVetId, wasDeclined, sendVetLocation]);

  // Handle distress updates
  const handleDistressUpdated = useCallback(() => {
    loadDistress();
  }, [loadDistress]);

  // Handle location updates (user location)
  const handleLocationUpdate = useCallback(
    (data: { coordinates: [number, number] }) => {
      setUserLocation({
        lng: data.coordinates[0],
        lat: data.coordinates[1],
      });
    },
    []
  );

  const { stopPolling } = usePolling({
    distressId: distressId,
    pollingInterval: 3000,
    onDistressUpdated: handleDistressUpdated,
    onDistressResolved: () => {
      // Stop location watching
      if (locationWatchRef.current !== null) {
        locationService.clearWatch(locationWatchRef.current);
        locationWatchRef.current = null;
      }
      toast.success("Emergency resolved!");
      navigate(ROUTES.VET_DASHBOARD);
    },
    onLocationUpdate: handleLocationUpdate,
    enabled: !!distressId && !wasDeclined && distress?.status !== 'resolved' && distress?.status !== 'cancelled',
  });

  const handleResolve = async () => {
    if (!distressId) return;

    setIsResolving(true);

    try {
      // Stop polling and location watching first
      stopPolling();
      if (locationWatchRef.current !== null) {
        locationService.clearWatch(locationWatchRef.current);
        locationWatchRef.current = null;
      }

      await distressService.resolveDistress(distressId);
      toast.success("Emergency resolved! Thank you.");
      navigate(ROUTES.VET_DASHBOARD);
    } catch (err) {
      toast.error("Failed to resolve. Please try again.");
      console.error(err);
    } finally {
      setIsResolving(false);
      setShowResolveModal(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center py-12">
          <Loader text="Loading emergency details..." />
        </div>
      </Layout>
    );
  }

  // Show declined message
  if (wasDeclined) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto">
          <Card className="bg-[#FFCDC9] border-[#FDACAC]">
            <CardBody className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 bg-white rounded-full flex items-center justify-center shadow-[0_4px_0_#FDACAC]">
                <FiX className="h-10 w-10 text-[#FD7979]" />
              </div>
              <h2 className="text-2xl font-bold text-[#5D4E4E] mb-2">
                Request Declined
              </h2>
              <p className="text-[#5D4E4E] opacity-70 mb-6">
                The user has selected another vet for this emergency.
                Thank you for your willingness to help!
              </p>
              <Button onClick={() => navigate(ROUTES.VET_DISTRESS_LIST)}>
                <FiArrowLeft className="mr-2 h-4 w-4" />
                Back to Emergencies
              </Button>
            </CardBody>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!distress) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardBody className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 bg-[#FEEAC9] rounded-full flex items-center justify-center border-2 border-[#FFCDC9]">
                <FiAlertCircle className="h-10 w-10 text-[#FDACAC]" />
              </div>
              <h2 className="text-xl font-bold text-[#5D4E4E] mb-2">
                Emergency Not Found
              </h2>
              <p className="text-[#5D4E4E] opacity-70 mb-6">
                This emergency may have been resolved or cancelled.
              </p>
              <Button onClick={() => navigate(ROUTES.VET_DISTRESS_LIST)}>
                <FiArrowLeft className="mr-2 h-4 w-4" />
                Back to Emergencies
              </Button>
            </CardBody>
          </Card>
        </div>
      </Layout>
    );
  }

  const isInProgress = distress.status === DISTRESS_STATUS.IN_PROGRESS;
  const isWaitingForSelection = distress.status === DISTRESS_STATUS.RESPONDED && !distress.selectedVetId;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(ROUTES.VET_DISTRESS_LIST)}
          className="flex items-center gap-2 text-[#5D4E4E] hover:text-[#FD7979] transition-colors font-medium mb-4"
        >
          <FiArrowLeft className="h-5 w-5" />
          Back to Emergencies
        </button>

        {/* Status Banner */}
        <Card
          className={`mb-6 ${
            isInProgress
              ? "bg-[#D1FAE5] border-[#10B981]"
              : isWaitingForSelection
              ? "bg-[#FEEAC9] border-[#FFCDC9]"
              : "bg-[#FFCDC9] border-[#FDACAC]"
          }`}
        >
          <CardBody>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${isInProgress ? 'bg-white shadow-[0_3px_0_#10B981]' : 'bg-white shadow-[0_3px_0_#FDACAC]'}`}>
                  {isInProgress ? (
                    <FiNavigation className="h-6 w-6 text-[#10B981]" />
                  ) : (
                    <FiMapPin className="h-6 w-6 text-[#FD7979]" />
                  )}
                </div>
                <div>
                  <h2 className="font-bold text-lg text-[#5D4E4E]">
                    {isInProgress
                      ? "You're Assigned!"
                      : isWaitingForSelection
                      ? "Waiting for User Approval"
                      : "Response Sent"}
                  </h2>
                  <p className="text-[#5D4E4E] opacity-70 text-sm">
                    {isInProgress
                      ? distress.responseMode === "vet_coming"
                        ? "Navigate to the user's location"
                        : "User is coming to your clinic"
                      : isWaitingForSelection
                      ? "User is reviewing your response"
                      : "Your response has been submitted"}
                  </p>
                </div>
              </div>
              <div
                className={`px-4 py-2 rounded-full text-sm font-bold ${
                  isInProgress
                    ? "bg-[#10B981] text-white shadow-[0_3px_0_#059669]"
                    : "bg-[#FD7979] text-white shadow-[0_3px_0_#E05A5A]"
                }`}
              >
                {distress.status.replace("_", " ").toUpperCase()}
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Map */}
          <Card className="lg:row-span-2 overflow-hidden">
            <CardBody className="p-0">
              <LiveMap
                userLocation={userLocation || undefined}
                vetLocation={vetLiveLocation || undefined}
                showRoute={isInProgress}
                className="h-[300px] lg:h-[500px] rounded-xl"
              />
            </CardBody>
          </Card>

          {/* Right Column */}
          <div className="space-y-6">
            {/* User Info */}
            <Card>
              <CardBody>
                <h3 className="font-bold text-[#5D4E4E] mb-4 flex items-center gap-2">
                  <FiMapPin className="h-5 w-5 text-[#FD7979]" />
                  User Details
                </h3>
                <div className="flex items-center gap-4 p-4 bg-[#FFF9F0] rounded-xl border-2 border-[#FEEAC9]">
                  <div className="flex-1">
                    <p className="font-bold text-[#5D4E4E]">
                      {distress.userId?.name || "Anonymous User"}
                    </p>
                    {distress.userId?.phone && (
                      <p className="text-sm text-[#5D4E4E] opacity-70 mt-1">
                        {distress.userId.phone}
                      </p>
                    )}
                  </div>
                  {distress.userId?.phone && (
                    <a
                      href={`tel:${distress.userId.phone}`}
                      className="p-3 bg-[#10B981] text-white rounded-full hover:bg-[#059669] transition-colors shadow-[0_3px_0_#059669]"
                    >
                      <FiPhone className="h-5 w-5" />
                    </a>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Emergency Description */}
            <Card>
              <CardBody>
                <h3 className="font-bold text-[#5D4E4E] mb-3">Emergency Description</h3>
                <div className="p-4 bg-[#FFF9F0] rounded-xl border-2 border-[#FEEAC9]">
                  <p className="text-[#5D4E4E]">{distress.description}</p>
                </div>
                {distress.imageUrl && (
                  <img
                    src={distress.imageUrl}
                    alt="Emergency"
                    className="w-full h-40 object-cover rounded-xl mt-4 border-2 border-[#FFCDC9]"
                  />
                )}
              </CardBody>
            </Card>

            {/* AI Guidance */}
            {distress.aiAnalysis && (
              <AIGuidancePanel
                analysis={distress.aiAnalysis}
                collapsible
                initialCollapsed={isInProgress}
              />
            )}

            {/* Actions */}
            {isInProgress && (
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowResolveModal(true)}
                  className="flex-1"
                  size="lg"
                >
                  <FiCheck className="mr-2 h-5 w-5" />
                  Mark Resolved
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Resolve Modal */}
        <ConfirmModal
          isOpen={showResolveModal}
          onClose={() => setShowResolveModal(false)}
          onConfirm={handleResolve}
          title="Mark as Resolved"
          message="Has the emergency been resolved? This will close the ticket."
          confirmText="Yes, Resolved"
          isLoading={isResolving}
        />

        {/* AI Chatbot */}
        <AIChatbot
          isOpen={showAIChatbot}
          onClose={() => setShowAIChatbot(false)}
          initialContext={distress.description}
        />
      </div>

      {/* AI Floating Button */}
      {!showAIChatbot && (
        <AIFloatingButton onClick={() => setShowAIChatbot(true)} />
      )}
    </Layout>
  );
};
