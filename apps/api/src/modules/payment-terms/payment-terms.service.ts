import logger from '../../lib/logger.js';
import { NotFoundError } from '../../utils/errors.js';
import { paymentTermsRepository } from './payment-terms.repository.js';
import { PaymentTerm } from '@prisma/client';

export class PaymentTermsService {
  async getAllPaymentTerms(): Promise<PaymentTerm[]> {
    const paymentTerms = await paymentTermsRepository.findAll();
    return paymentTerms;
  }

  async getPaymentTermById(id: string): Promise<PaymentTerm> {
    const paymentTerm = await paymentTermsRepository.findById(id);
    if (!paymentTerm) {
      throw new NotFoundError('Payment term not found');
    }
    return paymentTerm;
  }

  async getPaymentTermByName(name: string): Promise<PaymentTerm | null> {
    const paymentTerm = await paymentTermsRepository.findByName(name);
    return paymentTerm;
  }
}

export const paymentTermsService = new PaymentTermsService();
