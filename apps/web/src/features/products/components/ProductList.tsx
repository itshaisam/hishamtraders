import React from 'react';
import { Edit2, Trash2, Package, Layers } from 'lucide-react';
import { Product } from '../types/product.types';
import { useCurrencySymbol } from '../../../hooks/useSettings';

interface ProductListProps {
  products: Product[];
  isLoading: boolean;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  canEdit: boolean;
}

export const ProductList: React.FC<ProductListProps> = ({
  products,
  isLoading,
  onEdit,
  onDelete,
  canEdit,
}) => {
  const { data: currencyData } = useCurrencySymbol();
  const cs = currencyData?.currencySymbol || 'PKR';

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">Loading products...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <Package size={48} className="mx-auto text-gray-300 mb-4" />
        <p className="text-gray-600 text-lg">No products found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-6 py-3 text-left font-semibold text-gray-900">SKU</th>
            <th className="px-6 py-3 text-left font-semibold text-gray-900">Product Name</th>
            <th className="px-6 py-3 text-left font-semibold text-gray-900">Category</th>
            <th className="px-6 py-3 text-right font-semibold text-gray-900">Cost Price</th>
            <th className="px-6 py-3 text-right font-semibold text-gray-900">Selling Price</th>
            <th className="px-6 py-3 text-center font-semibold text-gray-900">Reorder Lvl</th>
            <th className="px-6 py-3 text-center font-semibold text-gray-900">Status</th>
            {canEdit && <th className="px-6 py-3 text-center font-semibold text-gray-900">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id} className="border-b border-gray-200 hover:bg-gray-50">
              <td className="px-6 py-3">
                <span className="font-mono font-semibold text-blue-600">{product.sku}</span>
              </td>
              <td className="px-6 py-3">
                <div>
                  <p className="font-medium text-gray-900">{product.name}</p>
                  {product.brand && <p className="text-xs text-gray-500">{product.brand.name}</p>}
                </div>
              </td>
              <td className="px-6 py-3">
                <span className="text-gray-600">{product.category?.name || '-'}</span>
              </td>
              <td className="px-6 py-3 text-right">
                <div className="flex items-center justify-end gap-1">
                  <span className="text-xs text-gray-400">{cs}</span>
                  <span className="text-gray-900 font-medium">{product.costPrice.toFixed(2)}</span>
                </div>
              </td>
              <td className="px-6 py-3 text-right">
                <div className="flex items-center justify-end gap-1">
                  <span className="text-xs text-gray-400">{cs}</span>
                  <span className="text-gray-900 font-medium">{product.sellingPrice.toFixed(2)}</span>
                </div>
              </td>
              <td className="px-6 py-3 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Layers size={14} className="text-gray-400" />
                  <span className="text-gray-900">{product.reorderLevel}</span>
                </div>
              </td>
              <td className="px-6 py-3 text-center">
                <span
                  className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                    product.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {product.status}
                </span>
              </td>
              {canEdit && (
                <td className="px-6 py-3 text-center">
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => onEdit(product)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                      title="Edit product"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => onDelete(product)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                      title="Delete product"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
