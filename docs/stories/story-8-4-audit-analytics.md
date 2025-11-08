# Story 8.4: Audit Analytics and User Activity Reports

**Epic:** Epic 8 - Audit Trail Viewer & Advanced Features
**Story ID:** STORY-8.4
**Priority:** Medium
**Estimated Effort:** 7-9 hours
**Dependencies:** Story 8.1
**Status:** Draft - Phase 2

---

## User Story

**As an** admin,
**I want** to analyze audit log data to identify usage patterns and potential issues,
**So that** system usage is optimized and security is maintained.

---

## Acceptance Criteria

1. **Backend API:**
   - [ ] GET /api/reports/audit-analytics - generates analytics report
   - [ ] Parameters: dateFrom, dateTo (required), userId (optional), entityType (optional)
   - [ ] GET /api/reports/user-activity/:userId - detailed user activity report

2. **Metrics Calculated:**
   - [ ] Total actions by type (CREATE, UPDATE, DELETE, VIEW)
   - [ ] Actions by user (top 10 most active users)
   - [ ] Actions by entity type (most used modules)
   - [ ] Actions by hour (peak usage times)
   - [ ] Failed actions (from application logs)
   - [ ] Unusual activity (large deletes, bulk updates, off-hours access)

3. **User Activity Report:**
   - [ ] Total actions (this week, this month, all time)
   - [ ] Action breakdown (by type and entity)
   - [ ] Recent activity timeline (last 50 actions)
   - [ ] Login history (timestamps, IP addresses)
   - [ ] Most accessed modules

4. **Frontend - Audit Analytics Page:**
   - [ ] Date range selector
   - [ ] Metric cards (total actions, unique users, peak hour)
   - [ ] Actions by type (pie chart)
   - [ ] Actions over time (line chart, daily totals)
   - [ ] Top users by activity (bar chart)
   - [ ] Most accessed modules (bar chart)

5. **Frontend - User Activity Page:**
   - [ ] User info and role
   - [ ] Activity metrics
   - [ ] Action breakdown charts
   - [ ] Recent activity timeline
   - [ ] Login history table

6. **Dashboard Widget:**
   - [ ] Admin dashboard includes "System Activity" widget (actions today/week)

7. **Authorization:**
   - [ ] Only Admin can access audit analytics

---

## Dev Notes

```typescript
async function getAuditAnalytics(
  dateFrom: Date,
  dateTo: Date
): Promise<any> {
  const logs = await prisma.auditLog.findMany({
    where: {
      timestamp: { gte: dateFrom, lte: dateTo }
    }
  });

  // Actions by type
  const actionsByType = logs.reduce((acc, log) => {
    acc[log.action] = (acc[log.action] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Actions by user
  const actionsByUser = logs.reduce((acc, log) => {
    acc[log.userId] = (acc[log.userId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Top 10 users
  const topUsers = Object.entries(actionsByUser)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  return {
    totalActions: logs.length,
    actionsByType,
    topUsers,
    // ... other metrics
  };
}
```

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
