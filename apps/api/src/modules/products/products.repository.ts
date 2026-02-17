import { Product, ProductStatus } from '@prisma/client';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { prisma, getTenantId } from '../../lib/prisma.js';

// Helper function to transform product for API response
const transformProduct = (product: any) => ({
  ...product,
  costPrice: product.costPrice.toNumber(),
  sellingPrice: product.sellingPrice.toNumber(),
  category: product.category ? { id: product.category.id, name: product.category.name } : null,
  brand: product.brand ? { id: product.brand.id, name: product.brand.name } : null,
  uom: product.uom ? {
    id: product.uom.id,
    name: product.uom.name,
    abbreviation: product.uom.abbreviation
  } : null,
  variants: product.variants ? product.variants.map((v: any) => ({
    ...v,
    costPrice: v.costPrice.toNumber(),
    sellingPrice: v.sellingPrice.toNumber(),
  })) : undefined,
});

export class ProductsRepository {
  async create(data: CreateProductDto & { sku: string }): Promise<Product> {
    const product = await prisma.product.create({
      data: {
        tenantId: getTenantId(),
        sku: data.sku.toUpperCase(),
        name: data.name,
        brandId: data.brandId || null,
        categoryId: data.categoryId || null,
        costPrice: data.costPrice,
        sellingPrice: data.sellingPrice,
        reorderLevel: data.reorderLevel || 10,
        binLocation: data.binLocation || null,
        status: (data.status as ProductStatus) || 'ACTIVE',
      },
      include: {
        category: true,
        brand: true,
      },
    });
    return transformProduct(product);
  }

  async findAll(filters: {
    search?: string;
    category?: string;
    status?: ProductStatus;
    page: number;
    limit: number;
  }): Promise<{ data: Product[]; total: number }> {
    const { search, category, status, page, limit } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      const searchLower = search.toLowerCase();
      where.OR = [
        { sku: { contains: searchLower } },
        { name: { contains: searchLower } },
      ];
    }

    if (category) {
      where.category = { name: { contains: category.toLowerCase() } };
    }

    if (status) {
      where.status = status;
    }

    const [data, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          brand: true,
          uom: true,
        },
      }),
      prisma.product.count({ where }),
    ]);

    return { data: data.map(transformProduct), total };
  }

  async findById(id: string): Promise<Product | null> {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        brand: true,
        uom: true,
        variants: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    return product ? transformProduct(product) : null;
  }

  async findBySku(sku: string): Promise<Product | null> {
    const product = await prisma.product.findFirst({
      where: { sku: sku.toUpperCase() },
      include: {
        category: true,
        brand: true,
      },
    });
    return product ? transformProduct(product) : null;
  }

  async update(id: string, data: UpdateProductDto): Promise<Product> {
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(data.brandId !== undefined && { brandId: data.brandId || null }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId || null }),
        ...(data.uomId !== undefined && { uomId: data.uomId || null }),
        ...(data.costPrice !== undefined && { costPrice: data.costPrice }),
        ...(data.sellingPrice !== undefined && { sellingPrice: data.sellingPrice }),
        ...(data.reorderLevel !== undefined && { reorderLevel: data.reorderLevel }),
        ...(data.binLocation !== undefined && { binLocation: data.binLocation || null }),
        ...(data.status !== undefined && { status: data.status as ProductStatus }),
      },
      include: {
        category: true,
        brand: true,
        uom: true,
      },
    });
    return transformProduct(product);
  }

  async softDelete(id: string): Promise<Product> {
    return prisma.product.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });
  }
}

export const productsRepository = new ProductsRepository();
