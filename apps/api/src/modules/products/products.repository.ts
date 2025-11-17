import { PrismaClient, Product, ProductStatus } from '@prisma/client';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

const prisma = new PrismaClient();

export class ProductsRepository {
  async create(data: CreateProductDto): Promise<Product> {
    return prisma.product.create({
      data: {
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
      where.OR = [
        { sku: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = { name: { contains: category, mode: 'insensitive' } };
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
        },
      }),
      prisma.product.count({ where }),
    ]);

    return { data, total };
  }

  async findById(id: string): Promise<Product | null> {
    return prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        brand: true,
      },
    });
  }

  async findBySku(sku: string): Promise<Product | null> {
    return prisma.product.findUnique({
      where: { sku: sku.toUpperCase() },
      include: {
        category: true,
        brand: true,
      },
    });
  }

  async update(id: string, data: UpdateProductDto): Promise<Product> {
    return prisma.product.update({
      where: { id },
      data: {
        ...(data.brandId !== undefined && { brandId: data.brandId || null }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId || null }),
        ...(data.costPrice !== undefined && { costPrice: data.costPrice }),
        ...(data.sellingPrice !== undefined && { sellingPrice: data.sellingPrice }),
        ...(data.reorderLevel !== undefined && { reorderLevel: data.reorderLevel }),
        ...(data.binLocation !== undefined && { binLocation: data.binLocation || null }),
        ...(data.status !== undefined && { status: data.status as ProductStatus }),
      },
      include: {
        category: true,
        brand: true,
      },
    });
  }

  async softDelete(id: string): Promise<Product> {
    return prisma.product.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });
  }
}

export const productsRepository = new ProductsRepository();
