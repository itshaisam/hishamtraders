import logger from '../../lib/logger.js';
import { ConflictError, NotFoundError } from '../../utils/errors';
import { CreateUomDto } from './dto/create-uom.dto';
import { UpdateUomDto } from './dto/update-uom.dto';
import { uomsRepository } from './uoms.repository';
import { UnitOfMeasure } from '@prisma/client';

export class UomsService {
  async createUom(data: CreateUomDto): Promise<UnitOfMeasure> {
    // Check if UOM with this name already exists
    const existingByName = await uomsRepository.findByName(data.name);
    if (existingByName) {
      throw new ConflictError('UOM with this name already exists');
    }

    // Check if UOM with this abbreviation already exists
    const existingByAbbr = await uomsRepository.findByAbbreviation(data.abbreviation);
    if (existingByAbbr) {
      throw new ConflictError('UOM with this abbreviation already exists');
    }

    const uom = await uomsRepository.create(data);
    logger.info('UOM created', {
      uomId: uom.id,
      uomName: uom.name,
    });

    return uom;
  }

  async getAllUoms(): Promise<UnitOfMeasure[]> {
    const uoms = await uomsRepository.findAll();
    return uoms;
  }

  async getUomById(id: string): Promise<UnitOfMeasure> {
    const uom = await uomsRepository.findById(id);
    if (!uom) {
      throw new NotFoundError('UOM not found');
    }
    return uom;
  }

  async updateUom(id: string, data: UpdateUomDto): Promise<UnitOfMeasure> {
    // Check if UOM exists
    const uom = await uomsRepository.findById(id);
    if (!uom) {
      throw new NotFoundError('UOM not found');
    }

    // If name is being updated, check for duplicates
    if (data.name && data.name !== uom.name) {
      const existingByName = await uomsRepository.findByName(data.name);
      if (existingByName) {
        throw new ConflictError('UOM with this name already exists');
      }
    }

    // If abbreviation is being updated, check for duplicates
    if (data.abbreviation && data.abbreviation !== uom.abbreviation) {
      const existingByAbbr = await uomsRepository.findByAbbreviation(data.abbreviation);
      if (existingByAbbr) {
        throw new ConflictError('UOM with this abbreviation already exists');
      }
    }

    const updatedUom = await uomsRepository.update(id, data);
    logger.info('UOM updated', {
      uomId: id,
      changes: Object.keys(data),
    });

    return updatedUom;
  }

  async deleteUom(id: string): Promise<void> {
    // Check if UOM exists
    const uom = await uomsRepository.findById(id);
    if (!uom) {
      throw new NotFoundError('UOM not found');
    }

    await uomsRepository.delete(id);
    logger.info('UOM deleted', {
      uomId: id,
      uomName: uom.name,
    });
  }
}

export const uomsService = new UomsService();
