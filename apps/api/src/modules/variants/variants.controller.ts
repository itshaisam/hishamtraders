import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../types/auth.types.js';
import { createVariantSchema } from './dto/create-variant.dto.js';
import { updateVariantSchema } from './dto/update-variant.dto.js';
import { variantFilterSchema } from './dto/variant-filter.dto.js';
import { variantsService } from './variants.service.js';

export class VariantsController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = createVariantSchema.parse(req.body);
      const userId = req.user?.userId;
      const variant = await variantsService.createVariant(data, userId);

      res.status(201).json({
        success: true,
        data: variant,
        message: 'Product variant created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const filters = variantFilterSchema.parse(req.query);
      const result = await variantsService.getVariantsWithPagination(filters);

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

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const variant = await variantsService.getVariantById(id);

      res.status(200).json({
        success: true,
        data: variant,
      });
    } catch (error) {
      next(error);
    }
  }

  async getByProductId(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { productId } = req.params;
      const { status } = req.query;
      const variants = await variantsService.getVariantsByProductId(
        productId,
        status as 'ACTIVE' | 'INACTIVE' | undefined
      );

      res.status(200).json({
        success: true,
        data: variants,
        total: variants.length,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = updateVariantSchema.parse(req.body);
      const userId = req.user?.userId;
      const variant = await variantsService.updateVariant(id, data, userId);

      res.status(200).json({
        success: true,
        data: variant,
        message: 'Product variant updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      await variantsService.deleteVariant(id, userId);

      res.status(200).json({
        success: true,
        message: 'Product variant deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const variantsController = new VariantsController();
