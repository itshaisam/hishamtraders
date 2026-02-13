import { Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AuditService } from '../services/audit.service.js';
import { AuthRequest } from '../types/auth.types.js';

/**
 * Map of route prefixes to entity type names.
 * Keys are the first path segment(s) after /api/v1/.
 * Checked in order — longer prefixes first for sub-resources.
 */
const ROUTE_ENTITY_MAP: Record<string, string> = {
  'inventory/adjustments': 'StockAdjustment',
  'inventory/movements': 'StockMovement',
  'purchase-orders': 'PurchaseOrder',
  'credit-notes': 'CreditNote',
  'account-heads': 'AccountHead',
  'journal-entries': 'JournalEntry',
  'bank-accounts': 'BankAccount',
  'bank-reconciliation': 'BankReconciliation',
  'petty-cash': 'PettyCash',
  'period-close': 'PeriodClose',
  'gate-passes': 'GatePass',
  'stock-transfers': 'StockTransfer',
  'stock-counts': 'StockCount',
  'payment-terms': 'PaymentTerm',
  'audit-logs': 'AuditLog',
  products: 'Product',
  suppliers: 'Supplier',
  clients: 'Client',
  invoices: 'Invoice',
  payments: 'Payment',
  warehouses: 'Warehouse',
  inventory: 'Inventory',
  categories: 'Category',
  brands: 'Brand',
  uoms: 'UOM',
  variants: 'Variant',
  users: 'User',
  expenses: 'Expense',
  settings: 'Setting',
  countries: 'Country',
  recovery: 'Recovery',
  alerts: 'Alert',
  reports: 'Report',
  dashboard: 'Dashboard',
  auth: 'Auth',
};

// Sorted by key length descending so longer prefixes match first
const SORTED_ROUTES = Object.entries(ROUTE_ENTITY_MAP).sort(
  (a, b) => b[0].length - a[0].length
);

/**
 * Check if a path segment looks like a CUID or UUID (i.e., an entity ID, not a resource name).
 */
function looksLikeId(segment: string): boolean {
  // CUIDs: start with 'c' followed by alphanumeric (25+ chars)
  if (/^c[a-z0-9]{20,}$/i.test(segment)) return true;
  // UUIDs: 8-4-4-4-12 hex pattern
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) return true;
  // Numeric IDs
  if (/^\d+$/.test(segment)) return true;
  return false;
}

/**
 * Extract entity type and ID from the request path.
 * The middleware is mounted at /api/v1, so req.path is everything after that.
 */
function extractEntityInfo(path: string): { entityType: string; entityId?: string } {
  const stripped = path.startsWith('/') ? path.slice(1) : path;

  // Match against known route prefixes
  for (const [prefix, entityType] of SORTED_ROUTES) {
    if (stripped === prefix || stripped.startsWith(prefix + '/')) {
      // Remainder after the prefix
      const remainder = stripped.slice(prefix.length + 1); // +1 for the '/'
      const remainderParts = remainder ? remainder.split('/').filter(Boolean) : [];

      // First remainder part that looks like an ID
      const entityId = remainderParts.find(looksLikeId);
      return { entityType, entityId };
    }
  }

  // Fallback: use first segment, capitalized
  const firstSegment = stripped.split('/')[0] || 'Unknown';
  return {
    entityType: firstSegment.charAt(0).toUpperCase() + firstSegment.slice(1),
  };
}

export const auditMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Only audit mutating operations
  const shouldAudit = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);

  if (!shouldAudit || !req.user) {
    return next();
  }

  // Store original res.json
  const originalJson = res.json.bind(res);

  // Override res.json to log after successful response
  res.json = function (data: any) {
    // Only log if request was successful (status < 400)
    if (res.statusCode < 400) {
      // Extract entity information from URL path
      const { entityType, entityId: pathEntityId } = extractEntityInfo(req.path);
      // Prefer ID from response body, fall back to URL path ID
      const entityId = data?.data?.id || data?.id || pathEntityId;

      // Determine action from HTTP method
      let action: 'CREATE' | 'UPDATE' | 'DELETE' = 'UPDATE';
      if (req.method === 'POST') action = 'CREATE';
      if (req.method === 'DELETE') action = 'DELETE';
      if (req.method === 'PUT' || req.method === 'PATCH') action = 'UPDATE';

      // For CREATE operations, log the submitted body fields (excluding internal fields)
      let changedFields: Prisma.InputJsonValue | undefined;
      if (action === 'CREATE' && req.body) {
        const fields: Record<string, { old: unknown; new: unknown }> = {};
        for (const [key, value] of Object.entries(req.body)) {
          if (key.startsWith('_') || key === 'password' || key === 'passwordHash') continue;
          fields[key] = { old: null, new: value };
        }
        if (Object.keys(fields).length > 0) {
          changedFields = fields as unknown as Prisma.InputJsonValue;
        }
      }

      // Log asynchronously (don't await - fire and forget)
      AuditService.log({
        userId: req.user!.userId,
        action,
        entityType,
        entityId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        changedFields,
        notes: `${action} via ${req.method} ${req.path}`,
      }).catch((err) => {
        console.error('Audit log failed:', err);
      });
    }

    // Call original res.json
    return originalJson(data);
  };

  next();
};
