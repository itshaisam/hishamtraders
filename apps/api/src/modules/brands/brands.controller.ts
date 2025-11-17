import { Request, Response, NextFunction } from 'express';
import logger from '../../lib/logger.js';
import { BadRequestError, ValidationError } from '../../utils/errors';
import { createBrandSchema } from './dto/create-brand.dto';
import { updateBrandSchema } from './dto/update-brand.dto';
import { brandsService } from './brands.service';

export class BrandsController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createBrandSchema.parse(req.body);
      const brand = await brandsService.createBrand(data);

      res.status(201).json({
        success: true,
        data: brand,
        message: 'Brand created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const brands = await brandsService.getAllBrands();

      res.status(200).json({
        success: true,
        data: brands,
        message: 'Brands fetched successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const brand = await brandsService.getBrandById(id);

      res.status(200).json({
        success: true,
        data: brand,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = updateBrandSchema.parse(req.body);
      const brand = await brandsService.updateBrand(id, data);

      res.status(200).json({
        success: true,
        data: brand,
        message: 'Brand updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await brandsService.deleteBrand(id);

      res.status(200).json({
        success: true,
        message: 'Brand deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const brandsController = new BrandsController();
