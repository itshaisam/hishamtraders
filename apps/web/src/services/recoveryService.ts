import { apiClient } from '../lib/api-client';

// ---- Types ----
export interface RecoveryScheduleClient {
  id: string;
  name: string;
  city: string | null;
  area: string | null;
  balance: number;
  recoveryDay: string;
  recoveryAgent: { id: string; name: string } | null;
  lastVisit: { visitDate: string; outcome: string } | null;
  pendingPromises: number;
}

export interface RecoveryAgent {
  id: string;
  name: string;
  email: string;
  assignedClients: number;
}

export interface RecoveryVisit {
  id: string;
  visitNumber: string;
  clientId: string;
  client: { id: string; name: string };
  visitDate: string;
  visitTime: string | null;
  outcome: string;
  amountCollected: number;
  promiseDate: string | null;
  promiseAmount: number | null;
  notes: string | null;
  visitor: { id: string; name: string };
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
}

export interface CreateVisitDto {
  clientId: string;
  visitDate: string;
  visitTime?: string;
  outcome: string;
  amountCollected?: number;
  promiseDate?: string;
  promiseAmount?: number;
  notes?: string;
  latitude?: number;
  longitude?: number;
}

export interface PaymentPromise {
  id: string;
  clientId: string;
  client: { id: string; name: string };
  promiseDate: string;
  promiseAmount: number;
  actualPaymentDate: string | null;
  actualAmount: number | null;
  status: string;
  recoveryVisitId: string | null;
  notes: string | null;
  creator: { id: string; name: string };
  createdAt: string;
}

export interface CreatePromiseDto {
  clientId: string;
  promiseDate: string;
  promiseAmount: number;
  notes?: string;
}

export interface AgentPerformance {
  agentId: string;
  agentName: string;
  totalVisits: number;
  totalCollected: number;
  assignedClients: number;
  fulfillmentRate: number;
  visitsByOutcome?: Record<string, number>;
  promiseStats?: {
    total: number;
    fulfilled: number;
    broken: number;
    pending: number;
  };
}

export interface CollectionEfficiencyMetrics {
  totalInvoiced: number;
  totalCollected: number;
  collectionRate: number;
  dso: number;
  cei: number;
  totalOutstanding: number;
  overdueAmount: number;
}

export interface CollectionTrendRow {
  month: string;
  totalInvoiced: number;
  totalCollected: number;
  collectionRate: number;
}

export interface RecoveryDashboardData {
  todaySchedule: { todayDay: string; scheduledClients: number; completedVisits: number };
  duePromises: { count: number; totalAmount: number };
  collectionMetrics: { todayCollected: number; weekCollected: number; monthCollected: number };
  overdueSummary: Record<string, { clients: number; amount: number }>;
  recentVisits: any[];
  alertCount: number;
  fulfillmentRate: { fulfilled: number; total: number; rate: number };
  topOverdueClients: { id: string; name: string; balance: number; city: string | null; lastVisitDate: string | null }[];
}

// ---- Alert Types ----
export interface Alert {
  id: string;
  type: string;
  priority: string;
  message: string;
  relatedType: string | null;
  relatedId: string | null;
  acknowledged: boolean;
  createdAt: string;
}

// ---- Aging Analysis ----
export interface AgingRow {
  clientId: string;
  clientName: string;
  city: string | null;
  area: string | null;
  balance: number;
  creditLimit: number;
  recoveryAgent: string | null;
  current: number;
  days1to7: number;
  days8to14: number;
  days15to30: number;
  days30plus: number;
  totalOverdue: number;
  oldestDueDate: string | null;
}

export interface AgingAnalysisData {
  clients: AgingRow[];
  summary: {
    totalOutstanding: number;
    currentTotal: number;
    days1to7Total: number;
    days8to14Total: number;
    days15to30Total: number;
    days30plusTotal: number;
    clientCount: number;
  };
}

