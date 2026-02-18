import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api-client';
import { useCreateGatePass } from '../../../hooks/useGatePasses';
import { GatePassPurpose, CreateGatePassDto } from '../../../types/gate-pass.types';
import { Button } from '../../../components/ui';
import { Breadcrumbs } from '../../../components/ui/Breadcrumbs';

interface ProductOption {
  id: string;
  name: string;
  sku: string;
}

interface WarehouseOption {
  id: string;
  name: string;
  gatePassMode: string;
}

interface ItemRow {
  productId: string;
  batchNo: string;
  binLocation: string;
  quantity: number;
  description: string;
}

export default function CreateGatePassPage() {
  const navigate = useNavigate();
  const createMutation = useCreateGatePass();

  const [warehouseId, setWarehouseId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [purpose, setPurpose] = useState<GatePassPurpose>(GatePassPurpose.SALE);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<ItemRow[]>([
    { productId: '', batchNo: '', binLocation: '', quantity: 1, description: '' },
  ]);

  // Fetch warehouses
  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses', 'all'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: WarehouseOption[] }>('/warehouses?limit=100');
      return res.data.data;
    },
  });

  // Fetch products
  const { data: productsData } = useQuery({
    queryKey: ['products', 'all'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: ProductOption[] }>('/products?limit=500&status=ACTIVE');
      return res.data.data;
    },
  });

  const warehouses = warehousesData || [];
  const products = productsData || [];

  const selectedWarehouse = warehouses.find((w) => w.id === warehouseId);

  const addItem = () => {
    setItems([...items, { productId: '', batchNo: '', binLocation: '', quantity: 1, description: '' }]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof ItemRow, value: string | number) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    setItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: CreateGatePassDto = {
      warehouseId,
      date,
      purpose,
      notes: notes || undefined,
      items: items
        .filter((item) => item.productId)
        .map((item) => ({
          productId: item.productId,
          batchNo: item.batchNo || undefined,
          binLocation: item.binLocation || undefined,
          quantity: item.quantity,
          description: item.description || undefined,
        })),
    };

    try {
      await createMutation.mutateAsync(payload);
      navigate('/gate-passes');
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <div className="p-6">
      <Breadcrumbs items={[{ label: 'Inventory', href: '/stock-levels' }, { label: 'Gate Passes', href: '/gate-passes' }, { label: 'Create Gate Pass' }]} className="mb-4" />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create Gate Pass</h1>
        <p className="text-sm text-gray-500 mt-1">Create a new outbound gate pass</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header Fields */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Gate Pass Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse *</label>
              <select
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
              >
                <option value="">Select warehouse</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
              {selectedWarehouse && (
                <p className="text-xs text-gray-500 mt-1">
                  Mode: <span className="font-medium">{selectedWarehouse.gatePassMode}</span>
                  {selectedWarehouse.gatePassMode === 'AUTO'
                    ? ' (auto-approved, inventory deducted immediately)'
                    : ' (requires manual approval)'}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input
                type="date"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purpose *</label>
              <select
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value as GatePassPurpose)}
              >
                <option value="SALE">Sale</option>
                <option value="TRANSFER">Transfer</option>
                <option value="RETURN">Return</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
            />
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Items</h2>
            <button
              type="button"
              onClick={addItem}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              + Add Item
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-4">
                  {index === 0 && <label className="block text-xs font-medium text-gray-500 mb-1">Product *</label>}
                  <select
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={item.productId}
                    onChange={(e) => updateItem(index, 'productId', e.target.value)}
                  >
                    <option value="">Select product</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  {index === 0 && <label className="block text-xs font-medium text-gray-500 mb-1">Batch No</label>}
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="Batch"
                    value={item.batchNo}
                    onChange={(e) => updateItem(index, 'batchNo', e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  {index === 0 && <label className="block text-xs font-medium text-gray-500 mb-1">Bin Location</label>}
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="Bin"
                    value={item.binLocation}
                    onChange={(e) => updateItem(index, 'binLocation', e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  {index === 0 && <label className="block text-xs font-medium text-gray-500 mb-1">Quantity *</label>}
                  <input
                    type="number"
                    required
                    min={1}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="col-span-2 flex gap-1">
                  {index === 0 && <label className="block text-xs font-medium text-gray-500 mb-1">&nbsp;</label>}
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="text-red-500 hover:text-red-700 text-sm px-2 py-2"
                    disabled={items.length <= 1}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/gate-passes')}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creating...' : 'Create Gate Pass'}
          </Button>
        </div>
      </form>
    </div>
  );
}
