import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, DollarSign, Clock, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { recoveryService } from '../../../services/recoveryService';
import { Card, Spinner } from '../../../components/ui';
import { Breadcrumbs } from '../../../components/ui/Breadcrumbs';

const formatCurrency = (n: number) =>
  `PKR ${Number(n || 0).toLocaleString('en-PK', { minimumFractionDigits: 0 })}`;

export default function CollectionEfficiencyPage() {
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));

  const { data: metricsData, isLoading } = useQuery({
    queryKey: ['collection-efficiency', dateFrom, dateTo],
    queryFn: () => recoveryService.getCollectionEfficiency({ dateFrom, dateTo }),
  });

  const { data: trendData } = useQuery({
    queryKey: ['collection-trend'],
    queryFn: () => recoveryService.getCollectionTrend(6),
  });

  const metrics = metricsData?.data;
  const trend = trendData?.data || [];

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Recovery', href: '/recovery/dashboard' }, { label: 'Collection Efficiency' }]} className="mb-4" />
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Collection Efficiency</h1>
        <p className="text-gray-600 mt-1">KPI metrics for payment collection performance</p>
      </div>

      {/* Date Filters */}
      <div className="flex gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">From</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">To</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2 text-sm" />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : metrics ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg"><DollarSign size={20} className="text-blue-600" /></div>
                <div>
                  <p className="text-xs text-gray-500">Total Invoiced</p>
                  <p className="text-xl font-bold">{formatCurrency(metrics.totalInvoiced)}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg"><TrendingUp size={20} className="text-green-600" /></div>
                <div>
                  <p className="text-xs text-gray-500">Total Collected</p>
                  <p className="text-xl font-bold">{formatCurrency(metrics.totalCollected)}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg"><Target size={20} className="text-purple-600" /></div>
                <div>
                  <p className="text-xs text-gray-500">Collection Rate</p>
                  <p className="text-xl font-bold">{(metrics.collectionRate || 0).toFixed(1)}%</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg"><Clock size={20} className="text-orange-600" /></div>
                <div>
                  <p className="text-xs text-gray-500">DSO (Days)</p>
                  <p className="text-xl font-bold">{(metrics.dso || 0).toFixed(0)}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4">
              <p className="text-xs text-gray-500">CEI (Collection Effectiveness)</p>
              <p className="text-2xl font-bold text-blue-600">{(metrics.cei || 0).toFixed(1)}%</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-gray-500">Total Outstanding</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(metrics.totalOutstanding)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-gray-500">Overdue Amount</p>
              <p className="text-2xl font-bold text-red-700">{formatCurrency(metrics.overdueAmount)}</p>
            </Card>
          </div>
        </>
      ) : null}

      {/* Trend Chart */}
      {trend.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Collection Trend (6 Months)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="amount" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <YAxis yAxisId="rate" orientation="right" tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(value: any, name: any) =>
                name === 'collectionRate' ? `${Number(value).toFixed(1)}%` : formatCurrency(Number(value))
              } />
              <Legend />
              <Line yAxisId="amount" type="monotone" dataKey="totalInvoiced" name="Invoiced" stroke="#3b82f6" strokeWidth={2} />
              <Line yAxisId="amount" type="monotone" dataKey="totalCollected" name="Collected" stroke="#22c55e" strokeWidth={2} />
              <Line yAxisId="rate" type="monotone" dataKey="collectionRate" name="Rate %" stroke="#a855f7" strokeWidth={2} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}
