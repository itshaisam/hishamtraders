import { Client, ClientStatus } from '@prisma/client';
import { ClientRepository, ClientFilters } from './clients.repository';

export interface CreateClientDto {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  city?: string;
  area?: string;
  creditLimit?: number;
  paymentTermsDays?: number;
  status?: ClientStatus;
}

export interface UpdateClientDto {
  name?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  city?: string;
  area?: string;
  creditLimit?: number;
  paymentTermsDays?: number;
  status?: ClientStatus;
}

export class ClientService {
  private repository: ClientRepository;

  constructor() {
    this.repository = new ClientRepository();
  }

  async createClient(data: CreateClientDto): Promise<Client> {
    // Validation: credit limit must be >= 0
    if (data.creditLimit !== undefined && data.creditLimit < 0) {
      throw new Error('Credit limit must be 0 or greater');
    }

    // Validation: payment terms must be > 0
    if (data.paymentTermsDays !== undefined && data.paymentTermsDays <= 0) {
      throw new Error('Payment terms must be greater than 0 days');
    }

    return this.repository.create({
      name: data.name,
      contactPerson: data.contactPerson,
      phone: data.phone,
      email: data.email,
      city: data.city,
      area: data.area,
      creditLimit: data.creditLimit ?? 0,
      paymentTermsDays: data.paymentTermsDays ?? 30,
      status: data.status ?? 'ACTIVE',
    });
  }

  async getClients(filters: ClientFilters): Promise<{ clients: Client[]; total: number; page: number; limit: number }> {
    const { clients, total } = await this.repository.findAll(filters);

    return {
      clients,
      total,
      page: filters.page ?? 1,
      limit: filters.limit ?? 20,
    };
  }

  async getClientById(id: string): Promise<Client> {
    const client = await this.repository.findById(id);

    if (!client) {
      throw new Error('Client not found');
    }

    return client;
  }

  async updateClient(id: string, data: UpdateClientDto): Promise<Client> {
    // Check if client exists
    await this.getClientById(id);

    // Validation: credit limit must be >= 0
    if (data.creditLimit !== undefined && data.creditLimit < 0) {
      throw new Error('Credit limit must be 0 or greater');
    }

    // Validation: payment terms must be > 0
    if (data.paymentTermsDays !== undefined && data.paymentTermsDays <= 0) {
      throw new Error('Payment terms must be greater than 0 days');
    }

    return this.repository.update(id, data);
  }

  async deleteClient(id: string): Promise<Client> {
    // Check if client exists
    const client = await this.getClientById(id);

    // Validation: cannot delete client with non-zero balance
    const balance = await this.repository.getBalance(id);
    if (balance !== 0) {
      throw new Error('Cannot delete client with outstanding balance');
    }

    return this.repository.softDelete(id);
  }

  async getAllCities(): Promise<string[]> {
    return this.repository.getAllCities();
  }

  calculateCreditUtilization(balance: number, creditLimit: number): number {
    if (creditLimit === 0) return 0; // No credit allowed
    return (balance / creditLimit) * 100;
  }

  getCreditStatus(utilization: number): 'good' | 'warning' | 'danger' {
    if (utilization >= 100) return 'danger'; // Over limit
    if (utilization >= 80) return 'warning';  // Approaching limit
    return 'good';
  }
}
