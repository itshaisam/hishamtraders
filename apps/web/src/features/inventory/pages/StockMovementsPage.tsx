import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { FileDown, Search, X } from 'lucide-react';
import { useStockMovements } from '../../../hooks/useStockMovements';
import { useProducts } from '../../products/hooks/useProducts';
import { useWarehouses } from '../../../hooks/useWarehouses';
import { MovementType, ReferenceType, StockMovementFilters } from '../../../types/stock-movement.types';
import { Breadcrumbs } from '../../../components/ui';
import * as XLSX from 'xlsx';

function StockMovementsPage() {
  const [filters, setFilters] = useState<StockMovementFilters>({
    productId: '',
    warehouseId: '',
    movementType: undefined,
    dateFrom: '',
    dateTo: '',
    page: 1,
    pageSize: 50,
  });

  const { data: productsData, isLoading: productsLoading } = useProducts({});
  const { data: warehousesData, isLoading: warehousesLoading } = useWarehouses();
  const { data, isLoading, error } = useStockMovements(filters);

  const movements = data?.data || [];
  const pagination = data?.pagination;

  // Export to Excel
  const handleExport = () => {
    if (movements.length === 0) {
      alert('No data to export');
      return;
    }

    const exportData = movements.map((m) => ({
      Date: format(new Date(m.movementDate), 'yyyy-MM-dd HH:mm:ss'),
      Product: m.product.name,
      SKU: m.product.sku,
      Variant: m.productVariant?.variantName || '-',
      Warehouse: m.warehouse.name,
      Type: m.movementType,
      Reference: m.referenceId || '-',
      'Qty In': m.quantityIn || 0,
      'Qty Out': m.quantityOut || 0,
      Balance: m.runningBalance,
      User: m.user.name,
      Notes: m.notes || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock Movements');

    const fileName = `stock-movements-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // Get reference link
  const getReferenceLink = (referenceType: ReferenceType | null, referenceId: string | null) => {
    if (!referenceType || !referenceId) return null;

    switch (referenceType) {
      case ReferenceType.PO:
        return `/purchase-orders/${referenceId}`;
      case ReferenceType.ADJUSTMENT:
        return `/inventory/adjustments/history`; // Could also navigate to specific adjustment
      case ReferenceType.INVOICE:
        return `/invoices/${referenceId}`; // Future
      default:
        return null;
    }
  };

  // Get movement type badge color
  const getMovementTypeBadge = (type: MovementType) => {
    switch (type) {
      case MovementType.RECEIPT:
        return 'bg-green-100 text-green-800';
      case MovementType.SALE:
        return 'bg-blue-100 text-blue-800';
      case MovementType.ADJUSTMENT:
        return 'bg-yellow-100 text-yellow-800';
      case MovementType.TRANSFER:
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      productId: '',
      warehouseId: '',
      movementType: undefined,
      dateFrom: '',
      dateTo: '',
      page: 1,
      pageSize: 50,
    });
  };

  return (
    <div className="p-6">
      <Breadcrumbs items={[{ label: 'Inventory', href: '/stock-levels' }, { label: 'Stock Movements' }]} className="mb-4" />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Stock Movement Report</h1>
        <p className="text-gray-600 mt-1">View complete movement history with running balance</p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Product Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
            <select
              value={filters.productId}
              onChange={(e) => setFilters({ ...filters, productId: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={productsLoading}
            >
              <option value="">All Products</option>
              {productsData?.data?.map((product: any) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.sku})
                </option>
              ))}
            </select>
          </div>

          {/* Warehouse Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse</label>
            <select
              value={filters.warehouseId}
              onChange={(e) => setFilters({ ...filters, warehouseId: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={warehousesLoading}
            >
              <option value="">All Warehouses</option>
              {warehousesData?.data?.map((warehouse: any) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name} ({warehouse.code})
                </option>
              ))}
            </select>
          </div>

          {/* Movement Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Movement Type</label>
            <select
              value={filters.movementType || ''}
              onChange={(e) =>
                setFilters({ ...filters, movementType: e.target.value ? (e.target.value as MovementType) : undefined, page: 1 })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value={MovementType.RECEIPT}>Receipt</option>
              <option value={MovementType.SALE}>Sale</option>
              <option value={MovementType.ADJUSTMENT}>Adjustment</option>
              <option value={MovementType.TRANSFER}>Transfer</option>
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Filter Actions */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Clear Filters
          </button>
          <button
            onClick={handleExport}
            disabled={movements.length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <FileDown className="h-4 w-4" />
            Export to Excel
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading movements...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">
            Error loading movements. Please try again.
          </div>
        ) : movements.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No stock movements found. Try adjusting your filters.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Warehouse
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reference
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Qty In
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Qty Out
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Balance
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {movements.map((movement) => {
                    const refLink = getReferenceLink(movement.referenceType, movement.referenceId);
                    return (
                      <tr key={movement.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {format(new Date(movement.movementDate), 'yyyy-MM-dd HH:mm')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <div>{movement.product.name}</div>
                          <div className="text-xs text-gray-500">{movement.product.sku}</div>
                          {movement.productVariant && (
                            <div className="text-xs text-gray-500">
                              Variant: {movement.productVariant.variantName}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {movement.warehouse.name}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getMovementTypeBadge(
                              movement.movementType
                            )}`}
                          >
                            {movement.movementType}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {refLink ? (
                            <Link to={refLink} className="text-blue-600 hover:text-blue-800 underline">
                              {movement.referenceId?.substring(0, 8)}...
                            </Link>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-green-600 font-medium">
                          {movement.quantityIn || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-red-600 font-medium">
                          {movement.quantityOut || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                          {movement.runningBalance}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {movement.user.name}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing page <span className="font-medium">{pagination.page}</span> of{' '}
                    <span className="font-medium">{pagination.totalPages}</span> (
                    <span className="font-medium">{pagination.total}</span> total records)
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
                      disabled={(filters.page || 1) === 1}
                      className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
                      disabled={(filters.page || 1) >= pagination.totalPages}
                      className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default StockMovementsPage;
