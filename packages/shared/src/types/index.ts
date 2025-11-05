// Shared TypeScript types

export interface User {
  id: string;
  email: string;
  name: string;
  roleId: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: string;
  name: string;
  description: string;
}

export type UserRole = 'ADMIN' | 'WAREHOUSE_MANAGER' | 'SALES_OFFICER' | 'ACCOUNTANT' | 'RECOVERY_AGENT';
