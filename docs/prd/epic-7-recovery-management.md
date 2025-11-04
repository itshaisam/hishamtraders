# Epic 7: Recovery & Collection Management

**Epic Goal:** Implement advanced recovery management features including weekly recovery schedules, aging analysis for overdue accounts, automated recovery reminders, recovery agent performance tracking, and collection efficiency metrics. This epic streamlines cash collection and reduces DSO (Days Sales Outstanding) through systematic follow-up and data-driven recovery strategies.

**Timeline:** Phase 2 (Post-MVP, estimated 2-3 weeks)

**Status:** PHASE 2 - Not included in 6-week MVP

**Dependencies:** Epic 1, 3 (MVP sales and payments must be operational)

---

## Overview

The MVP provides **basic payment recording** (client payments with balance updates). Phase 2 adds **systematic recovery workflows** with scheduled collections, aging analysis, automated reminders, and performance tracking for recovery agents.

### What's Missing in MVP:
- ❌ Weekly recovery schedules (assign clients to specific days of week)
- ❌ Detailed aging analysis (0-7, 8-14, 15-30, 30+ day buckets)
- ❌ Automated recovery reminders (WhatsApp/SMS/Email - optional)
- ❌ Recovery agent assignment and performance tracking
- ❌ Collection targets and achievement metrics
- ❌ Recovery visit logging
- ❌ Payment promise tracking
- ❌ Overdue escalation workflows

### What Phase 2 Adds:
✅ Weekly recovery schedule by client day
✅ Comprehensive aging analysis reports
✅ Recovery agent assignment to clients
✅ Daily recovery route planning
✅ Recovery visit logging
✅ Payment promise tracking
✅ Recovery agent performance dashboards
✅ Collection efficiency metrics
✅ Overdue alert escalation

---

## Stories

### Story 7.1: Weekly Recovery Schedule Configuration

**As a** recovery agent,
**I want** to assign clients to specific days of the week for payment collection,
**So that** I can plan my collection route efficiently.

**Acceptance Criteria:**
1. Client table expanded: recoveryDay (enum: MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, NONE), recoveryAgentId (references User with role=RECOVERY_AGENT)
2. PUT /api/clients/:id updates client recoveryDay and recoveryAgentId
3. GET /api/recovery/schedule?date=YYYY-MM-DD returns clients scheduled for that day
4. Endpoint calculates day of week from date and filters clients by recoveryDay
5. Response includes: Client name, contact, address, current balance, overdue amount, last payment date, recovery agent assigned
6. Clients with recoveryDay=NONE not included in any schedule (on-demand only)
7. Frontend Client form includes Recovery Day dropdown (Mon-Sat or None)
8. Frontend Client form includes Recovery Agent dropdown (list of users with role=RECOVERY_AGENT)
9. Frontend displays client's recovery schedule on detail page
10. Accountant, Admin can configure recovery schedules
11. **Recovery schedule changes logged in audit trail**

**Story File:** [docs/stories/story-7-1-recovery-schedule-config.md](../stories/story-7-1-recovery-schedule-config.md)

---

### Story 7.2: Daily Recovery Route Planning

**As a** recovery agent,
**I want** to see which clients are scheduled for collection today,
**So that** I can plan my visits and prioritize high-value collections.

**Acceptance Criteria:**
1. GET /api/recovery/schedule/today returns today's scheduled clients for logged-in recovery agent
2. Clients sorted by: overdue amount desc (highest priority first)
3. Response includes: Client, address (with map link if coordinates available), phone (click-to-call), balance, overdue amount, days overdue, last payment date
4. GET /api/recovery/schedule/week returns this week's schedule (Mon-Sat) grouped by day
5. Frontend Recovery Schedule page displays today's clients by default
6. Frontend allows selecting different date to view schedule
7. Frontend displays clients in card/list view with:
   - Client name and contact (click-to-call phone)
   - Address (with "Get Directions" link to Google Maps)
   - Balance and overdue amount (color-coded: green=current, yellow=1-14 days, red=15+ days)
   - Last payment date
   - "Visit Client" button (logs visit)
   - "Record Payment" button (quick payment entry)
8. Frontend highlights overdue clients in red
9. Frontend shows total collectible amount for today
10. Recovery dashboard displays "Today's Collections" widget with scheduled client count
11. Recovery Agent can view their own schedule; Admin can view all schedules

**Story File:** [docs/stories/story-7-2-daily-recovery-route.md](../stories/story-7-2-daily-recovery-route.md)

---

### Story 7.3: Aging Analysis Report

**As an** accountant,
**I want** to see client balances categorized by age buckets,
**So that** collection efforts can be prioritized on the most overdue accounts.

