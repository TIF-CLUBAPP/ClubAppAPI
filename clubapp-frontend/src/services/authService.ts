import { api } from './api';
import type { AuthenticationRequest, AuthenticationResponse, RegisterData } from '../types/auth';

export const authService = {
  login: async (credentials: AuthenticationRequest): Promise<AuthenticationResponse> => {
    const response = await api.post<AuthenticationResponse>('/authentication/authenticate', credentials);
    return response.data;
  },

  register: async (data: RegisterData) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  googleSignIn: async (idToken: string) => {
    const response = await api.post('/auth/google', { idToken });
    return response.data as { token?: string; requiresProfileCompletion?: boolean; userId?: number };
  },

  completeGoogleProfile: async (payload: { userId: number; dni: string; phone: string; birthDate: string }) => {
    const response = await api.post('/auth/complete-google-profile', payload);
    return response.data as { message?: string; token?: string };
  },

  forgotPassword: async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data as { message: string };
  },

  resetPassword: async (payload: { email: string; token: string; newPassword: string }) => {
    const response = await api.post('/auth/reset-password', payload);
    return response.data as { message: string };
  }
};