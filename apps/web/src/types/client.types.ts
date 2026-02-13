export type ClientStatus = 'ACTIVE' | 'INACTIVE';

export type CreditStatus = 'good' | 'warning' | 'danger';

export interface ClientInvoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  total: number;
  paidAmount: number;
  status: string;
  paymentType: string;
}

export type RecoveryDay = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'NONE';

export interface Client {
  id: string;
  name: string;
  contactPerson?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  city?: string | null;
  area?: string | null;
  creditLimit: number;
  paymentTermsDays: number;
  balance: number;
  status: ClientStatus;
  recoveryDay?: RecoveryDay | null;
  recoveryAgentId?: string | null;
  createdAt: string;
  updatedAt: string;
  creditUtilization?: number;
  creditStatus?: CreditStatus;
  invoices?: ClientInvoice[];
}

export interface CreateClientDto {
  name: string;
  contactPerson?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  city?: string;
  area?: string;
  creditLimit?: number;
  paymentTermsDays?: number;
  status?: ClientStatus;
  recoveryDay?: RecoveryDay;
  recoveryAgentId?: string;
}

export interface UpdateClientDto {
  name?: string;
  contactPerson?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  city?: string;
  area?: string;
  creditLimit?: number;
  paymentTermsDays?: number;
  status?: ClientStatus;
  recoveryDay?: RecoveryDay;
  recoveryAgentId?: string;
}

export interface ClientFilters {
  search?: string;
  city?: string;
  status?: ClientStatus;
  hasBalance?: boolean;
  page?: number;
  limit?: number;
}

export interface ClientsResponse {
  success: boolean;
  data: Client[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ClientResponse {
  success: boolean;
  data: Client;
  message?: string;
}

export interface CitiesResponse {
  success: boolean;
  data: string[];
}
