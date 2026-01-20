import logger from '../../lib/logger.js';
import { BadRequestError, ConflictError, NotFoundError } from '../../utils/errors.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { categoriesRepository } from './categories.repository.js';
import { ProductCategory } from '@prisma/client';

export class CategoriesService {
  async createCategory(data: CreateCategoryDto): Promise<ProductCategory> {
    // Check if category with this name already exists
    const existingCategory = await categoriesRepository.findByName(data.name);
    if (existingCategory) {
      throw new ConflictError('Category with this name already exists');
    }

    const category = await categoriesRepository.create(data);
    logger.info('Category created', {
      categoryId: category.id,
      categoryName: category.name,
    });

    return category;
  }

  async getAllCategories(): Promise<ProductCategory[]> {
    const categories = await categoriesRepository.findAll();
    return categories;
  }

  async getCategoryById(id: string): Promise<ProductCategory> {
    const category = await categoriesRepository.findById(id);
    if (!category) {
      throw new NotFoundError('Category not found');
    }
    return category;
  }

  async updateCategory(id: string, data: UpdateCategoryDto): Promise<ProductCategory> {
    // Check if category exists
    const category = await categoriesRepository.findById(id);
    if (!category) {
      throw new NotFoundError('Category not found');
    }

    // If name is being updated, check for duplicates
    if (data.name && data.name !== category.name) {
      const existingCategory = await categoriesRepository.findByName(data.name);
      if (existingCategory) {
        throw new ConflictError('Category with this name already exists');
      }
    }

    const updatedCategory = await categoriesRepository.update(id, data);
    logger.info('Category updated', {
      categoryId: id,
      changes: Object.keys(data),
    });

    return updatedCategory;
  }

  async deleteCategory(id: string): Promise<void> {
    // Check if category exists
    const category = await categoriesRepository.findById(id);
    if (!category) {
      throw new NotFoundError('Category not found');
    }

    await categoriesRepository.delete(id);
    logger.info('Category deleted', {
      categoryId: id,
      categoryName: category.name,
    });
  }
}

export const categoriesService = new CategoriesService();
