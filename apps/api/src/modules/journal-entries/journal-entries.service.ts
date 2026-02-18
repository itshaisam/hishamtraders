import { JournalEntry, Prisma } from '@prisma/client';
import { prisma, getTenantId } from '../../lib/prisma.js';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto.js';
import { UpdateJournalEntryDto } from './dto/update-journal-entry.dto.js';
import { JournalEntryFilters } from './dto/journal-entry-filter.dto.js';
import { generateJournalEntryNumber } from '../../utils/journal-number.util.js';
import { calculateBalanceChange } from '../../utils/balance-helper.js';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';
import { AuditService } from '../../services/audit.service.js';

const INCLUDE_LINES = {
  lines: {
    include: {
      accountHead: {
        select: { id: true, code: true, name: true, accountType: true },
      },
    },
    orderBy: { createdAt: 'asc' as const },
  },
  creator: { select: { id: true, name: true, email: true } },
  approver: { select: { id: true, name: true, email: true } },
};

export class JournalEntryService {
  async create(data: CreateJournalEntryDto, userId: string) {
    // Validate double-entry: debits == credits
    this.validateBalance(data.lines);

    // Validate each line has either debit or credit (not both, not zero)
    for (const line of data.lines) {
      if (line.debitAmount > 0 && line.creditAmount > 0) {
        throw new BadRequestError('A line cannot have both debit and credit amounts');
      }
      if (line.debitAmount === 0 && line.creditAmount === 0) {
        throw new BadRequestError('Each line must have a debit or credit amount');
      }
    }

    const entryNumber = await generateJournalEntryNumber(data.date);

    const created = await prisma.journalEntry.create({
      data: {
        entryNumber,
        date: data.date,
        description: data.description.trim(),
        status: 'DRAFT',
        referenceType: data.referenceType || null,
        referenceId: data.referenceId || null,
        createdBy: userId,
        tenantId: getTenantId(),
      },
    });

    await prisma.journalEntryLine.createMany({
      data: data.lines.map((line: any) => ({
        journalEntryId: created.id,
        accountHeadId: line.accountHeadId,
        debitAmount: line.debitAmount,
        creditAmount: line.creditAmount,
        description: line.description || null,
        tenantId: getTenantId(),
      })),
    });

    const entry = (await prisma.journalEntry.findUnique({
      where: { id: created.id },
      include: INCLUDE_LINES,
    }))!;

    await AuditService.log({
      userId,
      action: 'CREATE',
      entityType: 'JournalEntry',
      entityId: entry.id,
      notes: `Journal entry created: ${entryNumber} - ${data.description}`,
    });

    return entry;
  }

  async getAll(filters: JournalEntryFilters) {
    const { status, dateFrom, dateTo, search, page = 1, limit = 20 } = filters;

    const where: Prisma.JournalEntryWhereInput = {};

    if (status) where.status = status;

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = dateFrom;
      if (dateTo) where.date.lte = dateTo;
    }

