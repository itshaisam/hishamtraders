import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gatePassService } from '../services/gatePassService';
import { GatePassFilters, GatePassListResponse, GatePass, CreateGatePassDto } from '../types/gate-pass.types';
import toast from 'react-hot-toast';

const QUERY_KEYS = {
  gatePasses: (filters?: GatePassFilters) => ['gatePasses', filters] as const,
  gatePass: (id: string) => ['gatePass', id] as const,
};

export const useGatePasses = (filters?: GatePassFilters) => {
  return useQuery<GatePassListResponse>({
    queryKey: QUERY_KEYS.gatePasses(filters),
    queryFn: () => gatePassService.getAll(filters),
  });
};

export const useGatePassById = (id: string) => {
  return useQuery<GatePass>({
    queryKey: QUERY_KEYS.gatePass(id),
    queryFn: () => gatePassService.getById(id),
    enabled: !!id,
  });
};

export const useCreateGatePass = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateGatePassDto) => gatePassService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gatePasses'] });
      toast.success('Gate pass created successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to create gate pass';
      toast.error(message);
    },
  });
};

export const useApproveGatePass = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => gatePassService.approve(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['gatePasses'] });
      queryClient.invalidateQueries({ queryKey: ['gatePass', id] });
      toast.success('Gate pass approved');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to approve gate pass');
    },
  });
};

export const useDispatchGatePass = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => gatePassService.dispatch(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['gatePasses'] });
      queryClient.invalidateQueries({ queryKey: ['gatePass', id] });
      toast.success('Gate pass dispatched');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to dispatch gate pass');
    },
  });
};

export const useCompleteGatePass = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => gatePassService.complete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['gatePasses'] });
      queryClient.invalidateQueries({ queryKey: ['gatePass', id] });
      toast.success('Gate pass completed');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to complete gate pass');
    },
  });
};

export const useCancelGatePass = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => gatePassService.cancel(id, reason),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['gatePasses'] });
      queryClient.invalidateQueries({ queryKey: ['gatePass', id] });
      toast.success('Gate pass cancelled');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to cancel gate pass');
    },
  });
};

export const useUpdateWarehouseGatePassConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ warehouseId, gatePassMode }: { warehouseId: string; gatePassMode: string }) =>
      gatePassService.updateWarehouseGatePassConfig(warehouseId, gatePassMode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      toast.success('Gate pass configuration updated');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update configuration');
    },
  });
};
