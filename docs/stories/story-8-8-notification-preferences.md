# Story 8.8: Notification Preferences and Alert Configuration

**Epic:** Epic 8 - Audit Trail Viewer & Advanced Features
**Story ID:** STORY-8.8
**Priority:** Medium
**Estimated Effort:** 5-7 hours
**Dependencies:** Story 7.6 (Alerts system — AlertRule model)
**Status:** Draft — Phase 2 (v2.0 — Revised)

---

## User Story

**As a** user,
**I want** to configure my in-app notification preferences,
**So that** I receive relevant alerts within the application.

---

## Acceptance Criteria

1. **Database Schema:**
   - [ ] NEW `UserPreference` model: id, userId (unique), inAppNotifications (boolean), alertTypes (Json), updatedAt
   - [ ] Email/SMS preference fields deferred to post-MVP

2. **Alert Types (depends on Story 7.6):**
   - [ ] LOW_STOCK, OUT_OF_STOCK, CREDIT_LIMIT_EXCEEDED, OVERDUE_PAYMENT, PENDING_APPROVAL, BROKEN_PROMISE, NEAR_EXPIRY
   - [ ] **Note:** Alert type definitions come from Story 7.6 (AlertRule model). If 7.6 is not yet implemented, use the alert type strings as constants.

3. **Backend API:**
   - [ ] PUT /api/v1/users/me/preferences - updates user preferences
   - [ ] GET /api/v1/users/me/preferences - returns current preferences

4. **In-App Notifications (MVP scope):**
   - [ ] Real-time alert badge count in navigation bar
   - [ ] Notification dropdown with recent alerts
   - [ ] Mark as read / dismiss functionality
   - [ ] User can select which alert types they want to receive

5. **Frontend - User Preferences Page:**
   - [ ] In-app notifications enabled/disabled checkbox
   - [ ] Alert type checkboxes (which alerts to receive)
   - [ ] "Save Preferences" button
   - [ ] Success toast on save

6. **Authorization:**
   - [ ] All users can configure their own preferences

7. **Audit Trail:**
   - [ ] Preference changes logged via `AuditService.log()`

---

## POST-MVP Deferred

The following are deferred to post-MVP and are NOT part of this story's scope:

- **Email notifications** -- daily digest, immediate critical alerts, SMTP configuration. Requires `emailService.send()` which does not exist yet.
- **SMS notifications** -- requires SMS gateway integration (Twilio, local provider). Also requires adding a `phone` field to the User model (User model currently has NO `phone` field). Requires `smsService.send()` which does not exist yet.
- **Notification delivery status tracking** -- sent, failed, retry logic.
- **Test notification** -- send test email/SMS button.

---

## Dev Notes

### Schema (New Model)

```prisma
model UserPreference {
  id                  String   @id @default(cuid())
  userId              String   @unique
  inAppNotifications  Boolean  @default(true)
  alertTypes          Json     @default("[]")  // Array of alert type strings
  updatedAt           DateTime @updatedAt

  user                User     @relation(fields: [userId], references: [id])

  @@map("user_preferences")
}
```

> **Note:** This is a NEW model and requires a migration. Also requires adding a `preferences UserPreference?` relation field on the User model.

### Backend -- Preferences Service

```typescript
import { prisma } from '../prisma.js';
import { AuditService } from '../services/audit.service.js';

const VALID_ALERT_TYPES = [
  'LOW_STOCK',
  'OUT_OF_STOCK',
  'CREDIT_LIMIT_EXCEEDED',
  'OVERDUE_PAYMENT',
  'PENDING_APPROVAL',
  'BROKEN_PROMISE',
  'NEAR_EXPIRY'
];

async function getUserPreferences(userId: string) {
  let preferences = await prisma.userPreference.findUnique({
    where: { userId }
  });

  if (!preferences) {
    // Create default preferences on first access
    preferences = await prisma.userPreference.create({
      data: {
        userId,
        inAppNotifications: true,
        alertTypes: VALID_ALERT_TYPES // Subscribe to all by default
      }
    });
  }

  return preferences;
}

async function updateUserPreferences(
  userId: string,
  data: {
    inAppNotifications?: boolean;
    alertTypes?: string[];
  }
) {
  // Validate alert types
  if (data.alertTypes) {
    const invalid = data.alertTypes.filter(t => !VALID_ALERT_TYPES.includes(t));
    if (invalid.length > 0) {
      throw new BadRequestError(`Invalid alert types: ${invalid.join(', ')}`);
    }
  }

  const preferences = await prisma.userPreference.upsert({
    where: { userId },
    update: {
      ...(data.inAppNotifications !== undefined && { inAppNotifications: data.inAppNotifications }),
      ...(data.alertTypes !== undefined && { alertTypes: data.alertTypes })
    },
    create: {
      userId,
      inAppNotifications: data.inAppNotifications ?? true,
      alertTypes: data.alertTypes ?? VALID_ALERT_TYPES
    }
  });

  await AuditService.log({
    userId,
    action: 'UPDATE',
    entityType: 'UserPreference',
    entityId: userId,
    notes: `Notification preferences updated`
  });

  return preferences;
}

// In-app notification dispatch (MVP)
async function sendInAppNotification(
  userId: string,
  alertType: string,
  message: string
): Promise<void> {
  const preferences = await prisma.userPreference.findUnique({
    where: { userId }
  });

  if (!preferences || !preferences.inAppNotifications) return;

  const alertTypes = preferences.alertTypes as string[];
  if (!alertTypes.includes(alertType)) return;

  // Create in-app notification (assumes a Notification model exists or will be created)
  // This is the MVP delivery channel
  await createInAppNotification(userId, alertType, message);
}
```

