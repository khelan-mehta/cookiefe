import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FiCheck, FiX, FiPhone, FiMapPin, FiClock, FiNavigation, FiRefreshCw } from "react-icons/fi";
import { Layout } from "../../components/layout/Layout";
import { Card, CardBody } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Loader } from "../../components/common/Loader";
import { LiveMap } from "../../components/map/LiveMap";
import { AIGuidancePanel } from "../../components/distress/AIGuidancePanel";
import { AIChatbot, AIFloatingButton } from "../../components/distress/AIChatbot";
import { StoreRecommendations } from "../../components/distress/StoreRecommendations";
import { VetResponseList } from "../../components/distress/VetResponseCard";
import { ConfirmModal } from "../../components/common/Modal";
import { useDistress } from "../../context/DistressContext";
import { usePolling } from "../../hooks/usePolling";
import { locationService } from "../../services/location";
import { distressService, type Distress } from "../../services/distress";
import { ROUTES, DISTRESS_STATUS } from "../../utils/constants";

export const Tracking = () => {
  const navigate = useNavigate();
  const {
    activeDistress,
    aiAnalysis,
    setActiveDistress,
    clearDistress,
    refreshActiveDistress,
  } = useDistress();
  const [isSelectingVet, setIsSelectingVet] = useState(false);
  const [selectingVetId, setSelectingVetId] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [vetLocation, setVetLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [userLiveLocation, setUserLiveLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [showAIChatbot, setShowAIChatbot] = useState(false);
  const lastLocationUpdateRef = useRef<number>(0);
  const locationCacheRef = useRef<{ lat: number; lng: number } | null>(null);

  // Get and cache user location, only update every 10 seconds
  const updateUserLocation = useCallback(async () => {
    if (!activeDistress?._id) return;

    const now = Date.now();
    // Only update if 10 seconds have passed since last update
    if (now - lastLocationUpdateRef.current < 10000 && locationCacheRef.current) {
      return;
    }

    try {
      const position = await locationService.getCurrentPosition();
      const coords: [number, number] = [
        position.coords.longitude,
        position.coords.latitude,
      ];

      const newLocation = { lng: coords[0], lat: coords[1] };

      // Only update if coordinates actually changed significantly (more than ~10 meters)
      if (!locationCacheRef.current ||
          Math.abs(locationCacheRef.current.lat - newLocation.lat) > 0.0001 ||
          Math.abs(locationCacheRef.current.lng - newLocation.lng) > 0.0001) {
        locationCacheRef.current = newLocation;
        setUserLiveLocation(newLocation);

        // Send to backend
        await locationService.updateDistressLocation(activeDistress._id, coords);
        lastLocationUpdateRef.current = now;
        console.log('User location updated:', coords);
      }
    } catch (error) {
      console.error('Failed to update user location:', error);
    }
  }, [activeDistress?._id]);

  // Initial location fetch
  useEffect(() => {
    if (activeDistress?._id) {
      updateUserLocation();
    }
  }, [activeDistress?._id, updateUserLocation]);

  const handleDistressUpdated = useCallback(() => {
    refreshActiveDistress();
  }, [refreshActiveDistress]);

  const handleLocationUpdate = useCallback(
    (data: { coordinates: [number, number] }) => {
      setVetLocation({
        lng: data.coordinates[0],
        lat: data.coordinates[1],
      });
    },
    []
  );

  const { stopPolling, refresh, isPolling } = usePolling({
    distressId: activeDistress?._id,
    pollingInterval: 20000, // 20 seconds auto-refresh
    onDistressUpdated: handleDistressUpdated,
    onDistressResolved: () => {
      toast.success("Emergency resolved!");
      clearDistress();
      navigate(ROUTES.DASHBOARD);
    },
    onLocationUpdate: handleLocationUpdate,
    enabled: !!activeDistress?._id && activeDistress?.status !== 'resolved' && activeDistress?.status !== 'cancelled',
  });

  // Auto-update location every 10 seconds
  useEffect(() => {
    if (!activeDistress?._id) return;

    const interval = setInterval(() => {
      updateUserLocation();
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [activeDistress?._id, updateUserLocation]);

  const handleRefresh = useCallback(() => {
    // Force location update by resetting the timer
    lastLocationUpdateRef.current = 0;
    updateUserLocation();
    refresh();
    toast.success("Refreshing emergency data...");
  }, [refresh, updateUserLocation]);

  useEffect(() => {
    if (!activeDistress) {
      refreshActiveDistress();
    }
  }, [activeDistress, refreshActiveDistress]);

  const handleSelectVet = async (vetId: string, mode: string) => {
    if (!activeDistress) return;

    setIsSelectingVet(true);
    setSelectingVetId(vetId);

    try {
      await distressService.selectVet(
        activeDistress._id,
        vetId,
        mode
      );
      // Fetch full distress data with populated fields
      await refreshActiveDistress();
      toast.success("Vet selected! Help is on the way.");
    } catch (err) {
      toast.error("Failed to select vet. Please try again.");
      console.error(err);
    } finally {
      setIsSelectingVet(false);
      setSelectingVetId(null);
    }
  };

  const handleCancel = async () => {
    if (!activeDistress) return;

    setIsCancelling(true);

    try {
      // Stop polling first
      stopPolling();

      await distressService.cancelDistress(activeDistress._id);
      toast.success("Emergency cancelled");
      clearDistress();
      navigate(ROUTES.DASHBOARD);
    } catch (err) {
      toast.error("Failed to cancel. Please try again.");
      console.error(err);
    } finally {
      setIsCancelling(false);
      setShowCancelModal(false);
    }
  };

  const handleResolve = async () => {
    if (!activeDistress) return;

    setIsResolving(true);

    try {
      // Stop polling first
      stopPolling();

      await distressService.resolveDistress(activeDistress._id);
      toast.success("Emergency resolved! Thank you.");
      clearDistress();
      navigate(ROUTES.DASHBOARD);
    } catch (err) {
      toast.error("Failed to resolve. Please try again.");
      console.error(err);
    } finally {
      setIsResolving(false);
      setShowResolveModal(false);
    }
  };

  if (!activeDistress) {
    return (
      <Layout>
        <div className="flex justify-center py-12">
          <Loader text="Loading emergency details..." />
        </div>
      </Layout>
    );
  }

  const userLocation = userLiveLocation || (activeDistress.location?.coordinates
    ? {
        lng: activeDistress.location.coordinates[0],
        lat: activeDistress.location.coordinates[1],
      }
    : undefined);

  const selectedVetLocation = activeDistress.selectedVetId?.location
    ?.coordinates
    ? {
        lng: activeDistress.selectedVetId.location.coordinates[0],
        lat: activeDistress.selectedVetId.location.coordinates[1],
      }
    : vetLocation;

  const isInProgress = activeDistress.status === DISTRESS_STATUS.IN_PROGRESS;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header with Refresh Button */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-[#5D4E4E]">Emergency Tracking</h1>
          <Button
            variant="ghost"
            onClick={handleRefresh}
            disabled={isPolling}
          >
            <FiRefreshCw className={`h-4 w-4 mr-2 ${isPolling ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Status Banner */}
        <Card
          className={`mb-6 ${
            isInProgress
              ? "bg-[#D1FAE5] border-[#10B981]"
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
                    <FiClock className="h-6 w-6 text-[#FD7979]" />
                  )}
                </div>
                <div>
                  <h2 className="font-bold text-lg text-[#5D4E4E]">
                    {isInProgress ? "Help is Coming!" : "Waiting for Responses"}
                  </h2>
                  <p className="text-[#5D4E4E] opacity-70 text-sm">
                    {isInProgress
                      ? activeDistress.responseMode === "vet_coming"
                        ? "A vet is on their way to you"
                        : "Head to the clinic for assistance"
                      : "Nearby vets have been notified"}
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
                {activeDistress.status.replace("_", " ").toUpperCase()}
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
                userLocation={userLocation}
                vetLocation={selectedVetLocation || undefined}
                showRoute={isInProgress && !!selectedVetLocation}
                className="h-[300px] lg:h-[500px] rounded-xl"
              />
            </CardBody>
          </Card>

          {/* Right Column */}
          <div className="space-y-6">
            {/* AI Guidance */}
            {(aiAnalysis || activeDistress.aiAnalysis) && (
              <AIGuidancePanel
                analysis={aiAnalysis || activeDistress.aiAnalysis || null}
                collapsible
                initialCollapsed={false}
              />
            )}

            {/* Store Recommendations */}
            <StoreRecommendations
              description={activeDistress.description}
              severity={aiAnalysis?.severity || activeDistress.aiAnalysis?.severity}
            />

            {/* Vet Responses (when waiting) */}
            {!activeDistress.selectedVetId && (
              <Card>
                <CardBody>
                  <VetResponseList
                    responses={activeDistress.responses.map((r: any) => ({
                      vetId:
                        typeof r.vetId === "string" ? r.vetId : r.vetId._id,
                      clinicName:
                        typeof r.vetId === "object"
                          ? r.vetId.clinicName
                          : undefined,
                      mode: r.mode,
                      estimatedTime: r.estimatedTime,
                      distance: r.distance,
                      message: r.message,
                    }))}
                    onSelect={handleSelectVet}
                    selectingVetId={selectingVetId || undefined}
                  />
                </CardBody>
              </Card>
            )}

            {/* Selected Vet Info */}
            {activeDistress.selectedVetId && (
              <Card>
                <CardBody>
                  <h3 className="font-bold text-[#5D4E4E] mb-4 flex items-center gap-2">
                    <FiMapPin className="h-5 w-5 text-[#FD7979]" />
                    Your Helper
                  </h3>
                  <div className="flex items-center gap-4 p-4 bg-[#FFF9F0] rounded-xl border-2 border-[#FEEAC9]">
                    <div className="flex-1">
                      <p className="font-bold text-[#5D4E4E]">
                        {activeDistress.selectedVetId.clinicName ||
                          "Veterinary Clinic"}
                      </p>
                      {activeDistress.selectedVetId.clinicAddress && (
                        <p className="text-sm text-[#5D4E4E] opacity-70 mt-1">
                          {activeDistress.selectedVetId.clinicAddress}
                        </p>
                      )}
                    </div>
                    <a
                      href={`tel:${activeDistress.userId.phone}`}
                      className="p-3 bg-[#10B981] text-white rounded-full hover:bg-[#059669] transition-colors shadow-[0_3px_0_#059669]"
                    >
                      <FiPhone className="h-5 w-5" />
                    </a>
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              {isInProgress ? (
                <Button
                  onClick={() => setShowResolveModal(true)}
                  className="flex-1"
                  size="lg"
                >
                  <FiCheck className="mr-2 h-5 w-5" />
                  Mark Resolved
                </Button>
              ) : (
                <Button
                  variant="danger"
                  onClick={() => setShowCancelModal(true)}
                  className="flex-1"
                  size="lg"
                >
                  <FiX className="mr-2 h-5 w-5" />
                  Cancel Emergency
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Cancel Modal */}
        <ConfirmModal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          onConfirm={handleCancel}
          title="Cancel Emergency"
          message="Are you sure you want to cancel this emergency? Vets who have responded will be notified."
          confirmText="Yes, Cancel"
          variant="danger"
          isLoading={isCancelling}
        />

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
          initialContext={activeDistress.description}
          showHistory={true}
        />
      </div>

      {/* AI Floating Button */}
      {!showAIChatbot && (
        <AIFloatingButton onClick={() => setShowAIChatbot(true)} />
      )}
    </Layout>
  );
};
