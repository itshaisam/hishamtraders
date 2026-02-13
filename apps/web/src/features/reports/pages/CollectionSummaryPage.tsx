import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { recoveryService } from '../../../services/recoveryService';
import { Card, Spinner } from '../../../components/ui';

const formatCurrency = (n: number) =>
  `PKR ${Number(n || 0).toLocaleString('en-PK', { minimumFractionDigits: 0 })}`;

export default function CollectionSummaryPage() {
  const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 10); });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));

  const { data, isLoading } = useQuery({
    queryKey: ['collection-summary-report', dateFrom, dateTo],
    queryFn: () => recoveryService.getCollectionSummaryReport({ dateFrom, dateTo }),
  });

  const result = data?.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Collection Summary</h1>
        <p className="text-gray-600 mt-1">Summary of collections by agent and daily breakdown</p>
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
      ) : result ? (
        <>
          <Card className="p-4">
            <p className="text-xs text-gray-500">Total Collected</p>
            <p className="text-3xl font-bold text-green-600">{formatCurrency(result.totalCollected)}</p>
          </Card>

          {/* Agent Collections */}
          {result.agentCollections?.length > 0 && (
            <Card className="overflow-hidden">
              <div className="px-4 py-3 border-b bg-gray-50">
                <h3 className="font-semibold text-gray-900">By Agent</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Visits</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Collected</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {result.agentCollections.map((a: any) => (
                      <tr key={a.agentId} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm font-medium text-gray-900">{a.agentName}</td>
                        <td className="px-4 py-2 text-sm text-right">{a.visitCount}</td>
                        <td className="px-4 py-2 text-sm text-right font-medium text-green-600">{formatCurrency(a.totalCollected)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Daily Chart */}
          {result.dailyCollections?.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Daily Collections</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={result.dailyCollections}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(d) => new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric' })} />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                  <Bar dataKey="amount" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}
        </>
      ) : null}
    </div>
  );
}
