import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { recoveryService } from '../../../services/recoveryService';
import { Card, Button, Input, Spinner } from '../../../components/ui';

const formatCurrency = (n: number) =>
  `PKR ${Number(n || 0).toLocaleString('en-PK', { minimumFractionDigits: 0 })}`;

const BUCKET_COLORS = ['#22c55e', '#eab308', '#f97316', '#ef4444', '#991b1b'];
const BUCKET_LABELS = ['Current', '1-7 Days', '8-14 Days', '15-30 Days', '30+ Days'];

export default function AgingAnalysisPage() {
  const [filters, setFilters] = useState({ agentId: '', city: '', minBalance: '', asOfDate: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['aging-analysis', filters],
    queryFn: () =>
      recoveryService.getAgingAnalysis({
        agentId: filters.agentId || undefined,
        city: filters.city || undefined,
        minBalance: filters.minBalance ? Number(filters.minBalance) : undefined,
        asOfDate: filters.asOfDate || undefined,
      }),
  });

  const { data: agents } = useQuery({
    queryKey: ['recovery-agents'],
    queryFn: () => recoveryService.getRecoveryAgents(),
  });

  const result = data?.data;
  const summary = result?.summary;
  const clients = result?.clients || [];

  const chartData = summary
    ? [
        { name: 'Current', amount: summary.currentTotal },
        { name: '1-7 Days', amount: summary.days1to7Total },
        { name: '8-14 Days', amount: summary.days8to14Total },
        { name: '15-30 Days', amount: summary.days15to30Total },
        { name: '30+ Days', amount: summary.days30plusTotal },
      ]
    : [];

  const handleExport = async () => {
    try {
      const blob = await recoveryService.exportAgingAnalysis({
        agentId: filters.agentId || undefined,
        city: filters.city || undefined,
        asOfDate: filters.asOfDate || undefined,
      });
      const url = window.URL.createObjectURL(new Blob([blob as any]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `aging-analysis-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Aging Analysis</h1>
          <p className="text-gray-600 mt-1">Client receivables broken down by overdue period</p>
        </div>
        <Button variant="secondary" onClick={handleExport}>
          <Download size={16} className="mr-2" /> Export Excel
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Total Outstanding', value: summary.totalOutstanding, color: 'text-gray-900' },
            { label: 'Current', value: summary.currentTotal, color: 'text-green-600' },
            { label: '1-7 Days', value: summary.days1to7Total, color: 'text-yellow-600' },
            { label: '8-14 Days', value: summary.days8to14Total, color: 'text-orange-500' },
            { label: '15-30 Days', value: summary.days15to30Total, color: 'text-red-500' },
            { label: '30+ Days', value: summary.days30plusTotal, color: 'text-red-700' },
          ].map((item) => (
            <Card key={item.label} className="p-3">
              <p className="text-xs text-gray-500">{item.label}</p>
              <p className={`text-lg font-bold ${item.color}`}>{formatCurrency(item.value)}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Recovery Agent</label>
            <select
              value={filters.agentId}
              onChange={(e) => setFilters({ ...filters, agentId: e.target.value })}
              className="rounded border border-gray-300 px-3 py-2 text-sm w-48"
            >
              <option value="">All Agents</option>
              {(agents?.data || []).map((a: any) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">City</label>
            <Input
              value={filters.city}
              onChange={(e) => setFilters({ ...filters, city: e.target.value })}
              placeholder="Filter by city"
              className="w-40"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Min Balance</label>
            <Input
              type="number"
              value={filters.minBalance}
              onChange={(e) => setFilters({ ...filters, minBalance: e.target.value })}
              placeholder="0"
              className="w-32"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">As of Date</label>
            <input
              type="date"
              value={filters.asOfDate}
              onChange={(e) => setFilters({ ...filters, asOfDate: e.target.value })}
              className="rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
      </Card>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Aging Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
              <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">City</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-green-600 uppercase">Current</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-yellow-600 uppercase">1-7d</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-orange-500 uppercase">8-14d</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-red-500 uppercase">15-30d</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-red-700 uppercase">30+d</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Overdue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {clients.map((c: any) => (
                  <tr key={c.clientId} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-sm font-medium text-gray-900">{c.clientName}</td>
                    <td className="px-3 py-2 text-sm text-gray-600">{c.city || '—'}</td>
                    <td className="px-3 py-2 text-sm text-right">{formatCurrency(c.balance)}</td>
                    <td className="px-3 py-2 text-sm text-right text-green-600">{c.current > 0 ? formatCurrency(c.current) : '—'}</td>
                    <td className="px-3 py-2 text-sm text-right text-yellow-600">{c.days1to7 > 0 ? formatCurrency(c.days1to7) : '—'}</td>
                    <td className="px-3 py-2 text-sm text-right text-orange-500">{c.days8to14 > 0 ? formatCurrency(c.days8to14) : '—'}</td>
                    <td className="px-3 py-2 text-sm text-right text-red-500">{c.days15to30 > 0 ? formatCurrency(c.days15to30) : '—'}</td>
                    <td className="px-3 py-2 text-sm text-right text-red-700">{c.days30plus > 0 ? formatCurrency(c.days30plus) : '—'}</td>
                    <td className="px-3 py-2 text-sm text-right font-medium">{formatCurrency(c.totalOverdue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {clients.length === 0 && (
            <p className="text-center text-gray-500 py-8">No clients with outstanding balances</p>
          )}
        </Card>
      )}
    </div>
  );
}
