import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiClient } from '../../../lib/api-client';
import { Breadcrumbs } from '../../../components/ui';

export default function BinTransferPage() {
  const [warehouseId, setWarehouseId] = useState('');
  const [productId, setProductId] = useState('');
  const [sourceBin, setSourceBin] = useState('');
  const [destinationBin, setDestinationBin] = useState('');
  const [batchNo, setBatchNo] = useState('');
  const [quantity, setQuantity] = useState(1);

  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses-dropdown'],
    queryFn: async () => (await apiClient.get('/warehouses?limit=100')).data,
  });
  const warehouses = warehousesData?.data || [];

  const { data: productsData } = useQuery({
    queryKey: ['products-dropdown'],
    queryFn: async () => (await apiClient.get('/products?limit=500&status=ACTIVE')).data,
  });
  const products = productsData?.data || [];

  const { data: binsData } = useQuery({
    queryKey: ['bins', warehouseId],
    queryFn: async () => (await apiClient.get(`/warehouses/${warehouseId}/bins?limit=100&isActive=true`)).data,
    enabled: !!warehouseId,
  });
  const bins = binsData?.data || [];

  const transferMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post(`/warehouses/${warehouseId}/bin-transfers`, {
        productId,
        sourceBin,
        destinationBin,
        batchNo: batchNo || undefined,
        quantity,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Bin transfer completed');
      setProductId('');
      setSourceBin('');
      setDestinationBin('');
      setBatchNo('');
      setQuantity(1);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Transfer failed'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!warehouseId) return toast.error('Select a warehouse');
    if (!productId) return toast.error('Select a product');
    if (!sourceBin) return toast.error('Enter source bin');
    if (!destinationBin) return toast.error('Enter destination bin');
    if (sourceBin === destinationBin) return toast.error('Source and destination must be different');
    if (quantity <= 0) return toast.error('Quantity must be positive');
    transferMutation.mutate();
  };

  return (
    <div className="p-6">
      <Breadcrumbs items={[{ label: 'Inventory', href: '/stock-levels' }, { label: 'Warehouses', href: '/warehouses' }, { label: 'Bin Transfer' }]} className="mb-4" />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Bin-to-Bin Transfer</h1>
        <p className="text-sm text-gray-500 mt-1">Move stock between bin locations within a warehouse</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse *</label>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={warehouseId}
            onChange={(e) => { setWarehouseId(e.target.value); setSourceBin(''); setDestinationBin(''); }}
            required
          >
            <option value="">Select Warehouse</option>
            {warehouses.map((w: any) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product *</label>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            required
          >
            <option value="">Select Product</option>
            {products.map((p: any) => (
              <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source Bin *</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={sourceBin}
              onChange={(e) => setSourceBin(e.target.value)}
              required
            >
              <option value="">Select source bin</option>
              {bins.map((b: any) => (
                <option key={b.id} value={b.code}>{b.code}{b.zone ? ` (${b.zone})` : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Destination Bin *</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={destinationBin}
              onChange={(e) => setDestinationBin(e.target.value)}
              required
            >
              <option value="">Select destination bin</option>
              {bins.filter((b: any) => b.code !== sourceBin).map((b: any) => (
                <option key={b.id} value={b.code}>{b.code}{b.zone ? ` (${b.zone})` : ''}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Batch No</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={batchNo}
              onChange={(e) => setBatchNo(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
            <input
              type="number"
              min="1"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              required
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={transferMutation.isPending}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {transferMutation.isPending ? 'Transferring...' : 'Transfer Stock'}
          </button>
        </div>
      </form>
    </div>
  );
}
