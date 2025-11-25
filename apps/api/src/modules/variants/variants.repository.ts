import { PrismaClient, ProductVariant, VariantStatus, Prisma } from '@prisma/client';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { VariantFilterDto } from './dto/variant-filter.dto';

const prisma = new PrismaClient();

// Type for variant with product relation
type VariantWithProduct = ProductVariant & {
  product: {
    id: string;
    sku: string;
    name: string;
  } | null;
};

// Helper function to transform variant for API response
const transformVariant = (variant: VariantWithProduct): ProductVariant => ({
  ...variant,
  costPrice: variant.costPrice.toNumber() as unknown as typeof variant.costPrice,
  sellingPrice: variant.sellingPrice.toNumber() as unknown as typeof variant.sellingPrice,
  product: variant.product ? {
    id: variant.product.id,
    sku: variant.product.sku,
    name: variant.product.name,
  } : undefined,
} as ProductVariant);

export class VariantsRepository {
  async create(data: CreateVariantDto & { createdBy?: string }): Promise<ProductVariant> {
    const variant = await prisma.productVariant.create({
      data: {
        productId: data.productId,
        sku: data.sku!.toUpperCase(),
        variantName: data.variantName,
        attributes: data.attributes,
        costPrice: data.costPrice,
        sellingPrice: data.sellingPrice,
        reorderLevel: data.reorderLevel || 10,
        binLocation: data.binLocation || null,
        status: (data.status as VariantStatus) || 'ACTIVE',
        createdBy: data.createdBy || null,
      },
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
          },
        },
      },
    });
    return transformVariant(variant);
  }

  async findAll(filters: VariantFilterDto): Promise<{ data: ProductVariant[]; total: number }> {
    const { productId, status, search, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductVariantWhereInput = {};

    if (productId) {
      where.productId = productId;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { sku: { contains: search } },
        { variantName: { contains: search } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.productVariant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: {
              id: true,
              sku: true,
              name: true,
            },
          },
        },
      }),
      prisma.productVariant.count({ where }),
    ]);

    return { data: data.map(transformVariant), total };
  }

  async findById(id: string): Promise<ProductVariant | null> {
    const variant = await prisma.productVariant.findUnique({
      where: { id },
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
          },
        },
      },
    });
    return variant ? transformVariant(variant) : null;
  }

  async findBySku(sku: string): Promise<ProductVariant | null> {
    const variant = await prisma.productVariant.findUnique({
      where: { sku: sku.toUpperCase() },
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
          },
        },
      },
    });
    return variant ? transformVariant(variant) : null;
  }

  async findByProductId(productId: string, status?: VariantStatus): Promise<ProductVariant[]> {
    const where: Prisma.ProductVariantWhereInput = { productId };
    if (status) {
      where.status = status;
    }

    const variants = await prisma.productVariant.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
          },
        },
      },
    });

    return variants.map(transformVariant);
  }

  async update(id: string, data: UpdateVariantDto & { updatedBy?: string }): Promise<ProductVariant> {
    const variant = await prisma.productVariant.update({
      where: { id },
      data: {
        ...(data.variantName !== undefined && { variantName: data.variantName }),
        ...(data.attributes !== undefined && { attributes: data.attributes }),
        ...(data.costPrice !== undefined && { costPrice: data.costPrice }),
        ...(data.sellingPrice !== undefined && { sellingPrice: data.sellingPrice }),
        ...(data.reorderLevel !== undefined && { reorderLevel: data.reorderLevel }),
        ...(data.binLocation !== undefined && { binLocation: data.binLocation || null }),
        ...(data.status !== undefined && { status: data.status as VariantStatus }),
        updatedBy: data.updatedBy || null,
      },
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
          },
        },
      },
    });
    return transformVariant(variant);
  }

  async softDelete(id: string, deletedBy?: string): Promise<ProductVariant> {
    return prisma.productVariant.update({
      where: { id },
      data: {
        status: 'INACTIVE',
        updatedBy: deletedBy || null,
      },
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async hasActiveInventory(_variantId: string): Promise<boolean> {
    // TODO: Implement when Inventory table is created in Story 2.6
    // Parameter prefixed with _ and eslint disabled for intentionally unused parameter
    // This will be used when Inventory table is added in Story 2.6:
    // const inventoryCount = await prisma.inventory.count({
    //   where: {
    //     productVariantId: _variantId,
    //     quantity: { gt: 0 },
    //   },
    // });
    // return inventoryCount > 0;
    return false; // Placeholder until inventory tracking is implemented
  }

  async hasActivePurchaseOrders(variantId: string): Promise<boolean> {
    const poItemCount = await prisma.pOItem.count({
      where: {
        productVariantId: variantId,
        purchaseOrder: {
          status: {
            in: ['PENDING', 'IN_TRANSIT'],
          },
        },
      },
    });
    return poItemCount > 0;
  }
}

export const variantsRepository = new VariantsRepository();
