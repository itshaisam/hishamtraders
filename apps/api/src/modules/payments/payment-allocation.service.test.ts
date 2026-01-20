import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaClient, InvoiceStatus } from '@prisma/client';
import { PaymentAllocationService } from './payment-allocation.service.js';

// Mock PrismaClient
const mockPrisma = {
  invoice: {
    findMany: vi.fn(),
    update: vi.fn(),
  },
  paymentAllocation: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
  client: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
} as unknown as PrismaClient;

describe('PaymentAllocationService', () => {
  let service: PaymentAllocationService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PaymentAllocationService(mockPrisma);
  });

  describe('allocatePaymentToInvoices - FIFO allocation', () => {
    it('should allocate payment to oldest invoice first (FIFO)', async () => {
      const paymentId = 'payment-1';
      const clientId = 'client-1';
      const paymentAmount = 1000;

      // Mock outstanding invoices (oldest first)
      const mockInvoices = [
        {
          id: 'invoice-1',
          invoiceNumber: 'INV-001',
          invoiceDate: new Date('2024-01-01'),
          total: { toString: () => '500' },
          paidAmount: { toString: () => '0' },
          dueDate: new Date('2024-02-01'),
        },
        {
          id: 'invoice-2',
          invoiceNumber: 'INV-002',
          invoiceDate: new Date('2024-01-15'),
          total: { toString: () => '800' },
          paidAmount: { toString: () => '0' },
          dueDate: new Date('2024-02-15'),
        },
      ];

      (mockPrisma.invoice.findMany as any).mockResolvedValue(mockInvoices);
      (mockPrisma.paymentAllocation.create as any).mockResolvedValue({});
      (mockPrisma.invoice.update as any).mockResolvedValue({});

      const result = await service.allocatePaymentToInvoices(paymentId, clientId, paymentAmount);

      // Should allocate to both invoices
      expect(result.allocations).toHaveLength(2);
      expect(result.totalAllocated).toBe(1000);
      expect(result.overpayment).toBe(0);

      // First invoice should be fully paid
      expect(result.allocations[0].invoiceId).toBe('invoice-1');
      expect(result.allocations[0].allocatedAmount).toBe(500);

      // Second invoice should receive remaining amount
      expect(result.allocations[1].invoiceId).toBe('invoice-2');
      expect(result.allocations[1].allocatedAmount).toBe(500);
    });

    it('should handle overpayment correctly', async () => {
      const paymentId = 'payment-1';
      const clientId = 'client-1';
      const paymentAmount = 2000;

      const mockInvoices = [
        {
          id: 'invoice-1',
          invoiceNumber: 'INV-001',
          invoiceDate: new Date('2024-01-01'),
          total: { toString: () => '500' },
          paidAmount: { toString: () => '0' },
          dueDate: new Date('2024-02-01'),
        },
      ];

      (mockPrisma.invoice.findMany as any).mockResolvedValue(mockInvoices);
      (mockPrisma.paymentAllocation.create as any).mockResolvedValue({});
      (mockPrisma.invoice.update as any).mockResolvedValue({});

      const result = await service.allocatePaymentToInvoices(paymentId, clientId, paymentAmount);

      expect(result.allocations).toHaveLength(1);
      expect(result.totalAllocated).toBe(500);
      expect(result.overpayment).toBe(1500);
      expect(result.allocations[0].allocatedAmount).toBe(500);
    });

    it('should handle no outstanding invoices', async () => {
      const paymentId = 'payment-1';
      const clientId = 'client-1';
      const paymentAmount = 1000;

      (mockPrisma.invoice.findMany as any).mockResolvedValue([]);

      const result = await service.allocatePaymentToInvoices(paymentId, clientId, paymentAmount);

      expect(result.allocations).toHaveLength(0);
      expect(result.totalAllocated).toBe(0);
      expect(result.overpayment).toBe(1000);
    });

    it('should handle partial invoice payment', async () => {
      const paymentId = 'payment-1';
      const clientId = 'client-1';
      const paymentAmount = 300;

      const mockInvoices = [
        {
          id: 'invoice-1',
          invoiceNumber: 'INV-001',
          invoiceDate: new Date('2024-01-01'),
          total: { toString: () => '500' },
          paidAmount: { toString: () => '0' },
          dueDate: new Date('2024-02-01'),
        },
      ];

      (mockPrisma.invoice.findMany as any).mockResolvedValue(mockInvoices);
      (mockPrisma.paymentAllocation.create as any).mockResolvedValue({});
      (mockPrisma.invoice.update as any).mockResolvedValue({});

      const result = await service.allocatePaymentToInvoices(paymentId, clientId, paymentAmount);

      expect(result.allocations).toHaveLength(1);
      expect(result.totalAllocated).toBe(300);
      expect(result.overpayment).toBe(0);
      expect(result.allocations[0].allocatedAmount).toBe(300);

      // Should update invoice to PARTIAL status
      expect(mockPrisma.invoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'invoice-1' },
          data: expect.objectContaining({
            status: InvoiceStatus.PARTIAL,
          }),
        })
      );
    });

    it('should update invoice to PAID when fully paid', async () => {
      const paymentId = 'payment-1';
      const clientId = 'client-1';
      const paymentAmount = 500;

      const mockInvoices = [
        {
          id: 'invoice-1',
          invoiceNumber: 'INV-001',
          invoiceDate: new Date('2024-01-01'),
          total: { toString: () => '500' },
          paidAmount: { toString: () => '0' },
          dueDate: new Date('2024-02-01'),
        },
      ];

      (mockPrisma.invoice.findMany as any).mockResolvedValue(mockInvoices);
      (mockPrisma.paymentAllocation.create as any).mockResolvedValue({});
      (mockPrisma.invoice.update as any).mockResolvedValue({});

      await service.allocatePaymentToInvoices(paymentId, clientId, paymentAmount);

      // Should update invoice to PAID status
      expect(mockPrisma.invoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'invoice-1' },
          data: expect.objectContaining({
            status: InvoiceStatus.PAID,
          }),
        })
      );
    });
  });

  describe('updateClientBalance', () => {
    it('should reduce client balance by payment amount', async () => {
      const clientId = 'client-1';
      const paymentAmount = 1000;

      const mockClient = {
        id: clientId,
        balance: { toString: () => '5000' },
      };

      (mockPrisma.client.findUnique as any).mockResolvedValue(mockClient);
      (mockPrisma.client.update as any).mockResolvedValue({});

      const newBalance = await service.updateClientBalance(clientId, paymentAmount);

      expect(newBalance).toBe(4000);
      expect(mockPrisma.client.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: clientId },
          data: expect.objectContaining({
            balance: expect.anything(),
          }),
        })
      );
    });

    it('should not allow negative balance', async () => {
      const clientId = 'client-1';
      const paymentAmount = 6000;

      const mockClient = {
        id: clientId,
        balance: { toString: () => '5000' },
      };

      (mockPrisma.client.findUnique as any).mockResolvedValue(mockClient);
      (mockPrisma.client.update as any).mockResolvedValue({});

      const newBalance = await service.updateClientBalance(clientId, paymentAmount);

      // Balance should be 0, not negative
      expect(newBalance).toBe(0);
    });

    it('should throw error if client not found', async () => {
      const clientId = 'nonexistent';
      const paymentAmount = 1000;

      (mockPrisma.client.findUnique as any).mockResolvedValue(null);

      await expect(
        service.updateClientBalance(clientId, paymentAmount)
      ).rejects.toThrow('Client not found');
    });
  });

  describe('getOutstandingInvoices', () => {
    it('should return invoices in FIFO order (oldest first)', async () => {
      const clientId = 'client-1';

      const mockInvoices = [
        { id: 'invoice-1', invoiceDate: new Date('2024-01-01') },
        { id: 'invoice-2', invoiceDate: new Date('2024-01-15') },
        { id: 'invoice-3', invoiceDate: new Date('2024-01-10') },
      ];

      (mockPrisma.invoice.findMany as any).mockResolvedValue(mockInvoices);

      const result = await service.getOutstandingInvoices(clientId);

      // Should query with FIFO ordering
      expect(mockPrisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { invoiceDate: 'asc' },
        })
      );
    });

    it('should only return outstanding invoices', async () => {
      const clientId = 'client-1';

      (mockPrisma.invoice.findMany as any).mockResolvedValue([]);

      await service.getOutstandingInvoices(clientId);

      // Should filter for outstanding statuses only
      expect(mockPrisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            clientId,
            status: {
              in: [InvoiceStatus.PENDING, InvoiceStatus.PARTIAL, InvoiceStatus.OVERDUE],
            },
          },
        })
      );
    });
  });
});