**Acceptance Criteria:**
1. GET /api/reports/aging-analysis generates aging report
2. For each client with balance > 0, calculate outstanding invoice amounts by age buckets:
   - **Current** (not yet due: dueDate >= today)
   - **1-7 days overdue** (dueDate between today-7 and today-1)
   - **8-14 days overdue** (dueDate between today-14 and today-8)
   - **15-30 days overdue** (dueDate between today-30 and today-15)
   - **30+ days overdue** (dueDate < today-30)
3. Report shows: Client, Current, 1-7 Days, 8-14 Days, 15-30 Days, 30+ Days, Total Outstanding
4. Summary row shows totals for each bucket across all clients
5. Report sortable by total outstanding (default) or any age bucket
6. Report filterable by recovery agent (if assigned)
7. Report exportable to Excel
8. Frontend Aging Analysis page displays table with color coding:
   - Current: green
   - 1-7 days: yellow
   - 8-14 days: orange
   - 15-30 days: red
   - 30+ days: dark red
9. Frontend allows filtering by client name, agent, minimum outstanding amount
10. GET /api/clients/:id/aging returns aging breakdown for specific client
11. Client detail page displays aging breakdown widget
12. Accountant, Admin, Recovery Agent can access aging reports

**Story File:** [docs/stories/story-7-3-aging-analysis.md](../stories/story-7-3-aging-analysis.md)

---

### Story 7.4: Recovery Visit Logging

**As a** recovery agent,
**I want** to log my client visits and outcomes,
**So that** visit history and collection progress are tracked.

**Acceptance Criteria:**
1. RecoveryVisit table: id, clientId, agentId (userId), visitDate, visitTime, outcome (PAYMENT_RECEIVED, PROMISE_TO_PAY, CLIENT_UNAVAILABLE, DISPUTED, REFUSED, OTHER), paymentAmount, promiseDate, promiseAmount, notes, createdAt
2. POST /api/recovery/visits creates visit record
3. Visit outcomes:
   - PAYMENT_RECEIVED: Agent collected payment (links to Payment record)
   - PROMISE_TO_PAY: Client promised payment by specific date
   - CLIENT_UNAVAILABLE: Client not available at time of visit
   - DISPUTED: Client disputes amount owed
   - REFUSED: Client refuses to pay
   - OTHER: Other outcome (requires notes)
4. If outcome = PAYMENT_RECEIVED, paymentAmount required (links to Payment via payment recording)
5. If outcome = PROMISE_TO_PAY, promiseDate and promiseAmount required
6. GET /api/recovery/visits returns visit history with filters (clientId, agentId, date range, outcome)
7. GET /api/clients/:id/visits returns visit history for specific client
8. Frontend "Visit Client" button on recovery schedule opens visit logging modal
9. Frontend visit modal:
   - Select outcome
   - Conditional fields (payment amount if received, promise date if promised)
   - Notes textarea
   - Submit button
10. Frontend client detail page displays visit history timeline
11. Frontend displays visit outcomes with icons/colors
12. Recovery Agent logs their own visits; Admin can view all visits
13. **Recovery visits logged in audit trail**

**Story File:** [docs/stories/story-7-4-visit-logging.md](../stories/story-7-4-visit-logging.md)

---

### Story 7.5: Payment Promise Tracking

**As a** recovery agent,
**I want** to track payment promises made by clients,
**So that** I can follow up if promises are not kept.

**Acceptance Criteria:**
1. PaymentPromise table: id, clientId, promiseDate, promiseAmount, actualPaymentDate, actualPaymentAmount, status (PENDING/KEPT/BROKEN/PARTIAL), visitId (if promise made during visit), notes, createdAt
2. Promise created automatically when RecoveryVisit outcome = PROMISE_TO_PAY
3. Promise can also be created manually: POST /api/payment-promises
4. When client payment recorded, system checks for matching promises:
   - If promise exists for today and amount matches: status = KEPT
   - If payment < promiseAmount: status = PARTIAL
5. **Automated daily job checks for broken promises:**
   - If promiseDate < today and status = PENDING: change status to BROKEN, create alert
6. GET /api/payment-promises returns promise list with filters (status, date range, clientId, agentId)
7. GET /api/payment-promises/due returns promises due today or overdue
8. GET /api/clients/:id/promises returns promise history for specific client
9. Frontend Payment Promises page displays promise list with status badges
10. Frontend displays "Due Today" and "Overdue" sections prominently
11. Frontend client detail page shows active promises
12. Frontend recovery dashboard displays "Promises Due Today" widget
13. Recovery Agent and Accountant can view promises
14. **Promise status changes logged in audit trail**

