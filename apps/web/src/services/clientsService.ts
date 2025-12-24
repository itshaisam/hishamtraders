import { apiClient } from '../lib/api-client';
import {
  Client,
  CreateClientDto,
  UpdateClientDto,
  ClientFilters,
  ClientsResponse,
  ClientResponse,
  CitiesResponse,
} from '../types/client.types';

export const clientsService = {
  async getClients(filters?: ClientFilters): Promise<ClientsResponse> {
    const params = new URLSearchParams();

    if (filters?.search) params.append('search', filters.search);
    if (filters?.city) params.append('city', filters.city);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.hasBalance) params.append('hasBalance', 'true');
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get<ClientsResponse>(
      `/clients?${params.toString()}`
    );
    return response.data;
  },

  async getClientById(id: string): Promise<ClientResponse> {
    const response = await apiClient.get<ClientResponse>(`/clients/${id}`);
    return response.data;
  },

  async createClient(data: CreateClientDto): Promise<ClientResponse> {
    const response = await apiClient.post<ClientResponse>('/clients', data);
    return response.data;
  },

  async updateClient(id: string, data: UpdateClientDto): Promise<ClientResponse> {
    const response = await apiClient.put<ClientResponse>(`/clients/${id}`, data);
    return response.data;
  },

  async deleteClient(id: string): Promise<ClientResponse> {
    const response = await apiClient.delete<ClientResponse>(`/clients/${id}`);
    return response.data;
  },

  async getAllCities(): Promise<CitiesResponse> {
    const response = await apiClient.get<CitiesResponse>('/clients/cities');
    return response.data;
  },
};
