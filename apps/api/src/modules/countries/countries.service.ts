import logger from '../../lib/logger.js';
import { NotFoundError } from '../../utils/errors';
import { countriesRepository } from './countries.repository';
import { Country } from '@prisma/client';

export class CountriesService {
  async getAllCountries(): Promise<Country[]> {
    const countries = await countriesRepository.findAll();
    return countries;
  }

  async getCountryById(id: string): Promise<Country> {
    const country = await countriesRepository.findById(id);
    if (!country) {
      throw new NotFoundError('Country not found');
    }
    return country;
  }

  async getCountryByCode(code: string): Promise<Country | null> {
    const country = await countriesRepository.findByCode(code);
    return country;
  }
}

export const countriesService = new CountriesService();
