# Story 8.7: System Configuration Management UI

**Epic:** Epic 8 - Audit Trail Viewer & Advanced Features
**Story ID:** STORY-8.7
**Priority:** Medium
**Estimated Effort:** 6-8 hours
**Dependencies:** None
**Status:** Draft — Phase 2 (v2.0 — Revised)

---

## User Story

**As an** admin,
**I want** to manage system settings through UI without code changes,
**So that** configuration is easy and doesn't require developer intervention.

---

## Acceptance Criteria

1. **Database Schema:**
   - [ ] USE the existing `SystemSetting` model (id, key, value, dataType, label, category, createdAt, updatedAt)
   - [ ] ADD `updatedBy` (String?, nullable) field via migration — tracks which user last changed the setting
   - [ ] DO NOT create a new `SystemConfig` model

2. **Configuration Categories:**
   - [ ] **General:** company name, logo URL, timezone, date format
   - [ ] **Tax:** default sales tax rate, withholding tax rates
   - [ ] **Inventory:** low stock threshold multiplier, adjustment approval threshold
   - [ ] **Recovery:** DSO target, collection effectiveness target
   - [ ] **Security:** session timeout, password policy, login attempt limit

3. **Backend API:**
   - [ ] POST /api/v1/settings - creates a setting entry
   - [ ] PUT /api/v1/settings/:key - updates setting value with validation
   - [ ] GET /api/v1/settings - returns all settings grouped by category
   - [ ] GET /api/v1/settings/:key - returns specific setting
   - [ ] Validation: type checking based on existing `dataType` field ("string", "number", "boolean")
   - [ ] Range validation: min/max for numeric values
   - [ ] Enum validation: allowedValues for restricted choices

4. **Frontend - System Settings Page:**
   - [ ] Category tab buttons (General, Tax, Inventory, Recovery, Security) — inline button pattern, no Tabs component
   - [ ] Configuration forms with appropriate input types
   - [ ] "Save" button per category
   - [ ] "Reset to Defaults" button
   - [ ] Displays current values with edit capability
   - [ ] Validates inputs before saving
   - [ ] Displays success toast on save

5. **Authorization:**
   - [ ] Only Admin role can access system configuration

6. **Audit Trail:**
   - [ ] Configuration changes logged via `AuditService.log()` with correct field names

---

## Dev Notes

### Schema Change (Migration Required)

The `SystemSetting` model already exists in `prisma/schema.prisma`:

```prisma
model SystemSetting {
  id        String   @id @default(cuid())
  key       String   @unique  // e.g., "TAX_RATE", "CURRENCY", "BUSINESS_NAME"
  value     String   @db.Text
  dataType  String   // "number", "string", "boolean"
  label     String   // Human-readable label
  category  String?  // "tax", "general", "invoice", etc.
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([category])
  @@map("system_settings")
}
```

**Migration needed** -- add `updatedBy` field:

```prisma
model SystemSetting {
  id        String   @id @default(cuid())
  key       String   @unique
  value     String   @db.Text
  dataType  String   // "number", "string", "boolean"
  label     String
  category  String?
  updatedBy String?  // <-- NEW: userId of last editor (nullable for seed data)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([category])
  @@map("system_settings")
}
```

> **Note:** `updatedBy` is a plain String, not a relation to User. The SystemSetting model does not have a User relation and adding one would require adding a corresponding relation field on User. For MVP, store the userId as a plain string.

### Configuration Schema Definition

