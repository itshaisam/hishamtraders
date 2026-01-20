import { PrismaClient, Supplier, SupplierStatus } from '@prisma/client';
import { CreateSupplierDto } from './dto/create-supplier.dto.js';
import { UpdateSupplierDto } from './dto/update-supplier.dto.js';

const prisma = new PrismaClient();

// Helper function to transform supplier for API response
const transformSupplier = (supplier: any) => ({
  ...supplier,
  country: supplier.country ? { id: supplier.country.id, code: supplier.country.code, name: supplier.country.name } : null,
  paymentTerm: supplier.paymentTerm ? { id: supplier.paymentTerm.id, name: supplier.paymentTerm.name } : null,
});

export class SuppliersRepository {
  async create(data: CreateSupplierDto): Promise<Supplier> {
    const supplier = await prisma.supplier.create({
      data: {
        name: data.name,
        countryId: data.countryId || null,
        contactPerson: data.contactPerson || null,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        paymentTermId: data.paymentTermId || null,
        status: (data.status as SupplierStatus) || 'ACTIVE',
      },
      include: {
        country: true,
        paymentTerm: true,
      },
    });
    return transformSupplier(supplier);
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
      const searchLower = search.toLowerCase();
      where.OR = [
        { name: { contains: searchLower } },
        { contactPerson: { contains: searchLower } },
        { email: { contains: searchLower } },
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
        include: {
          country: true,
          paymentTerm: true,
        },
      }),
      prisma.supplier.count({ where }),
    ]);

    return { data: data.map(transformSupplier), total };
  }

  async findById(id: string): Promise<Supplier | null> {
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        country: true,
        paymentTerm: true,
      },
    });
    return supplier ? transformSupplier(supplier) : null;
  }

  async findByName(name: string): Promise<Supplier | null> {
    const supplier = await prisma.supplier.findUnique({
      where: { name },
      include: {
        country: true,
        paymentTerm: true,
      },
    });
    return supplier ? transformSupplier(supplier) : null;
  }

  async update(id: string, data: UpdateSupplierDto): Promise<Supplier> {
    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        ...(data.countryId !== undefined && { countryId: data.countryId || null }),
        ...(data.contactPerson !== undefined && { contactPerson: data.contactPerson || null }),
        ...(data.email !== undefined && { email: data.email || null }),
        ...(data.phone !== undefined && { phone: data.phone || null }),
        ...(data.address !== undefined && { address: data.address || null }),
        ...(data.paymentTermId !== undefined && { paymentTermId: data.paymentTermId || null }),
        ...(data.status !== undefined && { status: data.status as SupplierStatus }),
      },
      include: {
        country: true,
        paymentTerm: true,
      },
    });
    return transformSupplier(supplier);
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