**Story File:** [docs/stories/story-7-5-payment-promises.md](../stories/story-7-5-payment-promises.md)

---

### Story 7.6: Overdue Payment Alerts and Escalation

**As an** accountant,
**I want** automatic alerts for overdue invoices with escalation,
**So that** collection follow-up is timely and prioritized.

**Acceptance Criteria:**
1. **Automated daily job** (cron or background task) runs to check for overdue invoices
2. Invoice considered overdue if: status != PAID AND dueDate < today
3. **Alert creation rules:**
   - 1-7 days overdue: create LOW severity alert
   - 8-14 days overdue: create MEDIUM severity alert
   - 15-30 days overdue: create HIGH severity alert
   - 30+ days overdue: create CRITICAL severity alert
4. Alert created once per invoice (not duplicated daily), but severity updated as days overdue increases
5. Alert includes: client name, invoice number, due date, days overdue, amount
6. Alerts delivered to: Accountant, Recovery Agent (if assigned to client), Admin
7. GET /api/alerts?type=OVERDUE_PAYMENT returns overdue alerts with filters (severity, clientId, agentId)
8. Dashboard displays overdue invoice count prominently (by severity)
9. Frontend allows filtering alerts by severity
10. Clicking alert navigates to invoice or client detail
11. Alert dismissed when invoice paid
12. **Alert escalations logged in audit trail**

**Story File:** [docs/stories/story-7-6-overdue-alerts.md](../stories/story-7-6-overdue-alerts.md)

---

### Story 7.7: Recovery Agent Performance Dashboard

**As an** admin,
**I want** to track recovery agent performance and collection efficiency,
**So that** I can identify top performers and areas needing improvement.

**Acceptance Criteria:**
1. GET /api/dashboard/recovery-agent/:agentId returns agent performance metrics:
   - Assigned clients count
   - Total outstanding balance (assigned clients)
   - Overdue balance (assigned clients)
   - Payments collected this week/month
   - Collection rate (payments / outstanding)
   - Visits logged this week/month
   - Promises obtained vs kept ratio
   - Average days to collection (invoice date to payment date)
2. GET /api/reports/agent-performance generates agent comparison report:
   - Agent, Assigned Clients, Total Outstanding, Collected This Month, Collection Rate %, Visits Logged, Promises Kept %
   - Sorted by collection amount desc
3. Frontend Recovery Agent Performance page displays:
   - Agent selector dropdown (Admin sees all, agents see only themselves)
   - Performance metric cards (outstanding, collected, rate, visits)
   - Collection trend chart (last 30 days, daily totals)
   - Top 5 clients by outstanding balance
   - Recent payments collected
   - Recent visits logged
   - Promises status summary (pending, kept, broken)
4. Frontend Admin dashboard includes "Top Collectors" widget (top 3 agents by collection this month)
5. Admin and Accountant can view all agent performance; Agents can view only their own
6. Report exportable to Excel

**Story File:** [docs/stories/story-7-7-agent-performance.md](../stories/story-7-7-agent-performance.md)

---

### Story 7.8: Collection Efficiency Metrics

**As an** admin,
**I want** to measure overall collection efficiency,
**So that** I can assess recovery process effectiveness and identify trends.

**Acceptance Criteria:**
1. GET /api/reports/collection-efficiency generates efficiency report
2. Metrics calculated:
   - **DSO (Days Sales Outstanding)**: Avg days to collect payment from invoice date
     - Formula: (Accounts Receivable / Total Credit Sales) × Days in Period
   - **Collection Effectiveness Index (CEI)**: % of receivables collected
     - Formula: (Collections / (Opening A/R + Credit Sales - Ending A/R)) × 100
   - **Average Collection Period**: Avg days from due date to payment date
   - **On-Time Collection Rate**: % of invoices paid before or on due date
   - **Overdue Rate**: % of outstanding invoices past due date
3. Report shows trends over time (last 6 months, monthly breakdown)
4. Filterable by recovery agent (compare agent efficiency)
5. GET /api/dashboard/admin includes collection efficiency KPIs:
   - Current DSO (target: < 32 days, per project goals)
   - CEI (target: > 90%)
   - Overdue rate (target: < 15%)
6. Frontend Collection Metrics page displays:
   - Metric cards with trend indicators (improving/declining)
   - DSO trend chart (line chart, last 6 months)
   - Collection rate by agent (bar chart)
   - On-time vs late payment pie chart
7. Frontend Admin dashboard displays "DSO" widget with target comparison
8. Report exportable to Excel
9. Only Admin and Accountant can access efficiency metrics

**Story File:** [docs/stories/story-7-8-collection-efficiency.md](../stories/story-7-8-collection-efficiency.md)

---

### Story 7.9: Recovery Report Suite

