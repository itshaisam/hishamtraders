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
        brand: data.brand || null,
        category: data.category || null,
        costPrice: data.costPrice,
        sellingPrice: data.sellingPrice,
        reorderLevel: data.reorderLevel || 10,
        binLocation: data.binLocation || null,
        status: (data.status as ProductStatus) || 'ACTIVE',
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
      where.category = { contains: category, mode: 'insensitive' };
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
      }),
      prisma.product.count({ where }),
    ]);

    return { data, total };
  }

  async findById(id: string): Promise<Product | null> {
    return prisma.product.findUnique({
      where: { id },
    });
  }

  async findBySku(sku: string): Promise<Product | null> {
    return prisma.product.findUnique({
      where: { sku: sku.toUpperCase() },
    });
  }

  async update(id: string, data: UpdateProductDto): Promise<Product> {
    return prisma.product.update({
      where: { id },
      data: {
        ...(data.brand !== undefined && { brand: data.brand || null }),
        ...(data.category !== undefined && { category: data.category || null }),
        ...(data.costPrice !== undefined && { costPrice: data.costPrice }),
        ...(data.sellingPrice !== undefined && { sellingPrice: data.sellingPrice }),
        ...(data.reorderLevel !== undefined && { reorderLevel: data.reorderLevel }),
        ...(data.binLocation !== undefined && { binLocation: data.binLocation || null }),
        ...(data.status !== undefined && { status: data.status as ProductStatus }),
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