// ---- Service ----
export const recoveryService = {
  // Schedule
  async getSchedule(date?: string) {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    const res = await apiClient.get<{ success: boolean; data: any }>(`/recovery/schedule?${params}`);
    return res.data;
  },

  async getTodayRoute() {
    const res = await apiClient.get<{ success: boolean; data: RecoveryScheduleClient[] }>('/recovery/schedule/today');
    return res.data;
  },

  async getRecoveryAgents() {
    const res = await apiClient.get<{ success: boolean; data: RecoveryAgent[] }>('/recovery/agents');
    return res.data;
  },

  // Visits
  async createVisit(data: CreateVisitDto) {
    const res = await apiClient.post<{ success: boolean; data: RecoveryVisit }>('/recovery/visits', data);
    return res.data;
  },

  async getVisits(params: { clientId?: string; page?: number; limit?: number } = {}) {
    const qs = new URLSearchParams();
    if (params.clientId) qs.append('clientId', params.clientId);
    if (params.page) qs.append('page', params.page.toString());
    if (params.limit) qs.append('limit', params.limit.toString());
    const res = await apiClient.get<{ success: boolean; data: RecoveryVisit[]; meta?: any }>(`/recovery/visits?${qs}`);
    return res.data;
  },

  async getMyVisits(dateFrom?: string, dateTo?: string) {
    const qs = new URLSearchParams();
    if (dateFrom) qs.append('dateFrom', dateFrom);
    if (dateTo) qs.append('dateTo', dateTo);
    const res = await apiClient.get<{ success: boolean; data: RecoveryVisit[] }>(`/recovery/visits/my?${qs}`);
    return res.data;
  },

  // Promises
  async createPromise(data: CreatePromiseDto) {
    const res = await apiClient.post<{ success: boolean; data: PaymentPromise }>('/recovery/promises', data);
    return res.data;
  },

  async fulfillPromise(id: string) {
    const res = await apiClient.put<{ success: boolean; data: PaymentPromise }>(`/recovery/promises/${id}/fulfill`);
    return res.data;
  },

  async cancelPromise(id: string) {
    const res = await apiClient.put<{ success: boolean; data: PaymentPromise }>(`/recovery/promises/${id}/cancel`);
    return res.data;
  },

  async getDuePromises() {
    const res = await apiClient.get<{ success: boolean; data: PaymentPromise[] }>('/recovery/promises/due');
    return res.data;
  },

  async getClientPromises(clientId: string) {
    const res = await apiClient.get<{ success: boolean; data: PaymentPromise[] }>(`/recovery/promises?clientId=${clientId}`);
    return res.data;
  },

  async getPromiseFulfillmentRate(params: { agentId?: string; dateFrom?: string; dateTo?: string } = {}) {
    const qs = new URLSearchParams();
    if (params.agentId) qs.append('agentId', params.agentId);
    if (params.dateFrom) qs.append('dateFrom', params.dateFrom);
    if (params.dateTo) qs.append('dateTo', params.dateTo);
    const res = await apiClient.get<{ success: boolean; data: any }>(`/recovery/promises/fulfillment-rate?${qs}`);
    return res.data;
  },

  // Alerts
  async getAlerts(acknowledged?: boolean) {
    const qs = new URLSearchParams();
    if (acknowledged !== undefined) qs.append('acknowledged', String(acknowledged));
    const res = await apiClient.get<{ success: boolean; data: Alert[] }>(`/alerts?${qs}`);
    return res.data;
  },

  async acknowledgeAlert(id: string) {
    const res = await apiClient.put<{ success: boolean }>(`/alerts/${id}/acknowledge`);
    return res.data;
  },

  async getUnreadAlertCount() {
    const res = await apiClient.get<{ success: boolean; data: { count: number } }>('/alerts/unread-count');
    return res.data;
  },

  async checkOverdue() {
    const res = await apiClient.post<{ success: boolean; data: any }>('/alerts/check-overdue');
    return res.data;
  },

  // Aging Analysis
  async getAgingAnalysis(params: { agentId?: string; city?: string; minBalance?: number; asOfDate?: string } = {}) {
    const qs = new URLSearchParams();
    if (params.agentId) qs.append('agentId', params.agentId);
    if (params.city) qs.append('city', params.city);
    if (params.minBalance) qs.append('minBalance', params.minBalance.toString());
    if (params.asOfDate) qs.append('asOfDate', params.asOfDate);
    const res = await apiClient.get<{ success: boolean; data: AgingAnalysisData }>(`/reports/aging-analysis?${qs}`);
    return res.data;
  },

  async exportAgingAnalysis(params: { agentId?: string; city?: string; asOfDate?: string } = {}) {
    const qs = new URLSearchParams();
    if (params.agentId) qs.append('agentId', params.agentId);
    if (params.city) qs.append('city', params.city);
    if (params.asOfDate) qs.append('asOfDate', params.asOfDate);
    const res = await apiClient.get(`/reports/aging-analysis/export?${qs}`, { responseType: 'blob' });
    return res.data;
  },

  // Agent Performance
  async getAgentPerformance(agentId: string, dateFrom?: string, dateTo?: string) {
    const qs = new URLSearchParams();
    if (dateFrom) qs.append('dateFrom', dateFrom);
    if (dateTo) qs.append('dateTo', dateTo);
    const res = await apiClient.get<{ success: boolean; data: AgentPerformance }>(`/recovery/agents/${agentId}/performance?${qs}`);
    return res.data;
  },

  async getAllAgentsPerformance(dateFrom?: string, dateTo?: string) {
    const qs = new URLSearchParams();
    if (dateFrom) qs.append('dateFrom', dateFrom);
    if (dateTo) qs.append('dateTo', dateTo);
    const res = await apiClient.get<{ success: boolean; data: AgentPerformance[] }>(`/recovery/agents/performance?${qs}`);
    return res.data;
  },

  // Collection Efficiency
  async getCollectionEfficiency(params: { dateFrom?: string; dateTo?: string; agentId?: string } = {}) {
    const qs = new URLSearchParams();
    if (params.dateFrom) qs.append('dateFrom', params.dateFrom);
    if (params.dateTo) qs.append('dateTo', params.dateTo);
    if (params.agentId) qs.append('agentId', params.agentId);
    const res = await apiClient.get<{ success: boolean; data: CollectionEfficiencyMetrics }>(`/reports/collection-efficiency?${qs}`);
    return res.data;
  },

  async getCollectionTrend(months?: number) {
    const qs = new URLSearchParams();
    if (months) qs.append('months', months.toString());
    const res = await apiClient.get<{ success: boolean; data: CollectionTrendRow[] }>(`/reports/collection-efficiency/trend?${qs}`);
    return res.data;
  },

  // Recovery Reports
  async getVisitActivityReport(params: { agentId?: string; dateFrom?: string; dateTo?: string; outcome?: string; page?: number; limit?: number } = {}) {
    const qs = new URLSearchParams();
    if (params.agentId) qs.append('agentId', params.agentId);
    if (params.dateFrom) qs.append('dateFrom', params.dateFrom);
    if (params.dateTo) qs.append('dateTo', params.dateTo);
    if (params.outcome) qs.append('outcome', params.outcome);
    if (params.page) qs.append('page', params.page.toString());
    if (params.limit) qs.append('limit', params.limit.toString());
    const res = await apiClient.get<{ success: boolean; data: any[]; summary: any; meta: any }>(`/reports/recovery/visits?${qs}`);
    return res.data;
  },

  async getCollectionSummaryReport(params: { dateFrom?: string; dateTo?: string; agentId?: string } = {}) {
    const qs = new URLSearchParams();
    if (params.dateFrom) qs.append('dateFrom', params.dateFrom);
    if (params.dateTo) qs.append('dateTo', params.dateTo);
    if (params.agentId) qs.append('agentId', params.agentId);
    const res = await apiClient.get<{ success: boolean; data: any }>(`/reports/recovery/collections?${qs}`);
    return res.data;
  },

  async getOverdueClientsReport(params: { minDaysOverdue?: number; city?: string; agentId?: string; page?: number; limit?: number } = {}) {
    const qs = new URLSearchParams();
    if (params.minDaysOverdue) qs.append('minDaysOverdue', params.minDaysOverdue.toString());
    if (params.city) qs.append('city', params.city);
    if (params.agentId) qs.append('agentId', params.agentId);
    if (params.page) qs.append('page', params.page.toString());
    if (params.limit) qs.append('limit', params.limit.toString());
    const res = await apiClient.get<{ success: boolean; data: any[]; summary: any; meta: any }>(`/reports/recovery/overdue?${qs}`);
    return res.data;
  },

  async getAgentProductivityReport(params: { dateFrom?: string; dateTo?: string } = {}) {
    const qs = new URLSearchParams();
    if (params.dateFrom) qs.append('dateFrom', params.dateFrom);
    if (params.dateTo) qs.append('dateTo', params.dateTo);
    const res = await apiClient.get<{ success: boolean; data: any[] }>(`/reports/recovery/productivity?${qs}`);
    return res.data;
  },

  // Recovery Dashboard
  async getRecoveryDashboard() {
    const res = await apiClient.get<{ success: boolean; data: RecoveryDashboardData }>('/recovery/dashboard');
    return res.data;
  },
};
