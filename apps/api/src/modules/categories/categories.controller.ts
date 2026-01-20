import { Request, Response, NextFunction } from 'express';
import logger from '../../lib/logger.js';
import { BadRequestError, ValidationError } from '../../utils/errors.js';
import { createCategorySchema } from './dto/create-category.dto.js';
import { updateCategorySchema } from './dto/update-category.dto.js';
import { categoriesService } from './categories.service.js';

export class CategoriesController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createCategorySchema.parse(req.body);
      const category = await categoriesService.createCategory(data);

      res.status(201).json({
        success: true,
        data: category,
        message: 'Category created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await categoriesService.getAllCategories();

      res.status(200).json({
        success: true,
        data: categories,
        message: 'Categories fetched successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const category = await categoriesService.getCategoryById(id);

      res.status(200).json({
        success: true,
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = updateCategorySchema.parse(req.body);
      const category = await categoriesService.updateCategory(id, data);

      res.status(200).json({
        success: true,
        data: category,
        message: 'Category updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await categoriesService.deleteCategory(id);

      res.status(200).json({
        success: true,
        message: 'Category deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const categoriesController = new CategoriesController();
