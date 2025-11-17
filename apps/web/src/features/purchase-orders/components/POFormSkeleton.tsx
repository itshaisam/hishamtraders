import React from 'react';
import { Skeleton, SkeletonLine, SkeletonInput, SkeletonButton, SkeletonTable } from '@/components/ui';

/**
 * POFormSkeleton - Custom skeleton loader for Purchase Order Form pages
 * Complex skeleton matching the multi-section form with line items
 */
export const POFormSkeleton: React.FC<{ isEdit?: boolean }> = ({ isEdit = false }) => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-8">
        {/* Header Skeleton */}
        <div>
          {isEdit && (
            <div className="mb-4 flex items-center gap-2">
              <Skeleton width={40} height={40} circle />
            </div>
          )}
          <SkeletonLine width={isEdit ? '35%' : '45%'} height="2rem" className="mb-2" />
          <SkeletonLine width="55%" height="1rem" />
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow p-6 md:p-8 space-y-8">
          {/* SECTION 1: Order Information */}
          <div className="bg-gray-50 p-4 md:p-6 rounded-lg space-y-4">
            <h3 className="font-semibold text-gray-900">
              <SkeletonLine width="25%" />
            </h3>

            {/* Supplier Combobox */}
            <SkeletonInput />

            {/* Order Date + Expected Arrival (Grid on md+) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SkeletonInput />
              <SkeletonInput />
            </div>

            {/* Notes Textarea */}
            <div className="space-y-2">
              <SkeletonLine width="40%" />
              <Skeleton width="100%" height="3.5rem" className="rounded-md" />
            </div>
          </div>

          {/* SECTION 2: Order Items */}
          <div className="bg-gray-50 p-4 md:p-6 rounded-lg space-y-6">
            <h3 className="font-semibold text-gray-900">
              <SkeletonLine width="20%" />
            </h3>

            {/* Add Item Form - Card inside */}
            <div className="bg-white border border-gray-300 rounded-md p-4 space-y-4">
              <h4 className="font-medium">
                <SkeletonLine width="18%" />
              </h4>

              {/* Product Combobox */}
              <SkeletonInput />

              {/* Quantity + Unit Cost + Line Total (Responsive grid) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <SkeletonInput />
                <SkeletonInput />
                <SkeletonInput />
              </div>

              {/* Add Item Button */}
              <SkeletonButton />
            </div>

            {/* Items Table (for edit mode) - Conditional skeleton */}
            {isEdit && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-4">
                  <SkeletonLine width="15%" />
                </h4>
                <SkeletonTable columns={5} rows={4} />

                {/* Grand Total */}
                <div className="mt-4 p-4 bg-white border border-gray-300 rounded-md flex justify-end">
                  <SkeletonLine width="30%" />
                </div>
              </div>
            )}
          </div>

          {/* Buttons - Responsive Stack/Flex */}
          <div className="pt-6 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row gap-3">
              <SkeletonButton />
              <SkeletonButton />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