```typescript
// Uses the existing dataType values: "string", "number", "boolean"
// NO new ConfigValueType enum needed — SystemSetting.dataType already serves this purpose.

interface SettingSchema {
  dataType: 'string' | 'number' | 'boolean';
  min?: number;
  max?: number;
  allowedValues?: string[];
  defaultValue: string; // Stored as string in DB (value is @db.Text)
  label: string;
  category: string;
}

const SETTINGS_SCHEMA: Record<string, SettingSchema> = {
  // General settings
  COMPANY_NAME: {
    dataType: 'string',
    defaultValue: 'Hisham Traders',
    label: 'Company Name',
    category: 'general'
  },
  COMPANY_LOGO_URL: {
    dataType: 'string',
    defaultValue: '',
    label: 'Company Logo URL',
    category: 'general'
  },
  TIMEZONE: {
    dataType: 'string',
    allowedValues: ['UTC', 'Asia/Karachi', 'Asia/Dubai'],
    defaultValue: 'Asia/Karachi',
    label: 'Timezone',
    category: 'general'
  },
  DATE_FORMAT: {
    dataType: 'string',
    allowedValues: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'],
    defaultValue: 'DD/MM/YYYY',
    label: 'Date Format',
    category: 'general'
  },

  // Tax settings
  DEFAULT_SALES_TAX_RATE: {
    dataType: 'number',
    min: 0,
    max: 100,
    defaultValue: '17',
    label: 'Default Sales Tax Rate (%)',
    category: 'tax'
  },
  WITHHOLDING_TAX_RATE: {
    dataType: 'number',
    min: 0,
    max: 100,
    defaultValue: '0.5',
    label: 'Withholding Tax Rate (%)',
    category: 'tax'
  },

  // Inventory settings
  LOW_STOCK_THRESHOLD_MULTIPLIER: {
    dataType: 'number',
    min: 0.1,
    max: 10,
    defaultValue: '1.5',
    label: 'Low Stock Threshold Multiplier',
    category: 'inventory'
  },
  ADJUSTMENT_APPROVAL_THRESHOLD: {
    dataType: 'number',
    min: 0,
    max: 1000000,
    defaultValue: '5000',
    label: 'Adjustment Approval Threshold (Rs.)',
    category: 'inventory'
  },

  // Recovery settings
  DSO_TARGET_DAYS: {
    dataType: 'number',
    min: 1,
    max: 365,
    defaultValue: '32',
    label: 'DSO Target (Days)',
    category: 'recovery'
  },
  COLLECTION_EFFECTIVENESS_TARGET: {
    dataType: 'number',
    min: 0,
    max: 100,
    defaultValue: '90',
    label: 'Collection Effectiveness Target (%)',
    category: 'recovery'
  },

  // Security settings
  SESSION_TIMEOUT_MINUTES: {
    dataType: 'number',
    min: 5,
    max: 1440,
    defaultValue: '30',
    label: 'Session Timeout (Minutes)',
    category: 'security'
  },
  LOGIN_ATTEMPT_LIMIT: {
    dataType: 'number',
    min: 1,
    max: 10,
    defaultValue: '5',
    label: 'Login Attempt Limit',
    category: 'security'
  }
};
```

### Backend -- Update Setting Service

```typescript
import { prisma } from '../prisma.js';
import { AuditService } from '../services/audit.service.js';
import { BadRequestError } from '../errors.js';

async function updateSystemSetting(
  key: string,
  value: string,
  userId: string
): Promise<void> {
  const schema = SETTINGS_SCHEMA[key];
  if (!schema) {
    throw new BadRequestError(`Unknown setting key: ${key}`);
  }

  // Validate value based on dataType
  validateSettingValue(key, value, schema);

  await prisma.systemSetting.upsert({
    where: { key },
    update: {
      value: String(value),
      updatedBy: userId
    },
    create: {
      key,
      value: String(value),
      dataType: schema.dataType,
      label: schema.label,
      category: schema.category
    }
  });

  // Audit log with correct AuditService.log() signature
  await AuditService.log({
    userId,
    action: 'UPDATE',
    entityType: 'SystemSetting',
    entityId: key,
    notes: `Setting "${key}" updated to "${value}"`
  });
}

function validateSettingValue(key: string, value: string, schema: SettingSchema): void {
  if (schema.dataType === 'number') {
    const num = Number(value);
    if (isNaN(num)) {
      throw new BadRequestError(`${key} must be a valid number`);
    }
    if (schema.min !== undefined && num < schema.min) {
      throw new BadRequestError(`${key} must be >= ${schema.min}`);
    }
    if (schema.max !== undefined && num > schema.max) {
      throw new BadRequestError(`${key} must be <= ${schema.max}`);
    }
  }

  if (schema.dataType === 'boolean') {
    if (value !== 'true' && value !== 'false') {
      throw new BadRequestError(`${key} must be "true" or "false"`);
    }
  }

  if (schema.allowedValues && !schema.allowedValues.includes(value)) {
    throw new BadRequestError(
      `${key} must be one of: ${schema.allowedValues.join(', ')}`
    );
  }
}

async function getSystemSetting(key: string): Promise<string> {
  const schema = SETTINGS_SCHEMA[key];
  if (!schema) {
    throw new BadRequestError(`Unknown setting key: ${key}`);
  }

  const setting = await prisma.systemSetting.findUnique({
    where: { key }
  });

  return setting ? setting.value : schema.defaultValue;
}

async function getAllSystemSettings(): Promise<Record<string, any>> {
  const settings = await prisma.systemSetting.findMany();
  const result: Record<string, string> = {};

  for (const setting of settings) {
    result[setting.key] = setting.value;
  }

  // Fill in defaults for missing keys
  for (const [key, schema] of Object.entries(SETTINGS_SCHEMA)) {
    if (!(key in result)) {
      result[key] = schema.defaultValue;
    }
  }

  return result;
}
```

