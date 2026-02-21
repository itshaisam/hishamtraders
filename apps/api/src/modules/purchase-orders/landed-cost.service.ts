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

export interface LandedCostCostItem {
  id: string;
  type: string;
  amount: number;
  description?: string;
  source: 'PO' | 'GRN';
  grnNumber?: string;
}

export interface LandedCostResult {
  totalProductCost: number;
  totalAdditionalCosts: number;
  grandTotal: number;
  breakdown: LandedCostBreakdown[];
  costs: LandedCostCostItem[];
}

export class LandedCostService {
  constructor(private prisma: any) {}

  /**
   * Calculate landed cost for a purchase order
   * Aggregates costs from both legacy POCost and new GRNCost records
   */
  async calculateLandedCost(poId: string): Promise<LandedCostResult> {
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
        goodsReceiveNotes: {
          where: { status: 'COMPLETED' },
          include: { costs: true },
        },
      },
    });

    if (!po) {
      throw new NotFoundError(`Purchase order with ID ${poId} not found`);
    }

    // Calculate total product cost
    const totalProductCost = po.items.reduce((sum: number, item: any) => {
      return sum + Number(item.totalCost);
    }, 0);

    // Aggregate costs from both PO-level (legacy) and GRN-level
    const allCosts: LandedCostCostItem[] = [];

    // Legacy PO costs
    for (const cost of po.costs) {
      allCosts.push({
        id: cost.id,
        type: cost.type,
        amount: Number(cost.amount),
        description: cost.description || undefined,
        source: 'PO',
      });
    }

    // GRN costs from completed GRNs
    for (const grn of (po.goodsReceiveNotes || [])) {
      for (const cost of (grn.costs || [])) {
        allCosts.push({
          id: cost.id,
          type: cost.type,
          amount: Number(cost.amount),
          description: cost.description || undefined,
          source: 'GRN',
          grnNumber: grn.grnNumber,
        });
      }
    }

    const totalAdditionalCosts = allCosts.reduce((sum, cost) => sum + cost.amount, 0);
    const grandTotal = totalProductCost + totalAdditionalCosts;

    // Calculate breakdown for each product
    const breakdown: LandedCostBreakdown[] = po.items.map((item: any) => {
      const productCost = Number(item.totalCost);
      const productRatio = totalProductCost > 0 ? productCost / totalProductCost : 0;
      const allocatedAdditionalCost = totalAdditionalCosts * productRatio;
      const totalLandedCost = productCost + allocatedAdditionalCost;
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
      costs: allCosts,
    };
  }

  /**
   * Calculate landed cost for a single GRN
   * Uses GRN items (quantity * poItem.unitCost) as base, allocates GRNCost proportionally
   */
  async calculateGRNLandedCost(grnId: string): Promise<LandedCostResult> {
    const grn = await this.prisma.goodsReceiveNote.findUnique({
      where: { id: grnId },
      include: {
        items: {
          include: {
            product: true,
            productVariant: true,
            poItem: { select: { unitCost: true } },
          },
        },
        costs: true,
      },
    });

    if (!grn) {
      throw new NotFoundError(`Goods Receipt Note with ID ${grnId} not found`);
    }

    // Calculate total product cost from GRN items (quantity * poItem.unitCost)
    const totalProductCost = grn.items.reduce((sum: number, item: any) => {
      return sum + (item.quantity * Number(item.poItem.unitCost));
    }, 0);

    // GRN costs
    const costs: LandedCostCostItem[] = (grn.costs || []).map((cost: any) => ({
      id: cost.id,
      type: cost.type,
      amount: Number(cost.amount),
      description: cost.description || undefined,
      source: 'GRN' as const,
    }));

    const totalAdditionalCosts = costs.reduce((sum, cost) => sum + cost.amount, 0);
    const grandTotal = totalProductCost + totalAdditionalCosts;

    // Calculate breakdown for each GRN item
    const breakdown: LandedCostBreakdown[] = grn.items.map((item: any) => {
      const productCost = item.quantity * Number(item.poItem.unitCost);
      const productRatio = totalProductCost > 0 ? productCost / totalProductCost : 0;
      const allocatedAdditionalCost = totalAdditionalCosts * productRatio;
      const totalLandedCost = productCost + allocatedAdditionalCost;
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
      costs,
    };
  }
}
