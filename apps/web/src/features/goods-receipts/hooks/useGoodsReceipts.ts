import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goodsReceiptsService } from '../services/goodsReceiptsService';
import { GRNFilters, CreateGRNRequest, AddGRNCostRequest } from '../types/goods-receipt.types';

export function useGoodsReceipts(filters?: GRNFilters) {
  return useQuery({
    queryKey: ['goods-receipts', filters],
    queryFn: () => goodsReceiptsService.list(filters),
  });
}

export function useGoodsReceipt(id: string) {
  return useQuery({
    queryKey: ['goods-receipt', id],
    queryFn: () => goodsReceiptsService.getById(id),
    enabled: !!id,
  });
}

export function useCreateGRN() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateGRNRequest) => goodsReceiptsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goods-receipts'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

export function useCancelGRN() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => goodsReceiptsService.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goods-receipts'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

export function useAddGRNCost(grnId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddGRNCostRequest) => goodsReceiptsService.addCost(grnId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goods-receipt', grnId] });
      queryClient.invalidateQueries({ queryKey: ['grn-landed-cost', grnId] });
      queryClient.invalidateQueries({ queryKey: ['landedCost'] });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrder'] });
    },
  });
}

export function useGRNLandedCost(grnId: string) {
  return useQuery({
    queryKey: ['grn-landed-cost', grnId],
    queryFn: () => goodsReceiptsService.getLandedCost(grnId),
    enabled: !!grnId,
    staleTime: 5 * 60 * 1000,
  });
}
