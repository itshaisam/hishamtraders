# Story 8.4: Audit Analytics and User Activity Reports

**Epic:** Epic 8 - Audit Trail Viewer & Advanced Features
**Story ID:** STORY-8.4
**Priority:** Medium
**Estimated Effort:** 7-9 hours
**Dependencies:** Story 8.1
**Status:** Draft -- Phase 2 (v2.0 -- Revised)

---

## User Story

**As an** admin,
**I want** to analyze audit log data to identify usage patterns and potential issues,
**So that** system usage is optimized and security is maintained.

---

## Acceptance Criteria

1. **Backend API:**
   - [ ] GET /api/v1/reports/audit-analytics - generates analytics report
   - [ ] Parameters: dateFrom, dateTo (required), userId (optional), entityType (optional)
   - [ ] GET /api/v1/reports/user-activity/:userId - detailed user activity report

2. **Metrics Calculated:**
   - [ ] Total actions by type (CREATE, UPDATE, DELETE, VIEW, LOGIN, LOGOUT)
   - [ ] Actions by user (top 10 most active users)
   - [ ] Actions by entity type (most used modules)
   - [ ] Actions by hour (peak usage times)
   - [ ] Unusual activity (large deletes, bulk updates, off-hours access)

3. **User Activity Report:**
   - [ ] Total actions (this week, this month, all time)
   - [ ] Action breakdown (by type and entity)
   - [ ] Recent activity timeline (last 50 actions)
   - [ ] Login history (timestamps, IP addresses) -- filtered from audit logs where action = 'LOGIN'
   - [ ] Most accessed modules

4. **Frontend - Audit Analytics Page:**
   - [ ] Date range selector (native `<input type="date">` elements)
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

### Backend Implementation -- Use Prisma `groupBy` for Aggregation

> **IMPORTANT:** Do NOT load all audit logs into memory for analytics. The v1.0 approach of `findMany()` + in-memory reduce is a performance anti-pattern that will degrade as the audit_logs table grows. Use Prisma `groupBy` to push aggregation to the database.

```typescript
async function getAuditAnalytics(
  dateFrom: Date,
  dateTo: Date,
  userId?: string,
  entityType?: string
): Promise<any> {
  const baseWhere: any = {
    timestamp: { gte: dateFrom, lte: dateTo }
  };
  if (userId) baseWhere.userId = userId;
  if (entityType) baseWhere.entityType = entityType;

  // Total actions count
  const totalActions = await prisma.auditLog.count({ where: baseWhere });

  // Actions by type -- using Prisma groupBy (pushes to SQL GROUP BY)
  const actionsByType = await prisma.auditLog.groupBy({
    by: ['action'],
    where: baseWhere,
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } }
  });

  // Actions by entity type
  const actionsByEntity = await prisma.auditLog.groupBy({
    by: ['entityType'],
    where: baseWhere,
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } }
  });

  // Actions by user (top 10)
  const actionsByUser = await prisma.auditLog.groupBy({
    by: ['userId'],
    where: baseWhere,
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 10
  });

  // Resolve user names for top users
  const userIds = actionsByUser.map(a => a.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true }
  });
  const userMap = new Map(users.map(u => [u.id, u]));

  const topUsers = actionsByUser.map(a => ({
    userId: a.userId,
    userName: userMap.get(a.userId)?.name || 'Unknown',
    userEmail: userMap.get(a.userId)?.email || 'Unknown',
    count: a._count.id
  }));

  // Unique active users in period
  const uniqueUsers = await prisma.auditLog.groupBy({
    by: ['userId'],
    where: baseWhere
  });

  return {
    totalActions,
    uniqueUserCount: uniqueUsers.length,
    actionsByType: actionsByType.map(a => ({
      action: a.action,
      count: a._count.id
    })),
    actionsByEntity: actionsByEntity.map(a => ({
      entityType: a.entityType,
      count: a._count.id
    })),
    topUsers
  };
}

async function getUserActivity(
  userId: string
): Promise<any> {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Count actions for different periods using database aggregation
  const [weekCount, monthCount, totalCount] = await Promise.all([
    prisma.auditLog.count({
      where: { userId, timestamp: { gte: oneWeekAgo } }
    }),
    prisma.auditLog.count({
      where: { userId, timestamp: { gte: oneMonthAgo } }
    }),
    prisma.auditLog.count({
      where: { userId }
    })
  ]);

  // Action breakdown by type
  const actionBreakdown = await prisma.auditLog.groupBy({
    by: ['action'],
    where: { userId },
    _count: { id: true }
  });

  // Entity breakdown
  const entityBreakdown = await prisma.auditLog.groupBy({
    by: ['entityType'],
    where: { userId },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } }
  });

  // Recent activity (last 50 actions)
  const recentActivity = await prisma.auditLog.findMany({
    where: { userId },
    orderBy: { timestamp: 'desc' },
    take: 50,
    select: {
      id: true,
      action: true,
      entityType: true,
      entityId: true,
      timestamp: true,
      ipAddress: true
    }
  });

  // Login history (filter audit logs where action = 'LOGIN')
  const loginHistory = await prisma.auditLog.findMany({
    where: { userId, action: 'LOGIN' },
    orderBy: { timestamp: 'desc' },
    take: 20,
    select: {
      timestamp: true,
      ipAddress: true,
      userAgent: true
    }
  });

  // User info
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true }
  });

  return {
    user: {
      id: user?.id,
      name: user?.name,
      email: user?.email,
      role: user?.role?.name,
      lastLoginAt: user?.lastLoginAt
    },
    actionCounts: {
      thisWeek: weekCount,
      thisMonth: monthCount,
      allTime: totalCount
    },
    actionBreakdown: actionBreakdown.map(a => ({
      action: a.action,
      count: a._count.id
    })),
    mostAccessedModules: entityBreakdown.map(e => ({
      entityType: e.entityType,
      count: e._count.id
    })),
    recentActivity,
    loginHistory
  };
}
```

### Notes on Removed Metrics

- **"Failed actions (from application logs)"** has been removed. There is no separate application log table in the database. AuditService logs only successful actions. If error tracking is needed in the future, consider integrating with an external service (e.g., Sentry) or adding a separate `ApplicationLog` model.
- **"Actions by hour"** can be computed on the frontend from the `recentActivity` timestamps or by adding a raw SQL query with `HOUR(timestamp)` grouping if needed. This avoids loading all logs.

---

### Key Corrections (from v1.0)

1. **API path:** Changed `/api/reports/` to `/api/v1/reports/` to match the project's API base URL convention.
2. **In-memory aggregation replaced with Prisma `groupBy`:** The v1.0 approach loaded ALL audit logs into memory with `findMany()` and then used JavaScript `reduce()` for aggregation. This is a severe performance anti-pattern -- on a production system with millions of audit log rows, this would cause out-of-memory errors and extreme latency. Replaced with Prisma `groupBy` which translates to SQL `GROUP BY`, pushing computation to the database where it belongs.
3. **"Failed actions" metric removed:** There is no separate application log or error log table in the schema. The `AuditService` only records successful operations (it catches and swallows its own errors). Removed this metric entirely rather than showing inaccurate data.

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
| 2026-02-10 | 2.0     | Revised: corrected API paths, replaced in-memory aggregation with Prisma groupBy, removed non-existent "failed actions" metric, added comprehensive user activity implementation | Claude (Tech Review) |
