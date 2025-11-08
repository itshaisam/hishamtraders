# Story 8.7: System Configuration Management UI

**Epic:** Epic 8 - Audit Trail Viewer & Advanced Features
**Story ID:** STORY-8.7
**Priority:** Medium
**Estimated Effort:** 6-8 hours
**Dependencies:** None
**Status:** Draft - Phase 2

---

## User Story

**As an** admin,
**I want** to manage system settings through UI without code changes,
**So that** configuration is easy and doesn't require developer intervention.

---

## Acceptance Criteria

1. **Database Schema:**
   - [ ] SystemConfig table: id, key (unique), value (JSON), category, description, updatedBy, updatedAt

2. **Configuration Categories:**
   - [ ] **General:** company name, logo URL, timezone, date format
   - [ ] **Tax:** default sales tax rate, withholding tax rates
   - [ ] **Inventory:** low stock threshold multiplier, adjustment approval threshold
   - [ ] **Recovery:** DSO target, collection effectiveness target
   - [ ] **Security:** session timeout, password policy, login attempt limit
   - [ ] **Notifications:** email SMTP settings, SMS gateway config

3. **Backend API:**
   - [ ] POST /api/system-config - creates configuration entry
   - [ ] PUT /api/system-config/:key - updates configuration value with validation
   - [ ] GET /api/system-config - returns all configurations grouped by category
   - [ ] GET /api/system-config/:key - returns specific configuration
   - [ ] Configuration validation: type checking (STRING, NUMBER, BOOLEAN, DECIMAL, JSON)
   - [ ] Range validation: min/max for numeric values
   - [ ] Pattern validation: regex for string values
   - [ ] Enum validation: allowedValues for restricted choices

4. **Frontend - System Settings Page:**
   - [ ] Category tabs (General, Tax, Inventory, Recovery, Security, Notifications)
   - [ ] Configuration forms with appropriate input types
   - [ ] "Save" button per category
   - [ ] "Reset to Defaults" button
   - [ ] Displays current values with edit capability
   - [ ] Validates inputs before saving
   - [ ] Displays success message on save

5. **Authorization:**
   - [ ] Only Admin role can access system configuration

6. **Audit Trail:**
   - [ ] Configuration changes logged in audit trail

---

## Dev Notes

```prisma
model SystemConfig {
  id          String   @id @default(cuid())
  key         String   @unique
  value       String   @db.Text // Stored as JSON string
  valueType   String   // ConfigValueType enum: STRING, NUMBER, BOOLEAN, DECIMAL, JSON
  category    String
  description String?  @db.Text
  updatedBy   String
  updatedAt   DateTime @updatedAt

  user        User     @relation(fields: [updatedBy], references: [id])

  @@map("system_config")
}
```

### Configuration Value Types

