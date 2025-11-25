import { prisma } from '../../../lib/prisma.js';

/**
 * Generate a unique SKU for a product
 * Format: PROD-YYYY-XXX
 * Example: PROD-2025-001, PROD-2025-002, etc.
 *
 * @param categoryId Optional category ID to include in SKU generation
 * @returns Generated SKU string
 */
export async function generateSKU(categoryId?: string): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `PROD-${currentYear}-`;

  try {
    // Find the highest numbered SKU for the current year
    const latestProduct = await prisma.product.findFirst({
      where: {
        sku: {
          startsWith: prefix,
        },
      },
      orderBy: {
        sku: 'desc',
      },
      select: {
        sku: true,
      },
    });

    if (!latestProduct) {
      // No products for this year yet, start with 001
      return `${prefix}001`;
    }

    // Extract the numeric part and increment it
    const lastNumber = parseInt(latestProduct.sku.split('-')[2], 10);
    const nextNumber = (lastNumber + 1).toString().padStart(3, '0');

    return `${prefix}${nextNumber}`;
  } catch (error) {
    console.error('Error generating SKU:', error);
    throw new Error('Failed to generate SKU');
  }
}

/**
 * Validate if a SKU is unique in the database
 * @param sku SKU to validate
 * @param excludeProductId Optional product ID to exclude from validation (for updates)
 * @returns true if SKU is unique, false otherwise
 */
export async function isSkuUnique(sku: string, excludeProductId?: string): Promise<boolean> {
  try {
    const existingProduct = await prisma.product.findFirst({
      where: {
        sku: sku.toUpperCase(),
        ...(excludeProductId && { id: { not: excludeProductId } }),
      },
      select: {
        id: true,
      },
    });

    return !existingProduct;
  } catch (error) {
    console.error('Error validating SKU uniqueness:', error);
    throw new Error('Failed to validate SKU');
  }
}
