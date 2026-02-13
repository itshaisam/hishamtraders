import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Calendar, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { recoveryService } from '../../../services/recoveryService';
import { Card, Button, Spinner, Input, Badge } from '../../../components/ui';

const formatCurrency = (n: number) =>
  `PKR ${Number(n || 0).toLocaleString('en-PK', { minimumFractionDigits: 0 })}`;

export default function RecoveryRoutePage() {
  const [dateFilter, setDateFilter] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['recovery-today-route', dateFilter],
    queryFn: () =>
      dateFilter
        ? recoveryService.getSchedule(dateFilter)
        : recoveryService.getTodayRoute(),
  });

  const routeResponse = data?.data as any;
  const clients = (Array.isArray(routeResponse) ? routeResponse : routeResponse?.clients || []) as any[];
  const filtered = search
    ? clients.filter((c: any) =>
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.client?.name?.toLowerCase().includes(search.toLowerCase())
      )
    : clients;

  const totalBalance = filtered.reduce(
    (sum: number, c: any) => sum + Number(c.balance || 0),
    0
  );

  const getBalanceColor = (balance: number) => {
    if (balance > 50000) return 'border-l-red-500 bg-red-50';
    if (balance > 20000) return 'border-l-yellow-500 bg-yellow-50';
    return 'border-l-green-500 bg-green-50';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Recovery Route</h1>
        <p className="text-gray-600 mt-1">
          {dateFilter ? `Schedule for ${dateFilter}` : "Today's collection route"}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Scheduled Clients</p>
              <p className="text-xl font-bold">{filtered.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Outstanding</p>
              <p className="text-xl font-bold">{formatCurrency(totalBalance)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Visits Completed</p>
              <p className="text-xl font-bold">
                {filtered.filter((c: any) => c.visitedToday).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Search client..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:w-64"
        />
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        />
        {dateFilter && (
          <Button variant="secondary" size="sm" onClick={() => setDateFilter('')}>
            Back to Today
          </Button>
        )}
      </div>

      {/* Client Cards */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <Clock size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">No clients scheduled for {dateFilter || 'today'}</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((client: any) => {
            const c = client.client || client;
            const balance = Number(c.balance || client.balance || 0);
            return (
              <Card
                key={c.id || client.id}
                className={`p-4 border-l-4 ${getBalanceColor(balance)}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{c.name || client.name}</h3>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                      <MapPin size={14} />
                      <span>{c.area || client.area}{c.city || client.city ? `, ${c.city || client.city}` : ''}</span>
                    </div>
                    {(c.phone || client.phone) && (
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                        <Phone size={14} />
                        <span>{c.phone || client.phone}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(balance)}</p>
                    {(client.pendingPromises > 0 || c.pendingPromises > 0) && (
                      <span className="mt-1 inline-block px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                        {client.pendingPromises || c.pendingPromises} promises
                      </span>
                    )}
                  </div>
                </div>

                {client.lastVisit && (
                  <p className="text-xs text-gray-400 mt-2">
                    Last visit: {new Date(client.lastVisit.visitDate).toLocaleDateString()} —{' '}
                    {client.lastVisit.outcome?.replace(/_/g, ' ')}
                  </p>
                )}

                <div className="flex gap-2 mt-3">
                  <Link to={`/recovery/visits/log?clientId=${c.id || client.id}`}>
                    <Button size="sm" variant="primary">Log Visit</Button>
                  </Link>
                  <Link to={`/clients/${c.id || client.id}/view`}>
                    <Button size="sm" variant="secondary">View Client</Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
