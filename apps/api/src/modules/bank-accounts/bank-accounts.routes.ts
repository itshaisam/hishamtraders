import { Router } from 'express';
import { BankAccountsController } from './bank-accounts.controller.js';

const router = Router();
const controller = new BankAccountsController();

// GET /api/v1/bank-accounts — list all bank-type accounts with balances
router.get('/', controller.getBankAccounts);

export const bankAccountRoutes = router;
