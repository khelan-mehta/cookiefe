import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import { distressService, type Distress, type AIAnalysis } from '../services/distress';
import { useAuth } from './AuthContext';

interface DistressContextType {
  activeDistress: Distress | null;
  isLoading: boolean;
  error: string | null;
  aiAnalysis: AIAnalysis | null;
  setActiveDistress: (distress: Distress | null) => void;
  setAIAnalysis: (analysis: AIAnalysis | null) => void;
  refreshActiveDistress: () => Promise<void>;
  clearDistress: () => void;
}

const DistressContext = createContext<DistressContextType | undefined>(undefined);

export const DistressProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, user } = useAuth();
  const [activeDistress, setActiveDistress] = useState<Distress | null>(null);
  const [aiAnalysis, setAIAnalysis] = useState<AIAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshActiveDistress = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    setIsLoading(true);
    setError(null);
    try {
      const data = await distressService.getActiveDistress();
      setActiveDistress(data.distress);
      if (data.distress?.aiAnalysis) {
        setAIAnalysis(data.distress.aiAnalysis);
      }
    } catch (err) {
      setError('Failed to fetch active distress');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'user') {
      refreshActiveDistress();
    }
  }, [isAuthenticated, user?.role, refreshActiveDistress]);

  const clearDistress = () => {
    setActiveDistress(null);
    setAIAnalysis(null);
    setError(null);
  };

  return (
    <DistressContext.Provider
      value={{
        activeDistress,
        isLoading,
        error,
        aiAnalysis,
        setActiveDistress,
        setAIAnalysis,
        refreshActiveDistress,
        clearDistress,
      }}
    >
      {children}
    </DistressContext.Provider>
  );
};

export const useDistress = () => {
  const context = useContext(DistressContext);
  if (context === undefined) {
    throw new Error('useDistress must be used within a DistressProvider');
  }
  return context;
};
