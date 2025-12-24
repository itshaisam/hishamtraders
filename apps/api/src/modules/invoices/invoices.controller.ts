import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { InvoicesService } from './invoices.service.js';
import { createInvoiceSchema } from './dto/create-invoice.dto.js';
import { invoiceFilterSchema } from './dto/invoice-filter.dto.js';
import logger from '../../lib/logger.js';

const prisma = new PrismaClient();

export class InvoicesController {
  private service: InvoicesService;

  constructor() {
    this.service = new InvoicesService(prisma);
  }

  /**
   * Create a new invoice
   * POST /api/v1/invoices
   */
  createInvoice = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      const validatedData = createInvoiceSchema.parse(req.body);

      // Get user ID from auth
      const userId = (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'Unauthorized',
        });
      }

      // Create invoice
      const invoice = await this.service.createInvoice(validatedData, userId);

      if (!invoice) {
        return res.status(500).json({
          status: 'error',
          message: 'Failed to create invoice',
        });
      }

      logger.info('Invoice created via API', {
        invoiceId: invoice.id,
        invoiceNumber: (invoice as any).invoiceNumber,
        userId,
      });

      res.status(201).json({
        status: 'success',
        data: invoice,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all invoices with filters
   * GET /api/v1/invoices
   */
  getInvoices = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Parse and validate query parameters
      const filters = invoiceFilterSchema.parse({
        clientId: req.query.clientId,
        status: req.query.status,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        search: req.query.search,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      });

      const result = await this.service.getInvoices(filters);

      res.json({
        status: 'success',
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get invoice by ID
   * GET /api/v1/invoices/:id
   */
  getInvoiceById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const invoice = await this.service.getInvoiceById(id);

      res.json({
        status: 'success',
        data: invoice,
      });
    } catch (error) {
      next(error);
    }
  };
}
