export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
export const GOOGLE_OAUTH_CLIENT_ID = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID || '';

export const BREAKPOINTS = {
  mobile: 640,
  tablet: 768,
  desktop: 1024,
} as const;

export const DISTRESS_STATUS = {
  PENDING: 'pending',
  RESPONDED: 'responded',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CANCELLED: 'cancelled',
} as const;

export const SEVERITY_COLORS = {
  low: 'bg-[#D1FAE5] text-[#065F46] border-2 border-[#A7F3D0]',
  medium: 'bg-[#FEEAC9] text-[#5D4E4E] border-2 border-[#FFCDC9]',
  high: 'bg-[#FFCDC9] text-[#5D4E4E] border-2 border-[#FDACAC]',
  critical: 'bg-[#FD7979] text-white border-2 border-[#E05A5A]',
} as const;

export const COOKIE_COLORS = {
  cream: '#FEEAC9',
  salmon: '#FFCDC9',
  pink: '#FDACAC',
  coral: '#FD7979',
  dark: '#5D4E4E',
  text: '#4A3F3F',
  light: '#FFF9F0',
} as const;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  ROLE_SELECT: '/role-select',
  DASHBOARD: '/dashboard',
  DISTRESS_CALL: '/distress-call',
  TRACKING: '/tracking',
  PROFILE: '/profile',
  STORE: '/store',
  VET_DASHBOARD: '/vet/dashboard',
  VET_DISTRESS_LIST: '/vet/distress-list',
  VET_TRACKING: '/vet/tracking',
  VET_STORE: '/vet/store',
  VET_STORE_EDITOR: '/vet/store/edit',
} as const;