    if (search) {
      where.OR = [
        { entryNumber: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [entries, total] = await Promise.all([
      prisma.journalEntry.findMany({
        where,
        include: INCLUDE_LINES,
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.journalEntry.count({ where }),
    ]);

    return { entries, total };
  }

  async getById(id: string) {
    const entry = await prisma.journalEntry.findUnique({
      where: { id },
      include: INCLUDE_LINES,
    });

    if (!entry) {
      throw new NotFoundError('Journal entry not found');
    }

    return entry;
  }

  async update(id: string, data: UpdateJournalEntryDto, userId: string) {
    const existing = await this.getById(id);

    if (existing.status === 'POSTED') {
      throw new BadRequestError('Cannot edit a posted journal entry');
    }

    // Validate lines if provided
    if (data.lines) {
      this.validateBalance(data.lines);
      for (const line of data.lines) {
        if (line.debitAmount > 0 && line.creditAmount > 0) {
          throw new BadRequestError('A line cannot have both debit and credit amounts');
        }
        if (line.debitAmount === 0 && line.creditAmount === 0) {
          throw new BadRequestError('Each line must have a debit or credit amount');
        }
      }
    }

    const entry = await prisma.$transaction(async (tx: any) => {
      // If lines are being updated, delete old and create new
      if (data.lines) {
        await tx.journalEntryLine.deleteMany({
          where: { journalEntryId: id },
        });
      }

      const updated = await tx.journalEntry.update({
        where: { id },
        data: {
          date: data.date,
          description: data.description?.trim(),
          referenceType: data.referenceType,
          referenceId: data.referenceId,
        },
      });

      if (data.lines) {
        await tx.journalEntryLine.createMany({
          data: data.lines.map((line: any) => ({
            journalEntryId: id,
            accountHeadId: line.accountHeadId,
            debitAmount: line.debitAmount,
            creditAmount: line.creditAmount,
            description: line.description || null,
            tenantId: getTenantId(),
          })),
        });
      }

      return tx.journalEntry.findUnique({
        where: { id },
        include: INCLUDE_LINES,
      });
    });

    await AuditService.log({
      userId,
      action: 'UPDATE',
      entityType: 'JournalEntry',
      entityId: id,
      notes: `Journal entry updated: ${existing.entryNumber}`,
    });

    return entry;
  }

  async post(id: string, userId: string) {
    return await prisma.$transaction(async (tx: any) => {
      const entry = await tx.journalEntry.findUnique({
        where: { id },
        include: {
          lines: { include: { accountHead: true } },
        },
      });

      if (!entry) throw new NotFoundError('Journal entry not found');
      if (entry.status === 'POSTED') throw new BadRequestError('Already posted');

      // Verify balance
      const totalDebits = entry.lines.reduce(
        (sum: any, l: any) => sum + parseFloat(l.debitAmount.toString()),
        0
      );
      const totalCredits = entry.lines.reduce(
        (sum: any, l: any) => sum + parseFloat(l.creditAmount.toString()),
        0
      );

      if (Math.abs(totalDebits - totalCredits) > 0.0001) {
        throw new BadRequestError(
          `Entry is not balanced. Debits: ${totalDebits.toFixed(4)}, Credits: ${totalCredits.toFixed(4)}`
        );
      }

      // Update status to POSTED
      const posted = await tx.journalEntry.update({
        where: { id },
        data: { status: 'POSTED', approvedBy: userId },
        include: INCLUDE_LINES,
      });

      // Update account balances
      for (const line of entry.lines) {
        const debit = parseFloat(line.debitAmount.toString());
        const credit = parseFloat(line.creditAmount.toString());
        const balanceChange = calculateBalanceChange(
          line.accountHead.accountType,
          debit,
          credit
        );

        await tx.accountHead.update({
          where: { id: line.accountHeadId },
          data: { currentBalance: { increment: balanceChange } },
        });
      }

      await AuditService.log({
        userId,
        action: 'UPDATE',
        entityType: 'JournalEntry',
        entityId: id,
        notes: `Journal entry posted: ${entry.entryNumber} (Debits: ${totalDebits.toFixed(4)}, Credits: ${totalCredits.toFixed(4)})`,
      });

      return posted;
    });
  }

  async delete(id: string, userId: string) {
    const existing = await this.getById(id);

    if (existing.status === 'POSTED') {
      throw new BadRequestError('Cannot delete a posted journal entry');
    }

    await prisma.journalEntry.delete({ where: { id } });

    await AuditService.log({
      userId,
      action: 'DELETE',
      entityType: 'JournalEntry',
      entityId: id,
      notes: `Journal entry deleted: ${existing.entryNumber}`,
    });
  }

  private validateBalance(lines: { debitAmount: number; creditAmount: number }[]) {
    const totalDebits = lines.reduce((sum, l) => sum + (l.debitAmount || 0), 0);
    const totalCredits = lines.reduce((sum, l) => sum + (l.creditAmount || 0), 0);

    if (Math.abs(totalDebits - totalCredits) > 0.0001) {
      throw new BadRequestError(
        `Debits (${totalDebits.toFixed(4)}) must equal Credits (${totalCredits.toFixed(4)})`
      );
    }
  }
}

export const journalEntryService = new JournalEntryService();
