import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, TrendingUp, Target, DollarSign } from 'lucide-react';
import { recoveryService } from '../../../services/recoveryService';
import { Card, Spinner } from '../../../components/ui';
import { Breadcrumbs } from '../../../components/ui/Breadcrumbs';

const formatCurrency = (n: number) =>
  `PKR ${Number(n || 0).toLocaleString('en-PK', { minimumFractionDigits: 0 })}`;

export default function AgentPerformancePage() {
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));

  const { data, isLoading } = useQuery({
    queryKey: ['agent-performance', dateFrom, dateTo],
    queryFn: () => recoveryService.getAllAgentsPerformance(dateFrom, dateTo),
  });

  const agents = (data?.data || []) as any[];

  const totalVisits = agents.reduce((s, a) => s + (a.totalVisits || 0), 0);
  const totalCollected = agents.reduce((s, a) => s + (a.totalCollected || 0), 0);
  const avgFulfillment = agents.length
    ? agents.reduce((s, a) => s + (a.fulfillmentRate || 0), 0) / agents.length
    : 0;

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Recovery', href: '/recovery/dashboard' }, { label: 'Agent Performance' }]} className="mb-4" />
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Agent Performance</h1>
        <p className="text-gray-600 mt-1">Recovery agent comparison and metrics</p>
      </div>

      {/* Date Filters */}
      <div className="flex gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg"><Users size={20} className="text-blue-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Active Agents</p>
              <p className="text-xl font-bold">{agents.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg"><TrendingUp size={20} className="text-green-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Total Visits</p>
              <p className="text-xl font-bold">{totalVisits}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg"><DollarSign size={20} className="text-emerald-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Total Collected</p>
              <p className="text-xl font-bold">{formatCurrency(totalCollected)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg"><Target size={20} className="text-purple-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Avg Fulfillment</p>
              <p className="text-xl font-bold">{avgFulfillment.toFixed(1)}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Comparison Table */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Customers</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Visits</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Collected</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg/Visit</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Fulfillment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {agents.map((agent: any) => (
                  <tr key={agent.agentId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{agent.agentName}</td>
                    <td className="px-4 py-3 text-sm text-right">{agent.assignedClients || 0}</td>
                    <td className="px-4 py-3 text-sm text-right">{agent.totalVisits || 0}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-green-600">
                      {formatCurrency(agent.totalCollected)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {agent.totalVisits ? formatCurrency(agent.totalCollected / agent.totalVisits) : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span className={agent.fulfillmentRate >= 70 ? 'text-green-600' : agent.fulfillmentRate >= 50 ? 'text-yellow-600' : 'text-red-600'}>
                        {(agent.fulfillmentRate || 0).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {agents.length === 0 && (
            <p className="text-center text-gray-500 py-8">No recovery agents found</p>
          )}
        </Card>
      )}
    </div>
  );
}
