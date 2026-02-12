import { apiClient } from '../lib/api-client';
import {
  AccountHead,
  CreateAccountHeadDto,
  UpdateAccountHeadDto,
  AccountHeadFilters,
  JournalEntry,
  CreateJournalEntryDto,
  UpdateJournalEntryDto,
  JournalEntryFilters,
  BankAccount,
  PettyCashBalance,
  PettyCashTransaction,
} from '../types/accounting.types';

export const accountingService = {
  async getAccountHeads(filters: AccountHeadFilters = {}) {
    const params = new URLSearchParams();

    if (filters.accountType) params.append('accountType', filters.accountType);
    if (filters.status) params.append('status', filters.status);
    if (filters.parentId) params.append('parentId', filters.parentId);
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get<{
      status: string;
      data: AccountHead[];
      meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>(`/account-heads?${params.toString()}`);

    return response.data;
  },

  async getAccountHeadTree() {
    const response = await apiClient.get<{
      status: string;
      data: AccountHead[];
    }>('/account-heads/tree');

    return response.data.data;
  },

  async getAccountHeadById(id: string) {
    const response = await apiClient.get<{
      status: string;
      data: AccountHead;
    }>(`/account-heads/${id}`);

    return response.data.data;
  },

  async createAccountHead(data: CreateAccountHeadDto) {
    const response = await apiClient.post<{
      status: string;
      data: AccountHead;
    }>('/account-heads', data);

    return response.data.data;
  },

  async updateAccountHead(id: string, data: UpdateAccountHeadDto) {
    const response = await apiClient.put<{
      status: string;
      data: AccountHead;
    }>(`/account-heads/${id}`, data);

    return response.data.data;
  },

  async deleteAccountHead(id: string) {
    const response = await apiClient.delete<{
      status: string;
      message: string;
    }>(`/account-heads/${id}`);

    return response.data;
  },

  // Journal Entry methods
  async getJournalEntries(filters: JournalEntryFilters = {}) {
    const params = new URLSearchParams();

    if (filters.status) params.append('status', filters.status);
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get<{
      status: string;
      data: JournalEntry[];
      meta: { total: number; page: number; limit: number; totalPages: number };
    }>(`/journal-entries?${params.toString()}`);

    return response.data;
  },

  async getJournalEntryById(id: string) {
    const response = await apiClient.get<{
      status: string;
      data: JournalEntry;
    }>(`/journal-entries/${id}`);

    return response.data.data;
  },

  async createJournalEntry(data: CreateJournalEntryDto) {
    const response = await apiClient.post<{
      status: string;
      data: JournalEntry;
    }>('/journal-entries', data);

    return response.data.data;
  },

  async updateJournalEntry(id: string, data: UpdateJournalEntryDto) {
    const response = await apiClient.put<{
      status: string;
      data: JournalEntry;
    }>(`/journal-entries/${id}`, data);

    return response.data.data;
  },

  async postJournalEntry(id: string) {
    const response = await apiClient.post<{
      status: string;
      data: JournalEntry;
    }>(`/journal-entries/${id}/post`);

    return response.data.data;
  },

  async deleteJournalEntry(id: string) {
    const response = await apiClient.delete<{
      status: string;
      message: string;
    }>(`/journal-entries/${id}`);

    return response.data;
  },

  // Bank Accounts (Story 5.7)
  async getBankAccounts() {
    const response = await apiClient.get<{
      status: string;
      data: BankAccount[];
    }>('/bank-accounts');

    return response.data.data;
  },

  // Petty Cash (Story 5.9)
  async getPettyCashBalance() {
    const response = await apiClient.get<{
      status: string;
      data: PettyCashBalance;
    }>('/petty-cash/balance');

    return response.data.data;
  },

  async getPettyCashTransactions(limit: number = 20) {
    const response = await apiClient.get<{
      status: string;
      data: PettyCashTransaction[];
    }>(`/petty-cash/transactions?limit=${limit}`);

    return response.data.data;
  },

  async createPettyCashAdvance(amount: number, bankAccountId: string) {
    const response = await apiClient.post<{
      status: string;
      data: any;
      message: string;
    }>('/petty-cash/advance', { amount, bankAccountId });

    return response.data;
  },
};
