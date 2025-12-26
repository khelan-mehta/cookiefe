import { useState } from 'react';
import { FiAlertCircle, FiChevronDown, FiChevronUp, FiInfo } from 'react-icons/fi';
import type { AIAnalysis } from '../../services/distress';
import { SEVERITY_COLORS } from '../../utils/constants';
import { Card, CardBody } from '../common/Card';

interface AIGuidancePanelProps {
  analysis: AIAnalysis | null;
  isLoading?: boolean;
  collapsible?: boolean;
  initialCollapsed?: boolean;
}

export const AIGuidancePanel = ({
  analysis,
  isLoading = false,
  collapsible = true,
  initialCollapsed = false,
}: AIGuidancePanelProps) => {
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);

  if (isLoading) {
    return (
      <Card className="bg-[#FEEAC9] border-[#FFCDC9]">
        <CardBody>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FFCDC9] rounded-full flex items-center justify-center">
              <div className="animate-spin h-5 w-5 border-2 border-[#FD7979] border-t-transparent rounded-full" />
            </div>
            <div>
              <span className="font-bold text-[#5D4E4E]">Analyzing situation...</span>
              <p className="text-sm text-[#5D4E4E] opacity-70">
                AI is reviewing the information to provide guidance
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (!analysis) {
    return null;
  }

  const severityColor = SEVERITY_COLORS[analysis.severity] || SEVERITY_COLORS.medium;

  return (
    <Card>
      <button
        onClick={() => collapsible && setIsCollapsed(!isCollapsed)}
        className="w-full px-5 py-4 flex items-center justify-between bg-[#FFF9F0] rounded-t-2xl border-b-2 border-[#FEEAC9]"
        disabled={!collapsible}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#FFCDC9] rounded-full flex items-center justify-center">
            <FiAlertCircle className="h-5 w-5 text-[#FD7979]" />
          </div>
          <span className="font-bold text-[#5D4E4E]">AI Guidance</span>
          <span className={`px-3 py-1 text-xs font-bold rounded-full ${severityColor}`}>
            {analysis?.severity?.toUpperCase()}
          </span>
        </div>
        {collapsible && (
          isCollapsed ? (
            <FiChevronDown className="h-5 w-5 text-[#5D4E4E]" />
          ) : (
            <FiChevronUp className="h-5 w-5 text-[#5D4E4E]" />
          )
        )}
      </button>

      {!isCollapsed && (
        <CardBody className="space-y-5">
          {analysis.immediateSteps && analysis.immediateSteps.length > 0 && (
            <div>
              <h4 className="font-bold text-[#5D4E4E] mb-3">Immediate Steps</h4>
              <ul className="space-y-2">
                {analysis.immediateSteps.map((step, index) => (
                  <li key={index} className="flex items-start gap-3 p-3 bg-[#FFF9F0] rounded-xl">
                    <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-[#FD7979] text-white rounded-full text-xs font-bold">
                      {index + 1}
                    </span>
                    <span className="text-[#5D4E4E] text-sm">{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.suggestions && analysis.suggestions.length > 0 && (
            <div>
              <h4 className="font-bold text-[#5D4E4E] mb-3">Suggestions</h4>
              <ul className="space-y-2">
                {analysis.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-3 text-[#5D4E4E] text-sm">
                    <span className="w-1.5 h-1.5 bg-[#FDACAC] rounded-full mt-2 flex-shrink-0" />
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.possibleConditions && analysis.possibleConditions.length > 0 && (
            <div>
              <h4 className="font-bold text-[#5D4E4E] mb-3">Possible Conditions</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.possibleConditions.map((condition, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-[#FEEAC9] text-[#5D4E4E] text-sm rounded-full font-medium border-2 border-[#FFCDC9]"
                  >
                    {condition}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-start gap-3 p-4 bg-[#FEEAC9] rounded-xl border-2 border-[#FFCDC9]">
            <FiInfo className="h-5 w-5 text-[#FD7979] mt-0.5 flex-shrink-0" />
            <p className="text-xs text-[#5D4E4E]">
              This AI guidance is advisory only and should not replace professional
              veterinary care. Always consult a qualified veterinarian for proper
              diagnosis and treatment.
            </p>
          </div>
        </CardBody>
      )}
    </Card>
  );
};
