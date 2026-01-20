import logger from '../../lib/logger.js';
import { BadRequestError, ConflictError, NotFoundError } from '../../utils/errors.js';
import { CreateBrandDto } from './dto/create-brand.dto.js';
import { UpdateBrandDto } from './dto/update-brand.dto.js';
import { brandsRepository } from './brands.repository.js';
import { Brand } from '@prisma/client';

export class BrandsService {
  async createBrand(data: CreateBrandDto): Promise<Brand> {
    // Check if brand with this name already exists
    const existingBrand = await brandsRepository.findByName(data.name);
    if (existingBrand) {
      throw new ConflictError('Brand with this name already exists');
    }

    const brand = await brandsRepository.create(data);
    logger.info('Brand created', {
      brandId: brand.id,
      brandName: brand.name,
    });

    return brand;
  }

  async getAllBrands(): Promise<Brand[]> {
    const brands = await brandsRepository.findAll();
    return brands;
  }

  async getBrandById(id: string): Promise<Brand> {
    const brand = await brandsRepository.findById(id);
    if (!brand) {
      throw new NotFoundError('Brand not found');
    }
    return brand;
  }

  async updateBrand(id: string, data: UpdateBrandDto): Promise<Brand> {
    // Check if brand exists
    const brand = await brandsRepository.findById(id);
    if (!brand) {
      throw new NotFoundError('Brand not found');
    }

    // If name is being updated, check for duplicates
    if (data.name && data.name !== brand.name) {
      const existingBrand = await brandsRepository.findByName(data.name);
      if (existingBrand) {
        throw new ConflictError('Brand with this name already exists');
      }
    }

    const updatedBrand = await brandsRepository.update(id, data);
    logger.info('Brand updated', {
      brandId: id,
      changes: Object.keys(data),
    });

    return updatedBrand;
  }

  async deleteBrand(id: string): Promise<void> {
    // Check if brand exists
    const brand = await brandsRepository.findById(id);
    if (!brand) {
      throw new NotFoundError('Brand not found');
    }

    await brandsRepository.delete(id);
    logger.info('Brand deleted', {
      brandId: id,
      brandName: brand.name,
    });
  }
}

export const brandsService = new BrandsService();
