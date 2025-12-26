import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMapPin, FiClock, FiRefreshCw, FiAlertTriangle, FiAlertCircle, FiNavigation, FiHome } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { Layout } from '../../components/layout/Layout';
import { Card, CardBody } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Loader } from '../../components/common/Loader';
import { Modal } from '../../components/common/Modal';
import { TextArea } from '../../components/common/Input';
import { usePolling } from '../../hooks/usePolling';
import { distressService, type Distress } from '../../services/distress';
import { locationService } from '../../services/location';
import { formatDistance, formatDateTime } from '../../utils/validators';
import { SEVERITY_COLORS, ROUTES } from '../../utils/constants';

export const DistressList = () => {
  const navigate = useNavigate();
  const [distresses, setDistresses] = useState<Distress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDistress, setSelectedDistress] = useState<Distress | null>(null);
  const [responseMode, setResponseMode] = useState<'vet_coming' | 'user_going'>('vet_coming');
  const [responseMessage, setResponseMessage] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const updateVetLocationAndLoad = useCallback(async () => {
    try {
      const position = await locationService.getCurrentPosition();
      const coordinates: [number, number] = [
        position.coords.longitude,
        position.coords.latitude,
      ];
      await locationService.updateVetLocation(coordinates);
      setLocationError(null);
      console.log('Vet location updated before loading distresses:', coordinates);
    } catch (error) {
      console.error('Failed to update vet location:', error);
      setLocationError('Could not get your location. Enable location access to see nearby emergencies.');
    }
  }, []);

  const loadDistresses = useCallback(async () => {
    try {
      const data = await distressService.getNearbyDistresses();
      setDistresses(data.distresses);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      if (error.response?.data?.message?.includes('location')) {
        setLocationError('Please set your location first');
      }
      console.error('Failed to load distresses:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    updateVetLocationAndLoad().then(() => loadDistresses());
  }, [updateVetLocationAndLoad, loadDistresses]);

  usePolling({
    pollingInterval: 5000,
    onNewDistress: (data) => {
      if (data.distresses && data.distresses.length > 0) {
        loadDistresses();
        toast('New emergency nearby!', { icon: '!' });
      }
    },
    enabled: true,
  });

  const handleRespond = async () => {
    if (!selectedDistress) return;

    setIsResponding(true);
    try {
      await distressService.respondToDistress(
        selectedDistress._id,
        responseMode,
        responseMessage
      );
      toast.success('Response sent successfully!');
      // Navigate to tracking page for this distress
      navigate(`${ROUTES.VET_TRACKING}/${selectedDistress._id}`);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to respond');
      console.error(err);
    } finally {
      setIsResponding(false);
      setSelectedDistress(null);
      setResponseMessage('');
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#FD7979] rounded-full flex items-center justify-center shadow-[0_4px_0_#E05A5A]">
              <FiAlertCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#5D4E4E]">Nearby Emergencies</h1>
              <p className="text-[#5D4E4E] opacity-70 text-sm">Respond to pets in need</p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={() => {
              setIsLoading(true);
              loadDistresses();
            }}
          >
            <FiRefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Location Error Banner */}
        {locationError && (
          <Card className="mb-4 bg-[#FEEAC9] border-[#FFCDC9]">
            <CardBody className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-full">
                <FiAlertTriangle className="h-5 w-5 text-[#FD7979]" />
              </div>
              <p className="text-[#5D4E4E] text-sm font-medium">{locationError}</p>
            </CardBody>
          </Card>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader text="Loading emergencies..." />
          </div>
        ) : distresses.length === 0 ? (
          <Card>
            <CardBody className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 bg-[#FEEAC9] rounded-full flex items-center justify-center border-2 border-[#FFCDC9]">
                <FiAlertCircle className="h-10 w-10 text-[#FDACAC]" />
              </div>
              <p className="text-[#5D4E4E] font-medium">No active emergencies in your area</p>
              <p className="text-sm text-[#5D4E4E] opacity-70 mt-2">
                Make sure your location is set in your profile
              </p>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-4">
            {distresses.map((distress) => (
              <Card key={distress._id}>
                <CardBody>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      {distress.aiAnalysis?.severity && (
                        <span
                          className={`inline-block px-3 py-1 text-xs font-bold rounded-full mb-3 ${
                            SEVERITY_COLORS[distress.aiAnalysis.severity]
                          }`}
                        >
                          {distress.aiAnalysis.severity.toUpperCase()}
                        </span>
                      )}
                      <p className="text-[#5D4E4E] font-medium">{distress.description}</p>
                    </div>
                    {distress.imageUrl && (
                      <img
                        src={distress.imageUrl}
                        alt="Emergency"
                        className="w-20 h-20 object-cover rounded-xl ml-4 border-2 border-[#FFCDC9]"
                      />
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-[#5D4E4E] mb-4 flex-wrap">
                    {distress.distance !== undefined && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FEEAC9] rounded-full">
                        <FiMapPin className="h-4 w-4 text-[#FD7979]" />
                        <span className="font-medium">{formatDistance(distress.distance)}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFF9F0] rounded-full border border-[#FEEAC9]">
                      <FiClock className="h-4 w-4 text-[#FDACAC]" />
                      <span>{formatDateTime(distress.createdAt)}</span>
                    </div>
                    <span className="text-[#5D4E4E] opacity-70">
                      {distress.responses.length} response(s)
                    </span>
                  </div>

                  <Button
                    onClick={() => setSelectedDistress(distress)}
                    className="w-full"
                    size="lg"
                  >
                    Respond to Emergency
                  </Button>
                </CardBody>
              </Card>
            ))}
          </div>
        )}

        {/* Response Modal */}
        <Modal
          isOpen={!!selectedDistress}
          onClose={() => setSelectedDistress(null)}
          title="Respond to Emergency"
          size="lg"
        >
          {selectedDistress && (
            <div className="space-y-5">
              <div className="p-4 bg-[#FFF9F0] rounded-xl border-2 border-[#FEEAC9]">
                <h4 className="font-bold text-[#5D4E4E] mb-2">Emergency Details</h4>
                <p className="text-[#5D4E4E] opacity-80 text-sm">{selectedDistress.description}</p>
              </div>

              <div>
                <h4 className="font-bold text-[#5D4E4E] mb-3">Response Mode</h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setResponseMode('vet_coming')}
                    className={`p-4 border-2 rounded-xl text-center transition-all ${
                      responseMode === 'vet_coming'
                        ? 'border-[#FD7979] bg-[#FFCDC9] shadow-[0_3px_0_#FDACAC]'
                        : 'border-[#FFCDC9] hover:border-[#FDACAC] bg-white'
                    }`}
                  >
                    <div className={`w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center ${
                      responseMode === 'vet_coming' ? 'bg-[#FD7979]' : 'bg-[#FEEAC9]'
                    }`}>
                      <FiNavigation className={`h-5 w-5 ${responseMode === 'vet_coming' ? 'text-white' : 'text-[#FDACAC]'}`} />
                    </div>
                    <p className="font-bold text-[#5D4E4E]">I'll come to you</p>
                    <p className="text-sm text-[#5D4E4E] opacity-70">Visit the location</p>
                  </button>
                  <button
                    onClick={() => setResponseMode('user_going')}
                    className={`p-4 border-2 rounded-xl text-center transition-all ${
                      responseMode === 'user_going'
                        ? 'border-[#FD7979] bg-[#FFCDC9] shadow-[0_3px_0_#FDACAC]'
                        : 'border-[#FFCDC9] hover:border-[#FDACAC] bg-white'
                    }`}
                  >
                    <div className={`w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center ${
                      responseMode === 'user_going' ? 'bg-[#FD7979]' : 'bg-[#FEEAC9]'
                    }`}>
                      <FiHome className={`h-5 w-5 ${responseMode === 'user_going' ? 'text-white' : 'text-[#FDACAC]'}`} />
                    </div>
                    <p className="font-bold text-[#5D4E4E]">Come to clinic</p>
                    <p className="text-sm text-[#5D4E4E] opacity-70">Bring the animal</p>
                  </button>
                </div>
              </div>

              <div>
                <TextArea
                  label="Message (Optional)"
                  placeholder="Add any instructions or notes..."
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Button
                  variant="ghost"
                  onClick={() => setSelectedDistress(null)}
                  disabled={isResponding}
                >
                  Cancel
                </Button>
                <Button onClick={handleRespond} isLoading={isResponding} size="lg">
                  Send Response
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
};