**As an** accountant,
**I want** comprehensive recovery reports for analysis and planning,
**So that** collection strategies can be data-driven.

**Acceptance Criteria:**
1. **Outstanding Receivables Report:**
   - GET /api/reports/receivables-outstanding
   - Shows: Client, Invoice #, Invoice Date, Due Date, Days Overdue, Amount, Agent Assigned
   - Filterable by: date range, clientId, agentId, days overdue
   - Sortable by: days overdue, amount, client
2. **Collection Summary Report:**
   - GET /api/reports/collection-summary
   - Parameters: date range (required)
   - Shows: Opening A/R, Credit Sales, Collections, Closing A/R, Net Change
   - Breakdown by payment method (Cash, Bank, Cheque)
   - Breakdown by recovery agent (if assigned)
3. **Recovery Visit Report:**
   - GET /api/reports/recovery-visits
   - Parameters: date range, agentId
   - Shows: Visit Date, Client, Agent, Outcome, Payment Collected, Promise Amount, Notes
   - Summary: Total visits, Successful collections, Promises obtained
4. **Payment Promise Report:**
   - GET /api/reports/payment-promises
   - Parameters: status (PENDING/KEPT/BROKEN), date range
   - Shows: Client, Promise Date, Promise Amount, Actual Payment, Status
   - Summary: Promises kept %, Promises broken %, Total promised vs collected
5. All reports exportable to Excel
6. Frontend Reports Center includes "Recovery Reports" category with all 4 reports
7. Frontend displays reports in responsive tables with filters and summaries
8. Accountant, Recovery Agent, Admin can access recovery reports

**Story File:** [docs/stories/story-7-9-recovery-reports.md](../stories/story-7-9-recovery-reports.md)

---

### Story 7.10: Recovery Dashboard Enhancements

**As a** recovery agent,
**I want** a comprehensive recovery dashboard,
**So that** I can quickly assess my workload and priorities.

**Acceptance Criteria:**
1. GET /api/dashboard/recovery returns comprehensive recovery metrics:
   - Assigned clients count (total and with outstanding balance)
   - Total outstanding receivables (assigned clients)
   - Overdue receivables (assigned clients)
   - Payments collected today/this week/this month
   - Today's scheduled visits count
   - Promises due today count
   - Broken promises count (requires follow-up)
   - Top 5 overdue clients (by amount and days)
   - Recent payments collected (last 10)
   - Collection trend (last 7 days)
2. Frontend Recovery Dashboard displays:
   - Metric cards (outstanding, overdue, collected today/week/month)
   - "Today's Schedule" section with scheduled clients (first 5, link to full schedule)
   - "Promises Due Today" section with promise list
   - "Broken Promises" alert widget (requires follow-up)
   - "Top Overdue Clients" table (prioritize visits)
   - Collection trend chart (bar chart, last 7 days)
   - Quick actions: View Full Schedule, Record Payment, Log Visit
3. Dashboard responsive and updates on load
4. Dashboard displays alerts badge count (overdue payments, broken promises)
5. Recovery Agent role sees this dashboard by default on login
6. Admin can view any agent's dashboard by selecting agent

**Story File:** [docs/stories/story-7-10-recovery-dashboard.md](../stories/story-7-10-recovery-dashboard.md)

---

## Epic 7 Dependencies

- **Epic 1** - Foundation, authentication, audit
- **Epic 3** - Sales, payments (client balances must be operational)

## Epic 7 Deliverables

✅ Weekly recovery schedule configuration (assign clients to days/agents)
✅ Daily recovery route planning
✅ Comprehensive aging analysis reports
✅ Recovery visit logging with outcomes
✅ Payment promise tracking with automated follow-up
✅ Overdue alert escalation
✅ Recovery agent performance dashboards
✅ Collection efficiency metrics (DSO, CEI, collection rate)
✅ Comprehensive recovery report suite
✅ Enhanced recovery dashboards
✅ **All recovery operations logged in audit trail**

## Success Criteria

- Recovery schedules enable systematic collection
- Agents can plan daily routes efficiently
- Aging analysis identifies high-priority collections
- Visit logging tracks field activity
- Payment promises tracked and followed up automatically
- Overdue alerts escalate by severity
- Agent performance measurable and comparable
- DSO reduced from 45 to 32 days (30% improvement per project goals)
- Collection effectiveness > 90%

## Links

- **Stories:** [docs/stories/](../stories/) (story-7-1 through story-7-10)
- **Architecture:** [docs/architecture/database-schema.md](../architecture/database-schema.md)
- **Phase 2 Roadmap:** [docs/planning/phase-2-roadmap.md](../planning/phase-2-roadmap.md)
