import { apiClient } from '../lib/api-client';

export const settingsService = {
  async getTaxRate() {
    const response = await apiClient.get<{
      success: boolean;
      data: { taxRate: number };
    }>('/settings/tax-rate');
    return response.data.data;
  },

  async updateTaxRate(taxRate: number) {
    const response = await apiClient.put<{
      success: boolean;
      message: string;
      data: { taxRate: number };
    }>('/settings/tax-rate', { taxRate });
    return response.data;
  },
};
