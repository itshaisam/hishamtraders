import { prisma } from '../../lib/prisma.js';

export class BankAccountsService {
  /**
   * Get all bank accounts (AccountHead codes starting with '11', ASSET type, ACTIVE)
   */
  async getBankAccounts() {
    const accounts = await prisma.accountHead.findMany({
      where: {
        code: { startsWith: '11' },
        accountType: 'ASSET',
        status: 'ACTIVE',
      },
      select: {
        id: true,
        code: true,
        name: true,
        currentBalance: true,
        isSystemAccount: true,
        parentId: true,
      },
      orderBy: { code: 'asc' },
    });

    return accounts.map((a) => ({
      ...a,
      currentBalance: parseFloat(a.currentBalance.toString()),
    }));
  }
}
