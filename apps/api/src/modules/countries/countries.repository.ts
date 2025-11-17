import { prisma } from '../../lib/prisma';
import { Country } from '@prisma/client';

export class CountriesRepository {
  async findAll(): Promise<Country[]> {
    return prisma.country.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string): Promise<Country | null> {
    return prisma.country.findUnique({
      where: { id },
    });
  }

  async findByCode(code: string): Promise<Country | null> {
    return prisma.country.findUnique({
      where: { code },
    });
  }

  async findByName(name: string): Promise<Country | null> {
    return prisma.country.findUnique({
      where: { name },
    });
  }
}

export const countriesRepository = new CountriesRepository();