### Frontend -- Notification Preferences Page

Uses `Checkbox` component (not `Toggle` which does not exist). Uses `<div className="p-6">` instead of `Card.Body` (which does not exist).

```tsx
import { useState, useEffect, FC } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiClient } from '../../lib/api-client';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Checkbox } from '../../components/ui/Checkbox';
import { Spinner } from '../../components/ui/Spinner';

const alertTypes = [
  { id: 'LOW_STOCK', label: 'Low Stock Alerts' },
  { id: 'OUT_OF_STOCK', label: 'Out of Stock Alerts' },
  { id: 'CREDIT_LIMIT_EXCEEDED', label: 'Credit Limit Exceeded' },
  { id: 'OVERDUE_PAYMENT', label: 'Overdue Payment Alerts' },
  { id: 'PENDING_APPROVAL', label: 'Pending Approvals' },
  { id: 'BROKEN_PROMISE', label: 'Broken Payment Promises' },
  { id: 'NEAR_EXPIRY', label: 'Near Expiry Products' }
];

export const NotificationPreferencesPage: FC = () => {
  const queryClient = useQueryClient();
  const [formState, setFormState] = useState<{
    inAppNotifications: boolean;
    alertTypes: string[];
  }>({
    inAppNotifications: true,
    alertTypes: []
  });

  const { data: preferences, isLoading } = useQuery({
    queryKey: ['user-preferences'],
    queryFn: async () => {
      const response = await apiClient.get('/users/me/preferences');
      return response.data.data;
    }
  });

  useEffect(() => {
    if (preferences) {
      setFormState({
        inAppNotifications: preferences.inAppNotifications,
        alertTypes: preferences.alertTypes || []
      });
    }
  }, [preferences]);

  const updatePreferences = useMutation({
    mutationFn: async (data: { inAppNotifications: boolean; alertTypes: string[] }) => {
      const response = await apiClient.put('/users/me/preferences', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-preferences'] });
      toast.success('Preferences updated successfully');
    },
    onError: () => {
      toast.error('Failed to update preferences');
    }
  });

  const handleAlertTypeToggle = (typeId: string, checked: boolean) => {
    setFormState(prev => ({
      ...prev,
      alertTypes: checked
        ? [...prev.alertTypes, typeId]
        : prev.alertTypes.filter(t => t !== typeId)
    }));
  };

  const handleSave = () => {
    updatePreferences.mutate(formState);
  };

  if (isLoading) {
    return <Spinner size={48} className="h-64" />;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Notification Preferences</h1>

      <Card className="mb-6">
        <div className="p-6">
          <h3 className="font-semibold mb-4">Notification Channels</h3>
          <div className="space-y-3">
            <Checkbox
              label="In-App Notifications"
              checked={formState.inAppNotifications}
              onChange={(checked) =>
                setFormState(prev => ({ ...prev, inAppNotifications: !!checked }))
              }
            />
            {/* Email and SMS channels deferred to post-MVP */}
            <p className="text-sm text-gray-500 italic">
              Email and SMS notification channels will be available in a future update.
            </p>
          </div>
        </div>
      </Card>

      <Card className="mb-6">
        <div className="p-6">
          <h3 className="font-semibold mb-4">Alert Types</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {alertTypes.map(type => (
              <Checkbox
                key={type.id}
                label={type.label}
                checked={formState.alertTypes.includes(type.id)}
                onChange={(checked) => handleAlertTypeToggle(type.id, !!checked)}
              />
            ))}
          </div>
        </div>
      </Card>

      <Button
        onClick={handleSave}
        disabled={updatePreferences.isPending}
      >
        {updatePreferences.isPending ? 'Saving...' : 'Save Preferences'}
      </Button>
    </div>
  );
};
```

---

### Key Corrections (from v1.0)

1. **API path corrected** -- `/api/users/me/preferences` changed to `/api/v1/users/me/preferences` to match the project's API base URL pattern.
2. **Replaced `Card.Body` with `<div className="p-6">`** -- `Card.Body` does not exist as a subcomponent.
3. **Replaced `Toggle` with `Checkbox`** -- `Toggle` component does not exist in the codebase. `Checkbox` does exist and serves the same purpose.
4. **Noted User.phone does not exist** -- v1.0 referenced `user.phone` for SMS delivery but the User model has no `phone` field. SMS notifications deferred entirely to post-MVP (requires schema change to add phone to User).
5. **Deferred email/SMS services** -- `emailService.send()` and `smsService.send()` do not exist. Email digest, SMTP config, and SMS gateway are all post-MVP.
6. **Noted dependency on Story 7.6** -- Alert types reference the AlertRule model from Story 7.6. If not implemented, alert type strings are used as constants.
7. **Frontend uses `apiClient`** -- replaced raw `fetch()` calls with axios `apiClient` pattern from `../../lib/api-client`.
8. **Batch save pattern** -- v1.0 fired a mutation on every individual toggle change. Revised to use local form state with a single "Save Preferences" button to reduce unnecessary API calls.
9. **Simplified model name** -- using `UserPreference` (singular, Prisma convention) instead of `UserPreferences`.

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
| 2026-02-10 | 2.0     | Major revision: fix API path to /api/v1/, replace Toggle with Checkbox, replace Card.Body with div, defer email/SMS to post-MVP (services don't exist, User has no phone field), use apiClient instead of fetch(), add batch save pattern | Claude (Dev Review) |
