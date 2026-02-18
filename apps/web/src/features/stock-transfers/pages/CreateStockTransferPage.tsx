import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiClient } from '../../../lib/api-client';
import { stockTransferService } from '../../../services/stockTransferService';
import { Breadcrumbs } from '../../../components/ui/Breadcrumbs';

interface TransferItem {
  productId: string;
  productName: string;
  batchNo: string;
  quantity: number;
}

export default function CreateStockTransferPage() {
  const navigate = useNavigate();
  const [sourceWarehouseId, setSourceWarehouseId] = useState('');
  const [destinationWarehouseId, setDestinationWarehouseId] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<TransferItem[]>([{ productId: '', productName: '', batchNo: '', quantity: 1 }]);

  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses-list'],
    queryFn: async () => (await apiClient.get('/warehouses?limit=100')).data,
  });
  const warehouses = warehousesData?.data || [];

  const { data: productsData } = useQuery({
    queryKey: ['products-list'],
    queryFn: async () => (await apiClient.get('/products?limit=500&status=ACTIVE')).data,
  });
  const products = productsData?.data || [];

  const createMutation = useMutation({
    mutationFn: () => stockTransferService.create({
      sourceWarehouseId,
      destinationWarehouseId,
      notes: notes || undefined,
      items: items.filter((i) => i.productId).map((i) => ({
        productId: i.productId,
        batchNo: i.batchNo || undefined,
        quantity: i.quantity,
      })),
    }),
    onSuccess: () => {
      toast.success('Stock transfer created');
      navigate('/stock-transfers');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create transfer'),
  });

  const addItem = () => setItems([...items, { productId: '', productName: '', batchNo: '', quantity: 1 }]);
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));
  const updateItem = (index: number, field: keyof TransferItem, value: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    if (field === 'productId') {
      const product = products.find((p: any) => p.id === value);
      updated[index].productName = product?.name || '';
    }
    setItems(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceWarehouseId || !destinationWarehouseId) return toast.error('Select both warehouses');
    if (sourceWarehouseId === destinationWarehouseId) return toast.error('Warehouses must be different');
    if (!items.some((i) => i.productId)) return toast.error('Add at least one item');
    createMutation.mutate();
  };

  return (
    <div className="p-6">
      <Breadcrumbs items={[{ label: 'Inventory', href: '/stock-levels' }, { label: 'Stock Transfers', href: '/stock-transfers' }, { label: 'Create Transfer' }]} className="mb-4" />
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Stock Transfer</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source Warehouse *</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={sourceWarehouseId} onChange={(e) => setSourceWarehouseId(e.target.value)} required>
                <option value="">Select source</option>
                {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Destination Warehouse *</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={destinationWarehouseId} onChange={(e) => setDestinationWarehouseId(e.target.value)} required>
                <option value="">Select destination</option>
                {warehouses.filter((w: any) => w.id !== sourceWarehouseId).map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Items</h2>
            <button type="button" onClick={addItem} className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200">+ Add Item</button>
          </div>
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-5">
                  {index === 0 && <label className="block text-xs text-gray-500 mb-1">Product</label>}
                  <select className="w-full border border-gray-300 rounded px-2 py-2 text-sm" value={item.productId} onChange={(e) => updateItem(index, 'productId', e.target.value)}>
                    <option value="">Select product</option>
                    {products.map((p: any) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                  </select>
                </div>
                <div className="col-span-3">
                  {index === 0 && <label className="block text-xs text-gray-500 mb-1">Batch No</label>}
                  <input type="text" className="w-full border border-gray-300 rounded px-2 py-2 text-sm" placeholder="Optional" value={item.batchNo} onChange={(e) => updateItem(index, 'batchNo', e.target.value)} />
                </div>
                <div className="col-span-2">
                  {index === 0 && <label className="block text-xs text-gray-500 mb-1">Quantity</label>}
                  <input type="number" min="1" className="w-full border border-gray-300 rounded px-2 py-2 text-sm" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)} />
                </div>
                <div className="col-span-2 flex justify-center">
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700 text-sm">Remove</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate('/stock-transfers')} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm">Cancel</button>
          <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {createMutation.isPending ? 'Creating...' : 'Create Transfer'}
          </button>
        </div>
      </form>
    </div>
  );
}
