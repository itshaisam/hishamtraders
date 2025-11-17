import { prisma } from '../../lib/prisma';
import { Brand } from '@prisma/client';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

export class BrandsRepository {
  async findAll(): Promise<Brand[]> {
    return prisma.brand.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string): Promise<Brand | null> {
    return prisma.brand.findUnique({
      where: { id },
    });
  }

  async findByName(name: string): Promise<Brand | null> {
    return prisma.brand.findUnique({
      where: { name },
    });
  }

  async create(data: CreateBrandDto): Promise<Brand> {
    return prisma.brand.create({
      data: {
        name: data.name,
        country: data.country,
        active: true,
      },
    });
  }

  async update(id: string, data: UpdateBrandDto): Promise<Brand> {
    return prisma.brand.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.brand.delete({
      where: { id },
    });
  }
}

export const brandsRepository = new BrandsRepository();
