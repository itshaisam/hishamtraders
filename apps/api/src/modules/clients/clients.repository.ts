import { Client, ClientStatus, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

export interface ClientFilters {
  search?: string;
  city?: string;
  status?: ClientStatus;
  hasBalance?: boolean; // balance > 0
  page?: number;
  limit?: number;
}

export class ClientRepository {
  private prisma: any;

  constructor() {
    this.prisma = prisma;
  }

  async create(data: Prisma.ClientCreateInput): Promise<Client> {
    return this.prisma.client.create({
      data,
    });
  }

  async findAll(filters: ClientFilters = {}): Promise<{ clients: Client[]; total: number }> {
    const {
      search,
      city,
      status,
      hasBalance,
      page = 1,
      limit = 20,
    } = filters;

    const where: Prisma.ClientWhereInput = {};

    // Search filter (name, contact person, phone, email)
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { contactPerson: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
      ];
    }

    // City filter
    if (city) {
      where.city = city;
    }

    // Status filter
    if (status) {
      where.status = status;
    }

    // Balance filter
    if (hasBalance) {
      where.balance = { gt: 0 };
    }

    const skip = (page - 1) * limit;

    const [clients, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.client.count({ where }),
    ]);

    return { clients, total };
  }

  async findById(id: string): Promise<Client | null> {
    return this.prisma.client.findUnique({
      where: { id },
    });
  }

  async findByIdWithInvoices(id: string) {
    return this.prisma.client.findUnique({
      where: { id },
      include: {
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            invoiceDate: true,
            dueDate: true,
            total: true,
            paidAmount: true,
            status: true,
            paymentType: true,
          },
          orderBy: { invoiceDate: 'desc' },
        },
      },
    });
  }

  async update(id: string, data: Prisma.ClientUpdateInput): Promise<Client> {
    return this.prisma.client.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string): Promise<Client> {
    // Mark as INACTIVE instead of hard delete
    return this.prisma.client.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });
  }

  async getBalance(id: string): Promise<number> {
    const client = await this.prisma.client.findUnique({
      where: { id },
      select: { balance: true },
    });

    return client ? parseFloat(client.balance.toString()) : 0;
  }

  async getAllCities(): Promise<string[]> {
    const clients = await this.prisma.client.findMany({
      where: { city: { not: null } },
      select: { city: true },
      distinct: ['city'],
    });

    return clients
      .map((c: any) => c.city)
      .filter((city: any): city is string => city !== null)
      .sort();
  }
}
