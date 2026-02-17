import { Prisma } from '@prisma/client';

export interface CreditNoteFilters {
  clientId?: string;
  invoiceId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export class CreditNotesRepository {
  constructor(private prisma: any) {}

  async findById(id: string) {
    return this.prisma.creditNote.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, sku: true, name: true },
            },
            productVariant: {
              select: { id: true, sku: true, variantName: true },
            },
            invoiceItem: true,
          },
        },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            invoiceDate: true,
            total: true,
            status: true,
            warehouse: { select: { id: true, name: true } },
          },
        },
        client: {
          select: { id: true, name: true, city: true },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async findAll(filters: CreditNoteFilters) {
    const { clientId, invoiceId, status, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.CreditNoteWhereInput = {};

    if (clientId) where.clientId = clientId;
    if (invoiceId) where.invoiceId = invoiceId;
    if (status) where.status = status as any;

    const [creditNotes, total] = await Promise.all([
      this.prisma.creditNote.findMany({
        where,
        include: {
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
            },
          },
          client: {
            select: { id: true, name: true },
          },
          creator: {
            select: { id: true, name: true },
          },
          items: {
            include: {
              product: {
                select: { id: true, sku: true, name: true },
              },
              productVariant: {
                select: { id: true, sku: true, variantName: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.creditNote.count({ where }),
    ]);

    return {
      data: creditNotes,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
