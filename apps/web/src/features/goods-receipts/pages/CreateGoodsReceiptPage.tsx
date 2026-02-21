import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Input, Select, Breadcrumbs, Spinner } from '../../../components/ui';
import { usePurchaseOrders, usePurchaseOrder } from '@/features/purchase-orders/hooks/usePurchaseOrders';
import { useWarehouses } from '@/hooks/useWarehouses';
import { useCreateGRN } from '../hooks/useGoodsReceipts';
import { CreateGRNItemRequest } from '../types/goods-receipt.types';

interface ReceiveItem extends CreateGRNItemRequest {
  productName: string;
  productSku: string;
  variantName?: string;
  ordered: number;
  alreadyReceived: number;
  remaining: number;
}

export const CreateGoodsReceiptPage: React.FC = () => {
  const { poId: routePoId } = useParams<{ poId: string }>();
  const navigate = useNavigate();

  const [selectedPoId, setSelectedPoId] = useState(routePoId || '');
  const [warehouseId, setWarehouseId] = useState('');
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [receiveItems, setReceiveItems] = useState<ReceiveItem[]>([]);

  // Fetch receivable POs (PENDING, IN_TRANSIT, PARTIALLY_RECEIVED)
  const { data: posResponse } = usePurchaseOrders({ limit: 100 });
  const receivablePOs = (posResponse?.data || []).filter(
    (po: any) => ['PENDING', 'IN_TRANSIT', 'PARTIALLY_RECEIVED'].includes(po.status)
  );

  // Fetch selected PO details
  const { data: poResponse, isLoading: poLoading } = usePurchaseOrder(selectedPoId);
  const selectedPO = poResponse?.data;

  const { data: warehousesResponse } = useWarehouses();
  const warehouses = (warehousesResponse?.data || []).filter((w: any) => w.status === 'ACTIVE');

  const createGRN = useCreateGRN();

  // When PO is loaded, populate receive items
  useEffect(() => {
    if (!selectedPO?.items) return;

    const items: ReceiveItem[] = selectedPO.items
      .filter((item: any) => item.quantity - (item.receivedQuantity || 0) > 0)
      .map((item: any) => {
        const remaining = item.quantity - (item.receivedQuantity || 0);
        return {
          poItemId: item.id,
          productId: item.productId,
          productVariantId: item.productVariantId || null,
          quantity: remaining,
          binLocation: null,
          batchNo: null,
          productName: item.product?.name || 'Unknown',
          productSku: item.productVariant?.sku || item.product?.sku || '-',
          variantName: item.productVariant?.variantName,
          ordered: item.quantity,
          alreadyReceived: item.receivedQuantity || 0,
          remaining,
        };
      });

    setReceiveItems(items);
  }, [selectedPO]);

  const handleQuantityChange = (index: number, qty: number) => {
    setReceiveItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], quantity: Math.min(Math.max(0, qty), updated[index].remaining) };
      return updated;
    });
  };

  const handleFieldChange = (index: number, field: 'binLocation' | 'batchNo', value: string) => {
    setReceiveItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value || null };
      return updated;
    });
  };

  const handleSubmit = async () => {
    if (!selectedPoId) { toast.error('Please select a Purchase Order'); return; }
    if (!warehouseId) { toast.error('Please select a Warehouse'); return; }

    const itemsToReceive = receiveItems.filter((item) => item.quantity > 0);
    if (itemsToReceive.length === 0) { toast.error('Please enter quantity for at least one item'); return; }

    try {
      const result = await createGRN.mutateAsync({
        poId: selectedPoId,
        warehouseId,
        receivedDate: new Date(receivedDate).toISOString(),
        notes: notes || null,
        items: itemsToReceive.map((item) => ({
          poItemId: item.poItemId,
          productId: item.productId,
          productVariantId: item.productVariantId,
          quantity: item.quantity,
          binLocation: item.binLocation,
          batchNo: item.batchNo,
        })),
      });

      toast.success('Goods Receipt Note created successfully!');
      navigate(`/goods-receipts/${result.data?.id || ''}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create goods receipt');
    }
  };

  return (
    <div className="p-6 space-y-4">
      <Breadcrumbs
        items={[
          { label: 'Purchases', href: '/purchase-orders' },
          { label: 'Goods Receipts', href: '/goods-receipts' },
          { label: 'Create' },
        ]}
        className="mb-4"
      />

      <div className="flex items-start gap-4">
        <button
          onClick={() => navigate('/goods-receipts')}
          className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} className="text-gray-700" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Goods Receipt</h1>
          <p className="text-sm text-gray-600">Receive goods from a purchase order</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* PO Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Purchase Order <span className="text-red-500">*</span>
            </label>
            <Select
              value={selectedPoId}
              onChange={(e) => setSelectedPoId(e.target.value)}
              disabled={!!routePoId}
              options={[
                { value: '', label: 'Select Purchase Order' },
                ...receivablePOs.map((po: any) => ({
                  value: po.id,
                  label: `${po.poNumber} - ${po.supplier?.name || 'Unknown'} (${po.status})`,
                })),
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Warehouse <span className="text-red-500">*</span>
            </label>
            <Select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              options={[
                { value: '', label: 'Select Warehouse' },
                ...warehouses.map((w: any) => ({ value: w.id, label: w.name })),
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Received Date</label>
            <Input
              type="date"
              value={receivedDate}
              onChange={(e) => setReceivedDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
            />
          </div>
        </div>

        {/* PO Info */}
        {selectedPoId && selectedPO && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500">PO Number</p>
                <p className="font-semibold">{selectedPO.poNumber}</p>
              </div>
              <div>
                <p className="text-gray-500">Supplier</p>
                <p className="font-semibold">{selectedPO.supplier?.name}</p>
              </div>
              <div>
                <p className="text-gray-500">Status</p>
                <p className="font-semibold">{selectedPO.status}</p>
              </div>
              <div>
                <p className="text-gray-500">Total Items</p>
                <p className="font-semibold">{selectedPO.items?.length || 0}</p>
              </div>
            </div>
          </div>
        )}

        {/* Items Table */}
        {poLoading && (
          <div className="flex justify-center py-8"><Spinner /></div>
        )}

        {selectedPoId && receiveItems.length === 0 && !poLoading && (
          <div className="text-center py-8 text-gray-500">
            All items have been fully received for this purchase order.
          </div>
        )}

        {receiveItems.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Items to Receive</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-200 bg-gray-50">
                    <th className="px-3 py-2 text-left font-semibold text-gray-900">Product</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-900">Ordered</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-900">Received</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-900">Remaining</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-900">Receive Qty</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-900">Bin Location</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-900">Batch No</th>
                  </tr>
                </thead>
                <tbody>
                  {receiveItems.map((item, index) => (
                    <tr key={item.poItemId} className="border-b border-gray-200">
                      <td className="px-3 py-2">
                        <p className="font-medium text-gray-900">{item.productName}</p>
                        <p className="text-xs text-gray-500">{item.productSku}</p>
                        {item.variantName && (
                          <p className="text-xs text-blue-600">{item.variantName}</p>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-700">{item.ordered}</td>
                      <td className="px-3 py-2 text-right text-gray-500">{item.alreadyReceived}</td>
                      <td className="px-3 py-2 text-right font-medium text-gray-900">{item.remaining}</td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          min={0}
                          max={item.remaining}
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 0)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-right text-sm"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={item.binLocation || ''}
                          onChange={(e) => handleFieldChange(index, 'binLocation', e.target.value)}
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="Optional"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={item.batchNo || ''}
                          onChange={(e) => handleFieldChange(index, 'batchNo', e.target.value)}
                          className="w-28 px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="Auto-generate"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button variant="secondary" onClick={() => navigate('/goods-receipts')}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={createGRN.isPending || !selectedPoId || !warehouseId || receiveItems.length === 0}
          >
            {createGRN.isPending ? 'Creating...' : 'Create Goods Receipt'}
          </Button>
        </div>
      </div>
    </div>
  );
};
