import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiArrowRight, FiMapPin, FiCamera, FiFileText, FiCheck } from 'react-icons/fi';
import { Layout } from '../../components/layout/Layout';
import { Card, CardBody } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { TextArea } from '../../components/common/Input';
import { ImageUpload } from '../../components/distress/ImageUpload';
import { AIGuidancePanel } from '../../components/distress/AIGuidancePanel';
import { AIChatbot, AIFloatingButton } from '../../components/distress/AIChatbot';
import { Loader } from '../../components/common/Loader';
import { useLocation } from '../../hooks/useLocation';
import { useDistress } from '../../context/DistressContext';
import { distressService } from '../../services/distress';
import { aiService, type AIAnalysisResult } from '../../services/ai';
import { ROUTES } from '../../utils/constants';
import { isValidDescription } from '../../utils/validators';

type Step = 'image' | 'description' | 'submit';

export const DistressCall = () => {
  const navigate = useNavigate();
  const { coordinates, isLoading: locationLoading, error: locationError } = useLocation();
  const { setActiveDistress, setAIAnalysis } = useDistress();

  const [step, setStep] = useState<Step>('image');
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setLocalAIAnalysis] = useState<AIAnalysisResult | null>(null);
  const [showAIChatbot, setShowAIChatbot] = useState(false);

  const handleImageUploaded = (url: string) => {
    setImageUrl(url);
  };

  const handleNextStep = () => {
    if (step === 'image') {
      setStep('description');
    } else if (step === 'description') {
      if (!isValidDescription(description)) {
        toast.error('Please provide at least 10 characters of description');
        return;
      }
      setStep('submit');
    }
  };

  const handlePreviousStep = () => {
    if (step === 'description') {
      setStep('image');
    } else if (step === 'submit') {
      setStep('description');
    }
  };

  const handleSubmit = async () => {
    if (!coordinates) {
      toast.error('Location is required. Please enable location access.');
      return;
    }

    if (!isValidDescription(description)) {
      toast.error('Please provide a valid description');
      return;
    }

    setIsSubmitting(true);
    setIsAnalyzing(true);

    try {
      const [distressResult] = await Promise.all([
        distressService.createDistress({
          imageUrl,
          description,
          location: {
            coordinates,
          },
        }),
        aiService.analyzeDistress(imageUrl, description).then((result) => {
          setLocalAIAnalysis(result.analysis);
          setAIAnalysis(result.analysis);
          setIsAnalyzing(false);

          if (distressResult?.distress?.id) {
            distressService.updateAIAnalysis(
              distressResult.distress.id,
              result.analysis
            ).catch(console.error);
          }
        }).catch((err) => {
          console.error('AI analysis failed:', err);
          setIsAnalyzing(false);
        }),
      ]);

      toast.success('Emergency reported! Help is on the way.');

      const fullDistress = await distressService.getDistress(distressResult.distress.id);
      setActiveDistress(fullDistress.distress);

      navigate(ROUTES.TRACKING);
    } catch (err) {
      toast.error('Failed to create emergency. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { key: 'image', icon: FiCamera, label: 'Photo' },
    { key: 'description', icon: FiFileText, label: 'Details' },
    { key: 'submit', icon: FiCheck, label: 'Review' },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === step);

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        {/* Emergency Header */}
        <div className="bg-gradient-to-r from-[#FD7979] to-[#E05A5A] rounded-2xl p-4 mb-6 shadow-[0_4px_0_#C54545]">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(ROUTES.DASHBOARD)}
              className="flex items-center gap-2 text-white hover:text-white/80 transition-colors font-medium"
            >
              <FiArrowLeft className="h-5 w-5" />
              Back
            </button>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
              <h1 className="text-xl font-bold text-white">Emergency Report</h1>
            </div>
            <div className="w-16"></div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const isCompleted = i < currentStepIndex;
            const isCurrent = i === currentStepIndex;
            return (
              <div key={s.key} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      isCompleted
                        ? 'bg-[#10B981] border-2 border-[#059669] shadow-[0_3px_0_#059669]'
                        : isCurrent
                        ? 'bg-[#FD7979] border-2 border-[#E05A5A] shadow-[0_3px_0_#E05A5A]'
                        : 'bg-white border-2 border-[#FFCDC9]'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isCompleted || isCurrent ? 'text-white' : 'text-[#FDACAC]'}`} />
                  </div>
                  <span className={`text-xs mt-2 font-medium ${isCurrent ? 'text-[#FD7979]' : 'text-[#5D4E4E] opacity-70'}`}>
                    {s.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`w-12 h-1 mx-2 rounded-full ${i < currentStepIndex ? 'bg-[#10B981]' : 'bg-[#FFCDC9]'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Location Status */}
        <Card className="mb-6">
          <CardBody className="flex items-center gap-3">
            <div className={`p-2.5 rounded-full ${coordinates ? 'bg-[#D1FAE5]' : 'bg-[#FEEAC9]'}`}>
              <FiMapPin className={`h-5 w-5 ${coordinates ? 'text-[#10B981]' : 'text-[#FDACAC]'}`} />
            </div>
            {locationLoading ? (
              <span className="text-[#5D4E4E] opacity-70">Getting your location...</span>
            ) : locationError ? (
              <span className="text-[#E05A5A] text-sm font-medium">{locationError}</span>
            ) : (
              <span className="text-[#10B981] font-medium">Location acquired</span>
            )}
          </CardBody>
        </Card>

        {/* Step: Image Upload */}
        {step === 'image' && (
          <Card>
            <CardBody>
              <h2 className="text-lg font-bold text-[#5D4E4E] mb-4">
                Add a Photo (Optional)
              </h2>
              <p className="text-[#5D4E4E] opacity-70 mb-4 text-sm">
                A photo helps vets assess the situation before arriving
              </p>
              <ImageUpload
                onImageUploaded={handleImageUploaded}
                currentImage={imageUrl}
                onClear={() => setImageUrl(undefined)}
              />
              <div className="mt-6 flex justify-end">
                <Button onClick={handleNextStep}>
                  Next
                  <FiArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Step: Description */}
        {step === 'description' && (
          <Card>
            <CardBody>
              <h2 className="text-lg font-bold text-[#5D4E4E] mb-4">
                Describe the Situation
              </h2>
              <TextArea
                placeholder="Describe what happened and the animal's condition. Include details like:
- Type of animal
- Visible injuries or symptoms
- How long has it been like this
- Animal's behavior"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                helperText={`${description.length} characters (minimum 10)`}
              />
              <div className="mt-6 flex justify-between">
                <Button variant="ghost" onClick={handlePreviousStep}>
                  <FiArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={handleNextStep}>
                  Next
                  <FiArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Step: Review & Submit */}
        {step === 'submit' && (
          <div className="space-y-4">
            <Card>
              <CardBody>
                <h2 className="text-lg font-bold text-[#5D4E4E] mb-4">
                  Review & Submit
                </h2>

                {imageUrl && (
                  <div className="mb-4">
                    <p className="text-sm text-[#5D4E4E] font-medium mb-2">Photo</p>
                    <img
                      src={imageUrl}
                      alt="Emergency"
                      className="w-full h-32 object-cover rounded-xl border-2 border-[#FFCDC9]"
                    />
                  </div>
                )}

                <div className="mb-4">
                  <p className="text-sm text-[#5D4E4E] font-medium mb-2">Description</p>
                  <div className="p-4 bg-[#FFF9F0] rounded-xl border-2 border-[#FEEAC9]">
                    <p className="text-[#5D4E4E]">{description}</p>
                  </div>
                </div>

                <div className="mt-6 flex justify-between">
                  <Button variant="ghost" onClick={handlePreviousStep}>
                    <FiArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    isLoading={isSubmitting}
                    disabled={!coordinates}
                    size="lg"
                  >
                    Submit Emergency
                  </Button>
                </div>
              </CardBody>
            </Card>

            {(isAnalyzing || aiAnalysis) && (
              <AIGuidancePanel
                analysis={aiAnalysis}
                isLoading={isAnalyzing}
                collapsible={false}
              />
            )}
          </div>
        )}

        {/* Submitting Overlay */}
        {isSubmitting && (
          <div className="fixed inset-0 bg-[#5D4E4E] bg-opacity-50 flex items-center justify-center z-50">
            <Card className="mx-4 max-w-sm">
              <CardBody className="text-center py-8">
                <Loader size="lg" />
                <h3 className="font-bold text-[#5D4E4E] mt-4">
                  Submitting Emergency
                </h3>
                <p className="text-[#5D4E4E] opacity-70 mt-2">
                  Notifying nearby vets...
                </p>
              </CardBody>
            </Card>
          </div>
        )}

        {/* AI Chatbot */}
        <AIChatbot
          isOpen={showAIChatbot}
          onClose={() => setShowAIChatbot(false)}
          initialContext={description || undefined}
        />
      </div>

      {/* AI Floating Button */}
      {!showAIChatbot && (
        <AIFloatingButton onClick={() => setShowAIChatbot(true)} />
      )}
    </Layout>
  );
};
