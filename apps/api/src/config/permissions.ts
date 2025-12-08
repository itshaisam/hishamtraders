/**
 * Permission matrix defining what each role can do
 */
export const PERMISSIONS = {
  // User Management
  users: {
    create: ['ADMIN'],
    read: ['ADMIN'],
    update: ['ADMIN'],
    delete: ['ADMIN'],
  },

  // Inventory Management
  products: {
    create: ['ADMIN', 'WAREHOUSE_MANAGER'],
    read: ['ADMIN', 'WAREHOUSE_MANAGER', 'SALES_OFFICER'],
    update: ['ADMIN', 'WAREHOUSE_MANAGER'],
    delete: ['ADMIN'],
  },

  inventory: {
    create: ['ADMIN', 'WAREHOUSE_MANAGER'],
    read: ['ADMIN', 'WAREHOUSE_MANAGER', 'SALES_OFFICER'],
    update: ['ADMIN', 'WAREHOUSE_MANAGER'],
    delete: ['ADMIN'],
  },

  suppliers: {
    create: ['ADMIN', 'ACCOUNTANT'],
    read: ['ADMIN', 'ACCOUNTANT'],
    update: ['ADMIN', 'ACCOUNTANT'],
    delete: ['ADMIN'],
  },

  purchaseOrders: {
    create: ['ADMIN', 'ACCOUNTANT', 'WAREHOUSE_MANAGER'],
    read: ['ADMIN', 'ACCOUNTANT', 'WAREHOUSE_MANAGER'],
    update: ['ADMIN', 'ACCOUNTANT'],
    delete: ['ADMIN'],
  },

  categories: {
    create: ['ADMIN'],
    read: ['ADMIN', 'WAREHOUSE_MANAGER', 'SALES_OFFICER'],
    update: ['ADMIN'],
    delete: ['ADMIN'],
  },

  brands: {
    create: ['ADMIN'],
    read: ['ADMIN', 'WAREHOUSE_MANAGER', 'SALES_OFFICER'],
    update: ['ADMIN'],
    delete: ['ADMIN'],
  },

  uoms: {
    create: ['ADMIN'],
    read: ['ADMIN', 'WAREHOUSE_MANAGER', 'SALES_OFFICER'],
    update: ['ADMIN'],
    delete: ['ADMIN'],
  },

  warehouses: {
    create: ['ADMIN'],
    read: ['ADMIN', 'WAREHOUSE_MANAGER', 'SALES_OFFICER'],
    update: ['ADMIN'],
    delete: ['ADMIN'],
  },

  // Sales & Invoicing
  invoices: {
    create: ['ADMIN', 'SALES_OFFICER'],
    read: ['ADMIN', 'SALES_OFFICER', 'ACCOUNTANT', 'RECOVERY_AGENT'],
    update: ['ADMIN', 'SALES_OFFICER', 'ACCOUNTANT'],
    delete: ['ADMIN'],
  },

  clients: {
    create: ['ADMIN', 'SALES_OFFICER'],
    read: ['ADMIN', 'SALES_OFFICER', 'ACCOUNTANT', 'RECOVERY_AGENT'],
    update: ['ADMIN', 'SALES_OFFICER', 'ACCOUNTANT'],
    delete: ['ADMIN'],
  },

  // Financial Management
  payments: {
    create: ['ADMIN', 'ACCOUNTANT', 'RECOVERY_AGENT'],
    read: ['ADMIN', 'ACCOUNTANT', 'RECOVERY_AGENT'],
    update: ['ADMIN', 'ACCOUNTANT'],
    delete: ['ADMIN'],
  },

  expenses: {
    create: ['ADMIN', 'ACCOUNTANT'],
    read: ['ADMIN', 'ACCOUNTANT'],
    update: ['ADMIN', 'ACCOUNTANT'],
    delete: ['ADMIN'],
  },

  // Reports & Analytics
  reports: {
    read: ['ADMIN', 'ACCOUNTANT'],
  },

  // Audit Logs
  auditLogs: {
    read: ['ADMIN'],
  },
} as const;

export type PermissionResource = keyof typeof PERMISSIONS;
export type PermissionAction = 'create' | 'read' | 'update' | 'delete';
