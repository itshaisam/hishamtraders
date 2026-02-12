import { Request, Response, NextFunction } from 'express';
import { BinLocationService } from './bin-location.service.js';

export class BinLocationController {
  private service: BinLocationService;

  constructor() {
    this.service = new BinLocationService();
  }

  listBins = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { search, isActive, page = '1', limit = '50' } = req.query;

      const result = await this.service.listBins(id, {
        search: search as string | undefined,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
      });

      res.json({ success: true, data: result.data, pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  };

  createBin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const bin = await this.service.createBin(id, req.body);
      res.status(201).json({ success: true, message: 'Bin location created', data: bin });
    } catch (error) {
      next(error);
    }
  };

  updateBin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id, binId } = req.params;
      const bin = await this.service.updateBin(id, binId, req.body);
      res.json({ success: true, message: 'Bin location updated', data: bin });
    } catch (error) {
      next(error);
    }
  };

  deleteBin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id, binId } = req.params;
      await this.service.deleteBin(id, binId);
      res.json({ success: true, message: 'Bin location deactivated' });
    } catch (error) {
      next(error);
    }
  };
}
