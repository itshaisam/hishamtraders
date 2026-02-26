import { SystemSetting } from '@prisma/client';
import { getTenantId } from '../../lib/prisma.js';

export class SettingsRepository {
  constructor(private prisma: any) {}

  /**
   * Get a system setting by key
   */
  async findByKey(key: string): Promise<SystemSetting | null> {
    return this.prisma.systemSetting.findFirst({
      where: { key },
    });
  }

  /**
   * Get all settings (optionally filtered by category)
   */
  async findAll(category?: string): Promise<SystemSetting[]> {
    return this.prisma.systemSetting.findMany({
      where: category ? { category } : undefined,
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });
  }

  /**
   * Create or update a system setting
   */
  async upsert(key: string, value: string, label: string, dataType: string, category?: string): Promise<SystemSetting> {
    const tenantId = getTenantId();
    return this.prisma.systemSetting.upsert({
      where: { tenantId_key: { tenantId, key } },
      update: { value, label, dataType, category },
      create: { key, value, label, dataType, category, tenantId },
    });
  }

  /**
   * Update a setting value
   */
  async updateValue(key: string, value: string): Promise<SystemSetting> {
    const existing = await this.prisma.systemSetting.findFirst({ where: { key } });
    if (!existing) {
      throw new Error(`Setting not found: ${key}`);
    }
    return this.prisma.systemSetting.update({
      where: { id: existing.id },
      data: { value },
    });
  }
}
