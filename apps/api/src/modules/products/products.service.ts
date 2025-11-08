import logger from '../../lib/logger.js';
import { BadRequestError, ConflictError, NotFoundError } from '../../utils/errors';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { productsRepository } from './products.repository';
import { Product, ProductStatus } from '@prisma/client';

export class ProductsService {
  async createProduct(data: CreateProductDto): Promise<Product> {
    // Check if product with this SKU already exists
    const existingProduct = await productsRepository.findBySku(data.sku);
    if (existingProduct) {
      throw new ConflictError('Product with this SKU already exists');
    }

    // Validate prices
    if (data.costPrice <= 0) {
      throw new BadRequestError('Cost price must be greater than 0');
    }
    if (data.sellingPrice <= 0) {
      throw new BadRequestError('Selling price must be greater than 0');
    }

    const product = await productsRepository.create(data);
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
