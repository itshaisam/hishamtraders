import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';
import { recoveryService } from '../../../services/recoveryService';
import { Card, Button, Badge, Spinner } from '../../../components/ui';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'warning',
  FULFILLED: 'success',
  PARTIAL: 'info',
  BROKEN: 'danger',
  CANCELLED: 'default',
};

const formatCurrency = (n: number) =>
  `PKR ${Number(n || 0).toLocaleString('en-PK', { minimumFractionDigits: 0 })}`;

export default function DuePromisesPage() {
  const [tab, setTab] = useState<'due' | 'overdue' | 'all'>('due');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['due-promises'],
    queryFn: () => recoveryService.getDuePromises(),
  });

  const fulfillMutation = useMutation({
    mutationFn: (id: string) => recoveryService.fulfillPromise(id),
    onSuccess: () => {
      toast.success('Promise marked as fulfilled');
      queryClient.invalidateQueries({ queryKey: ['due-promises'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed'),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => recoveryService.cancelPromise(id),
    onSuccess: () => {
      toast.success('Promise cancelled');
      queryClient.invalidateQueries({ queryKey: ['due-promises'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed'),
  });

  const promises = (data?.data || []) as any[];
  const today = new Date().toISOString().slice(0, 10);

  const filtered = promises.filter((p: any) => {
    const promDate = p.promiseDate?.slice(0, 10);
    if (tab === 'due') return promDate === today;
    if (tab === 'overdue') return promDate < today;
    return true;
  });

  const totalDueAmount = filtered.reduce((s: number, p: any) => s + Number(p.promiseAmount || 0), 0);
  const dueToday = promises.filter((p: any) => p.promiseDate?.slice(0, 10) === today).length;
  const overdue = promises.filter((p: any) => p.promiseDate?.slice(0, 10) < today).length;

  const getDaysOverdue = (promiseDate: string) => {
    const diff = Math.floor((Date.now() - new Date(promiseDate).getTime()) / 86400000);
    return diff > 0 ? diff : 0;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payment Promises</h1>
        <p className="text-gray-600 mt-1">Track and manage customer payment promises</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock size={20} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Due Today</p>
              <p className="text-xl font-bold">{dueToday}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Overdue</p>
              <p className="text-xl font-bold">{overdue}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <AlertTriangle size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Due Amount</p>
              <p className="text-xl font-bold">{formatCurrency(totalDueAmount)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tab Buttons */}
      <div className="flex gap-2">
        {[
          { key: 'due', label: `Due Today (${dueToday})` },
          { key: 'overdue', label: `Overdue (${overdue})` },
          { key: 'all', label: `All Pending (${promises.length})` },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === t.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Promises Table */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <CheckCircle size={48} className="mx-auto text-green-300 mb-4" />
          <p className="text-gray-500">No promises in this category</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Promise Date</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Days Overdue</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map((p: any) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {p.client?.name || 'Unknown'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(p.promiseDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium">
                      {formatCurrency(Number(p.promiseAmount))}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={(STATUS_COLORS[p.status] || 'default') as any}>
                        {p.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      {getDaysOverdue(p.promiseDate) > 0 ? (
                        <span className="text-red-600 font-medium">{getDaysOverdue(p.promiseDate)}d</span>
                      ) : (
                        <span className="text-green-600">Today</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => {
                            if (confirm('Mark this promise as fulfilled?')) {
                              fulfillMutation.mutate(p.id);
                            }
                          }}
                          disabled={fulfillMutation.isPending}
                        >
                          <CheckCircle size={14} className="mr-1" /> Fulfill
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            if (confirm('Cancel this promise?')) {
                              cancelMutation.mutate(p.id);
                            }
                          }}
                          disabled={cancelMutation.isPending}
                        >
                          <XCircle size={14} className="mr-1" /> Cancel
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
