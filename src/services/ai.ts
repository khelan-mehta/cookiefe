import api from './api';

export interface AIAnalysisResult {
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestions: string[];
  possibleConditions: string[];
  immediateSteps: string[];
  disclaimer: string;
}

export interface GuidanceResult {
  severity: 'low' | 'medium' | 'high' | 'critical';
  immediateSteps: string[];
  suggestions: string[];
  disclaimer: string;
}

export const aiService = {
  async analyzeDistress(imageUrl: string | undefined, description: string): Promise<{ analysis: AIAnalysisResult }> {
    const response = await api.post('/ai/analyze-distress', { imageUrl, description });
    return response.data;
  },

  async getGuidance(symptoms: string, animalType?: string): Promise<{ guidance: GuidanceResult }> {
    const response = await api.post('/ai/guidance', { symptoms, animalType });
    return response.data;
  },
};
