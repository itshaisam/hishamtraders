import { Request, Response, NextFunction } from 'express';
import logger from '../../lib/logger.js';
import { createProductSchema } from './dto/create-product.dto.js';
import { updateProductSchema } from './dto/update-product.dto.js';
import { productFilterSchema } from './dto/product-filter.dto.js';
import { productsService } from './products.service.js';

export class ProductsController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createProductSchema.parse(req.body);
      const product = await productsService.createProduct(data);

      res.status(201).json({
        success: true,
        data: product,
        message: 'Product created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = productFilterSchema.parse(req.query);
      const result = await productsService.getProductsWithPagination({
        search: filters.search,
        category: filters.category,
        status: filters.status as any,
        page: filters.page,
        limit: filters.limit,
      });

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          pages: result.pages,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const product = await productsService.getProductById(id);

      res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = updateProductSchema.parse(req.body);
      const product = await productsService.updateProduct(id, data);

      res.status(200).json({
        success: true,
        data: product,
        message: 'Product updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await productsService.deleteProduct(id);

      res.status(200).json({
        success: true,
        message: 'Product deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const productsController = new ProductsController();
