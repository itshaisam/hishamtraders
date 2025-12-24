export interface CreditLimitCheck {
  status: 'OK' | 'WARNING' | 'EXCEEDED';
  currentBalance: number;
  creditLimit: number;
  newTotal: number;
  newBalance: number;
  utilization: number;
  message: string;
}

export interface ClientCreditAlert {
  id: string;
  name: string;
  balance: number;
  creditLimit: number;
  city: string | null;
  phone: string | null;
  utilization: number;
  status: 'EXCEEDED' | 'WARNING';
}

export interface CreditLimitSummary {
  totalClients: number;
  exceeded: number;
  warning: number;
  healthy: number;
  totalBalance: number;
  totalLimit: number;
  averageUtilization: number;
}

export interface CreditLimitReportResponse {
  success: boolean;
  data: ClientCreditAlert[];
  threshold: number;
}

export interface CreditLimitSummaryResponse {
  success: boolean;
  data: CreditLimitSummary;
}
