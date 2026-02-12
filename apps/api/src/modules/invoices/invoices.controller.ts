import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { InvoicesService } from './invoices.service.js';
import { createInvoiceSchema } from './dto/create-invoice.dto.js';
import { invoiceFilterSchema } from './dto/invoice-filter.dto.js';
import { voidInvoiceSchema } from './dto/void-invoice.dto.js';
import { UnauthorizedError, NotFoundError, BadRequestError } from '../../utils/errors.js';
import { generateInvoicePdf } from '../../utils/pdf/invoice-pdf.util.js';
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

  /**
   * Get returnable quantities for each invoice item
   * GET /api/v1/invoices/:id/returnable
   */
  getReturnableQuantities = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const data = await this.service.getReturnableQuantities(id);
      res.json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Void an invoice
   * PATCH /api/v1/invoices/:id/void
   * Story 3.4: Invoice Voiding and Stock Reversal
   */
  voidInvoice = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.userId;

      if (!userId) {
        throw new UnauthorizedError('User not authenticated');
      }

      // Validate DTO
      const dto = voidInvoiceSchema.parse(req.body);

      const voidedInvoice = await this.service.voidInvoice(id, userId, dto);

      logger.info('Invoice voided via API', {
        invoiceId: id,
        userId,
        reason: dto.reason,
      });

      res.status(200).json({
        success: true,
        data: voidedInvoice,
        message: 'Invoice voided successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Generate a shareable token for an invoice PDF
   * POST /api/v1/invoices/:id/share-token
   */
  generateShareToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.userId;

      if (!userId) {
        throw new UnauthorizedError('User not authenticated');
      }

      // Verify invoice exists
      const invoice = await this.service.getInvoiceById(id);
      if (!invoice) {
        throw new NotFoundError('Invoice not found');
      }

      const secret = process.env.JWT_SECRET || 'hishamtraders-jwt-secret';
      const token = jwt.sign(
        { invoiceId: id, type: 'invoice-share' },
        secret,
        { expiresIn: '7d' }
      );

      const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3001';
      const url = `${baseUrl}/api/v1/invoices/public/${token}`;

      logger.info('Invoice share token generated', { invoiceId: id, userId });

      res.json({
        status: 'success',
        data: { token, url },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get public invoice PDF via share token (no authentication required)
   * GET /api/v1/invoices/public/:token
   */
  getPublicPdf = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.params;

      // Validate share token
      const secret = process.env.JWT_SECRET || 'hishamtraders-jwt-secret';
      let decoded: any;
      try {
        decoded = jwt.verify(token, secret);
      } catch (err) {
        throw new BadRequestError('Invalid or expired share link');
      }

      if (decoded.type !== 'invoice-share' || !decoded.invoiceId) {
        throw new BadRequestError('Invalid share token');
      }

      // Fetch invoice with all relations
      const invoice = await prisma.invoice.findUnique({
        where: { id: decoded.invoiceId },
        include: {
          client: true,
          warehouse: true,
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  sku: true,
                  name: true,
                },
              },
              productVariant: {
                select: {
                  id: true,
                  sku: true,
                  variantName: true,
                },
              },
            },
          },
        },
      });

      if (!invoice) {
        throw new NotFoundError('Invoice not found');
      }

      // Get company name from system settings
      const businessNameSetting = await prisma.systemSetting.findUnique({
        where: { key: 'BUSINESS_NAME' },
      });
      const companyName = businessNameSetting?.value || 'Hisham Traders';

      // Generate PDF
      const pdfBuffer = await generateInvoicePdf(invoice, companyName);

      // Send PDF response
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `inline; filename="invoice-${invoice.invoiceNumber}.pdf"`
      );
      res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  };
}
