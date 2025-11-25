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

/**
 * Generate a unique SKU for a product variant
 * Format: BASE_SKU-ATTR1-ATTR2
 * Example: PROD-2025-001-CHR-8IN (Chrome, 8 inches)
 *
 * @param baseProductSKU The parent product's SKU
 * @param attributes Variant attributes object {finish: "Chrome", size: "8 inches"}
 * @returns Generated variant SKU string
 */
export function generateVariantSKU(
  baseProductSKU: string,
  attributes: Record<string, string>
): string {
  try {
    // Extract attribute codes (first 3 chars of each value, uppercase)
    const attrCodes = Object.values(attributes)
      .map((value) => {
        // Clean the value: remove special chars, take first word if multi-word
        const cleaned = value.replace(/[^a-zA-Z0-9\s]/g, '').split(' ')[0];
        return cleaned.substring(0, 3).toUpperCase();
      })
      .filter((code) => code.length > 0) // Remove empty codes
      .join('-');

    if (!attrCodes) {
      throw new Error('Cannot generate variant SKU: no valid attributes provided');
    }

    return `${baseProductSKU}-${attrCodes}`;
  } catch (error) {
    console.error('Error generating variant SKU:', error);
    throw new Error('Failed to generate variant SKU');
  }
}

/**
 * Validate if a variant SKU is unique across both products and variants
 * @param sku Variant SKU to validate
 * @param excludeVariantId Optional variant ID to exclude from validation (for updates)
 * @returns true if SKU is unique, false otherwise
 */
export async function isVariantSkuUnique(
  sku: string,
  excludeVariantId?: string
): Promise<boolean> {
  try {
    const skuUpper = sku.toUpperCase();

    // Check if SKU exists in products table
    const existingProduct = await prisma.product.findUnique({
      where: { sku: skuUpper },
      select: { id: true },
    });

    if (existingProduct) {
      return false;
    }

    // Check if SKU exists in variants table
    const existingVariant = await prisma.productVariant.findFirst({
      where: {
        sku: skuUpper,
        ...(excludeVariantId && { id: { not: excludeVariantId } }),
      },
      select: { id: true },
    });

    return !existingVariant;
  } catch (error) {
    console.error('Error validating variant SKU uniqueness:', error);
    throw new Error('Failed to validate variant SKU');
  }
}
