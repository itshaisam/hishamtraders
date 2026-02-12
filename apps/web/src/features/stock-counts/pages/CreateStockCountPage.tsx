import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiClient } from '../../../lib/api-client';
import { stockCountService } from '../../../services/stockCountService';

export default function CreateStockCountPage() {
  const navigate = useNavigate();
  const [warehouseId, setWarehouseId] = useState('');
  const [countDate, setCountDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses-list'],
    queryFn: async () => (await apiClient.get('/warehouses?limit=100')).data,
  });
  const warehouses = warehousesData?.data || [];

  const createMutation = useMutation({
    mutationFn: () => stockCountService.create({ warehouseId, countDate, notes: notes || undefined }),
    onSuccess: (data) => {
      toast.success('Stock count created');
      navigate(`/stock-counts/${data.data.id}`);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create count'),
  });

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Stock Count</h1>
      <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse *</label>
          <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} required>
            <option value="">Select Warehouse</option>
            {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Count Date *</label>
          <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={countDate} onChange={(e) => setCountDate(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => navigate('/stock-counts')} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm">Cancel</button>
          <button type="submit" disabled={createMutation.isPending || !warehouseId} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {createMutation.isPending ? 'Creating...' : 'Create Count'}
          </button>
        </div>
      </form>
    </div>
  );
}
