import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Bell, CheckCircle, AlertTriangle, AlertOctagon, Info } from 'lucide-react';
import { recoveryService } from '../../../services/recoveryService';
import { Card, Button, Badge, Spinner } from '../../../components/ui';

const PRIORITY_CONFIG: Record<string, { color: string; icon: any }> = {
  LOW: { color: 'info', icon: Info },
  MEDIUM: { color: 'warning', icon: AlertTriangle },
  HIGH: { color: 'danger', icon: AlertOctagon },
  CRITICAL: { color: 'danger', icon: AlertOctagon },
};

export default function AlertsPage() {
  const [showAcknowledged, setShowAcknowledged] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['alerts', showAcknowledged],
    queryFn: () => recoveryService.getAlerts(showAcknowledged ? undefined : false),
  });

  const acknowledgeMutation = useMutation({
    mutationFn: (id: string) => recoveryService.acknowledgeAlert(id),
    onSuccess: () => {
      toast.success('Alert acknowledged');
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alert-count'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed'),
  });

  const alerts = (data?.data || []) as any[];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alerts</h1>
          <p className="text-gray-600 mt-1">Overdue payment alerts and notifications</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAcknowledged(false)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              !showAcknowledged ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => setShowAcknowledged(true)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              showAcknowledged ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            All
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : alerts.length === 0 ? (
        <Card className="p-8 text-center">
          <Bell size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">No alerts to show</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert: any) => {
            const config = PRIORITY_CONFIG[alert.priority] || PRIORITY_CONFIG.LOW;
            const Icon = config.icon;
            return (
              <Card
                key={alert.id}
                className={`p-4 border-l-4 ${
                  alert.acknowledged
                    ? 'border-l-gray-300 bg-gray-50'
                    : alert.priority === 'CRITICAL'
                    ? 'border-l-red-600'
                    : alert.priority === 'HIGH'
                    ? 'border-l-red-400'
                    : alert.priority === 'MEDIUM'
                    ? 'border-l-yellow-500'
                    : 'border-l-blue-400'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <Icon
                      size={20}
                      className={
                        alert.priority === 'CRITICAL' || alert.priority === 'HIGH'
                          ? 'text-red-500 mt-0.5'
                          : alert.priority === 'MEDIUM'
                          ? 'text-yellow-500 mt-0.5'
                          : 'text-blue-500 mt-0.5'
                      }
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={config.color as any}>{alert.priority}</Badge>
                        <Badge variant="default">{alert.type?.replace(/_/g, ' ')}</Badge>
                      </div>
                      <p className="text-sm text-gray-900">{alert.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(alert.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {!alert.acknowledged && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => acknowledgeMutation.mutate(alert.id)}
                      disabled={acknowledgeMutation.isPending}
                    >
                      <CheckCircle size={14} className="mr-1" /> Acknowledge
                    </Button>
                  )}
                  {alert.acknowledged && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <CheckCircle size={12} /> Acknowledged
                    </span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
