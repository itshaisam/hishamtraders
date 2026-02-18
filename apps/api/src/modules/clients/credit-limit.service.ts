import { NotFoundError } from '../../utils/errors.js';

export interface CreditLimitCheck {
  status: 'OK' | 'WARNING' | 'EXCEEDED';
  currentBalance: number;
  creditLimit: number;
  newTotal: number;
  newBalance: number;
  utilization: number;
  message: string;
}

export class CreditLimitService {
  constructor(private prisma: any) {}

  /**
   * Check if adding an amount would exceed or approach credit limit
   * @param clientId - Client ID to check
   * @param additionalAmount - Amount to be added to balance
   * @param warningThreshold - Percentage threshold for warning (default 80%)
   * @returns Credit limit check result
   */
  async checkCreditLimit(
    clientId: string,
    additionalAmount: number,
    warningThreshold: number = 80
  ): Promise<CreditLimitCheck> {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundError('Client not found');
    }

    const currentBalance = parseFloat(client.balance.toString());
    const creditLimit = parseFloat(client.creditLimit.toString());
    const newBalance = currentBalance + additionalAmount;
    const utilization = creditLimit > 0 ? (newBalance / creditLimit) * 100 : 0;

    let status: 'OK' | 'WARNING' | 'EXCEEDED';
    let message: string;

    if (utilization > 100) {
      status = 'EXCEEDED';
      message = `Credit limit exceeded. Current balance: Rs.${currentBalance.toFixed(
        4
      )}, Limit: Rs.${creditLimit.toFixed(4)}, New total: Rs.${newBalance.toFixed(4)}`;
    } else if (utilization >= warningThreshold) {
      status = 'WARNING';
      message = `Client approaching credit limit (${utilization.toFixed(0)}% utilized)`;
    } else {
      status = 'OK';
      message = 'Credit limit OK';
    }

    return {
      status,
      currentBalance,
      creditLimit,
      newTotal: additionalAmount,
      newBalance,
      utilization,
      message,
    };
  }

  /**
   * Get clients exceeding the warning threshold
   * @param warningThreshold - Percentage threshold (default 80%)
   * @returns List of clients with high credit utilization
   */
  async getClientsOverThreshold(warningThreshold: number = 80) {
    const clients = await this.prisma.client.findMany({
      where: {
        status: 'ACTIVE',
        creditLimit: {
          gt: 0,
        },
      },
      select: {
        id: true,
        name: true,
        balance: true,
        creditLimit: true,
        city: true,
        phone: true,
      },
    });

    // Calculate utilization and filter
    const clientsWithUtilization = clients
      .map((client: any) => {
        const balance = parseFloat(client.balance.toString());
        const limit = parseFloat(client.creditLimit.toString());
        const utilization = limit > 0 ? (balance / limit) * 100 : 0;

        return {
          ...client,
          balance,
          creditLimit: limit,
          utilization,
          status:
            utilization >= 100 ? ('EXCEEDED' as const) : ('WARNING' as const),
        };
      })
      .filter((client: any) => client.utilization >= warningThreshold)
      .sort((a: any, b: any) => b.utilization - a.utilization);

    return clientsWithUtilization;
  }
}
