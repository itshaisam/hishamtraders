import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { CreditLimitService } from './credit-limit.service.js';
import { NotFoundError } from '../../utils/errors.js';

// Mock Prisma
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(),
}));

describe('CreditLimitService', () => {
  let service: CreditLimitService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      client: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
      },
    };
    service = new CreditLimitService(mockPrisma as PrismaClient);
  });

  describe('checkCreditLimit', () => {
    it('should return OK status when utilization is below 80%', async () => {
      const mockClient = {
        id: 'client-1',
        balance: 40000,
        creditLimit: 100000,
      };
      mockPrisma.client.findUnique.mockResolvedValue(mockClient);

      const result = await service.checkCreditLimit('client-1', 10000);

      expect(result.status).toBe('OK');
      expect(result.utilization).toBe(50); // (40000 + 10000) / 100000 * 100
      expect(result.newBalance).toBe(50000);
      expect(result.message).toBe('Credit limit OK');
    });

    it('should return WARNING status when utilization is between 80-100%', async () => {
      const mockClient = {
        id: 'client-1',
        balance: 70000,
        creditLimit: 100000,
      };
      mockPrisma.client.findUnique.mockResolvedValue(mockClient);

      const result = await service.checkCreditLimit('client-1', 20000);

      expect(result.status).toBe('WARNING');
      expect(result.utilization).toBe(90);
      expect(result.message).toContain('approaching credit limit');
      expect(result.message).toContain('90% utilized');
    });

    it('should return EXCEEDED status when utilization is over 100%', async () => {
      const mockClient = {
        id: 'client-1',
        balance: 90000,
        creditLimit: 100000,
      };
      mockPrisma.client.findUnique.mockResolvedValue(mockClient);

      const result = await service.checkCreditLimit('client-1', 20000);

      expect(result.status).toBe('EXCEEDED');
      expect(result.utilization).toBe(110);
      expect(result.message).toContain('Credit limit exceeded');
      expect(result.message).toContain('Rs.90000.00');
      expect(result.message).toContain('Rs.100000.00');
      expect(result.message).toContain('Rs.110000.00');
    });

    it('should handle custom warning threshold', async () => {
      const mockClient = {
        id: 'client-1',
        balance: 60000,
        creditLimit: 100000,
      };
      mockPrisma.client.findUnique.mockResolvedValue(mockClient);

      const result = await service.checkCreditLimit('client-1', 10000, 70);

      expect(result.status).toBe('WARNING');
      expect(result.utilization).toBe(70);
    });

    it('should throw NotFoundError when client does not exist', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(null);

      await expect(service.checkCreditLimit('invalid-id', 10000)).rejects.toThrow(
        NotFoundError
      );
    });

    it('should handle zero credit limit', async () => {
      const mockClient = {
        id: 'client-1',
        balance: 50000,
        creditLimit: 0,
      };
      mockPrisma.client.findUnique.mockResolvedValue(mockClient);

      const result = await service.checkCreditLimit('client-1', 10000);

      expect(result.utilization).toBe(0);
      expect(result.status).toBe('OK');
    });
  });

  describe('getClientsOverThreshold', () => {
    it('should return clients exceeding threshold sorted by utilization', async () => {
      const mockClients = [
        {
          id: 'client-1',
          name: 'Client A',
          balance: 90000,
          creditLimit: 100000,
          city: 'Karachi',
          phone: '1234567890',
        },
        {
          id: 'client-2',
          name: 'Client B',
          balance: 80000,
          creditLimit: 100000,
          city: 'Lahore',
          phone: '9876543210',
        },
        {
          id: 'client-3',
          name: 'Client C',
          balance: 50000,
          creditLimit: 100000,
          city: 'Islamabad',
          phone: '5555555555',
        },
      ];
      mockPrisma.client.findMany.mockResolvedValue(mockClients);

      const result = await service.getClientsOverThreshold(80);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('client-1');
      expect(result[0].utilization).toBe(90);
      expect(result[1].id).toBe('client-2');
      expect(result[1].utilization).toBe(80);
    });

    it('should filter out clients below threshold', async () => {
      const mockClients = [
        {
          id: 'client-1',
          name: 'Client A',
          balance: 70000,
          creditLimit: 100000,
          city: 'Karachi',
          phone: '1234567890',
        },
      ];
      mockPrisma.client.findMany.mockResolvedValue(mockClients);

      const result = await service.getClientsOverThreshold(80);

      expect(result).toHaveLength(0);
    });

    it('should mark status as EXCEEDED when over 100%', async () => {
      const mockClients = [
        {
          id: 'client-1',
          name: 'Client A',
          balance: 110000,
          creditLimit: 100000,
          city: 'Karachi',
          phone: '1234567890',
        },
      ];
      mockPrisma.client.findMany.mockResolvedValue(mockClients);

      const result = await service.getClientsOverThreshold(80);

      expect(result[0].status).toBe('EXCEEDED');
      expect(result[0].utilization).toBe(110);
    });

    it('should mark status as WARNING when between threshold and 100%', async () => {
      const mockClients = [
        {
          id: 'client-1',
          name: 'Client A',
          balance: 85000,
          creditLimit: 100000,
          city: 'Karachi',
          phone: '1234567890',
        },
      ];
      mockPrisma.client.findMany.mockResolvedValue(mockClients);

      const result = await service.getClientsOverThreshold(80);

      expect(result[0].status).toBe('WARNING');
    });
  });
});
