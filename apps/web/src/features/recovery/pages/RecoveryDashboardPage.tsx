import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Calendar, DollarSign, AlertTriangle, Clock, Users, TrendingUp, Bell, Target } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { recoveryService } from '../../../services/recoveryService';
import { Card, Button, Badge, Spinner } from '../../../components/ui';

const formatCurrency = (n: number) =>
  `PKR ${Number(n || 0).toLocaleString('en-PK', { minimumFractionDigits: 0 })}`;

const OVERDUE_COLORS = ['#eab308', '#f97316', '#ef4444', '#991b1b'];

export default function RecoveryDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['recovery-dashboard'],
    queryFn: () => recoveryService.getRecoveryDashboard(),
    refetchInterval: 300000, // 5 min auto-refresh
  });

  const d = data?.data;

  if (isLoading) {
    return <div className="flex justify-center py-20"><Spinner /></div>;
  }

  if (!d) {
    return <p className="text-center text-gray-500 py-12">Unable to load dashboard</p>;
  }

  // Transform overdueSummary from { '1-7': { clients, amount }, ... } to array format
  const overduePieData = d.overdueSummary
    ? Object.entries(d.overdueSummary).map(([bucket, val]: [string, any]) => ({
        bucket,
        totalAmount: val.amount || 0,
        clientCount: val.clients || 0,
      })).filter((b: any) => b.totalAmount > 0)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recovery Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of collection activities and metrics</p>
        </div>
        <div className="flex gap-2">
          <Link to="/recovery/route">
            <Button variant="primary" size="sm">Today's Route</Button>
          </Link>
          <Link to="/recovery/visits/log">
            <Button variant="secondary" size="sm">Log Visit</Button>
          </Link>
        </div>
      </div>

      {/* Top KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg"><Calendar size={20} className="text-blue-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Today's Schedule</p>
              <p className="text-xl font-bold">{d.todaySchedule?.scheduledClients || 0}</p>
              <p className="text-xs text-green-600">{d.todaySchedule?.completedVisits || 0} completed</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg"><Clock size={20} className="text-yellow-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Due Promises</p>
              <p className="text-xl font-bold">{d.duePromises?.count || 0}</p>
              <p className="text-xs text-gray-500">{formatCurrency(d.duePromises?.totalAmount || 0)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg"><DollarSign size={20} className="text-green-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Collected Today</p>
              <p className="text-xl font-bold">{formatCurrency(d.collectionMetrics?.todayCollected || 0)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg"><Target size={20} className="text-purple-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Fulfillment Rate</p>
              <p className="text-xl font-bold">{(d.fulfillmentRate?.rate || 0).toFixed(1)}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Collection Metrics + Overdue Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Collection Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Today</span>
              <span className="font-medium">{formatCurrency(d.collectionMetrics?.todayCollected || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">This Week</span>
              <span className="font-medium">{formatCurrency(d.collectionMetrics?.weekCollected || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">This Month</span>
              <span className="font-medium text-lg">{formatCurrency(d.collectionMetrics?.monthCollected || 0)}</span>
            </div>
          </div>
          {d.alertCount > 0 && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg flex items-center gap-2">
              <Bell size={16} className="text-red-500" />
              <span className="text-sm text-red-700">{d.alertCount} unread alerts</span>
              <Link to="/recovery/alerts" className="ml-auto text-sm text-red-600 underline">View</Link>
            </div>
          )}
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Overdue Distribution</h3>
          {overduePieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={overduePieData}
                  dataKey="totalAmount"
                  nameKey="bucket"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ bucket, totalAmount }: any) => `${bucket}: ${formatCurrency(totalAmount)}`}
                >
                  {overduePieData.map((_: any, i: number) => (
                    <Cell key={i} fill={OVERDUE_COLORS[i % OVERDUE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-400 py-8">No overdue data</p>
          )}
          <div className="flex flex-wrap gap-2 mt-2 justify-center">
            {overduePieData.map((b: any, i: number) => (
              <div key={b.bucket} className="flex items-center gap-1 text-xs">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: OVERDUE_COLORS[i % OVERDUE_COLORS.length] }} />
                <span>{b.bucket} ({b.clientCount})</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Visits + Top Overdue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900">Recent Visits</h3>
            <Link to="/reports/recovery/visits" className="text-sm text-blue-600">View All</Link>
          </div>
          <div className="space-y-2">
            {(d.recentVisits || []).length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No recent visits</p>
            ) : (
              (d.recentVisits || []).map((v: any) => (
                <div key={v.id} className="flex justify-between items-center text-sm border-b pb-2">
                  <div>
                    <p className="font-medium text-gray-900">{v.clientName || v.client?.name}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(v.visitDate).toLocaleDateString()} — {v.outcome?.replace(/_/g, ' ')}
                    </p>
                  </div>
                  {Number(v.amountCollected) > 0 && (
                    <span className="text-green-600 font-medium">{formatCurrency(Number(v.amountCollected))}</span>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900">Top Overdue Customers</h3>
            <Link to="/reports/recovery/overdue" className="text-sm text-blue-600">View All</Link>
          </div>
          <div className="space-y-2">
            {(d.topOverdueClients || []).length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No overdue customers</p>
            ) : (
              (d.topOverdueClients || []).map((c: any, i: number) => (
                <div key={c.id} className="flex justify-between items-center text-sm border-b pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-xs font-bold text-red-600">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">{c.name}</p>
                      <p className="text-xs text-gray-500">{c.city || ''}</p>
                    </div>
                  </div>
                  <span className="font-medium text-red-600">{formatCurrency(Number(c.balance))}</span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
        <div className="flex flex-wrap gap-2">
          <Link to="/recovery/route"><Button size="sm" variant="primary">Today's Route</Button></Link>
          <Link to="/recovery/promises"><Button size="sm" variant="secondary">Due Promises</Button></Link>
          <Link to="/recovery/aging"><Button size="sm" variant="secondary">Aging Analysis</Button></Link>
          <Link to="/recovery/alerts"><Button size="sm" variant="secondary">Alerts</Button></Link>
          <Link to="/reports/recovery/visits"><Button size="sm" variant="secondary">Visit Report</Button></Link>
          <Link to="/recovery/agents/performance"><Button size="sm" variant="secondary">Agent Performance</Button></Link>
        </div>
      </Card>
    </div>
  );
}
