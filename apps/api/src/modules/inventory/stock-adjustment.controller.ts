import { Request, Response } from 'express';
import { StockAdjustmentService } from './stock-adjustment.service';
import {
  createAdjustmentSchema,
  rejectAdjustmentSchema,
  adjustmentFiltersSchema,
} from './dto/stock-adjustment.dto';

export class StockAdjustmentController {
  private adjustmentService: StockAdjustmentService;

  constructor() {
    this.adjustmentService = new StockAdjustmentService();
  }

  /**
   * POST /api/inventory/adjustments
   * Create a new stock adjustment (PENDING status)
   * Access: WAREHOUSE_MANAGER, ADMIN
   */
  createAdjustment = async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validatedData = createAdjustmentSchema.parse(req.body);

      // Get user ID from authenticated request
      const userId = (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized: User ID not found',
        });
      }

      const adjustment = await this.adjustmentService.createAdjustment(validatedData, userId);

      res.status(201).json({
        success: true,
        data: adjustment,
        message: 'Stock adjustment created successfully and pending approval',
      });
    } catch (error: any) {
      console.error('Error creating stock adjustment:', error);

      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors,
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create stock adjustment',
      });
    }
  };

  /**
   * GET /api/inventory/adjustments
   * Get all stock adjustments with filters
   * Access: WAREHOUSE_MANAGER (own adjustments), ADMIN (all)
   */
  getAllAdjustments = async (req: Request, res: Response) => {
    try {
      // Validate query parameters
      const validatedFilters = adjustmentFiltersSchema.parse(req.query);

      // Convert date strings to Date objects
      const filters: any = {
        ...validatedFilters,
      };

      if (validatedFilters.startDate) {
        filters.startDate = new Date(validatedFilters.startDate);
      }
      if (validatedFilters.endDate) {
        filters.endDate = new Date(validatedFilters.endDate);
      }

      // If user is WAREHOUSE_MANAGER, filter by their own adjustments
      const userRole = (req as any).user?.roleName;
      const userId = (req as any).user?.userId;

      if (userRole === 'WAREHOUSE_MANAGER') {
        filters.createdBy = userId;
      }

      const result = await this.adjustmentService.getAll(filters);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      console.error('Error fetching adjustments:', error);

      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors: error.errors,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to fetch adjustments',
        error: error.message,
      });
    }
  };

  /**
   * GET /api/inventory/adjustments/pending
   * Get pending adjustments for admin approval
   * Access: ADMIN only
   */
  getPendingAdjustments = async (req: Request, res: Response) => {
    try {
      const warehouseId = req.query.warehouseId as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

      const result = await this.adjustmentService.getPendingAdjustments({
        warehouseId,
        page,
        limit,
      });

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      console.error('Error fetching pending adjustments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch pending adjustments',
        error: error.message,
      });
    }
  };

  /**
   * GET /api/inventory/adjustments/:id
   * Get single adjustment by ID
   * Access: WAREHOUSE_MANAGER (own), ADMIN (all)
   */
  getAdjustmentById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Adjustment ID is required',
        });
      }

      const adjustment = await this.adjustmentService.getById(id);

      // Authorization check: WAREHOUSE_MANAGER can only view their own
      const userRole = (req as any).user?.roleName;
      const userId = (req as any).user?.userId;

      if (userRole === 'WAREHOUSE_MANAGER' && adjustment.createdBy !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You can only view your own adjustments',
        });
      }

      res.status(200).json({
        success: true,
        data: adjustment,
      });
    } catch (error: any) {
      console.error('Error fetching adjustment:', error);
      res.status(404).json({
        success: false,
        message: error.message || 'Adjustment not found',
      });
    }
  };

  /**
   * PATCH /api/inventory/adjustments/:id/approve
   * Approve a pending adjustment
   * Access: ADMIN only
   */
  approveAdjustment = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Adjustment ID is required',
        });
      }

      const userId = (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized: User ID not found',
        });
      }

      const adjustment = await this.adjustmentService.approveAdjustment(id, userId);

      res.status(200).json({
        success: true,
        data: adjustment,
        message: 'Adjustment approved successfully. Inventory updated.',
      });
    } catch (error: any) {
      console.error('Error approving adjustment:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to approve adjustment',
      });
    }
  };

  /**
   * PATCH /api/inventory/adjustments/:id/reject
   * Reject a pending adjustment with reason
   * Access: ADMIN only
   */
  rejectAdjustment = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Adjustment ID is required',
        });
      }

      // Validate request body
      const validatedData = rejectAdjustmentSchema.parse(req.body);

      const userId = (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized: User ID not found',
        });
      }

      const adjustment = await this.adjustmentService.rejectAdjustment(
        id,
        userId,
        validatedData.rejectionReason
      );

      res.status(200).json({
        success: true,
        data: adjustment,
        message: 'Adjustment rejected successfully',
      });
    } catch (error: any) {
      console.error('Error rejecting adjustment:', error);

      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors,
        });
      }

      res.status(400).json({
        success: false,
        message: error.message || 'Failed to reject adjustment',
      });
    }
  };
}
