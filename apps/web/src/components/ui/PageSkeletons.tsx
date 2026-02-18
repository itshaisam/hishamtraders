import React from 'react';
import { Skeleton, SkeletonLine, SkeletonTable, SkeletonInput } from './Skeleton';

/**
 * ListPageSkeleton — Skeleton for list/table pages
 * Shows: breadcrumb + header + filter bar + table
 */
export const ListPageSkeleton: React.FC<{
  columns?: number;
  rows?: number;
  filters?: number;
  className?: string;
}> = ({ columns = 6, rows = 8, filters = 3, className = '' }) => (
  <div className={`space-y-6 ${className}`}>
    {/* Breadcrumb */}
    <SkeletonLine width="120px" height="0.875rem" />

    {/* Header row */}
    <div className="flex items-center justify-between">
      <div>
        <Skeleton width="200px" height="1.75rem" className="mb-2" />
        <Skeleton width="280px" height="0.875rem" />
      </div>
      <Skeleton width="140px" height="2.5rem" className="rounded-md" />
    </div>

    {/* Filters */}
    {filters > 0 && (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: filters }).map((_, i) => (
            <div key={i}>
              <Skeleton width="60px" height="0.75rem" className="mb-2" />
              <Skeleton width="100%" height="2.25rem" className="rounded-md" />
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Table */}
    <div className="bg-white rounded-lg shadow">
      <SkeletonTable columns={columns} rows={rows} />
    </div>
  </div>
);

/**
 * FormPageSkeleton — Skeleton for form/create/edit pages
 * Shows: breadcrumb + header + form sections with fields
 */
export const FormPageSkeleton: React.FC<{
  sections?: number;
  fieldsPerSection?: number;
  className?: string;
}> = ({ sections = 3, fieldsPerSection = 3, className = '' }) => (
  <div className={`space-y-6 ${className}`}>
    {/* Breadcrumb */}
    <div className="flex items-center gap-2">
      <Skeleton width="80px" height="0.875rem" />
      <Skeleton width="8px" height="0.875rem" />
      <Skeleton width="120px" height="0.875rem" />
    </div>

    {/* Header */}
    <div className="flex items-center gap-3">
      <Skeleton width="2rem" height="2rem" className="rounded-md" />
      <div>
        <Skeleton width="200px" height="1.75rem" className="mb-1" />
        <Skeleton width="300px" height="0.875rem" />
      </div>
    </div>

    {/* Form sections */}
    {Array.from({ length: sections }).map((_, sIdx) => (
      <div key={sIdx} className="bg-white rounded-lg shadow p-6">
        <Skeleton width="160px" height="1.25rem" className="mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: fieldsPerSection }).map((_, fIdx) => (
            <SkeletonInput key={fIdx} />
          ))}
        </div>
      </div>
    ))}

    {/* Submit button */}
    <div className="flex justify-end">
      <Skeleton width="140px" height="2.5rem" className="rounded-md" />
    </div>
  </div>
);

/**
 * DetailPageSkeleton — Skeleton for detail/view pages
 * Shows: breadcrumb + header + info cards + table
 */
export const DetailPageSkeleton: React.FC<{
  cards?: number;
  hasTable?: boolean;
  className?: string;
}> = ({ cards = 2, hasTable = true, className = '' }) => (
  <div className={`space-y-6 ${className}`}>
    {/* Breadcrumb */}
    <div className="flex items-center gap-2">
      <Skeleton width="100px" height="0.875rem" />
      <Skeleton width="8px" height="0.875rem" />
      <Skeleton width="140px" height="0.875rem" />
    </div>

    {/* Header with status */}
    <div className="flex items-center justify-between">
      <div>
        <Skeleton width="240px" height="1.75rem" className="mb-2" />
        <Skeleton width="160px" height="0.875rem" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton width="80px" height="1.5rem" className="rounded-full" />
        <Skeleton width="100px" height="2.5rem" className="rounded-md" />
      </div>
    </div>

    {/* Info cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow p-6">
          <Skeleton width="120px" height="1rem" className="mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="flex justify-between">
                <Skeleton width="100px" height="0.875rem" />
                <Skeleton width="140px" height="0.875rem" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>

    {/* Table */}
    {hasTable && (
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <Skeleton width="120px" height="1.25rem" />
        </div>
        <SkeletonTable columns={5} rows={4} />
      </div>
    )}
  </div>
);

/**
 * CardGridSkeleton — Skeleton for card grid pages (dashboard, reports center)
 */
export const CardGridSkeleton: React.FC<{
  cards?: number;
  columns?: number;
  className?: string;
}> = ({ cards = 6, columns = 3, className = '' }) => (
  <div className={`space-y-6 ${className}`}>
    {/* Breadcrumb */}
    <SkeletonLine width="100px" height="0.875rem" />

    {/* Header */}
    <Skeleton width="200px" height="1.75rem" className="mb-1" />
    <Skeleton width="280px" height="0.875rem" />

    {/* Cards grid */}
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns} gap-4`}>
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow p-5 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton width="2.5rem" height="2.5rem" className="rounded-lg" />
            <Skeleton width="120px" height="1rem" />
          </div>
          <Skeleton width="90%" height="0.75rem" />
          <Skeleton width="60%" height="0.75rem" />
        </div>
      ))}
    </div>
  </div>
);
