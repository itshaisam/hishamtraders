import { prisma } from '../../lib/prisma.js';
import { ProductCategory } from '@prisma/client';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';

export class CategoriesRepository {
  async findAll(): Promise<ProductCategory[]> {
    return prisma.productCategory.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string): Promise<ProductCategory | null> {
    return prisma.productCategory.findUnique({
      where: { id },
    });
  }

  async findByName(name: string): Promise<ProductCategory | null> {
    return prisma.productCategory.findUnique({
      where: { name },
    });
  }

  async create(data: CreateCategoryDto): Promise<ProductCategory> {
    return prisma.productCategory.create({
      data: {
        name: data.name,
        description: data.description,
        active: true,
      },
    });
  }

  async update(id: string, data: UpdateCategoryDto): Promise<ProductCategory> {
    return prisma.productCategory.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.productCategory.delete({
      where: { id },
    });
  }
}

export const categoriesRepository = new CategoriesRepository();
