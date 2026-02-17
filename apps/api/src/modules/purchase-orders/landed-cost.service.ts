import { NotFoundError } from '../../utils/errors.js';

export interface LandedCostBreakdown {
  productId: string;
  productName: string;
  productSku: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  productCost: number; // Total product cost (quantity * unitCost)
  productRatio: number; // Percentage of total product cost
  allocatedAdditionalCost: number; // Additional costs allocated to this product
  totalLandedCost: number; // productCost + allocatedAdditionalCost
  landedCostPerUnit: number; // totalLandedCost / quantity
}

export interface LandedCostResult {
  totalProductCost: number;
  totalAdditionalCosts: number;
  grandTotal: number;
  breakdown: LandedCostBreakdown[];
  costs: {
    id: string;
    type: string;
    amount: number;
    description?: string;
  }[];
}

export class LandedCostService {
  constructor(private prisma: any) {}

  /**
   * Calculate landed cost for a purchase order
   * Allocates additional costs (shipping, customs, tax) proportionally across all products
   * based on their cost ratio
   */
  async calculateLandedCost(poId: string): Promise<LandedCostResult> {
    // Fetch PO with items, costs, and product details
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: {
        items: {
          include: {
            product: true,
            productVariant: true,
          },
        },
        costs: true,
      },
    });

    if (!po) {
      throw new NotFoundError(`Purchase order with ID ${poId} not found`);
    }

    // Calculate total product cost
    const totalProductCost = po.items.reduce((sum: number, item: any) => {
      const itemCost = Number(item.totalCost);
      return sum + itemCost;
    }, 0);

    // Calculate total additional costs
    const totalAdditionalCosts = po.costs.reduce((sum: number, cost: any) => {
      return sum + Number(cost.amount);
    }, 0);

    // Calculate grand total
    const grandTotal = totalProductCost + totalAdditionalCosts;

    // Calculate breakdown for each product
    const breakdown: LandedCostBreakdown[] = po.items.map((item: any) => {
      const productCost = Number(item.totalCost);

      // Calculate product ratio (percentage of total product cost)
      const productRatio = totalProductCost > 0 ? productCost / totalProductCost : 0;

      // Allocate additional costs proportionally
      const allocatedAdditionalCost = totalAdditionalCosts * productRatio;

      // Calculate total landed cost for this product
      const totalLandedCost = productCost + allocatedAdditionalCost;

      // Calculate landed cost per unit
      const landedCostPerUnit = item.quantity > 0 ? totalLandedCost / item.quantity : 0;

      return {
        productId: item.productId,
        productName: item.product.name,
        productSku: item.product.sku,
        variantId: item.productVariantId || undefined,
        variantName: item.productVariant?.variantName || undefined,
        quantity: item.quantity,
        productCost,
        productRatio,
        allocatedAdditionalCost,
        totalLandedCost,
        landedCostPerUnit,
      };
    });

    return {
      totalProductCost,
      totalAdditionalCosts,
      grandTotal,
      breakdown,
      costs: po.costs.map((cost: any) => ({
        id: cost.id,
        type: cost.type,
        amount: Number(cost.amount),
        description: cost.description || undefined,
      })),
    };
  }
}
