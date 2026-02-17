import { prisma } from '../../lib/prisma.js';
import { AccountHead, AccountType, AccountStatus, Prisma } from '@prisma/client';
import { AccountHeadFilters } from './dto/account-head-filter.dto.js';

export class AccountHeadRepository {
  async create(data: Prisma.AccountHeadCreateInput): Promise<AccountHead> {
    return prisma.accountHead.create({
      data,
      include: {
        parent: {
          select: { id: true, code: true, name: true },
        },
      },
    });
  }

  async findAll(filters: AccountHeadFilters): Promise<{ accountHeads: AccountHead[]; total: number }> {
    const { accountType, status, parentId, search, page = 1, limit = 100 } = filters;

    const where: Prisma.AccountHeadWhereInput = {};

    if (accountType) {
      where.accountType = accountType;
    }

    if (status) {
      where.status = status;
    }

    if (parentId !== undefined) {
      where.parentId = parentId || null;
    }

    if (search) {
      where.OR = [
        { code: { contains: search } },
        { name: { contains: search } },
      ];
    }

    const [accountHeads, total] = await Promise.all([
      prisma.accountHead.findMany({
        where,
        include: {
          parent: {
            select: { id: true, code: true, name: true },
          },
          children: {
            select: { id: true, code: true, name: true, accountType: true, status: true },
            orderBy: { code: 'asc' },
          },
          _count: {
            select: { journalLines: true },
          },
        },
        orderBy: { code: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.accountHead.count({ where }),
    ]);

    return { accountHeads, total };
  }

  async findById(id: string): Promise<AccountHead | null> {
    return prisma.accountHead.findUnique({
      where: { id },
      include: {
        parent: {
          select: { id: true, code: true, name: true },
        },
        children: {
          select: { id: true, code: true, name: true, accountType: true, status: true, currentBalance: true },
          orderBy: { code: 'asc' },
        },
        _count: {
          select: { journalLines: true },
        },
      },
    });
  }

  async findByCode(code: string): Promise<AccountHead | null> {
    return prisma.accountHead.findFirst({
      where: { code },
    });
  }

  async update(id: string, data: Prisma.AccountHeadUpdateInput): Promise<AccountHead> {
    return prisma.accountHead.update({
      where: { id },
      data,
      include: {
        parent: {
          select: { id: true, code: true, name: true },
        },
        children: {
          select: { id: true, code: true, name: true, accountType: true, status: true },
          orderBy: { code: 'asc' },
        },
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.accountHead.delete({
      where: { id },
    });
  }

  async getTree(): Promise<AccountHead[]> {
    return prisma.accountHead.findMany({
      where: { parentId: null },
      include: {
        children: {
          include: {
            children: {
              orderBy: { code: 'asc' },
            },
          },
          orderBy: { code: 'asc' },
        },
      },
      orderBy: { code: 'asc' },
    });
  }

  async hasChildren(id: string): Promise<boolean> {
    const count = await prisma.accountHead.count({
      where: { parentId: id },
    });
    return count > 0;
  }

  async hasJournalLines(id: string): Promise<boolean> {
    const count = await prisma.journalEntryLine.count({
      where: { accountHeadId: id },
    });
    return count > 0;
  }
}

export const accountHeadRepository = new AccountHeadRepository();
