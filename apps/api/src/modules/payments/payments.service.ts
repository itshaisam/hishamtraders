import { PaymentType, PaymentMethod, PaymentReferenceType } from '@prisma/client';
import { PaymentsRepository, PaymentFilters } from './payments.repository.js';

export interface CreateSupplierPaymentDto {
  supplierId: string;
  paymentReferenceType?: PaymentReferenceType;
  referenceId?: string;
  amount: number;
  method: PaymentMethod;
  date: Date;
  notes?: string;
  recordedBy: string;
}

export class PaymentsService {
  private repository: PaymentsRepository;

  constructor() {
    this.repository = new PaymentsRepository();
  }

  /**
   * Create a supplier payment with validation
   */
  async createSupplierPayment(dto: CreateSupplierPaymentDto) {
    // Validation: Amount must be greater than 0
    if (dto.amount <= 0) {
      throw new Error('Payment amount must be greater than 0');
    }

    // Validation: If method is CHEQUE or BANK_TRANSFER, reference (notes) is required
    if (
      (dto.method === PaymentMethod.CHEQUE || dto.method === PaymentMethod.BANK_TRANSFER) &&
      (!dto.notes || dto.notes.trim().length === 0)
    ) {
      throw new Error('Reference number required for cheque or bank transfer');
    }

    // Validation: If paymentReferenceType is PO, referenceId (PO ID) is required
    if (dto.paymentReferenceType === PaymentReferenceType.PO && !dto.referenceId) {
      throw new Error('PO ID is required when payment reference type is PO');
    }

    // Create payment
    const payment = await this.repository.create({
      paymentType: PaymentType.SUPPLIER,
      paymentReferenceType: dto.paymentReferenceType || null,
      referenceId: dto.referenceId || null,
      amount: dto.amount,
      method: dto.method,
      date: dto.date,
      notes: dto.notes || null,
      user: {
        connect: { id: dto.recordedBy },
      },
      supplier: dto.supplierId
        ? {
            connect: { id: dto.supplierId },
          }
        : undefined,
    });

    return payment;
  }

  /**
   * Get all supplier payments with filters
   */
  async getSupplierPayments(filters: PaymentFilters) {
    return this.repository.findAll({
      ...filters,
      paymentType: PaymentType.SUPPLIER,
    });
  }

  /**
   * Get payments for a specific supplier
   */
  async getSupplierPaymentHistory(supplierId: string) {
    return this.repository.findBySupplier(supplierId);
  }

  /**
   * Get PO outstanding balance
   */
  async getPOBalance(poId: string) {
    return this.repository.getPOBalance(poId);
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(id: string) {
    const payment = await this.repository.findById(id);
    if (!payment) {
      throw new Error('Payment not found');
    }
    return payment;
  }
}
