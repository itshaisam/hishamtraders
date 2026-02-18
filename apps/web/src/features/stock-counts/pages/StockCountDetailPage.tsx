import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { stockCountService } from '../../../services/stockCountService';
import { Breadcrumbs } from '../../../components/ui/Breadcrumbs';

const statusColors: Record<string, string> = {
  PLANNED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export default function StockCountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [countedValues, setCountedValues] = useState<Record<string, { countedQuantity: number; notes: string }>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['stock-count', id],
    queryFn: () => stockCountService.getById(id!),
    enabled: !!id,
  });

  const stockCount = data?.data;
  const items = stockCount?.items || [];

  // Initialize counted values when data loads
  useEffect(() => {
    if (items.length > 0 && Object.keys(countedValues).length === 0) {
      const initial: Record<string, { countedQuantity: number; notes: string }> = {};
      items.forEach((item: any) => {
        initial[item.id] = {
          countedQuantity: item.countedQuantity ?? item.systemQuantity,
          notes: item.notes || '',
        };
      });
      setCountedValues(initial);
    }
  }, [items]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['stock-count', id] });

  const startMutation = useMutation({
    mutationFn: () => stockCountService.start(id!),
    onSuccess: () => { toast.success('Count started'); invalidate(); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const itemsToSave = Object.entries(countedValues).map(([itemId, vals]) => ({
        itemId,
        countedQuantity: vals.countedQuantity,
        notes: vals.notes || undefined,
      }));
      return stockCountService.updateItems(id!, itemsToSave);
    },
    onSuccess: () => { toast.success('Items saved'); invalidate(); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to save'),
  });

  const completeMutation = useMutation({
    mutationFn: () => stockCountService.complete(id!),
    onSuccess: () => { toast.success('Stock count completed. Adjustments created for variances.'); invalidate(); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const cancelMutation = useMutation({
    mutationFn: () => stockCountService.cancel(id!),
    onSuccess: () => { toast.success('Count cancelled'); invalidate(); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  });

  if (isLoading) return <div className="p-6"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mt-20"></div></div>;
  if (!stockCount) return <div className="p-6 text-center text-gray-500">Stock count not found</div>;

  const totalVariance = items.reduce((sum: number, i: any) => sum + (i.variance || 0), 0);

  return (
    <div className="p-6">
      <Breadcrumbs items={[{ label: 'Inventory', href: '/stock-levels' }, { label: 'Stock Counts', href: '/stock-counts' }, { label: stockCount?.countNumber || 'Stock Count Detail' }]} className="mb-4" />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{stockCount.countNumber}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[stockCount.status]}`}>
              {stockCount.status.replace('_', ' ')}
            </span>
            <span className="text-sm text-gray-500">{stockCount.warehouse?.name}</span>
            <span className="text-sm text-gray-500">{new Date(stockCount.countDate).toLocaleDateString()}</span>
          </div>
        </div>
        <button onClick={() => navigate('/stock-counts')} className="text-sm text-gray-600 hover:text-gray-800">Back to List</button>
      </div>

      {/* Notes */}
      {stockCount.notes && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-700"><span className="font-medium">Notes:</span> {stockCount.notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-3 flex-wrap">
          {stockCount.status === 'PLANNED' && (
            <>
              <button onClick={() => startMutation.mutate()} disabled={startMutation.isPending} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {startMutation.isPending ? 'Starting...' : 'Start Count'}
              </button>
              <button onClick={() => cancelMutation.mutate()} disabled={cancelMutation.isPending} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 disabled:opacity-50">Cancel</button>
            </>
          )}
          {stockCount.status === 'IN_PROGRESS' && (
            <>
              <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50">
                {saveMutation.isPending ? 'Saving...' : 'Save Progress'}
              </button>
              <button onClick={() => completeMutation.mutate()} disabled={completeMutation.isPending} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                {completeMutation.isPending ? 'Completing...' : 'Complete Count'}
              </button>
              <button onClick={() => cancelMutation.mutate()} disabled={cancelMutation.isPending} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 disabled:opacity-50">Cancel</button>
            </>
          )}
          {stockCount.status === 'COMPLETED' && (
            <div className="text-sm text-gray-500">
              Count completed. Total variance: <span className={`font-medium ${totalVariance !== 0 ? 'text-red-600' : 'text-green-600'}`}>{totalVariance > 0 ? '+' : ''}{totalVariance}</span>
            </div>
          )}
        </div>
      </div>

      {/* Items Grid */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b"><h3 className="text-lg font-semibold">Items ({items.length})</h3></div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bin</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">System Qty</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Counted Qty</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Variance</th>
              {stockCount.status === 'IN_PROGRESS' && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.map((item: any) => {
              const cv = countedValues[item.id];
              const variance = stockCount.status === 'IN_PROGRESS' ? (cv ? cv.countedQuantity - item.systemQuantity : 0) : (item.variance || 0);
              return (
                <tr key={item.id} className={variance !== 0 ? 'bg-yellow-50' : ''}>
                  <td className="px-4 py-3 text-sm text-gray-900">{item.product?.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{item.product?.sku}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{item.batchNo || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{item.binLocation || '-'}</td>
                  <td className="px-4 py-3 text-sm text-right">{item.systemQuantity}</td>
                  <td className="px-4 py-3 text-right">
                    {stockCount.status === 'IN_PROGRESS' ? (
                      <input
                        type="number"
                        min="0"
                        className="w-20 border border-gray-300 rounded px-2 py-1 text-sm text-right"
                        value={cv?.countedQuantity ?? item.systemQuantity}
                        onChange={(e) => setCountedValues({
                          ...countedValues,
                          [item.id]: { ...countedValues[item.id], countedQuantity: parseInt(e.target.value) || 0 },
                        })}
                      />
                    ) : (
                      <span className="text-sm">{item.countedQuantity ?? '-'}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <span className={`font-medium ${variance > 0 ? 'text-green-600' : variance < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                      {variance > 0 ? '+' : ''}{variance}
                    </span>
                  </td>
                  {stockCount.status === 'IN_PROGRESS' && (
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                        placeholder="Notes"
                        value={cv?.notes || ''}
                        onChange={(e) => setCountedValues({
                          ...countedValues,
                          [item.id]: { ...countedValues[item.id], notes: e.target.value },
                        })}
                      />
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
