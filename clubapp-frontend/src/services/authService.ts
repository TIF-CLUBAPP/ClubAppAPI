import { api } from './api';
import type { AuthenticationRequest, AuthenticationResponse } from '../types/auth';

export const authService = {
  login: async (credentials: AuthenticationRequest): Promise<AuthenticationResponse> => {
    const response = await api.post<AuthenticationResponse>('/Users/login', credentials);
    return response.data;
  },
};