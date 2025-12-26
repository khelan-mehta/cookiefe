import api from "./api";

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: "user" | "vet";
  phone?: string;
}

export interface VetProfile {
  _id: string;
  clinicName?: string;
  clinicAddress?: string;
  location?: {
    type: string;
    coordinates: [number, number];
  };
  isAvailable: boolean;
  specializations?: string[];
  rating?: number;
  reviewCount?: number;
}

export interface GoogleAuthResponse {
  success: boolean;
  registered: boolean;
  token?: string;
  user?: User;
  tempData?: {
    googleId: string;
    email: string;
    name: string;
    avatar?: string;
  };
}

export interface RegisterData {
  googleId: string;
  email: string;
  name: string;
  avatar?: string;
  phone: string;
  role: "user" | "vet";
}

export const authService = {
  async googleAuth(payload: { idToken: string }): Promise<GoogleAuthResponse> {
    const response = await api.post("/auth/google", payload);
    return response.data;
  },

  async register(data: RegisterData): Promise<{ token: string; user: User }> {
    const response = await api.post("/auth/register", data);
    return response.data;
  },

  async getMe(): Promise<{ user: User; vetProfile?: VetProfile }> {
    const response = await api.get("/auth/me");
    return response.data;
  },

  async logout(): Promise<void> {
    await api.post("/auth/logout");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  getToken(): string | null {
    return localStorage.getItem("token");
  },

  setToken(token: string): void {
    localStorage.setItem("token", token);
  },

  getStoredUser(): User | null {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  setStoredUser(user: User): void {
    localStorage.setItem("user", JSON.stringify(user));
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};
