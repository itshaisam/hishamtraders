import { Request, Response, NextFunction } from 'express';
import { ClientService, CreateClientDto, UpdateClientDto } from './clients.service.js';
import { ClientStatus } from '@prisma/client';

export class ClientController {
  private service: ClientService;

  constructor() {
    this.service = new ClientService();
  }

  createClient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data: CreateClientDto = req.body;
      const client = await this.service.createClient(data);

      res.status(201).json({
        success: true,
        data: client,
        message: 'Client created successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  getClients = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        search,
        city,
        status,
        hasBalance,
        page,
        limit,
      } = req.query;

      const filters = {
        search: search as string | undefined,
        city: city as string | undefined,
        status: status as ClientStatus | undefined,
        hasBalance: hasBalance === 'true',
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      };

      const result = await this.service.getClients(filters);

      res.json({
        success: true,
        data: result.clients,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          pages: Math.ceil(result.total / result.limit),
        },
      });
    } catch (error) {
      next(error);
    }
  };

  getClientById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const client = await this.service.getClientByIdWithInvoices(id);

      const balance = parseFloat(client.balance.toString());
      const creditLimit = parseFloat(client.creditLimit.toString());
      const utilization = this.service.calculateCreditUtilization(balance, creditLimit);
      const creditStatus = this.service.getCreditStatus(utilization);

      res.json({
        success: true,
        data: {
          ...client,
          creditUtilization: utilization,
          creditStatus,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  updateClient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const data: UpdateClientDto = req.body;
      const client = await this.service.updateClient(id, data);

      res.json({
        success: true,
        data: client,
        message: 'Client updated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  deleteClient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const client = await this.service.deleteClient(id);

      res.json({
        success: true,
        data: client,
        message: 'Client deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  getAllCities = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cities = await this.service.getAllCities();

      res.json({
        success: true,
        data: cities,
      });
    } catch (error) {
      next(error);
    }
  };
}
