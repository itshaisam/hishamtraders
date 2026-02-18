import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiClient } from '../../../lib/api-client';
import { binLocationService, BinLocation, CreateBinDto } from '../../../services/binLocationService';
import { Breadcrumbs } from '../../../components/ui';

export default function BinLocationManagementPage() {
  const queryClient = useQueryClient();
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBin, setEditingBin] = useState<BinLocation | null>(null);
  const [formData, setFormData] = useState<CreateBinDto>({ code: '', zone: '', description: '' });

  // Fetch warehouses for dropdown
  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses-dropdown'],
    queryFn: async () => {
      const res = await apiClient.get('/warehouses?limit=100');
      return res.data;
    },
  });
  const warehouses = warehousesData?.data || [];

  // Fetch bins for selected warehouse
  const { data: binsData, isLoading } = useQuery({
    queryKey: ['bin-locations', selectedWarehouseId, search],
    queryFn: () => binLocationService.getAll(selectedWarehouseId, { search: search || undefined, limit: 100 }),
    enabled: !!selectedWarehouseId,
  });
  const bins: BinLocation[] = binsData?.data || [];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateBinDto) => binLocationService.create(selectedWarehouseId, data),
    onSuccess: () => {
      toast.success('Bin location created');
      queryClient.invalidateQueries({ queryKey: ['bin-locations'] });
      closeModal();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create bin'),
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ binId, data }: { binId: string; data: any }) =>
      binLocationService.update(selectedWarehouseId, binId, data),
    onSuccess: () => {
      toast.success('Bin location updated');
      queryClient.invalidateQueries({ queryKey: ['bin-locations'] });
      closeModal();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update bin'),
  });

  // Delete (deactivate) mutation
  const deleteMutation = useMutation({
    mutationFn: (binId: string) => binLocationService.delete(selectedWarehouseId, binId),
    onSuccess: () => {
      toast.success('Bin location deactivated');
      queryClient.invalidateQueries({ queryKey: ['bin-locations'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to deactivate bin'),
  });

  const openCreateModal = () => {
    setEditingBin(null);
    setFormData({ code: '', zone: '', description: '' });
    setShowModal(true);
  };

  const openEditModal = (bin: BinLocation) => {
    setEditingBin(bin);
    setFormData({ code: bin.code, zone: bin.zone || '', description: bin.description || '' });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingBin(null);
    setFormData({ code: '', zone: '', description: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBin) {
      updateMutation.mutate({ binId: editingBin.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleToggleActive = (bin: BinLocation) => {
    if (bin.isActive) {
      deleteMutation.mutate(bin.id);
    } else {
      updateMutation.mutate({ binId: bin.id, data: { isActive: true } });
    }
  };

  return (
    <div className="p-6">
      <Breadcrumbs items={[{ label: 'Inventory', href: '/stock-levels' }, { label: 'Warehouses', href: '/warehouses' }, { label: 'Bin Locations' }]} className="mb-4" />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Bin Location Management</h1>
        <p className="text-sm text-gray-500 mt-1">Manage bin locations within warehouses</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedWarehouseId}
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
            >
              <option value="">Select Warehouse</option>
              {warehouses.map((w: any) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search by code, zone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={openCreateModal}
              disabled={!selectedWarehouseId}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              + Add Bin Location
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      {!selectedWarehouseId ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          Select a warehouse to view bin locations
        </div>
      ) : isLoading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading...</p>
        </div>
      ) : bins.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          No bin locations found. Click &quot;Add Bin Location&quot; to create one.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {bins.map((bin) => (
                <tr key={bin.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{bin.code}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{bin.zone || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{bin.description || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      bin.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {bin.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => openEditModal(bin)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleActive(bin)}
                      className={`text-sm ${bin.isActive ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}`}
                    >
                      {bin.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={closeModal}></div>
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-lg font-semibold mb-4">
                {editingBin ? 'Edit Bin Location' : 'Create Bin Location'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g., A-01-01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Zone</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.zone || ''}
                    onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                    placeholder="e.g., Zone A"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description"
                    rows={2}
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editingBin ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
