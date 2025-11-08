# Story 8.8: Notification Preferences and Alert Configuration

**Epic:** Epic 8 - Audit Trail Viewer & Advanced Features
**Story ID:** STORY-8.8
**Priority:** Medium
**Estimated Effort:** 7-9 hours
**Dependencies:** Story 7.6 (Alerts system)
**Status:** Draft - Phase 2

---

## User Story

**As a** user,
**I want** to configure my notification preferences,
**So that** I receive alerts via my preferred channels (email, SMS, in-app).

---

## Acceptance Criteria

1. **Database Schema:**
   - [ ] UserPreferences table: id, userId, emailNotifications (boolean), smsNotifications (boolean), inAppNotifications (boolean), alertTypes (JSON array), updatedAt

2. **Alert Types:**
   - [ ] LOW_STOCK, OUT_OF_STOCK, CREDIT_LIMIT_EXCEEDED, OVERDUE_PAYMENT, PENDING_APPROVAL, BROKEN_PROMISE, NEAR_EXPIRY

3. **Backend API:**
   - [ ] PUT /api/users/me/preferences - updates user preferences
   - [ ] GET /api/users/me/preferences - returns current preferences

4. **Email Notifications:**
   - [ ] Daily digest of alerts
   - [ ] Immediate alerts for CRITICAL severity
   - [ ] Uses configured SMTP settings from system config

5. **SMS Notifications:**
   - [ ] Critical alerts only (stock out, credit exceeded)
   - [ ] Uses SMS gateway (Twilio, local provider)

6. **In-App Notifications:**
   - [ ] Real-time alerts in navigation bar (badge count)
   - [ ] Notification dropdown with recent alerts
   - [ ] Mark as read/dismiss functionality

7. **Frontend - User Preferences Page:**
   - [ ] Notification channel toggles (Email, SMS, In-app)
   - [ ] Alert type checkboxes (which alerts to receive)
   - [ ] "Save Preferences" button
   - [ ] Displays notification delivery status (sent, failed)
   - [ ] Allows testing notification (send test email/SMS)

8. **Authorization:**
   - [ ] All users can configure their own preferences

9. **Audit Trail:**
   - [ ] Preference changes logged in audit trail

---

## Dev Notes

```prisma
model UserPreferences {
  id                  String   @id @default(cuid())
  userId              String   @unique
  emailNotifications  Boolean  @default(true)
  smsNotifications    Boolean  @default(false)
  inAppNotifications  Boolean  @default(true)
  alertTypes          Json     @default("[]")
  updatedAt           DateTime @updatedAt

  user                User     @relation(fields: [userId], references: [id])

  @@map("user_preferences")
}
```

```typescript
async function sendNotification(
  userId: string,
  alert: Alert
): Promise<void> {
  const preferences = await prisma.userPreferences.findUnique({
    where: { userId }
  });

  if (!preferences) return;

  const alertTypes = preferences.alertTypes as string[];
  if (!alertTypes.includes(alert.type)) {
    return; // User not subscribed to this alert type
  }

  // In-app notification (always sent)
  await createInAppNotification(userId, alert);

  // Email notification
  if (preferences.emailNotifications) {
    if (alert.priority === 'CRITICAL') {
      await sendEmailImmediately(userId, alert);
    } else {
      await queueForDailyDigest(userId, alert);
    }
  }

  // SMS notification (critical only)
  if (preferences.smsNotifications && alert.priority === 'CRITICAL') {
    await sendSMS(userId, alert);
  }
}

async function sendEmailImmediately(
  userId: string,
  alert: Alert
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user?.email) return;

  const smtpConfig = await getSystemConfig('SMTP_CONFIG');

  await emailService.send({
    to: user.email,
    subject: `[${alert.priority}] ${alert.type}`,
    body: alert.message,
    config: smtpConfig
  });
}

async function sendSMS(userId: string, alert: Alert): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user?.phone) return;

  const smsConfig = await getSystemConfig('SMS_GATEWAY_CONFIG');

  await smsService.send({
    to: user.phone,
    message: `[CRITICAL] ${alert.message}`,
    config: smsConfig
  });
}
```

**Frontend:**
```tsx
export const NotificationPreferencesPage: FC = () => {
  const { data: preferences } = useQuery({
    queryKey: ['user-preferences'],
    queryFn: () => fetch('/api/users/me/preferences').then(res => res.json())
  });

  const updatePreferences = useMutation({
    mutationFn: (data: any) =>
      fetch('/api/users/me/preferences', {
        method: 'PUT',
        body: JSON.stringify(data)
      }).then(res => res.json()),
    onSuccess: () => {
      toast.success('Preferences updated');
    }
  });

  const alertTypes = [
    { id: 'LOW_STOCK', label: 'Low Stock Alerts' },
    { id: 'OUT_OF_STOCK', label: 'Out of Stock Alerts' },
    { id: 'CREDIT_LIMIT_EXCEEDED', label: 'Credit Limit Exceeded' },
    { id: 'OVERDUE_PAYMENT', label: 'Overdue Payment Alerts' },
    { id: 'PENDING_APPROVAL', label: 'Pending Approvals' },
    { id: 'BROKEN_PROMISE', label: 'Broken Payment Promises' },
    { id: 'NEAR_EXPIRY', label: 'Near Expiry Products' }
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Notification Preferences</h1>

      <Card className="mb-6">
        <Card.Body>
          <h3 className="font-semibold mb-4">Notification Channels</h3>
          <div className="space-y-3">
            <Toggle
              label="Email Notifications"
              checked={preferences?.emailNotifications}
              onChange={(checked) => updatePreferences.mutate({ emailNotifications: checked })}
            />
            <Toggle
              label="SMS Notifications (Critical only)"
              checked={preferences?.smsNotifications}
              onChange={(checked) => updatePreferences.mutate({ smsNotifications: checked })}
            />
            <Toggle
              label="In-App Notifications"
              checked={preferences?.inAppNotifications}
              disabled
            />
          </div>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <h3 className="font-semibold mb-4">Alert Types</h3>
          <div className="grid grid-cols-2 gap-3">
            {alertTypes.map(type => (
              <Checkbox
                key={type.id}
                label={type.label}
                checked={preferences?.alertTypes?.includes(type.id)}
                onChange={(checked) => {
                  const newTypes = checked
                    ? [...(preferences?.alertTypes || []), type.id]
                    : preferences?.alertTypes?.filter((t: string) => t !== type.id);
                  updatePreferences.mutate({ alertTypes: newTypes });
                }}
              />
            ))}
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};
```

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
