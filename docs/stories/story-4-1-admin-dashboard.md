# Story 4.1: Admin Dashboard

**Epic:** Epic 4 - Dashboards & Reports
**Story ID:** STORY-4.1
**Priority:** Critical
**Estimated Effort:** 8-10 hours
**Dependencies:** Epic 1, Epic 2, Epic 3
**Status:** Draft

---

## User Story

**As an** admin,
**I want** a comprehensive dashboard showing overall business health,
**So that** I can monitor key metrics and make informed decisions.

---

## Acceptance Criteria

1. **Backend API - Admin Metrics:**
   - [ ] GET /api/dashboard/admin returns comprehensive metrics
   - [ ] Total stock value (sum of inventory qty × cost price)
   - [ ] Today's revenue (sum of invoices created today)
   - [ ] Month's revenue (sum of invoices this month)
   - [ ] Total receivables (sum of client balances)
   - [ ] Total payables (sum of unpaid PO amounts)
   - [ ] Low stock product count
   - [ ] Out of stock product count
   - [ ] Pending containers (POs in IN_TRANSIT status)
   - [ ] Top 5 products by revenue (this month)
   - [ ] Recent audit activity (last 10 actions)
   - [ ] Revenue trend (last 30 days, daily totals)

2. **Frontend Dashboard Display:**
   - [ ] Metric cards: stock value, revenue, receivables, payables
   - [ ] Revenue line chart (last 30 days)
   - [ ] Top products table (by revenue and quantity)
   - [ ] Low/out of stock alerts widget
   - [ ] Pending containers widget
   - [ ] Recent activity widget (audit log summary)
   - [ ] Quick action buttons (New PO, New Invoice, New Product)
   - [ ] The dashboard gracefully handles an "empty state" by displaying informative messages or placeholder content when there is no data to show (e.g., for a new account).

3. **Authorization & Role-Based Access:**
   - [ ] Only Admin role can access full admin dashboard (return 403 for others)
   - [ ] Accountant role: View-only access (no refresh actions)
   - [ ] Other roles: 403 Forbidden with clear error message
   - [ ] Dashboard is responsive (mobile, tablet, desktop)

4. **Performance & Caching:**
   - [ ] Dashboard data refreshes on page load via TanStack Query
   - [ ] Cache TTL: 5 minutes for all metrics
   - [ ] Cache invalidation triggers: new invoice, new PO, stock change
   - [ ] API timeout: 10 seconds maximum
   - [ ] Max records returned: 100 for activity/audit list
   - [ ] Pagination for "Recent activity": 10 items default, load more available

5. **Real-Time Data Updates:**
   - [ ] Dashboard auto-refreshes every 30 seconds
   - [ ] Manual refresh button available for immediate updates
   - [ ] Show "Last updated at" timestamp on dashboard
   - [ ] Network error handling: Show last cached data with warning badge
   - [ ] WebSocket support for live metric updates (optional for MVP)

6. **Error Handling:**
   - [ ] If any metric calculation fails, return partial data with error flags
   - [ ] Display affected metric with "N/A" + error toast
   - [ ] Log all calculation failures for audit trail
   - [ ] Return 202 Accepted with warning if partial data
   - [ ] Show "Last successful update" timestamp for failed metrics

---

## Tasks / Subtasks

### Backend Tasks

- [ ] **Task 1: Admin Dashboard Service**
  - [ ] Create `admin-dashboard.service.ts`
  - [ ] Implement `getAdminDashboard()` method
  - [ ] Calculate all required metrics
  - [ ] Optimize queries for performance

- [ ] **Task 2: Controller & Routes**
  - [ ] Create `dashboard.controller.ts`
  - [ ] Implement GET /api/dashboard/admin
  - [ ] Apply Admin-only authorization

- [ ] **Task 3: Testing**
  - [ ] Backend tests for metric calculations

### Frontend Tasks

