import logger from '../../lib/logger.js';
import { changeHistoryService } from '../../services/change-history.service.js';
import { BadRequestError, ConflictError, NotFoundError } from '../../utils/errors.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { productsRepository } from './products.repository.js';
import { generateSKU, isSkuUnique } from './utils/generate-sku.js';
import { Product, ProductStatus } from '@prisma/client';

export class ProductsService {
  async createProduct(data: CreateProductDto): Promise<Product> {
    // Auto-generate SKU if not provided
    let sku = data.sku;
    if (!sku) {
      sku = await generateSKU(data.categoryId);
      logger.info('Auto-generated SKU for product', { sku });
    } else {
      // Validate SKU uniqueness if provided
      const skuUnique = await isSkuUnique(sku);
      if (!skuUnique) {
        throw new ConflictError('Product with this SKU already exists');
      }
    }

    // Check if product with this SKU already exists (double-check)
    const existingProduct = await productsRepository.findBySku(sku);
    if (existingProduct) {
      throw new ConflictError('Product with this SKU already exists');
    }

    // Merge the auto-generated or validated SKU with data
    const productData = { ...data, sku };

    // Validate prices
    if (productData.costPrice <= 0) {
      throw new BadRequestError('Cost price must be greater than 0');
    }
    if (productData.sellingPrice <= 0) {
      throw new BadRequestError('Selling price must be greater than 0');
    }

    const product = await productsRepository.create(productData);
    logger.info('Product created', {
      productId: product.id,
      sku: product.sku,
      productName: product.name,
    });

    return product;
  }

  async getProductsWithPagination(filters: {
    search?: string;
    category?: string;
    status?: ProductStatus;
    page: number;
    limit: number;
  }): Promise<{ data: Product[]; total: number; page: number; limit: number; pages: number }> {
    const result = await productsRepository.findAll(filters);
    const pages = Math.ceil(result.total / filters.limit);

    return {
      data: result.data,
      total: result.total,
      page: filters.page,
      limit: filters.limit,
      pages,
    };
  }

  async getProductById(id: string): Promise<Product> {
    const product = await productsRepository.findById(id);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    return product;
  }

  async updateProduct(id: string, data: UpdateProductDto): Promise<Product> {
    // Check if product exists
    const product = await productsRepository.findById(id);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // Validate prices if provided
    if (data.costPrice !== undefined && data.costPrice <= 0) {
      throw new BadRequestError('Cost price must be greater than 0');
    }
    if (data.sellingPrice !== undefined && data.sellingPrice <= 0) {
      throw new BadRequestError('Selling price must be greater than 0');
    }

    // Capture snapshot before update
    await changeHistoryService.captureSnapshot('PRODUCT', id, product as any);

    const updatedProduct = await productsRepository.update(id, data);
    logger.info('Product updated', {
      productId: id,
      sku: product.sku,
      changes: Object.keys(data),
    });

    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<void> {
    // Check if product exists
    const product = await productsRepository.findById(id);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    await productsRepository.softDelete(id);
    logger.info('Product deleted', {
      productId: id,
      sku: product.sku,
      productName: product.name,
    });
  }
}

export const productsService = new ProductsService();
