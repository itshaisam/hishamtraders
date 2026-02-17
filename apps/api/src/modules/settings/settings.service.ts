import { SettingsRepository } from './settings.repository.js';
import logger from '../../lib/logger.js';

// In-memory cache for settings
interface SettingsCache {
  [key: string]: {
    value: string;
    fetchedAt: Date;
  };
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export class SettingsService {
  private repository: SettingsRepository;
  private cache: SettingsCache = {};

  constructor(prisma: any) {
    this.repository = new SettingsRepository(prisma);
  }

  /**
   * Get a setting value with caching
   */
  async getSetting(key: string): Promise<string | null> {
    // Check cache first
    const cached = this.cache[key];
    if (cached && Date.now() - cached.fetchedAt.getTime() < CACHE_TTL_MS) {
      logger.debug(`Settings cache hit for key: ${key}`);
      return cached.value;
    }

    // Fetch from database
    logger.debug(`Settings cache miss for key: ${key}, fetching from database`);
    const setting = await this.repository.findByKey(key);

    if (setting) {
      // Update cache
      this.cache[key] = {
        value: setting.value,
        fetchedAt: new Date(),
      };
      return setting.value;
    }

    return null;
  }

  /**
   * Get tax rate as a number
   */
  async getTaxRate(): Promise<number> {
    const value = await this.getSetting('TAX_RATE');
    if (!value) {
      logger.warn('TAX_RATE setting not found, using default 18%');
      return 18; // Default tax rate
    }

    const taxRate = parseFloat(value);
    if (isNaN(taxRate)) {
      logger.error(`Invalid TAX_RATE value: ${value}, using default 18%`);
      return 18;
    }

    return taxRate;
  }

  /**
   * Get currency symbol
   */
  async getCurrencySymbol(): Promise<string> {
    const value = await this.getSetting('CURRENCY_SYMBOL');
    return value || 'PKR';
  }

  /**
   * Get company name
   */
  async getCompanyName(): Promise<string> {
    const value = await this.getSetting('COMPANY_NAME');
    return value || 'Hisham Traders';
  }

  /**
   * Get company logo URL
   */
  async getCompanyLogo(): Promise<string> {
    const value = await this.getSetting('COMPANY_LOGO');
    return value || '';
  }

  /**
   * Get all settings
   */
  async getAllSettings(category?: string) {
    return this.repository.findAll(category);
  }

  /**
   * Update a setting value (also invalidates cache)
   */
  async updateSetting(key: string, value: string) {
    const setting = await this.repository.updateValue(key, value);

    // Invalidate cache for this key
    delete this.cache[key];

    logger.info(`Setting updated: ${key} = ${value}`);
    return setting;
  }

  /**
   * Create or update a setting (also invalidates cache)
   */
  async upsertSetting(key: string, value: string, label: string, dataType: string, category?: string) {
    const setting = await this.repository.upsert(key, value, label, dataType, category);

    // Invalidate cache for this key
    delete this.cache[key];

    logger.info(`Setting upserted: ${key} = ${value}`);
    return setting;
  }

  /**
   * Clear all cache (useful for testing or admin operations)
   */
  clearCache() {
    this.cache = {};
    logger.info('Settings cache cleared');
  }

  /**
   * Initialize default settings if they don't exist
   */
  async initializeDefaults() {
    const defaults = [
      { key: 'TAX_RATE', value: '18', label: 'Sales Tax Rate (%)', dataType: 'number', category: 'tax' },
      { key: 'CURRENCY_SYMBOL', value: 'PKR', label: 'Currency', dataType: 'string', category: 'general' },
      { key: 'COMPANY_NAME', value: 'Hisham Traders', label: 'Company Name', dataType: 'string', category: 'company' },
      { key: 'COMPANY_LOGO', value: '', label: 'Company Logo URL', dataType: 'string', category: 'company' },
    ];

    for (const setting of defaults) {
      const existing = await this.repository.findByKey(setting.key);
      if (!existing) {
        await this.repository.upsert(
          setting.key,
          setting.value,
          setting.label,
          setting.dataType,
          setting.category
        );
        logger.info(`Initialized default setting: ${setting.key} = ${setting.value}`);
      }
    }
  }
}
