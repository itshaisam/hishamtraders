import { PaymentType, PaymentMethod, PaymentReferenceType, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

export interface PaymentFilters {
  supplierId?: string;
  paymentType?: PaymentType;
  paymentReferenceType?: PaymentReferenceType;
  method?: PaymentMethod;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}

export interface UnifiedPaymentFilters {
  paymentType?: PaymentType | 'ALL';
  method?: PaymentMethod;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedPayments {
  payments: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface POBalance {
  total: number;
  paid: number;
  outstanding: number;
}

export class PaymentsRepository {
  /**
   * Create a new payment
   */
  async create(data: Prisma.PaymentCreateInput) {
    return prisma.payment.create({
      data,
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Get all payments with filters and pagination
   */
  async findAll(filters: PaymentFilters): Promise<PaginatedPayments> {
    const {
      supplierId,
      paymentType,
      paymentReferenceType,
      method,
      dateFrom,
      dateTo,
      page = 1,
      limit = 50,
    } = filters;

    const where: any = {};

    if (supplierId) {
      where.supplierId = supplierId;
    }

    if (paymentType) {
      where.paymentType = paymentType;
    }

    if (paymentReferenceType) {
      where.paymentReferenceType = paymentReferenceType;
    }

    if (method) {
      where.method = method;
    }

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) {
        where.date.gte = dateFrom;
      }
      if (dateTo) {
        where.date.lte = dateTo;
      }
    }

    const total = await prisma.payment.count({ where });

    const payments = await prisma.payment.findMany({
      where,
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      payments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get payments for a specific supplier
   */
  async findBySupplier(supplierId: string) {
    return prisma.payment.findMany({
      where: {
        supplierId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  /**
   * Get PO balance (total, paid, outstanding)
   */
  async getPOBalance(poId: string): Promise<POBalance> {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: poId },
      select: {
        totalAmount: true,
      },
    });

    if (!po) {
      throw new Error('Purchase order not found');
    }

    const payments = await prisma.payment.findMany({
      where: {
        paymentType: PaymentType.SUPPLIER,
        paymentReferenceType: PaymentReferenceType.PO,
        referenceId: poId,
      },
      select: {
        amount: true,
      },
    });

    const totalPaid = payments.reduce(
      (sum, payment) => sum + parseFloat(payment.amount.toString()),
      0
    );

    const totalAmount = parseFloat(po.totalAmount.toString());
    const outstanding = totalAmount - totalPaid;

    return {
      total: totalAmount,
      paid: totalPaid,
      outstanding: outstanding > 0 ? outstanding : 0,
    };
  }

  /**
   * Get payment by ID
   */
  async findById(id: string) {
    return prisma.payment.findUnique({
      where: { id },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Get all payments (unified: both client and supplier) with filters and pagination
   * Story 3.8: Payment History
   */
  async findAllUnified(filters: UnifiedPaymentFilters): Promise<PaginatedPayments> {
    const {
      paymentType = 'ALL',
      method,
      dateFrom,
      dateTo,
      search,
      page = 1,
      limit = 20,
    } = filters;

    const where: Prisma.PaymentWhereInput = {};

    if (paymentType !== 'ALL') {
      where.paymentType = paymentType as PaymentType;
    }

    if (method) {
      where.method = method;
    }

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = dateFrom;
      if (dateTo) where.date.lte = dateTo;
    }

    // Search by party name - pushed to DB, not client-side
    // MySQL is case-insensitive by default with utf8 collation, so no mode needed
    if (search) {
      where.OR = [
        { client: { name: { contains: search } } },
        { supplier: { name: { contains: search } } },
      ];
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          supplier: { select: { id: true, name: true } },
          client: { select: { id: true, name: true } },
          user: { select: { id: true, name: true } },
          allocations: {
            include: {
              invoice: { select: { id: true, invoiceNumber: true } },
            },
          },
        },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ]);

    return {
      payments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get payment by ID with full details (allocations, PO reference)
   * Story 3.8: Payment Details
   */
  async findByIdDetailed(id: string) {
    return prisma.payment.findUnique({
      where: { id },
      include: {
        supplier: { select: { id: true, name: true } },
        client: { select: { id: true, name: true, balance: true } },
        user: { select: { id: true, name: true, email: true } },
        allocations: {
          include: {
            invoice: {
              select: { id: true, invoiceNumber: true, total: true, status: true },
            },
          },
        },
      },
    });
  }
}
