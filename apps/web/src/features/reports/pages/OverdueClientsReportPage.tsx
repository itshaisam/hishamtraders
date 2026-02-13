import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { recoveryService } from '../../../services/recoveryService';
import { Card, Spinner, Badge, Button } from '../../../components/ui';

const formatCurrency = (n: number) =>
  `PKR ${Number(n || 0).toLocaleString('en-PK', { minimumFractionDigits: 0 })}`;

export default function OverdueClientsReportPage() {
  const [minDays, setMinDays] = useState('');
  const [city, setCity] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['overdue-clients-report', minDays, city, page],
    queryFn: () => recoveryService.getOverdueClientsReport({
      minDaysOverdue: minDays ? Number(minDays) : undefined,
      city: city || undefined,
      page,
      limit: 25,
    }),
  });

  const clients = data?.data || [];
  const summary = data?.summary;
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Overdue Clients Report</h1>
        <p className="text-gray-600 mt-1">Clients with past-due invoices</p>
      </div>

      <div className="flex gap-3 items-end flex-wrap">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Min Days Overdue</label>
          <input type="number" value={minDays} onChange={(e) => { setMinDays(e.target.value); setPage(1); }}
            placeholder="0" className="rounded border border-gray-300 px-3 py-2 text-sm w-32" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">City</label>
          <input type="text" value={city} onChange={(e) => { setCity(e.target.value); setPage(1); }}
            placeholder="All" className="rounded border border-gray-300 px-3 py-2 text-sm w-40" />
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="p-4">
            <p className="text-xs text-gray-500">Overdue Clients</p>
            <p className="text-xl font-bold">{summary.clientCount}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-gray-500">Total Overdue</p>
            <p className="text-xl font-bold text-red-600">{formatCurrency(summary.totalOverdue)}</p>
          </Card>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">City</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Overdue Amount</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Days Overdue</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Visit</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {clients.map((c: any) => (
                  <tr key={c.clientId} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm font-medium text-gray-900">{c.clientName}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{c.city || '—'}</td>
                    <td className="px-4 py-2 text-sm text-right font-medium text-red-600">{formatCurrency(c.overdueAmount)}</td>
                    <td className="px-4 py-2 text-sm text-right">
                      <Badge variant={c.daysOverdue > 30 ? 'danger' : c.daysOverdue > 14 ? 'warning' : 'info'}>
                        {c.daysOverdue}d
                      </Badge>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {c.lastVisitDate ? new Date(c.lastVisitDate).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Link to={`/recovery/visits/log?clientId=${c.clientId}`}>
                        <Button size="sm" variant="primary">Log Visit</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {clients.length === 0 && <p className="text-center text-gray-500 py-8">No overdue clients found</p>}
          {meta && meta.totalPages > 1 && (
            <div className="flex justify-center gap-2 py-4">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50">Prev</button>
              <span className="px-3 py-1 text-sm">Page {page} of {meta.totalPages}</span>
              <button onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page >= meta.totalPages}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50">Next</button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
