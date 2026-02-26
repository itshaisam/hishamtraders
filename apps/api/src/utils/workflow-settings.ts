import { SettingsService } from '../modules/settings/settings.service.js';
import { prisma } from '../lib/prisma.js';

const settingsService = new SettingsService(prisma);

/**
 * Get a workflow setting value as a boolean.
 * Uses SettingsService which has 5-min in-memory cache.
 * Returns false if the setting doesn't exist (safe default = simple mode).
 */
export async function getWorkflowSetting(key: string): Promise<boolean> {
  const value = await settingsService.getSetting(key);
  return value === 'true';
}

/**
 * Get all workflow settings at once (batch fetch).
 * More efficient than calling getWorkflowSetting() multiple times.
 */
export async function getWorkflowSettings(): Promise<Record<string, boolean>> {
  const keys = [
    'sales.requireSalesOrder',
    'sales.requireDeliveryNote',
    'sales.allowDirectInvoice',
    'purchasing.requirePurchaseInvoice',
    'sales.enableStockReservation',
  ];
  const result: Record<string, boolean> = {};
  for (const key of keys) {
    result[key] = await getWorkflowSetting(key);
  }
  return result;
}
