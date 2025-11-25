import logger from '../../lib/logger.js';
import { BadRequestError, ConflictError, NotFoundError } from '../../utils/errors';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { VariantFilterDto } from './dto/variant-filter.dto';
import { variantsRepository } from './variants.repository';
import { productsRepository } from '../products/products.repository';
import { generateVariantSKU, isVariantSkuUnique } from '../products/utils/generate-sku.js';
import { ProductVariant } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

export class VariantsService {
  async createVariant(data: CreateVariantDto, userId?: string): Promise<ProductVariant> {
    // Validate parent product exists and is active
    const parentProduct = await productsRepository.findById(data.productId);
    if (!parentProduct) {
      throw new NotFoundError('Parent product not found');
    }
    if (parentProduct.status !== 'ACTIVE') {
      throw new BadRequestError('Cannot create variant for inactive product');
    }

    // Validate attributes (at least one attribute required)
    if (!data.attributes || Object.keys(data.attributes).length === 0) {
      throw new BadRequestError('At least one variant attribute is required');
    }

    // Auto-generate variant SKU if not provided
    let sku = data.sku;
    if (!sku) {
      sku = generateVariantSKU(parentProduct.sku, data.attributes);
      logger.info('Auto-generated variant SKU', { sku, productId: data.productId });
    } else {
      // Validate SKU uniqueness if provided
      const skuUnique = await isVariantSkuUnique(sku);
      if (!skuUnique) {
        throw new ConflictError('Variant or product with this SKU already exists');
      }
    }

    // Validate prices
    if (data.costPrice <= 0) {
      throw new BadRequestError('Cost price must be greater than 0');
    }
    if (data.sellingPrice <= 0) {
      throw new BadRequestError('Selling price must be greater than 0');
    }

    // Create variant with generated/validated SKU
    const variantData = { ...data, sku, createdBy: userId };
    const variant = await variantsRepository.create(variantData);

    // Set hasVariants=true on parent product
    await prisma.product.update({
      where: { id: data.productId },
      data: { hasVariants: true },
    });

    logger.info('Product variant created', {
      variantId: variant.id,
      sku: variant.sku,
      productId: data.productId,
      userId,
    });

    return variant;
  }

  async getVariantsWithPagination(
    filters: VariantFilterDto
  ): Promise<{ data: ProductVariant[]; total: number; page: number; limit: number; pages: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;

    const result = await variantsRepository.findAll(filters);
    const pages = Math.ceil(result.total / limit);

    return {
      data: result.data,
      total: result.total,
      page,
      limit,
      pages,
    };
  }

  async getVariantById(id: string): Promise<ProductVariant> {
    const variant = await variantsRepository.findById(id);
    if (!variant) {
      throw new NotFoundError('Product variant not found');
    }

    return variant;
  }

  async getVariantsByProductId(productId: string, status?: 'ACTIVE' | 'INACTIVE'): Promise<ProductVariant[]> {
    // Validate product exists
    const product = await productsRepository.findById(productId);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    return variantsRepository.findByProductId(productId, status);
  }

  async updateVariant(id: string, data: UpdateVariantDto, userId?: string): Promise<ProductVariant> {
    // Check if variant exists
    const existingVariant = await variantsRepository.findById(id);
    if (!existingVariant) {
      throw new NotFoundError('Product variant not found');
    }

    // Validate attributes if provided (at least one attribute required)
    if (data.attributes && Object.keys(data.attributes).length === 0) {
      throw new BadRequestError('At least one variant attribute is required');
    }

    // Validate prices if provided
    if (data.costPrice !== undefined && data.costPrice <= 0) {
      throw new BadRequestError('Cost price must be greater than 0');
    }
    if (data.sellingPrice !== undefined && data.sellingPrice <= 0) {
      throw new BadRequestError('Selling price must be greater than 0');
    }

    const variant = await variantsRepository.update(id, { ...data, updatedBy: userId });
    logger.info('Product variant updated', {
      variantId: id,
      userId,
      changedFields: Object.keys(data),
    });

    return variant;
  }

  async deleteVariant(id: string, userId?: string): Promise<void> {
    // Check if variant exists
    const existingVariant = await variantsRepository.findById(id);
    if (!existingVariant) {
      throw new NotFoundError('Product variant not found');
    }

    // Check if variant has active inventory
    const hasInventory = await variantsRepository.hasActiveInventory(id);
    if (hasInventory) {
      throw new BadRequestError('Cannot delete variant with active inventory. Please adjust inventory to zero first.');
    }

    // Check if variant is referenced in active purchase orders
    const hasActivePOs = await variantsRepository.hasActivePurchaseOrders(id);
    if (hasActivePOs) {
      throw new BadRequestError('Cannot delete variant referenced in pending or in-transit purchase orders');
    }

    // Soft delete the variant
    await variantsRepository.softDelete(id, userId);
    logger.info('Product variant deleted (soft delete)', {
      variantId: id,
      userId,
    });
  }
}

export const variantsService = new VariantsService();