- [ ] **Task 4: Admin Dashboard Page**
  - [ ] Create `AdminDashboardPage.tsx`
  - [ ] Metric summary cards component
  - [ ] Revenue trend chart
  - [ ] Top products table
  - [ ] Alerts widgets

- [ ] **Task 5: Charts Integration**
  - [ ] Install chart library (recharts or chart.js)
  - [ ] Revenue trend line chart
  - [ ] Optional: Stock value pie chart

- [ ] **Task 6: Testing**
  - [ ] Frontend tests for dashboard display

---

## Dev Notes

### Admin Dashboard Service

```typescript
interface AdminDashboardMetrics {
  stockValue: number;
  todayRevenue: number;
  monthRevenue: number;
  totalReceivables: number;
  totalPayables: number;
  lowStockCount: number;
  outOfStockCount: number;
  pendingContainers: number;
  topProducts: Array<{
    productId: string;
    productName: string;
    revenue: number;
    quantitySold: number;
  }>;
  recentActivity: Array<{
    action: string;
    user: string;
    timestamp: Date;
    resource: string;
  }>;
  revenueTrend: Array<{
    date: string;
    revenue: number;
  }>;
}

async function getAdminDashboard(): Promise<AdminDashboardMetrics> {
  // Calculate stock value
  const inventory = await prisma.inventory.findMany({
    where: { quantity: { gt: 0 } },
    select: { quantity: true, unitCost: true }
  });
  const stockValue = inventory.reduce(
    (sum, inv) => sum + (inv.quantity * parseFloat(inv.unitCost.toString())),
    0
  );

  // Today's revenue
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayInvoices = await prisma.invoice.findMany({
    where: {
      invoiceDate: { gte: today },
      status: { not: 'VOIDED' }
    },
    select: { total: true }
  });
  const todayRevenue = todayInvoices.reduce(
    (sum, inv) => sum + parseFloat(inv.total.toString()),
    0
  );

  // Month's revenue
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthInvoices = await prisma.invoice.findMany({
    where: {
      invoiceDate: { gte: monthStart },
      status: { not: 'VOIDED' }
    },
    select: { total: true }
  });
  const monthRevenue = monthInvoices.reduce(
    (sum, inv) => sum + parseFloat(inv.total.toString()),
    0
  );

  // Total receivables
  const clients = await prisma.client.findMany({
    select: { balance: true }
  });
  const totalReceivables = clients.reduce(
    (sum, client) => sum + parseFloat(client.balance.toString()),
    0
  );

  // Total payables
  const unpaidPOs = await prisma.purchaseOrder.findMany({
    where: { status: { in: ['DRAFT', 'IN_TRANSIT', 'RECEIVED'] } },
    include: { payments: true }
  });
  const totalPayables = unpaidPOs.reduce((sum, po) => {
    const poTotal = parseFloat(po.totalCost.toString());
    const paid = po.payments.reduce(
      (pSum, payment) => pSum + parseFloat(payment.amount.toString()),
      0
    );
    return sum + (poTotal - paid);
  }, 0);

  // Low/out of stock counts
  const products = await prisma.product.findMany({
    include: { inventory: true }
  });
  let lowStockCount = 0;
  let outOfStockCount = 0;
  products.forEach(product => {
    const totalQty = product.inventory.reduce((sum, inv) => sum + inv.quantity, 0);
    if (totalQty === 0) {
      outOfStockCount++;
    } else if (totalQty <= product.reorderLevel) {
      lowStockCount++;
    }
  });

  // Pending containers
  const pendingContainers = await prisma.purchaseOrder.count({
    where: { status: 'IN_TRANSIT' }
  });

  // Top products by revenue
  const invoiceItems = await prisma.invoiceItem.findMany({
    where: {
      invoice: {
        invoiceDate: { gte: monthStart },
        status: { not: 'VOIDED' }
      }
    },
    include: { product: true }
  });
  const productRevenue = invoiceItems.reduce((acc, item) => {
    const key = item.productId;
    if (!acc[key]) {
      acc[key] = {
        productId: item.productId,
        productName: item.product.name,
        revenue: 0,
        quantitySold: 0
      };
    }
    acc[key].revenue += parseFloat(item.totalPrice.toString());
    acc[key].quantitySold += item.quantity;
    return acc;
  }, {} as Record<string, any>);
  const topProducts = Object.values(productRevenue)
    .sort((a: any, b: any) => b.revenue - a.revenue)
    .slice(0, 5);

  // Recent activity
  const recentActivity = await prisma.auditLog.findMany({
    take: 10,
    orderBy: { timestamp: 'desc' },
    include: { user: true }
  });

  // Revenue trend (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const trendInvoices = await prisma.invoice.findMany({
    where: {
      invoiceDate: { gte: thirtyDaysAgo },
      status: { not: 'VOIDED' }
    },
    select: { invoiceDate: true, total: true }
  });
  const revenueTrend = trendInvoices.reduce((acc, inv) => {
    const dateKey = format(inv.invoiceDate, 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = 0;
    }
    acc[dateKey] += parseFloat(inv.total.toString());
    return acc;
  }, {} as Record<string, number>);

  return {
    stockValue,
    todayRevenue,
    monthRevenue,
    totalReceivables,
    totalPayables,
    lowStockCount,
    outOfStockCount,
    pendingContainers,
    topProducts,
    recentActivity: recentActivity.map(log => ({
      action: log.action,
      user: log.user.name,
      timestamp: log.timestamp,
      resource: log.resource
    })),
    revenueTrend: Object.entries(revenueTrend).map(([date, revenue]) => ({
      date,
      revenue
    }))
  };
}
```

