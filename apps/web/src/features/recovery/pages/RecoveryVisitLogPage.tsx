import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { MapPin, CheckCircle, XCircle } from 'lucide-react';
import { recoveryService } from '../../../services/recoveryService';
import { Card, Button, Input, Spinner } from '../../../components/ui';

const OUTCOMES = [
  { value: 'PAYMENT_COLLECTED', label: 'Payment Collected' },
  { value: 'PROMISE_MADE', label: 'Promise Made' },
  { value: 'CLIENT_UNAVAILABLE', label: 'Customer Unavailable' },
  { value: 'REFUSED_TO_PAY', label: 'Refused to Pay' },
  { value: 'PARTIAL_PAYMENT', label: 'Partial Payment' },
  { value: 'DISPUTE_RAISED', label: 'Dispute Raised' },
  { value: 'OTHER', label: 'Other' },
];

export default function RecoveryVisitLogPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const preselectedClientId = searchParams.get('clientId') || '';

  const [form, setForm] = useState({
    clientId: preselectedClientId,
    visitDate: new Date().toISOString().slice(0, 10),
    visitTime: '',
    outcome: '',
    amountCollected: '',
    promiseDate: '',
    promiseAmount: '',
    notes: '',
  });

  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'loading' | 'captured' | 'unavailable'>('loading');

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocationStatus('captured');
        },
        () => setLocationStatus('unavailable'),
        { timeout: 10000 }
      );
    } else {
      setLocationStatus('unavailable');
    }
  }, []);

  const { data: routeData, isLoading: loadingClients } = useQuery({
    queryKey: ['recovery-today-route'],
    queryFn: () => recoveryService.getTodayRoute(),
  });

  const routeResponse = routeData?.data as any;
  const clients = (Array.isArray(routeResponse) ? routeResponse : routeResponse?.clients || []) as any[];

  const { data: visitData } = useQuery({
    queryKey: ['client-visits', form.clientId],
    queryFn: () => recoveryService.getVisits({ clientId: form.clientId, limit: 5 }),
    enabled: !!form.clientId,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => recoveryService.createVisit(data),
    onSuccess: () => {
      toast.success('Visit logged successfully');
      queryClient.invalidateQueries({ queryKey: ['recovery-today-route'] });
      queryClient.invalidateQueries({ queryKey: ['due-promises'] });
      navigate('/recovery/route');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to log visit');
    },
  });

  const showAmount = ['PAYMENT_COLLECTED', 'PARTIAL_PAYMENT'].includes(form.outcome);
  const showPromise = form.outcome === 'PROMISE_MADE';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientId || !form.outcome) {
      toast.error('Please select a customer and outcome');
      return;
    }
    createMutation.mutate({
      clientId: form.clientId,
      visitDate: form.visitDate,
      visitTime: form.visitTime || undefined,
      outcome: form.outcome,
      amountCollected: showAmount ? Number(form.amountCollected) || 0 : 0,
      promiseDate: showPromise ? form.promiseDate : undefined,
      promiseAmount: showPromise ? Number(form.promiseAmount) || 0 : undefined,
      notes: form.notes || undefined,
      latitude: location?.lat,
      longitude: location?.lng,
    });
  };

  const recentVisits = visitData?.data || [];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Log Recovery Visit</h1>
        <p className="text-gray-600 mt-1">Record the outcome of a customer visit</p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Location Badge */}
          <div className="flex items-center gap-2">
            <MapPin size={16} className={locationStatus === 'captured' ? 'text-green-500' : 'text-gray-400'} />
            {locationStatus === 'loading' && <span className="text-sm text-gray-500">Capturing location...</span>}
            {locationStatus === 'captured' && (
              <span className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle size={14} /> Location captured
              </span>
            )}
            {locationStatus === 'unavailable' && (
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <XCircle size={14} /> Location unavailable
              </span>
            )}
          </div>

          {/* Client Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
            {loadingClients ? (
              <Spinner />
            ) : (
              <select
                value={form.clientId}
                onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                required
              >
                <option value="">Select a customer</option>
                {clients.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — PKR {Number(c.balance || 0).toLocaleString()}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Visit Date *</label>
              <input
                type="date"
                value={form.visitDate}
                onChange={(e) => setForm({ ...form, visitDate: e.target.value })}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Visit Time</label>
              <input
                type="time"
                value={form.visitTime}
                onChange={(e) => setForm({ ...form, visitTime: e.target.value })}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          {/* Outcome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Outcome *</label>
            <select
              value={form.outcome}
              onChange={(e) => setForm({ ...form, outcome: e.target.value })}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              required
            >
              <option value="">Select outcome</option>
              {OUTCOMES.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Amount Collected */}
          {showAmount && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount Collected (PKR) *</label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={form.amountCollected}
                onChange={(e) => setForm({ ...form, amountCollected: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
          )}

          {/* Promise Fields */}
          {showPromise && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Promise Date *</label>
                <input
                  type="date"
                  value={form.promiseDate}
                  onChange={(e) => setForm({ ...form, promiseDate: e.target.value })}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Promise Amount (PKR) *</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={form.promiseAmount}
                  onChange={(e) => setForm({ ...form, promiseAmount: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              rows={3}
              placeholder="Additional notes..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="primary" loading={createMutation.isPending}>
              Log Visit
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>

      {/* Recent Visits */}
      {form.clientId && recentVisits.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Recent Visits for This Customer</h3>
          <div className="space-y-2">
            {recentVisits.map((v: any) => (
              <div key={v.id} className="flex justify-between items-center text-sm border-b pb-2">
                <div>
                  <span className="text-gray-600">{new Date(v.visitDate).toLocaleDateString()}</span>
                  <span className="ml-2 text-gray-800 font-medium">
                    {v.outcome?.replace(/_/g, ' ')}
                  </span>
                </div>
                {Number(v.amountCollected) > 0 && (
                  <span className="text-green-600 font-medium">
                    PKR {Number(v.amountCollected).toLocaleString()}
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
