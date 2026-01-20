import { Request, Response, NextFunction } from 'express';
import logger from '../../lib/logger.js';
import { countriesService } from './countries.service.js';

export class CountriesController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const countries = await countriesService.getAllCountries();

      res.status(200).json({
        success: true,
        data: countries,
        message: 'Countries fetched successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const country = await countriesService.getCountryById(id);

      res.status(200).json({
        success: true,
        data: country,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const countriesController = new CountriesController();
