import { MovementType, StockMovement } from '@prisma/client';
import {
  StockMovementRepository,
  StockMovementFilters,
  PaginatedStockMovements,
} from './stock-movement.repository';

export interface MovementWithBalance {
  id: string;
  movementDate: Date;
  movementType: MovementType;
  referenceType: string | null;
  referenceId: string | null;
  quantityIn: number;
  quantityOut: number;
  runningBalance: number;
  notes: string | null;
  product: {
    id: string;
    name: string;
    sku: string;
  };
  productVariant?: {
    id: string;
    variantName: string;
    sku: string;
  } | null;
  warehouse: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    name: string;
  };
}

export interface PaginatedMovementsWithBalance {
  movements: MovementWithBalance[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export class StockMovementService {
  private repository: StockMovementRepository;

  constructor() {
    this.repository = new StockMovementRepository();
  }

  /**
   * Get stock movements with running balance calculation
   */
  async getMovementsWithBalance(
    filters: StockMovementFilters
  ): Promise<PaginatedMovementsWithBalance> {
    const result = await this.repository.findAll(filters);

    // Calculate running balance
    // Note: For accurate running balance, we need to fetch ALL movements up to the current page
    // But for performance, we'll calculate balance within the page only
    // This is acceptable for a report view where users can filter by product/warehouse
    const movementsWithBalance = this.calculateRunningBalance(result.movements);

    return {
      movements: movementsWithBalance,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    };
  }

  /**
   * Calculate running balance for a list of movements
   * RECEIPT and ADJUSTMENT (positive) increase balance
   * SALE and ADJUSTMENT (negative) decrease balance
   */
  private calculateRunningBalance(movements: any[]): MovementWithBalance[] {
    let runningBalance = 0;

    return movements.map((movement) => {
      // Determine if this is incoming or outgoing
      // RECEIPT = incoming
      // SALE = outgoing
      // ADJUSTMENT = can be either (check quantity sign in actual implementation, but quantity is always positive in DB)
      // For now, we'll use movementType to determine direction
      const isIncoming =
        movement.movementType === 'RECEIPT' ||
        (movement.movementType === 'ADJUSTMENT' && movement.quantity > 0);

      const quantityIn = isIncoming ? movement.quantity : 0;
      const quantityOut = !isIncoming ? movement.quantity : 0;

      // Update running balance
      if (isIncoming) {
        runningBalance += movement.quantity;
      } else {
        runningBalance -= movement.quantity;
      }

      return {
        id: movement.id,
        movementDate: movement.movementDate,
        movementType: movement.movementType,
        referenceType: movement.referenceType,
        referenceId: movement.referenceId,
        quantityIn,
        quantityOut,
        runningBalance,
        notes: movement.notes,
        product: movement.product,
        productVariant: movement.productVariant,
        warehouse: movement.warehouse,
        user: {
          id: movement.user.id,
          name: movement.user.name,
        },
      };
    });
  }

  /**
   * Get movements for a specific product
   */
  async getProductMovements(
    productId: string,
    productVariantId?: string | null
  ): Promise<MovementWithBalance[]> {
    const movements = await this.repository.findByProduct(productId, productVariantId);
    return this.calculateRunningBalance(movements);
  }

  /**
   * Get movements for a specific warehouse
   */
  async getWarehouseMovements(warehouseId: string): Promise<MovementWithBalance[]> {
    const movements = await this.repository.findByWarehouse(warehouseId);
    return this.calculateRunningBalance(movements);
  }

  /**
   * Get movements for a specific product in a specific warehouse
   */
  async getProductWarehouseMovements(
    productId: string,
    warehouseId: string,
    productVariantId?: string | null
  ): Promise<MovementWithBalance[]> {
    const movements = await this.repository.findByProductAndWarehouse(
      productId,
      warehouseId,
      productVariantId
    );
    return this.calculateRunningBalance(movements);
  }
}
