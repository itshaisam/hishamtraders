import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { SettingsService } from './settings.service.js';

// Mock Prisma
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(),
}));

// Mock logger
vi.mock('../../lib/logger.js', () => ({
  default: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('SettingsService', () => {
  let service: SettingsService;
  let mockPrisma: any;
  let mockRepository: any;

  beforeEach(() => {
    mockPrisma = {
      systemSetting: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        upsert: vi.fn(),
        update: vi.fn(),
      },
    };

    service = new SettingsService(mockPrisma as PrismaClient);

    // Access the private repository to set up mocks
    mockRepository = (service as any).repository;
    mockRepository.findByKey = vi.fn();
    mockRepository.updateValue = vi.fn();
    mockRepository.upsert = vi.fn();
    mockRepository.findAll = vi.fn();

    // Clear cache before each test
    service.clearCache();
  });

  describe('getTaxRate', () => {
    it('should return cached value within TTL', async () => {
      // First call: fetch from DB
      mockRepository.findByKey.mockResolvedValueOnce({
        key: 'TAX_RATE',
        value: '17',
      });

      const first = await service.getTaxRate();
      expect(first).toBe(17);
      expect(mockRepository.findByKey).toHaveBeenCalledTimes(1);

      // Second call: should use cache
      const second = await service.getTaxRate();
      expect(second).toBe(17);
      expect(mockRepository.findByKey).toHaveBeenCalledTimes(1); // Still 1
    });

    it('should fetch from DB on cache miss', async () => {
      mockRepository.findByKey.mockResolvedValueOnce({
        key: 'TAX_RATE',
        value: '15',
      });

      const result = await service.getTaxRate();

      expect(result).toBe(15);
      expect(mockRepository.findByKey).toHaveBeenCalledWith('TAX_RATE');
    });

    it('should return default 18% when not found in DB', async () => {
      mockRepository.findByKey.mockResolvedValueOnce(null);

      const result = await service.getTaxRate();

      expect(result).toBe(18);
    });

    it('should return default 18% for invalid (non-numeric) value', async () => {
      mockRepository.findByKey.mockResolvedValueOnce({
        key: 'TAX_RATE',
        value: 'invalid',
      });

      const result = await service.getTaxRate();

      expect(result).toBe(18);
    });
  });

  describe('updateSetting', () => {
    it('should update value and invalidate cache', async () => {
      // Populate cache first
      mockRepository.findByKey.mockResolvedValueOnce({
        key: 'TAX_RATE',
        value: '18',
      });
      await service.getTaxRate();
      expect(mockRepository.findByKey).toHaveBeenCalledTimes(1);

      // Update setting
      mockRepository.updateValue.mockResolvedValueOnce({
        key: 'TAX_RATE',
        value: '20',
      });
      await service.updateSetting('TAX_RATE', '20');

      // Next fetch should go to DB again (cache invalidated)
      mockRepository.findByKey.mockResolvedValueOnce({
        key: 'TAX_RATE',
        value: '20',
      });
      const result = await service.getTaxRate();

      expect(result).toBe(20);
      expect(mockRepository.findByKey).toHaveBeenCalledTimes(2); // Was re-fetched
    });
  });

  describe('clearCache', () => {
    it('should clear all cached entries', async () => {
      // Populate cache with two keys
      mockRepository.findByKey.mockResolvedValueOnce({
        key: 'TAX_RATE',
        value: '18',
      });
      await service.getSetting('TAX_RATE');

      mockRepository.findByKey.mockResolvedValueOnce({
        key: 'OTHER_KEY',
        value: 'foo',
      });
      await service.getSetting('OTHER_KEY');

      expect(mockRepository.findByKey).toHaveBeenCalledTimes(2);

      // Clear cache
      service.clearCache();

      // Both should re-fetch
      mockRepository.findByKey.mockResolvedValueOnce({
        key: 'TAX_RATE',
        value: '18',
      });
      mockRepository.findByKey.mockResolvedValueOnce({
        key: 'OTHER_KEY',
        value: 'foo',
      });

      await service.getSetting('TAX_RATE');
      await service.getSetting('OTHER_KEY');

      expect(mockRepository.findByKey).toHaveBeenCalledTimes(4); // 2 original + 2 re-fetch
    });
  });
});
