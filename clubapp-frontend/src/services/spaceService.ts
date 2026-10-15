import { api } from './api';
import type { Space, SaveSpaceRequest } from '../types/space';

export const spaceService = {
  getSpaces: async (): Promise<Space[]> => {
    const response = await api.get<Space[]>('/spaces');
    return response.data;
  },
  createSpace: async (data: SaveSpaceRequest): Promise<Space> => {
    const response = await api.post<Space>('/spaces', data);
    return response.data;
  },
  updateSpace: async (id: number, data: SaveSpaceRequest): Promise<Space> => {
    const response = await api.put<Space>(`/spaces/${id}`, data);
    return response.data;
  },
  deleteSpace: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/spaces/${id}`);
    return response.data;
  },
};
