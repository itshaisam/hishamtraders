import React from 'react';
import { Skeleton, SkeletonLine, SkeletonInput, SkeletonButton, SkeletonTable } from '@/components/ui';

/**
 * POListSkeleton - Custom skeleton loader for Purchase Orders List page
 * Matches the structure with filters and table layout
 */
export const POListSkeleton: React.FC = () => {
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

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search Input */}
          <div>
            <SkeletonLine width="35%" height="0.875rem" className="mb-2" />
            <Skeleton width="100%" height="2.5rem" className="rounded-lg" />
          </div>

          {/* Status Filter */}
          <div>
            <SkeletonLine width="30%" height="0.875rem" className="mb-2" />
            <Skeleton width="100%" height="2.5rem" className="rounded-lg" />
          </div>

          {/* Info Badge */}
          <div className="flex items-end">
            <Skeleton width="100%" height="2.5rem" className="rounded-lg" />
          </div>
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <SkeletonTable columns={6} rows={8} />
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
