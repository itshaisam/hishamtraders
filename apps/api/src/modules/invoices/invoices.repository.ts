import { PrismaClient, Invoice, Prisma } from '@prisma/client';
import { InvoiceFilterDto } from './dto/invoice-filter.dto.js';

export class InvoicesRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Find all invoices with filters and pagination
   */
  async findAll(filters: InvoiceFilterDto) {
    const { clientId, status, startDate, endDate, search, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.InvoiceWhereInput = {};

    if (clientId) {
      where.clientId = clientId;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.invoiceDate = {};
      if (startDate) {
        where.invoiceDate.gte = startDate;
      }
      if (endDate) {
        where.invoiceDate.lte = endDate;
      }
    }

    if (search) {
      where.invoiceNumber = {
        contains: search,
      };
    }

    // Fetch invoices and total count
    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              city: true,
            },
          },
          warehouse: {
            select: {
              id: true,
              name: true,
            },
          },
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
        orderBy: { invoiceDate: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      data: invoices,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find invoice by ID with all relations
   */
  async findById(id: string): Promise<Invoice | null> {
    return this.prisma.invoice.findUnique({
      where: { id },
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
        creditNotes: {
          include: {
            items: {
              select: {
                invoiceItemId: true,
                quantityReturned: true,
                total: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    }) as any;
  }

  /**
   * Find invoice by invoice number
   */
  async findByInvoiceNumber(invoiceNumber: string): Promise<Invoice | null> {
    return this.prisma.invoice.findUnique({
      where: { invoiceNumber },
      include: {
        client: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    }) as any;
  }

  /**
   * Create invoice with items in a transaction
   * This is called within a transaction managed by the service layer
   */
  async create(
    invoiceData: Prisma.InvoiceCreateInput,
    tx: Prisma.TransactionClient
  ): Promise<Invoice> {
    return tx.invoice.create({
      data: invoiceData,
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
    }) as any;
  }
}