```typescript
enum ConfigValueType {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  DECIMAL = 'DECIMAL',
  JSON = 'JSON'
}

interface ConfigSchema {
  valueType: ConfigValueType;
  min?: number;
  max?: number;
  pattern?: RegExp;
  allowedValues?: string[];
  default?: any;
}

// Configuration schema definition
const CONFIG_SCHEMA: Record<string, ConfigSchema> = {
  // General settings
  COMPANY_NAME: {
    valueType: ConfigValueType.STRING,
    pattern: /^.{1,255}$/,
    default: 'Hisham Traders'
  },
  COMPANY_LOGO_URL: {
    valueType: ConfigValueType.STRING,
    pattern: /^(https?:\/\/).+/,
    default: ''
  },
  TIMEZONE: {
    valueType: ConfigValueType.STRING,
    allowedValues: ['UTC', 'Asia/Karachi', 'Asia/Dubai'],
    default: 'Asia/Karachi'
  },
  DATE_FORMAT: {
    valueType: ConfigValueType.STRING,
    allowedValues: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'],
    default: 'DD/MM/YYYY'
  },

  // Tax settings
  DEFAULT_SALES_TAX_RATE: {
    valueType: ConfigValueType.DECIMAL,
    min: 0,
    max: 100,
    default: 17
  },
  WITHHOLDING_TAX_RATE: {
    valueType: ConfigValueType.DECIMAL,
    min: 0,
    max: 100,
    default: 0.5
  },

  // Inventory settings
  LOW_STOCK_THRESHOLD_MULTIPLIER: {
    valueType: ConfigValueType.DECIMAL,
    min: 0.1,
    max: 10,
    default: 1.5
  },
  ADJUSTMENT_APPROVAL_THRESHOLD: {
    valueType: ConfigValueType.DECIMAL,
    min: 0,
    max: 1000000,
    default: 5000
  },

  // Recovery settings
  DSO_TARGET_DAYS: {
    valueType: ConfigValueType.NUMBER,
    min: 1,
    max: 365,
    default: 32
  },
  COLLECTION_EFFECTIVENESS_TARGET: {
    valueType: ConfigValueType.DECIMAL,
    min: 0,
    max: 100,
    default: 90
  },

  // Security settings
  SESSION_TIMEOUT_MINUTES: {
    valueType: ConfigValueType.NUMBER,
    min: 5,
    max: 1440,
    default: 30
  },
  LOGIN_ATTEMPT_LIMIT: {
    valueType: ConfigValueType.NUMBER,
    min: 1,
    max: 10,
    default: 5
  },
  ENABLE_TWO_FACTOR_AUTH: {
    valueType: ConfigValueType.BOOLEAN,
    default: true
  }
};

async function updateSystemConfig(
  key: string,
  value: any,
  userId: string
): Promise<SystemConfig> {
  const schema = CONFIG_SCHEMA[key];
  if (!schema) {
    throw new BadRequestError(`Unknown configuration key: ${key}`);
  }

  // Validate value
  validateConfigValue(key, value, schema);

  // Convert value to appropriate type
  const convertedValue = convertToType(value, schema.valueType);

  const config = await prisma.systemConfig.upsert({
    where: { key },
    update: {
      value: JSON.stringify(convertedValue),
      updatedBy: userId,
      updatedAt: new Date()
    },
    create: {
      key,
      value: JSON.stringify(convertedValue),
      valueType: schema.valueType,
      category: getCategoryForKey(key),
      description: getDescriptionForKey(key),
      updatedBy: userId
    }
  });

  await auditLogger.log({
    action: 'UPDATE',
    userId,
    resource: 'SystemConfig',
    resourceId: config.id,
    details: { key, value: convertedValue, valueType: schema.valueType }
  });

  return config;
}

function validateConfigValue(key: string, value: any, schema: ConfigSchema): void {
  // Type validation
  const actualType = typeof value;
  const expectedTypes: Record<ConfigValueType, string[]> = {
    [ConfigValueType.STRING]: ['string'],
    [ConfigValueType.NUMBER]: ['number'],
    [ConfigValueType.BOOLEAN]: ['boolean'],
    [ConfigValueType.DECIMAL]: ['number'],
    [ConfigValueType.JSON]: ['object']
  };

  const validTypes = expectedTypes[schema.valueType];
  if (!validTypes.includes(actualType)) {
    throw new BadRequestError(
      `Invalid type for ${key}. Expected ${schema.valueType}, got ${actualType}`
    );
  }

  // Range validation (for numeric types)
  if ((schema.valueType === ConfigValueType.NUMBER || schema.valueType === ConfigValueType.DECIMAL) && typeof value === 'number') {
    if (schema.min !== undefined && value < schema.min) {
      throw new BadRequestError(`${key} must be >= ${schema.min}`);
    }
    if (schema.max !== undefined && value > schema.max) {
      throw new BadRequestError(`${key} must be <= ${schema.max}`);
    }
  }

  // Pattern validation (for strings)
  if (schema.valueType === ConfigValueType.STRING && schema.pattern && !schema.pattern.test(value)) {
    throw new BadRequestError(`${key} format is invalid`);
  }

  // Enum validation
  if (schema.allowedValues && !schema.allowedValues.includes(value)) {
    throw new BadRequestError(
      `${key} must be one of: ${schema.allowedValues.join(', ')}`
    );
  }
}

function convertToType(value: any, type: ConfigValueType): any {
  switch (type) {
    case ConfigValueType.STRING:
      return String(value);
    case ConfigValueType.NUMBER:
      return parseInt(String(value), 10);
    case ConfigValueType.DECIMAL:
      return parseFloat(String(value));
    case ConfigValueType.BOOLEAN:
      return value === true || value === 'true' || value === '1';
    case ConfigValueType.JSON:
      return typeof value === 'string' ? JSON.parse(value) : value;
    default:
      return value;
  }
}

async function getSystemConfig(key: string): Promise<any> {
  const schema = CONFIG_SCHEMA[key];
  if (!schema) {
    throw new BadRequestError(`Unknown configuration key: ${key}`);
  }

  const config = await prisma.systemConfig.findUnique({
    where: { key }
  });

  const value = config ? JSON.parse(config.value) : schema.default;
  return convertToType(value, schema.valueType);
}

async function getAllSystemConfigs(): Promise<Record<string, any>> {
  const configs = await prisma.systemConfig.findMany();
  const result: Record<string, any> = {};

  for (const config of configs) {
    result[config.key] = JSON.parse(config.value);
  }

  // Fill in defaults for missing keys
  for (const [key, schema] of Object.entries(CONFIG_SCHEMA)) {
    if (!(key in result) && schema.default !== undefined) {
      result[key] = schema.default;
    }
  }

  return result;
}
```

**Frontend:**
```tsx
export const SystemSettingsPage: FC = () => {
  const [activeTab, setActiveTab] = useState('general');

  const { data: configs, isLoading } = useQuery({
    queryKey: ['system-config'],
    queryFn: () => fetch('/api/system-config').then(res => res.json())
  });

  const updateConfig = useMutation({
    mutationFn: ({ key, value }: any) =>
      fetch(`/api/system-config/${key}`, {
        method: 'PUT',
        body: JSON.stringify({ value })
      }).then(res => res.json()),
    onSuccess: () => {
      toast.success('Configuration updated');
    }
  });

  const categories = [
    { id: 'general', label: 'General' },
    { id: 'tax', label: 'Tax' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'recovery', label: 'Recovery' },
    { id: 'security', label: 'Security' },
    { id: 'notifications', label: 'Notifications' }
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">System Settings</h1>

      <Tabs activeTab={activeTab} onChange={setActiveTab}>
        {categories.map(cat => (
          <Tab key={cat.id} id={cat.id} label={cat.label}>
            <ConfigCategory
              category={cat.id}
              configs={configs?.filter((c: any) => c.category === cat.id)}
              onUpdate={updateConfig.mutate}
            />
          </Tab>
        ))}
      </Tabs>
    </div>
  );
};
```

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
