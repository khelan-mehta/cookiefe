import { FiMapPin, FiClock, FiMessageCircle, FiNavigation, FiHome } from 'react-icons/fi';
import { Card, CardBody } from '../common/Card';
import { Button } from '../common/Button';
import { formatDistance, formatDuration } from '../../utils/validators';

interface VetResponse {
  vetId: string;
  clinicName?: string;
  mode: 'vet_coming' | 'user_going';
  estimatedTime?: number;
  distance?: number;
  message?: string;
}

interface VetResponseCardProps {
  response: VetResponse;
  onSelect: (vetId: string, mode: string) => void;
  isSelecting?: boolean;
  isSelected?: boolean;
}

export const VetResponseCard = ({
  response,
  onSelect,
  isSelecting = false,
  isSelected = false,
}: VetResponseCardProps) => {
  return (
    <Card className={isSelected ? 'ring-2 ring-[#FD7979] bg-[#FFCDC9]' : ''}>
      <CardBody>
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              response.mode === 'vet_coming' ? 'bg-[#D1FAE5]' : 'bg-[#FEEAC9]'
            }`}>
              {response.mode === 'vet_coming' ? (
                <FiNavigation className="h-6 w-6 text-[#10B981]" />
              ) : (
                <FiHome className="h-6 w-6 text-[#FD7979]" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-[#5D4E4E]">
                {response.clinicName || 'Veterinary Clinic'}
              </h3>
              <span
                className={`inline-block px-3 py-1 text-xs font-bold rounded-full mt-1 ${
                  response.mode === 'vet_coming'
                    ? 'bg-[#D1FAE5] text-[#065F46]'
                    : 'bg-[#FEEAC9] text-[#5D4E4E]'
                }`}
              >
                {response.mode === 'vet_coming' ? 'Vet Coming to You' : 'Visit Clinic'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm text-[#5D4E4E] mb-4 flex-wrap">
          {response.distance !== undefined && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FEEAC9] rounded-full">
              <FiMapPin className="h-4 w-4 text-[#FD7979]" />
              <span className="font-medium">{formatDistance(response.distance)}</span>
            </div>
          )}
          {response.estimatedTime !== undefined && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFF9F0] rounded-full border border-[#FEEAC9]">
              <FiClock className="h-4 w-4 text-[#FDACAC]" />
              <span>{formatDuration(response.estimatedTime)}</span>
            </div>
          )}
        </div>

        {response.message && (
          <div className="flex items-start gap-3 text-sm text-[#5D4E4E] mb-4 p-3 bg-[#FFF9F0] rounded-xl border-2 border-[#FEEAC9]">
            <FiMessageCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-[#FDACAC]" />
            <p>{response.message}</p>
          </div>
        )}

        <Button
          onClick={() => onSelect(response.vetId, response.mode)}
          isLoading={isSelecting}
          disabled={isSelected}
          className="w-full"
          size="lg"
        >
          {isSelected ? 'Selected' : 'Accept Response'}
        </Button>
      </CardBody>
    </Card>
  );
};

export const VetResponseList = ({
  responses,
  onSelect,
  selectingVetId,
  selectedVetId,
}: {
  responses: VetResponse[];
  onSelect: (vetId: string, mode: string) => void;
  selectingVetId?: string;
  selectedVetId?: string;
}) => {
  if (responses.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-[#FEEAC9] rounded-full flex items-center justify-center border-2 border-[#FFCDC9]">
          <FiClock className="h-8 w-8 text-[#FDACAC]" />
        </div>
        <p className="text-[#5D4E4E] font-medium">Waiting for vet responses...</p>
        <p className="text-sm text-[#5D4E4E] opacity-70 mt-1">Nearby vets have been notified</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-[#5D4E4E] flex items-center gap-2">
        <FiNavigation className="h-5 w-5 text-[#FD7979]" />
        {responses.length} Vet{responses.length > 1 ? 's' : ''} Responded
      </h3>
      {responses.map((response) => (
        <VetResponseCard
          key={response.vetId}
          response={response}
          onSelect={onSelect}
          isSelecting={selectingVetId === response.vetId}
          isSelected={selectedVetId === response.vetId}
        />
      ))}
    </div>
  );
};
