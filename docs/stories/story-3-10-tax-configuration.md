# Story 3.10: Tax Rate Configuration

**Epic:** Epic 3 - Sales & Client Management + Payments
**Story ID:** STORY-3.10
**Priority:** Medium
**Estimated Effort:** 4-6 hours
**Dependencies:** Story 3.5 (Tax Calculation on Sales)
**Status:** New

---

## User Story

**As an** admin,
**I want** a settings page to manage the system-wide default sales tax rate,
**So that** I can easily update the tax percentage applied to all invoices.

---

## Acceptance Criteria

1.  **System Configuration:**
    *   [ ] A system-wide configuration setting exists for `DEFAULT_SALES_TAX_RATE`.
    *   [ ] The default value is seeded (e.g., 17.0 for 17%).

2.  **Backend API Endpoints:**
    *   [ ] `GET /api/config/tax-rate` - Retrieves the current default sales tax rate.
    *   [ ] `PUT /api/config/tax-rate` - Updates the default sales tax rate.

3.  **Validation:**
    *   [ ] The tax rate must be a number between 0 and 100.
    *   [ ] The API should reject invalid values with a clear error message.

4.  **Frontend UI:**
    *   [ ] A "Tax Settings" page is available in the admin settings area.
    *   [ ] The page displays the current default tax rate.
    *   [ ] An input field allows an admin to enter a new tax rate.
    *   [ ] A "Save" button persists the new rate.
    *   [ ] User-friendly validation messages are displayed for invalid input.

5.  **Authorization:**
    *   [ ] Only users with the `ADMIN` role can view and edit the tax rate.
    *   [ ] The API endpoints are protected to enforce this.

6.  **Audit Logging:**
    *   [ ] Any change to the tax rate is recorded in the audit trail.
    *   [ ] The log includes the old rate, the new rate, and the user who made the change.

---

## Dev Notes

### Database Schema (Prisma)

A generic configuration table is a good approach for this.

```prisma
model SystemConfiguration {
  id        String   @id @default(cuid())
  key       String   @unique
  value     String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

A record in this table would look like:
`{ key: 'DEFAULT_SALES_TAX_RATE', value: '17.0' }`

### Business Logic

*   When an admin updates the tax rate, the new rate only applies to invoices created *after* the change.
*   Existing invoices are not affected, as the tax amount is already calculated and stored at the time of invoice creation.
*   The `Tax Calculation on Sales` story (3.5) will be responsible for reading this configuration value when it calculates tax for a new invoice.

### API Implementation

**`config.controller.ts`**

```typescript
// GET /api/config/tax-rate
async getTaxRate(req: Request, res: Response) {
  const config = await prisma.systemConfiguration.findUnique({
    where: { key: 'DEFAULT_SALES_TAX_RATE' },
  });
  res.json({ taxRate: parseFloat(config?.value || '17.0') });
}

// PUT /api/config/tax-rate
async updateTaxRate(req: Request, res: Response) {
  const { taxRate } = req.body;

  if (typeof taxRate !== 'number' || taxRate < 0 || taxRate > 100) {
    return res.status(400).json({ message: 'Invalid tax rate. Must be between 0 and 100.' });
  }

  const oldConfig = await prisma.systemConfiguration.findUnique({
    where: { key: 'DEFAULT_SALES_TAX_RATE' },
  });

  const updatedConfig = await prisma.systemConfiguration.upsert({
    where: { key: 'DEFAULT_SALES_TAX_RATE' },
    update: { value: taxRate.toString() },
    create: { key: 'DEFAULT_SALES_TAX_RATE', value: taxRate.toString() },
  });

  // Audit Log
  await auditLog({
    userId: req.user.id,
    action: 'UPDATE',
    entityType: 'SystemConfiguration',
    entityId: updatedConfig.id,
    changedFields: {
      taxRate: { old: oldConfig?.value, new: updatedConfig.value }
    },
    notes: 'Default sales tax rate updated'
  });

  res.json({ success: true, taxRate: parseFloat(updatedConfig.value) });
}
```