### Frontend Dashboard

```tsx
export const AdminDashboardPage: FC = () => {
  const { data: metrics, isLoading } = useGetAdminDashboard();

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Stock Value"
          value={`Rs.${metrics.stockValue.toFixed(2)}`}
          icon={<Package />}
          color="blue"
        />
        <MetricCard
          title="Today's Revenue"
          value={`Rs.${metrics.todayRevenue.toFixed(2)}`}
          icon={<DollarSign />}
          color="green"
        />
        <MetricCard
          title="Total Receivables"
          value={`Rs.${metrics.totalReceivables.toFixed(2)}`}
          icon={<TrendingUp />}
          color="yellow"
        />
        <MetricCard
          title="Total Payables"
          value={`Rs.${metrics.totalPayables.toFixed(2)}`}
          icon={<TrendingDown />}
          color="red"
        />
      </div>

      {/* Revenue Trend Chart */}
      <Card>
        <Card.Header>Revenue Trend (Last 30 Days)</Card.Header>
        <Card.Body>
          <LineChart width={800} height={300} data={metrics.revenueTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="revenue" stroke="#8884d8" />
          </LineChart>
        </Card.Body>
      </Card>

      {/* Alerts & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <Card.Header>Stock Alerts</Card.Header>
          <Card.Body>
            <Alert variant="warning">
              {metrics.lowStockCount} products low on stock
            </Alert>
            <Alert variant="error" className="mt-2">
              {metrics.outOfStockCount} products out of stock
            </Alert>
            <Alert variant="info" className="mt-2">
              {metrics.pendingContainers} containers in transit
            </Alert>
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>Top Products (This Month)</Card.Header>
          <Card.Body>
            <Table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty Sold</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {metrics.topProducts.map(p => (
                  <tr key={p.productId}>
                    <td>{p.productName}</td>
                    <td>{p.quantitySold}</td>
                    <td>Rs.{p.revenue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};
```

---

## Testing

### Backend Testing
- Admin dashboard metric calculations
- Stock value calculation
- Revenue calculations (today, month, trend)
- Top products query
- Authorization (Admin only)

### Frontend Testing
- Dashboard display with mock data
- Metric cards rendering
- Chart visualization
- Responsive layout

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |

---

## Dev Agent Record

*To be populated by dev agent*

---

## QA Results

*To be populated by QA agent*
