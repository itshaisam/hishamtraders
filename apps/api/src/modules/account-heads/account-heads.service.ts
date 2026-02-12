import { AccountHead, AccountType } from '@prisma/client';
import { accountHeadRepository, AccountHeadRepository } from './account-heads.repository.js';
import { CreateAccountHeadDto } from './dto/create-account-head.dto.js';
import { UpdateAccountHeadDto } from './dto/update-account-head.dto.js';
import { AccountHeadFilters } from './dto/account-head-filter.dto.js';
import { BadRequestError, ConflictError, NotFoundError } from '../../utils/errors.js';
import { AuditService } from '../../services/audit.service.js';

// Map code prefix to expected account type
const CODE_TYPE_MAP: Record<string, AccountType> = {
  '1': 'ASSET',
  '2': 'LIABILITY',
  '3': 'EQUITY',
  '4': 'REVENUE',
  '5': 'EXPENSE',
};

export class AccountHeadService {
  async create(data: CreateAccountHeadDto, userId: string): Promise<AccountHead> {
    // Validate code uniqueness
    const existing = await accountHeadRepository.findByCode(data.code);
    if (existing) {
      throw new ConflictError(`Account with code "${data.code}" already exists`);
    }

    // Validate code prefix matches account type
    const codePrefix = data.code.charAt(0);
    const expectedType = CODE_TYPE_MAP[codePrefix];
    if (expectedType && expectedType !== data.accountType) {
      throw new BadRequestError(
        `Code starting with "${codePrefix}" must be of type ${expectedType}, got ${data.accountType}`
      );
    }

    // Validate parent
    if (data.parentId) {
      const parent = await accountHeadRepository.findById(data.parentId);
      if (!parent) {
        throw new NotFoundError('Parent account not found');
      }
      if (parent.accountType !== data.accountType) {
        throw new BadRequestError('Parent account must be of the same type');
      }
    }

    const accountHead = await accountHeadRepository.create({
      code: data.code,
      name: data.name,
      accountType: data.accountType,
      parent: data.parentId ? { connect: { id: data.parentId } } : undefined,
      openingBalance: data.openingBalance,
      currentBalance: data.openingBalance,
      status: data.status,
      isSystemAccount: data.isSystemAccount,
      description: data.description,
    });

    await AuditService.log({
      userId,
      action: 'CREATE',
      entityType: 'AccountHead',
      entityId: accountHead.id,
      notes: `Account head created: ${data.code} - ${data.name} (${data.accountType})`,
    });

    return accountHead;
  }

  async getAll(filters: AccountHeadFilters): Promise<{ accountHeads: AccountHead[]; total: number }> {
    return accountHeadRepository.findAll(filters);
  }

  async getById(id: string): Promise<AccountHead> {
    const accountHead = await accountHeadRepository.findById(id);
    if (!accountHead) {
      throw new NotFoundError('Account head not found');
    }
    return accountHead;
  }

  async getTree(): Promise<AccountHead[]> {
    return accountHeadRepository.getTree();
  }

  async update(id: string, data: UpdateAccountHeadDto, userId: string): Promise<AccountHead> {
    const existing = await this.getById(id);

    // Validate parent
    if (data.parentId !== undefined) {
      if (data.parentId) {
        if (data.parentId === id) {
          throw new BadRequestError('Account cannot be its own parent');
        }
        const parent = await accountHeadRepository.findById(data.parentId);
        if (!parent) {
          throw new NotFoundError('Parent account not found');
        }
        if (parent.accountType !== (existing as any).accountType) {
          throw new BadRequestError('Parent account must be of the same type');
        }
      }
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.parentId !== undefined) {
      updateData.parent = data.parentId
        ? { connect: { id: data.parentId } }
        : { disconnect: true };
    }
    if (data.openingBalance !== undefined) updateData.openingBalance = data.openingBalance;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.description !== undefined) updateData.description = data.description;

    const accountHead = await accountHeadRepository.update(id, updateData);

    await AuditService.log({
      userId,
      action: 'UPDATE',
      entityType: 'AccountHead',
      entityId: id,
      notes: `Account head updated: ${(existing as any).code} - ${(existing as any).name}`,
    });

    return accountHead;
  }

  async delete(id: string, userId: string): Promise<void> {
    const existing = await this.getById(id);

    // Cannot delete system accounts
    if ((existing as any).isSystemAccount) {
      throw new BadRequestError('Cannot delete a system account');
    }

    // Cannot delete if has children
    const hasChildren = await accountHeadRepository.hasChildren(id);
    if (hasChildren) {
      throw new BadRequestError('Cannot delete account with child accounts. Remove children first.');
    }

    // Cannot delete if has journal lines
    const hasJournalLines = await accountHeadRepository.hasJournalLines(id);
    if (hasJournalLines) {
      throw new BadRequestError('Cannot delete account with journal entries');
    }

    await accountHeadRepository.delete(id);

    await AuditService.log({
      userId,
      action: 'DELETE',
      entityType: 'AccountHead',
      entityId: id,
      notes: `Account head deleted: ${(existing as any).code} - ${(existing as any).name}`,
    });
  }
}

export const accountHeadService = new AccountHeadService();
