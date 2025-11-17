import React from 'react';
import { Skeleton, SkeletonLine, SkeletonInput, SkeletonButton } from '@/components/ui';

/**
 * SupplierFormSkeleton - Custom skeleton loader for Supplier Form pages
 * Matches the form structure for create/edit pages
 */
export const SupplierFormSkeleton: React.FC<{ isEdit?: boolean }> = ({ isEdit = false }) => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 space-y-8">
        {/* Header Skeleton */}
        <div>
          {isEdit && (
            <div className="mb-4 flex items-center gap-2">
              <Skeleton width={40} height={40} circle />
            </div>
          )}
          <SkeletonLine width={isEdit ? '35%' : '50%'} height="2rem" className="mb-2" />
          <SkeletonLine width="60%" height="1rem" />
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow p-6 md:p-8 space-y-6">
          {/* Supplier Name Field */}
          <SkeletonInput className="space-y-2" />

          {/* Country Field */}
          <SkeletonInput className="space-y-2" />

          {/* Contact Person Field */}
          <SkeletonInput className="space-y-2" />

          {/* Email Field */}
          <SkeletonInput className="space-y-2" />

          {/* Phone Field */}
          <SkeletonInput className="space-y-2" />

          {/* Address Field (Textarea) */}
          <div className="space-y-2">
            <SkeletonLine width="40%" />
            <Skeleton width="100%" height="4rem" className="rounded-md" />
          </div>

          {/* Payment Terms Field (Textarea) */}
          <div className="space-y-2">
            <SkeletonLine width="40%" />
            <Skeleton width="100%" height="3rem" className="rounded-md" />
          </div>

          {/* Status Field */}
          <SkeletonInput className="space-y-2" />

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
