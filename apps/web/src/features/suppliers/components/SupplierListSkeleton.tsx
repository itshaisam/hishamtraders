import React from 'react';
import { Skeleton, SkeletonLine, SkeletonText, SkeletonButton } from '@/components/ui';

/**
 * SupplierListSkeleton - Custom skeleton loader for Supplier List page
 * Matches the structure of the actual list to provide accurate loading preview
 */
export const SupplierListSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <SkeletonLine width="40%" height="2rem" className="mb-2" />
          <SkeletonLine width="60%" height="1rem" />
        </div>
        <SkeletonButton />
      </div>

      {/* Search Bar Skeleton */}
      <Skeleton width="100%" height="2.5rem" className="rounded-lg" />

      {/* List Items Skeleton - Card based */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="divide-y divide-gray-200">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="p-4 md:p-6 hover:bg-gray-50 transition-colors">
              {/* Supplier Name + Status Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <SkeletonLine width="45%" height="1.25rem" />
                <Skeleton width="80px" height="1.5rem" className="rounded-full" />
              </div>

              {/* Contact Info Grid (1 col on mobile, 2 on md+) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div>
                  <SkeletonLine width="30%" height="0.875rem" className="mb-1" />
                  <SkeletonLine width="70%" height="1rem" />
                </div>
                <div>
                  <SkeletonLine width="30%" height="0.875rem" className="mb-1" />
                  <SkeletonLine width="70%" height="1rem" />
                </div>
              </div>

              {/* Address (if present) */}
              <div className="mb-4">
                <SkeletonLine width="25%" height="0.875rem" className="mb-1" />
                <SkeletonText lines={2} />
              </div>

              {/* Payment Terms */}
              <div className="mb-4">
                <SkeletonLine width="35%" height="0.875rem" className="mb-1" />
                <SkeletonLine width="90%" height="1rem" className="mb-1" />
                <SkeletonLine width="70%" height="1rem" />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <SkeletonButton />
                <SkeletonButton />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <SkeletonLine width="40%" height="1rem" />
        <div className="flex gap-2">
          <SkeletonButton />
          <SkeletonButton />
        </div>
      </div>
    </div>
  );
};
