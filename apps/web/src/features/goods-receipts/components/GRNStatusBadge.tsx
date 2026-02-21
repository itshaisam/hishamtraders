import React from 'react';
import { GRNStatus } from '../types/goods-receipt.types';

interface GRNStatusBadgeProps {
  status: GRNStatus;
  className?: string;
}

export const GRNStatusBadge: React.FC<GRNStatusBadgeProps> = ({ status, className = '' }) => {
  const styles = status === 'COMPLETED'
    ? 'bg-green-100 text-green-800'
    : 'bg-red-100 text-red-800';

  const label = status === 'COMPLETED' ? 'Completed' : 'Cancelled';

  return (
    <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${styles} ${className}`}>
      {label}
    </span>
  );
};
