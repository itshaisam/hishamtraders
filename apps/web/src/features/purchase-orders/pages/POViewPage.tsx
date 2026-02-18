import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileDown, PackageCheck } from 'lucide-react';
import { POFormSkeleton } from '../components/POFormSkeleton';
import { usePurchaseOrder, useCanReceivePO } from '../hooks/usePurchaseOrders';
import { POStatusBadge } from '../components/POStatusBadge';
import { Button, Breadcrumbs } from '../../../components/ui';
import { ImportDocumentationSection } from '../components/ImportDocumentationSection';
import { POAdditionalCostsTable } from '../components/POAdditionalCostsTable';
import { LandedCostBreakdown } from '../components/LandedCostBreakdown';
import { useAuthStore } from '@/stores/auth.store';
import { useCurrencySymbol, useCompanyName } from '../../../hooks/useSettings';
import { generatePoPdf } from '../../../utils/poPdf';

/**
 * POViewPage - Read-only display of a purchase order
 * Shows all details without any edit capability
 * User: "in the view only there should be no edit"
 */
export const POViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state: any) => state.user);
  const { data: response, isLoading, isError } = usePurchaseOrder(id || '');
  const { data: canReceiveResponse } = useCanReceivePO(id || '');

  const { data: currencyData } = useCurrencySymbol();
  const cs = currencyData?.currencySymbol || 'PKR';
  const { data: companyNameData } = useCompanyName();
  const companyName = companyNameData?.companyName || 'Hisham Traders';

  // Extract PO data from API response
  const purchaseOrder = response?.data;
  const canReceive = canReceiveResponse?.data?.canReceive || false;

  // Check if user can receive goods (ADMIN or WAREHOUSE_MANAGER)
  const canUserReceive = user?.role?.name === 'ADMIN' || user?.role?.name === 'WAREHOUSE_MANAGER';

  const handleDownloadPdf = () => {
    if (!purchaseOrder) return;
    const doc = generatePoPdf(purchaseOrder, companyName, cs);
    doc.save(`${purchaseOrder.poNumber}.pdf`);
  };

  if (isLoading) {
    return <POFormSkeleton isEdit={true} />;
  }

  if (isError || !purchaseOrder) {
    return (
      <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-lg font-semibold text-red-900 mb-2">Purchase Order Not Found</h2>
            <p className="text-red-700 mb-4">
              The purchase order you're looking for doesn't exist or has been deleted.
            </p>
            <Button variant="primary" onClick={() => navigate('/purchase-orders')}>
              Back to Orders
            </Button>
          </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
        {/* Breadcrumbs - Responsive */}
        <Breadcrumbs
          items={[
            { label: 'Purchases', href: '/purchase-orders' },
            { label: 'Purchase Orders', href: '/purchase-orders' },
            { label: `${purchaseOrder.poNumber} (View)` },
          ]}
          className="mb-4"
        />

        {/* Header with back button - Responsive Flex */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:gap-4 gap-2">
          <button
            onClick={() => navigate('/purchase-orders')}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
            aria-label="Go back to purchase orders"
          >
            <ArrowLeft size={24} className="text-gray-700" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">View Purchase Order</h1>
            <p className="mt-1 text-sm sm:text-base text-gray-600">Read-only details</p>
          </div>
          <div className="flex gap-2">
            {canUserReceive && canReceive && (purchaseOrder.status === 'PENDING' || purchaseOrder.status === 'IN_TRANSIT') && (
              <button
                onClick={() => navigate(`/purchase-orders/${id}/receive`)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm font-medium"
                title="Receive goods from this purchase order"
              >
                <PackageCheck size={16} />
                Receive Goods
              </button>
            )}
            <button
              onClick={handleDownloadPdf}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm"
              title="Download PDF"
            >
              <FileDown size={16} />
              Download PDF
            </button>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-lg shadow p-6 md:p-8 mt-2 space-y-8">
          {/* Header Section */}
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* PO Number and Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purchase Order Number
                </label>
                <p className="text-lg font-mono font-semibold text-blue-600">
                  {purchaseOrder.poNumber}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <div>
                  <POStatusBadge status={purchaseOrder.status} />
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order Date
                </label>
                <p className="text-gray-900">
                  {new Date(purchaseOrder.orderDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              {purchaseOrder.expectedArrivalDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expected Arrival Date
                  </label>
                  <p className="text-gray-900">
                    {new Date(purchaseOrder.expectedArrivalDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Supplier Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Supplier Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier Name
                </label>
                <p className="text-gray-900 font-medium">{purchaseOrder.supplier?.name || '-'}</p>
              </div>
              {purchaseOrder.supplier?.contactPerson && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Person
                  </label>
                  <p className="text-gray-900">{purchaseOrder.supplier.contactPerson}</p>
                </div>
              )}
              {purchaseOrder.supplier?.email && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="text-gray-900">
                    <a
                      href={`mailto:${purchaseOrder.supplier.email}`}
                      className="text-blue-600 hover:underline"
                    >
                      {purchaseOrder.supplier.email}
                    </a>
                  </p>
                </div>
              )}
              {purchaseOrder.supplier?.phone && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <p className="text-gray-900">
                    <a
                      href={`tel:${purchaseOrder.supplier.phone}`}
                      className="text-blue-600 hover:underline"
                    >
                      {purchaseOrder.supplier.phone}
                    </a>
                  </p>
                </div>
              )}
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Items Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
            {purchaseOrder.items && purchaseOrder.items.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-200 bg-gray-50">
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">
                        Product
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-900">
                        Quantity
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-900">
                        Unit Cost
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-900">
                        Total Cost
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseOrder.items.map((item) => (
                      <tr key={item.id} className="border-b border-gray-200">
                        <td className="px-4 py-3 text-gray-900">
                          <div>
                            <p className="font-medium">{item.product?.name || 'Unknown Product'}</p>
                            <p className="text-xs text-gray-500">{item.product?.sku || '-'}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-900">{item.quantity}</td>
                        <td className="px-4 py-3 text-right text-gray-900">
                          {cs} {typeof item.unitCost === 'number' ? item.unitCost.toFixed(4) : Number(item.unitCost).toFixed(4)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-900 font-medium">
                          {cs} {typeof item.totalCost === 'number' ? item.totalCost.toFixed(4) : Number(item.totalCost).toFixed(4)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No items in this purchase order</p>
            )}
          </div>

          <hr className="border-gray-200" />

          {/* Summary Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-start-3">
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-700 font-medium">Subtotal:</span>
                  <span className="text-gray-900">
                    {cs}{' '}
                    {purchaseOrder.items
                      .reduce((sum, item) => sum + (typeof item.totalCost === 'number' ? item.totalCost : Number(item.totalCost)), 0)
                      .toFixed(4)}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between">
                  <span className="text-lg font-semibold text-gray-900">Total:</span>
                  <span className="text-lg font-semibold text-blue-600">
                    {cs} {typeof purchaseOrder.totalAmount === 'number'
                      ? purchaseOrder.totalAmount.toFixed(4)
                      : Number(purchaseOrder.totalAmount).toFixed(4)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          {purchaseOrder.notes && (
            <>
              <hr className="border-gray-200" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-900 whitespace-pre-wrap">{purchaseOrder.notes}</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Story 2.3: Import Documentation, Costs, and Landed Cost (Only show for IN_TRANSIT or RECEIVED) */}
        {(purchaseOrder.status === 'IN_TRANSIT' || purchaseOrder.status === 'RECEIVED') && (
          <>
            <ImportDocumentationSection po={purchaseOrder} />
            <POAdditionalCostsTable po={purchaseOrder} />
            <LandedCostBreakdown poId={purchaseOrder.id} />
          </>
        )}

        {/* Audit Fields Card */}
        <div className="bg-white rounded-lg shadow p-6">
          {/* Audit Fields */}
          <hr className="border-gray-200" />
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Document Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-600">
              <div>
                <p className="text-gray-700 font-medium">Created At:</p>
                <p>{new Date(purchaseOrder.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-700 font-medium">Last Updated:</p>
                <p>{new Date(purchaseOrder.updatedAt).toLocaleString()}</p>
              </div>
              {purchaseOrder.createdBy && (
                <div>
                  <p className="text-gray-700 font-medium">Created By:</p>
                  <p>{purchaseOrder.createdBy}</p>
                </div>
              )}
              {purchaseOrder.updatedBy && (
                <div>
                  <p className="text-gray-700 font-medium">Last Modified By:</p>
                  <p>{purchaseOrder.updatedBy}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Buttons - Only Back, NO Edit */}
        <div className="flex gap-4 justify-end">
          <Button
            variant="secondary"
            onClick={() => navigate('/purchase-orders')}
          >
            Back to Orders
          </Button>
        </div>

    </div>
  );
};
