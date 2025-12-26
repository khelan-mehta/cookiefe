import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authService, type User, type VetProfile } from '../services/auth';

interface AuthContextType {
  user: User | null;
  vetProfile: VetProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  updateVetProfile: (profile: VetProfile) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [vetProfile, setVetProfile] = useState<VetProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = authService.getToken();
      if (token) {
        try {
          const data = await authService.getMe();
          setUser(data.user);
          setVetProfile(data.vetProfile || null);
          authService.setStoredUser(data.user);
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = (token: string, userData: User) => {
    authService.setToken(token);
    authService.setStoredUser(userData);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // Continue with logout even if API fails
    }
    setUser(null);
    setVetProfile(null);
  };

  const updateUser = (userData: User) => {
    setUser(userData);
    authService.setStoredUser(userData);
  };

  const updateVetProfile = (profile: VetProfile) => {
    setVetProfile(profile);
  };

  const refreshUser = async () => {
    try {
      const data = await authService.getMe();
      setUser(data.user);
      setVetProfile(data.vetProfile || null);
      authService.setStoredUser(data.user);
    } catch {
      // Ignore errors
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        vetProfile,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        updateUser,
        updateVetProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
