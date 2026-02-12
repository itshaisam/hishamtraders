# Story 5.10: Month-End Closing

**Epic:** Epic 5 - Account Heads & General Ledger
**Story ID:** STORY-5.10
**Priority:** Medium
**Estimated Effort:** 8-10 hours
**Dependencies:** Story 5.4, Story 5.5
**Status:** Done

---

## User Story

**As an** accountant,
**I want** to perform month-end closing procedures,
**So that** financial periods are properly closed and books are prepared for next period.

---

## Acceptance Criteria

1. **Schema:** `PeriodClose` model (see Dev Notes)
2. `POST /api/v1/period-close/month` — Close current month
3. Month-end closing process:
   - Verify trial balance is balanced
   - Calculate net profit (Revenue - Expenses for the period)
   - Create closing journal entry (move net profit to Retained Earnings 3200)
   - Mark period as CLOSED
4. Cannot create/edit transactions for closed periods (validation middleware)
5. `POST /api/v1/period-close/:id/reopen` — Admin can reopen period (requires reason)
6. `GET /api/v1/period-close` — List of closed periods
7. Frontend: Month-End Closing page with trial balance status and P&L summary
8. **Authorization:** Only `ADMIN` can close/reopen periods. `ACCOUNTANT` can view.

---

## Dev Notes

### Implementation Status

**Backend:** Not started. Depends on AccountHead, JournalEntry, Trial Balance, Balance Sheet.

### Database Schema (Proposed)

```prisma
model PeriodClose {
  id           String            @id @default(cuid())
  periodType   PeriodType
  periodDate   DateTime          // Last day of period (e.g., 2026-01-31 for Jan 2026)
  netProfit    Decimal           @db.Decimal(12, 2)
  closedBy     String
  closedAt     DateTime          @default(now())
  status       PeriodCloseStatus @default(CLOSED)
  reopenedAt   DateTime?
  reopenReason String?           @db.Text

  user         User              @relation(fields: [closedBy], references: [id])

  @@unique([periodType, periodDate])
  @@map("period_closes")
}

enum PeriodType {
  MONTH
  YEAR
}

enum PeriodCloseStatus {
  CLOSED
  REOPENED
}
```

### Key Corrections

1. **API paths**: All use `/api/v1/period-close` prefix (not `/api/period-close/`)
2. **`auditLogger.log()`** → Use `AuditService.log()` with correct field names:
   ```typescript
   await AuditService.log({
     userId,
     action: 'CREATE',
     entityType: 'PeriodClose',  // NOT 'resource'
     entityId: periodClose.id,
     notes: `Month-end close: ${format(periodDate, 'MMMM yyyy')}, Net profit: ${netProfit}`,
   });
   ```
3. **User model** needs relation added: `periodCloses PeriodClose[]`

### Period Validation Middleware

```typescript
// Add to invoice/payment/expense creation services
async function validatePeriodNotClosed(date: Date): Promise<void> {
  const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const closedPeriod = await prisma.periodClose.findFirst({
    where: {
      periodDate: lastDayOfMonth,
      status: 'CLOSED',
    }
  });
  if (closedPeriod) {
    throw new BadRequestError(
      `Cannot create transaction: period ${format(lastDayOfMonth, 'MMMM yyyy')} is closed`
    );
  }
}
```

### Module Structure

```
apps/api/src/modules/period-close/
  period-close.controller.ts
  period-close.service.ts
  period-close.routes.ts

apps/web/src/features/accounting/pages/
  MonthEndClosingPage.tsx
```

### POST-MVP DEFERRED

- **Year-end closing**: Similar to month-end but with additional steps. Deferred.
- **Automatic P&L report generation on close**: Manual for MVP.
