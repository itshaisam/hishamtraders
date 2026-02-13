import { DollarSign, Users, Truck, History, Receipt } from 'lucide-react';
import { GuideContent } from '../types';

export const paymentsContent: GuideContent = {
  title: 'Payments',
  icon: DollarSign,
  introduction:
    'The Payments module handles all money movement in and out of the business. Record payments received from clients, payments made to suppliers, view full payment history, and track business expenses. Each payment automatically updates the related invoice statuses and ledger balances.',
  tableOfContents: [
    { id: 'client-payments', label: 'Client Payments', level: 1 },
    { id: 'client-payment-process', label: 'Payment Process', level: 2 },
    { id: 'client-payment-fields', label: 'Payment Fields', level: 2 },
    { id: 'supplier-payments', label: 'Supplier Payments', level: 1 },
    { id: 'supplier-payment-fields', label: 'Payment Fields', level: 2 },
    { id: 'payment-history', label: 'Payment History', level: 1 },
    { id: 'payment-history-filters', label: 'Filters & Search', level: 2 },
    { id: 'expenses', label: 'Expenses', level: 1 },
    { id: 'expense-fields', label: 'Expense Fields', level: 2 },
    { id: 'expense-list', label: 'Expense List & Filters', level: 2 },
  ],
  sections: [
    {
      id: 'client-payments',
      title: 'Client Payments',
      icon: Users,
      roles: ['Admin', 'Accountant', 'Recovery Agent'],
      content: [
        {
          type: 'paragraph',
          text: 'Client payments record money received from clients against their outstanding invoices. When a payment is recorded, it is allocated to one or more invoices, and each invoice status is updated automatically (e.g., from PENDING to PARTIAL or PAID).',
        },
        {
          type: 'flow',
          steps: [
            'Select Client',
            'Enter Amount',
            'Choose Payment Method',
            'Allocate to Invoices',
            'Confirm Payment',
            'Invoice Statuses Updated',
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Partial Payment Allocation',
          text: 'You can allocate a single payment across multiple invoices. For example, if a client pays PKR 50,000 and has two invoices of PKR 30,000 each, you can allocate PKR 30,000 to the first invoice (marking it PAID) and PKR 20,000 to the second (marking it PARTIAL). The system will prevent you from allocating more than the total payment amount.',
        },
      ],
      subSections: [
        {
          id: 'client-payment-process',
          title: 'Payment Process',
          content: [
            {
              type: 'steps',
              steps: [
                {
                  title: 'Select the Client',
                  description:
                    'Use the client dropdown to select the paying client. Once selected, the system loads all their outstanding invoices (PENDING, PARTIAL, or OVERDUE).',
                },
                {
                  title: 'Enter Payment Amount',
                  description:
                    'Enter the total amount received from the client. This is the gross amount before allocation.',
                },
                {
                  title: 'Choose Payment Method',
                  description:
                    'Select how the payment was received: Cash, Bank Transfer, Cheque, or Online. For Cheque and Bank Transfer, enter the reference number.',
                },
                {
                  title: 'Allocate to Invoices',
                  description:
                    'The outstanding invoices are listed with their balances. Enter the amount to apply against each invoice. The total allocated must equal the payment amount.',
                },
                {
                  title: 'Confirm and Save',
                  description:
                    'Review the allocation summary and confirm. The payment is recorded, invoice statuses are updated, and the client ledger balance is adjusted.',
                },
              ],
            },
          ],
        },
        {
          id: 'client-payment-fields',
          title: 'Payment Fields',
          content: [
            {
              type: 'fieldTable',
              fields: [
                { name: 'Client', fieldType: 'Dropdown', required: true, description: 'The client making the payment. Searchable dropdown.' },
                { name: 'Amount', fieldType: 'Number', required: true, description: 'Total payment amount received from the client.' },
                { name: 'Payment Method', fieldType: 'Select', required: true, description: 'Cash, Bank Transfer, Cheque, or Online.' },
                { name: 'Reference', fieldType: 'Text', required: false, description: 'Cheque number, transaction ID, or bank reference.' },
                { name: 'Payment Date', fieldType: 'Date', required: true, description: 'The date the payment was received. Defaults to today.' },
                { name: 'Notes', fieldType: 'Textarea', required: false, description: 'Optional notes or remarks about the payment.' },
                { name: 'Invoice Allocation', fieldType: 'Table', required: true, description: 'Amount to allocate against each outstanding invoice. Total must equal the payment amount.' },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'supplier-payments',
      title: 'Supplier Payments',
      icon: Truck,
      roles: ['Admin', 'Accountant'],
      content: [
        {
          type: 'paragraph',
          text: 'Supplier payments record money paid to suppliers against purchase orders or outstanding balances. Select the supplier, enter the amount and payment method, and optionally add a reference number for tracking.',
        },
        {
          type: 'steps',
          steps: [
            {
              title: 'Select the Supplier',
              description:
                'Choose the supplier from the dropdown. The system displays their current outstanding balance and recent purchase orders.',
            },
            {
              title: 'Enter Payment Details',
              description:
                'Enter the payment amount, select the method (Cash, Bank Transfer, Cheque, or Online), and provide a reference number if applicable.',
            },
            {
              title: 'Confirm Payment',
              description:
                'Review the details and submit. The supplier ledger is updated and the payment is recorded in the system.',
            },
          ],
        },
        {
          type: 'callout',
          variant: 'note',
          title: 'Supplier Ledger',
          text: 'Each supplier payment automatically updates the supplier ledger. You can view the full supplier payment history from the Supplier detail page or the Payment History screen.',
        },
      ],
      subSections: [
        {
          id: 'supplier-payment-fields',
          title: 'Payment Fields',
          content: [
            {
              type: 'fieldTable',
              fields: [
                { name: 'Supplier', fieldType: 'Dropdown', required: true, description: 'The supplier being paid. Searchable dropdown.' },
                { name: 'Amount', fieldType: 'Number', required: true, description: 'Total amount being paid to the supplier.' },
                { name: 'Payment Method', fieldType: 'Select', required: true, description: 'Cash, Bank Transfer, Cheque, or Online.' },
                { name: 'Reference', fieldType: 'Text', required: false, description: 'Cheque number, transaction ID, or bank reference for tracking.' },
                { name: 'Payment Date', fieldType: 'Date', required: true, description: 'The date the payment was made. Defaults to today.' },
                { name: 'Notes', fieldType: 'Textarea', required: false, description: 'Optional notes or remarks about the payment.' },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'payment-history',
      title: 'Payment History',
      icon: History,
      roles: ['Admin', 'Accountant', 'Recovery Agent'],
      content: [
        {
          type: 'paragraph',
          text: 'The Payment History page provides a comprehensive view of all recorded payments, both client and supplier. Use filters to narrow down results by date range, payment type, or method. Each row shows the payment amount, method, associated client or supplier, and allocation details.',
        },
        {
          type: 'keyValue',
          pairs: [
            { key: 'Payment Number', value: 'Auto-generated unique identifier for each payment.' },
            { key: 'Date', value: 'The date the payment was recorded.' },
            { key: 'Type', value: 'CLIENT or SUPPLIER, indicating the direction of payment.' },
            { key: 'Party', value: 'The client or supplier name associated with the payment.' },
            { key: 'Amount', value: 'The total payment amount.' },
            { key: 'Method', value: 'Cash, Bank Transfer, Cheque, or Online.' },
            { key: 'Reference', value: 'Cheque number or transaction reference, if provided.' },
          ],
        },
      ],
      subSections: [
        {
          id: 'payment-history-filters',
          title: 'Filters & Search',
          content: [
            {
              type: 'paragraph',
              text: 'The payment history list is searchable and filterable. You can combine multiple filters to narrow results.',
            },
            {
              type: 'fieldTable',
              fields: [
                { name: 'Search', fieldType: 'Text', required: false, description: 'Search by payment number, client name, supplier name, or reference.' },
                { name: 'Date Range', fieldType: 'Date Range', required: false, description: 'Filter payments within a specific start and end date.' },
                { name: 'Type', fieldType: 'Select', required: false, description: 'Filter by CLIENT or SUPPLIER payments.' },
                { name: 'Method', fieldType: 'Select', required: false, description: 'Filter by payment method: Cash, Bank Transfer, Cheque, or Online.' },
              ],
            },
            {
              type: 'callout',
              variant: 'tip',
              title: 'Quick Date Filters',
              text: 'Use the date range filter to quickly view payments for a specific period such as the current month or last 30 days. This is especially useful during month-end reconciliation.',
            },
          ],
        },
      ],
    },
    {
      id: 'expenses',
      title: 'Expenses',
      icon: Receipt,
      roles: ['Admin', 'Accountant'],
      content: [
        {
          type: 'paragraph',
          text: 'The Expenses section allows you to record and manage all business expenses. Each expense is categorized, dated, and linked to a payment method. Categories are configurable through system settings, allowing you to tailor expense tracking to your business needs.',
        },
        {
          type: 'steps',
          steps: [
            {
              title: 'Select Category',
              description:
                'Choose an expense category from the dropdown (e.g., Rent, Utilities, Transport, Office Supplies). Categories are configurable in system settings.',
            },
            {
              title: 'Enter Expense Details',
              description:
                'Provide the amount, date, payment method, and a description of the expense.',
            },
            {
              title: 'Save Expense',
              description:
                'Submit the expense record. It will appear in the expense list and be included in expense reports.',
            },
          ],
        },
        {
          type: 'callout',
          variant: 'important',
          title: 'Expense Categories',
          text: 'Expense categories can be configured by an Admin in the system settings. Ensure the categories are set up before recording expenses so that reports are accurate and consistent.',
        },
      ],
      subSections: [
        {
          id: 'expense-fields',
          title: 'Expense Fields',
          content: [
            {
              type: 'fieldTable',
              fields: [
                { name: 'Category', fieldType: 'Dropdown', required: true, description: 'The expense category (e.g., Rent, Utilities, Transport). Configurable in system settings.' },
                { name: 'Amount', fieldType: 'Number', required: true, description: 'The expense amount.' },
                { name: 'Date', fieldType: 'Date', required: true, description: 'The date the expense was incurred. Defaults to today.' },
                { name: 'Payment Method', fieldType: 'Select', required: true, description: 'Cash, Bank Transfer, Cheque, or Online.' },
                { name: 'Description', fieldType: 'Textarea', required: true, description: 'A brief description of what the expense was for.' },
                { name: 'Reference', fieldType: 'Text', required: false, description: 'Optional receipt number or external reference.' },
              ],
            },
          ],
        },
        {
          id: 'expense-list',
          title: 'Expense List & Filters',
          content: [
            {
              type: 'paragraph',
              text: 'The expense list displays all recorded expenses in reverse chronological order. Use filters to narrow the view by category, date range, or payment method.',
            },
            {
              type: 'fieldTable',
              fields: [
                { name: 'Search', fieldType: 'Text', required: false, description: 'Search by description or reference number.' },
                { name: 'Category', fieldType: 'Select', required: false, description: 'Filter by expense category.' },
                { name: 'Date Range', fieldType: 'Date Range', required: false, description: 'Filter expenses within a specific start and end date.' },
                { name: 'Payment Method', fieldType: 'Select', required: false, description: 'Filter by payment method.' },
              ],
            },
          ],
        },
      ],
    },
  ],
};
