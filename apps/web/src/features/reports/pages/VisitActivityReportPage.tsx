import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { recoveryService } from '../../../services/recoveryService';
import { Card, Spinner, Badge } from '../../../components/ui';
import { Breadcrumbs } from '../../../components/ui/Breadcrumbs';

const formatCurrency = (n: number) =>
  `PKR ${Number(n || 0).toLocaleString('en-PK', { minimumFractionDigits: 0 })}`;

const OUTCOME_COLORS: Record<string, string> = {
  PAYMENT_COLLECTED: 'success', PROMISE_MADE: 'warning', CLIENT_UNAVAILABLE: 'default',
  REFUSED_TO_PAY: 'danger', PARTIAL_PAYMENT: 'info', DISPUTE_RAISED: 'danger', OTHER: 'default',
};

export default function VisitActivityReportPage() {
  const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 10); });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['visit-activity-report', dateFrom, dateTo, page],
    queryFn: () => recoveryService.getVisitActivityReport({ dateFrom, dateTo, page, limit: 25 }),
  });

  const visits = data?.data || [];
  const summary = data?.summary;
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Reports', href: '/reports' }, { label: 'Visit Activity' }]} className="mb-4" />
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Visit Activity Report</h1>
        <p className="text-gray-600 mt-1">Recovery visit logs and outcomes</p>
      </div>

      <div className="flex gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">From</label>
          <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="rounded border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">To</label>
          <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="rounded border border-gray-300 px-3 py-2 text-sm" />
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4">
            <p className="text-xs text-gray-500">Total Visits</p>
            <p className="text-xl font-bold">{summary.totalVisits || 0}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-gray-500">Total Collected</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(summary.totalCollected || 0)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-gray-500">Outcomes</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {summary.visitsByOutcome && Object.entries(summary.visitsByOutcome).map(([k, v]: any) => (
                <Badge key={k} variant={(OUTCOME_COLORS[k] || 'default') as any}>{k.replace(/_/g, ' ')}: {v}</Badge>
              ))}
            </div>
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visit #</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Outcome</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Collected</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {visits.map((v: any) => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-600">{v.visitNumber}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{new Date(v.visitDate).toLocaleDateString()}</td>
                    <td className="px-4 py-2 text-sm font-medium text-gray-900">{v.client?.name}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{v.visitor?.name}</td>
                    <td className="px-4 py-2 text-center">
                      <Badge variant={(OUTCOME_COLORS[v.outcome] || 'default') as any}>{v.outcome?.replace(/_/g, ' ')}</Badge>
                    </td>
                    <td className="px-4 py-2 text-sm text-right">{Number(v.amountCollected) > 0 ? formatCurrency(Number(v.amountCollected)) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {visits.length === 0 && <p className="text-center text-gray-500 py-8">No visits in this period</p>}
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
