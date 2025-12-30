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

export interface ChatResponse {
  success: boolean;
  response: string;
  severity?: string;
  chatHistoryId?: string;
}

export interface SimilarQuery {
  id: string;
  query: string;
  animalType?: string;
  severity?: string;
  contactNumber?: string;
  answer?: string;
  createdAt: string;
}

export interface ChatHistoryItem {
  _id: string;
  query: string;
  animalType?: string;
  severity?: string;
  contactNumber?: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
  createdAt: string;
}

export interface StoreRecommendation {
  _id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  category?: string;
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

  async chat(
    message: string,
    context?: string,
    chatHistoryId?: string,
    contactNumber?: string
  ): Promise<ChatResponse> {
    const response = await api.post('/ai/chat', {
      message,
      context,
      chatHistoryId,
      contactNumber,
    });
    return response.data;
  },

  async getSimilarQueries(query: string, severity?: string): Promise<{ queries: SimilarQuery[] }> {
    const response = await api.get('/ai/similar-queries', {
      params: { query, severity },
    });
    return response.data;
  },

  async getChatHistory(page = 1, limit = 10): Promise<{
    history: ChatHistoryItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const response = await api.get('/ai/chat-history', {
      params: { page, limit },
    });
    return response.data;
  },

  async getStoreRecommendations(
    description: string,
    severity?: string,
    animalType?: string
  ): Promise<{
    recommendations: {
      products: StoreRecommendation[];
      reasoning: string;
      categories: string[];
    };
  }> {
    const response = await api.post('/ai/store-recommendations', {
      description,
      severity,
      animalType,
    });
    return response.data;
  },
};
