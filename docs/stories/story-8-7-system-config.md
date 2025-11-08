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
   - [ ] PUT /api/system-config/:key - updates configuration value
   - [ ] GET /api/system-config - returns all configurations grouped by category
   - [ ] GET /api/system-config/:key - returns specific configuration
   - [ ] Configuration validation: type checking (number, boolean, string, etc.)

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
  value       Json
  category    String
  description String?  @db.Text
  updatedBy   String
  updatedAt   DateTime @updatedAt

  user        User     @relation(fields: [updatedBy], references: [id])

  @@map("system_config")
}
```

```typescript
async function updateSystemConfig(
  key: string,
  value: any,
  userId: string
): Promise<SystemConfig> {
  // Validate value based on key
  validateConfigValue(key, value);

  const config = await prisma.systemConfig.upsert({
    where: { key },
    update: {
      value,
      updatedBy: userId,
      updatedAt: new Date()
    },
    create: {
      key,
      value,
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
    details: { key, value }
  });

  return config;
}

function validateConfigValue(key: string, value: any): void {
  switch (key) {
    case 'DEFAULT_SALES_TAX_RATE':
      if (typeof value !== 'number' || value < 0 || value > 100) {
        throw new BadRequestError('Tax rate must be between 0 and 100');
      }
      break;
    case 'SESSION_TIMEOUT':
      if (typeof value !== 'number' || value <= 0) {
        throw new BadRequestError('Session timeout must be positive');
      }
      break;
    // ... other validations
  }
}

async function getSystemConfig(key: string): Promise<any> {
  const config = await prisma.systemConfig.findUnique({
    where: { key }
  });

  return config?.value || getDefaultValue(key);
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
