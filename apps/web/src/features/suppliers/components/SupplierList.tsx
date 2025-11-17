import React from 'react';
import { Edit2, Trash2, Mail, Phone, MapPin } from 'lucide-react';
import { Supplier } from '../types/supplier.types';

interface SupplierListProps {
  suppliers: Supplier[];
  isLoading: boolean;
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplier: Supplier) => void;
  canEdit: boolean;
}

export const SupplierList: React.FC<SupplierListProps> = ({
  suppliers,
  isLoading,
  onEdit,
  onDelete,
  canEdit,
}) => {
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">Loading suppliers...</p>
      </div>
    );
  }

  if (suppliers.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No suppliers found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {suppliers.map((supplier) => (
        <div
          key={supplier.id}
          className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 hover:shadow-md transition"
        >
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 gap-1">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{supplier.name}</h3>
                <span
                  className={`inline-block px-2 py-1 text-xs font-medium rounded-full w-fit ${
                    supplier.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {supplier.status}
                </span>
              </div>

              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs sm:text-sm text-gray-600">
                {supplier.contactPerson && (
                  <p className="flex items-center gap-1 truncate">
                    <span className="font-medium">Contact:</span>
                    <span className="truncate">{supplier.contactPerson}</span>
                  </p>
                )}
                {supplier.email && (
                  <p className="flex items-center gap-1 truncate">
                    <Mail size={14} className="flex-shrink-0" />
                    <span className="truncate">{supplier.email}</span>
                  </p>
                )}
                {supplier.phone && (
                  <p className="flex items-center gap-1 truncate">
                    <Phone size={14} className="flex-shrink-0" />
                    <span className="truncate">{supplier.phone}</span>
                  </p>
                )}
                {supplier.country && (
                  <p className="flex items-center gap-1 truncate">
                    <MapPin size={14} className="flex-shrink-0" />
                    <span className="truncate">{supplier.country}</span>
                  </p>
                )}
              </div>

              {supplier.address && (
                <p className="mt-2 text-xs sm:text-sm text-gray-600 line-clamp-1">
                  <span className="font-medium">Address:</span> {supplier.address}
                </p>
              )}

              {supplier.paymentTerms && (
                <p className="mt-1 text-xs sm:text-sm text-gray-600 line-clamp-1">
                  <span className="font-medium">Payment Terms:</span> {supplier.paymentTerms}
                </p>
              )}
            </div>

            {canEdit && (
              <div className="flex gap-1 sm:gap-2 ml-0 sm:ml-4 flex-shrink-0">
                <button
                  onClick={() => onEdit(supplier)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  title="Edit supplier"
                >
                  <Edit2 size={16} className="sm:w-5 sm:h-5" />
                </button>
                <button
                  onClick={() => onDelete(supplier)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Delete supplier"
                >
                  <Trash2 size={16} className="sm:w-5 sm:h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