### Frontend -- System Settings Page

Uses inline tab buttons pattern (same as `AdminDashboard.tsx`). No `Tabs`/`Tab` components.

```tsx
import { useState, FC } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiClient } from '../../lib/api-client';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Checkbox } from '../../components/ui/Checkbox';
import { Spinner } from '../../components/ui/Spinner';

const categories = [
  { id: 'general', label: 'General' },
  { id: 'tax', label: 'Tax' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'recovery', label: 'Recovery' },
  { id: 'security', label: 'Security' }
];

export const SystemSettingsPage: FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const response = await apiClient.get('/settings');
      return response.data.data;
    }
  });

  const updateSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const response = await apiClient.put(`/settings/${key}`, { value });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      toast.success('Setting updated successfully');
    },
    onError: () => {
      toast.error('Failed to update setting');
    }
  });

  if (isLoading) {
    return <Spinner size={48} className="h-64" />;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">System Settings</h1>

      {/* Tab buttons — inline pattern (same as AdminDashboard.tsx) */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`py-4 px-1 border-b-2 font-semibold text-sm transition ${
                activeTab === cat.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <Card>
        <div className="p-6">
          {/* Render settings for the active category */}
          {/* Each setting renders as Input, Select, or Checkbox based on dataType */}
        </div>
      </Card>
    </div>
  );
};
```

---

### Key Corrections (from v1.0)

1. **CRITICAL: Removed duplicate `SystemConfig` model** -- v1.0 proposed a new `SystemConfig` Prisma model that duplicates the existing `SystemSetting` model. All references changed from `prisma.systemConfig` to `prisma.systemSetting`.
2. **API path corrected** -- `/api/system-config` changed to `/api/v1/settings` to match the project's API base URL pattern.
3. **Removed invented `ConfigValueType` enum** -- SystemSetting already has a `dataType` field storing `"number"`, `"string"`, `"boolean"`. No new enum needed.
4. **Fixed audit logging** -- `auditLogger.log({ resource, resourceId, details })` replaced with `AuditService.log({ userId, action, entityType, entityId, notes })` to match the actual service signature.
5. **Removed `Tabs`/`Tab` components** -- these do not exist in the codebase. Replaced with inline tab button pattern matching `AdminDashboard.tsx`.
6. **Removed User relation on SystemSetting** -- v1.0 had `user User @relation(...)` which does not exist. `updatedBy` is stored as a plain String.
7. **Frontend uses `apiClient`** -- replaced raw `fetch()` calls with axios `apiClient` pattern from `../../lib/api-client`.
8. **`Card.Body` not used** -- replaced with `<div className="p-6">` wrapper inside Card.
9. **`updatedBy` field noted as requiring migration** -- does not currently exist on SystemSetting.

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
| 2026-02-10 | 2.0     | Major revision: use existing SystemSetting model instead of duplicate SystemConfig, fix API paths to /api/v1/settings, fix AuditService.log() signature, replace Tabs/Tab with inline button pattern, replace fetch() with apiClient, note updatedBy migration requirement | Claude (Dev Review) |
