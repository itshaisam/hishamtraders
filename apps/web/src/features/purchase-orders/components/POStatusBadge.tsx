import React from 'react';
import { POStatus } from '../types/purchase-order.types';

interface POStatusBadgeProps {
  status: POStatus;
  className?: string;
}

export const POStatusBadge: React.FC<POStatusBadgeProps> = ({
  status,
  className = '',
}) => {
  const getStatusStyles = (status: POStatus) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'IN_TRANSIT':
        return 'bg-blue-100 text-blue-800';
      case 'RECEIVED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: POStatus) => {
    switch (status) {
      case 'PENDING':
        return 'Pending';
      case 'IN_TRANSIT':
        return 'In Transit';
      case 'RECEIVED':
        return 'Received';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  };

  return (
    <span
      className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${getStatusStyles(
        status
      )} ${className}`}
    >
      {getStatusLabel(status)}
    </span>
  );
};
