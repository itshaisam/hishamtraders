import { PrismaClient, Supplier, SupplierStatus } from '@prisma/client';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

const prisma = new PrismaClient();

export class SuppliersRepository {
  async create(data: CreateSupplierDto): Promise<Supplier> {
    return prisma.supplier.create({
      data: {
        name: data.name,
        country: data.country || null,
        contactPerson: data.contactPerson || null,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        paymentTerms: data.paymentTerms || null,
        status: (data.status as SupplierStatus) || 'ACTIVE',
      },
    });
  }

  async findAll(filters: {
    search?: string;
    status?: SupplierStatus;
    page: number;
    limit: number;
  }): Promise<{ data: Supplier[]; total: number }> {
    const { search, status, page, limit } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [data, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.supplier.count({ where }),
    ]);

    return { data, total };
  }

  async findById(id: string): Promise<Supplier | null> {
    return prisma.supplier.findUnique({
      where: { id },
    });
  }

  async findByName(name: string): Promise<Supplier | null> {
    return prisma.supplier.findUnique({
      where: { name },
    });
  }

  async update(id: string, data: UpdateSupplierDto): Promise<Supplier> {
    return prisma.supplier.update({
      where: { id },
      data: {
        ...(data.country !== undefined && { country: data.country || null }),
        ...(data.contactPerson !== undefined && { contactPerson: data.contactPerson || null }),
        ...(data.email !== undefined && { email: data.email || null }),
        ...(data.phone !== undefined && { phone: data.phone || null }),
        ...(data.address !== undefined && { address: data.address || null }),
        ...(data.paymentTerms !== undefined && { paymentTerms: data.paymentTerms || null }),
        ...(data.status !== undefined && { status: data.status as SupplierStatus }),
      },
    });
  }

  async softDelete(id: string): Promise<Supplier> {
    return prisma.supplier.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });
  }

  async hasActivePurchaseOrders(supplierId: string): Promise<boolean> {
    // TODO: Add this check once PurchaseOrder model is defined
    // For now, always allow deletion
    return false;
  }
}

export const suppliersRepository = new SuppliersRepository();
