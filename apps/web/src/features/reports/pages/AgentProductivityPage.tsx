import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { recoveryService } from '../../../services/recoveryService';
import { Card, Spinner } from '../../../components/ui';
import { Breadcrumbs } from '../../../components/ui/Breadcrumbs';

const formatCurrency = (n: number) =>
  `PKR ${Number(n || 0).toLocaleString('en-PK', { minimumFractionDigits: 0 })}`;

export default function AgentProductivityPage() {
  const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 10); });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));

  const { data, isLoading } = useQuery({
    queryKey: ['agent-productivity-report', dateFrom, dateTo],
    queryFn: () => recoveryService.getAgentProductivityReport({ dateFrom, dateTo }),
  });

  const agents = data?.data || [];

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Reports', href: '/reports' }, { label: 'Agent Productivity' }]} className="mb-4" />
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Agent Productivity Report</h1>
        <p className="text-gray-600 mt-1">Detailed productivity metrics for recovery agents</p>
      </div>

      <div className="flex gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">From</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">To</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded border border-gray-300 px-3 py-2 text-sm" />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Visits</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Visits/Day</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Collected</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg/Visit</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Promises</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Fulfilled</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Rate</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Coverage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {agents.map((a: any) => (
                  <tr key={a.agentId} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm font-medium text-gray-900">{a.agentName}</td>
                    <td className="px-4 py-2 text-sm text-right">{a.totalVisits}</td>
                    <td className="px-4 py-2 text-sm text-right">{(a.visitsPerDay || 0).toFixed(1)}</td>
                    <td className="px-4 py-2 text-sm text-right text-green-600">{formatCurrency(a.totalCollected)}</td>
                    <td className="px-4 py-2 text-sm text-right">{formatCurrency(a.avgCollectionPerVisit || 0)}</td>
                    <td className="px-4 py-2 text-sm text-right">{a.promisesMade}</td>
                    <td className="px-4 py-2 text-sm text-right">{a.promisesFulfilled}</td>
                    <td className="px-4 py-2 text-sm text-right">
                      <span className={a.fulfillmentRate >= 70 ? 'text-green-600' : a.fulfillmentRate >= 50 ? 'text-yellow-600' : 'text-red-600'}>
                        {(a.fulfillmentRate || 0).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-right">{(a.clientCoverage || 0).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {agents.length === 0 && <p className="text-center text-gray-500 py-8">No data available</p>}
        </Card>
      )}
    </div>
  );
}
