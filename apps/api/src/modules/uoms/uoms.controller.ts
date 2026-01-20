import { Request, Response, NextFunction } from 'express';
import { createUomSchema } from './dto/create-uom.dto.js';
import { updateUomSchema } from './dto/update-uom.dto.js';
import { uomsService } from './uoms.service.js';

export class UomsController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createUomSchema.parse(req.body);
      const uom = await uomsService.createUom(data);

      res.status(201).json({
        success: true,
        data: uom,
        message: 'UOM created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const uoms = await uomsService.getAllUoms();

      res.status(200).json({
        success: true,
        data: uoms,
        message: 'UOMs fetched successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const uom = await uomsService.getUomById(id);

      res.status(200).json({
        success: true,
        data: uom,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = updateUomSchema.parse(req.body);
      const uom = await uomsService.updateUom(id, data);

      res.status(200).json({
        success: true,
        data: uom,
        message: 'UOM updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await uomsService.deleteUom(id);

      res.status(200).json({
        success: true,
        message: 'UOM deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const uomsController = new UomsController();
