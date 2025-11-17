import { prisma } from '../../lib/prisma';
import { PaymentTerm } from '@prisma/client';

export class PaymentTermsRepository {
  async findAll(): Promise<PaymentTerm[]> {
    return prisma.paymentTerm.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string): Promise<PaymentTerm | null> {
    return prisma.paymentTerm.findUnique({
      where: { id },
    });
  }

  async findByName(name: string): Promise<PaymentTerm | null> {
    return prisma.paymentTerm.findUnique({
      where: { name },
    });
  }
}

export const paymentTermsRepository = new PaymentTermsRepository();
