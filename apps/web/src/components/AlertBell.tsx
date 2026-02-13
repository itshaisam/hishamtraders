import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { recoveryService } from '../services/recoveryService';

export default function AlertBell() {
  const { data } = useQuery({
    queryKey: ['alert-count'],
    queryFn: () => recoveryService.getUnreadAlertCount(),
    refetchInterval: 60000, // poll every 60s
  });

  const count = data?.data?.count || 0;

  return (
    <Link to="/recovery/alerts" className="relative p-2 hover:bg-gray-100 rounded-lg transition">
      <Bell size={20} className="text-gray-600" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}
