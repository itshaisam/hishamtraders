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

  async getPurchaseTaxRate() {
    const response = await apiClient.get<{
      success: boolean;
      data: { purchaseTaxRate: number };
    }>('/settings/purchase-tax-rate');
    return response.data.data;
  },

  async updatePurchaseTaxRate(purchaseTaxRate: number) {
    const response = await apiClient.put<{
      success: boolean;
      message: string;
      data: { purchaseTaxRate: number };
    }>('/settings/purchase-tax-rate', { purchaseTaxRate });
    return response.data;
  },

  async getCurrencySymbol() {
    const response = await apiClient.get<{
      success: boolean;
      data: { currencySymbol: string };
    }>('/settings/currency-symbol');
    return response.data.data;
  },

  async updateCurrencySymbol(currencySymbol: string) {
    const response = await apiClient.put<{
      success: boolean;
      message: string;
      data: { currencySymbol: string };
    }>('/settings/currency-symbol', { currencySymbol });
    return response.data;
  },

  async getCompanyName() {
    const response = await apiClient.get<{
      success: boolean;
      data: { companyName: string };
    }>('/settings/company-name');
    return response.data.data;
  },

  async updateCompanyName(companyName: string) {
    const response = await apiClient.put<{
      success: boolean;
      message: string;
      data: { companyName: string };
    }>('/settings/company-name', { companyName });
    return response.data;
  },

  async getCompanyLogo() {
    const response = await apiClient.get<{
      success: boolean;
      data: { companyLogo: string };
    }>('/settings/company-logo');
    return response.data.data;
  },

  async updateCompanyLogo(companyLogo: string) {
    const response = await apiClient.put<{
      success: boolean;
      message: string;
      data: { companyLogo: string };
    }>('/settings/company-logo', { companyLogo });
    return response.data;
  },
};
