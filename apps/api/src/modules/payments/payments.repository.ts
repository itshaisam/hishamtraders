import { PrismaClient, PaymentType, PaymentMethod, PaymentReferenceType, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

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
}
