import { FileText, Users, Receipt, RotateCcw } from 'lucide-react';
import { GuideContent } from '../types';

export const salesContent: GuideContent = {
  title: 'Sales',
  icon: FileText,
  introduction:
    'The Sales module covers customer management, invoice creation, payment tracking, and sales returns. It provides the tools needed to manage your entire order-to-cash cycle, from onboarding a customer and raising invoices to processing returns and issuing credit notes.',
  tableOfContents: [
    { id: 'customers', label: 'Customers', level: 1 },
    { id: 'customers-create', label: 'Creating a Customer', level: 2 },
    { id: 'customers-fields', label: 'Customer Fields', level: 2 },
    { id: 'customers-credit-limit', label: 'Credit Limit Enforcement', level: 2 },
    { id: 'customers-edit-delete', label: 'Editing & Deactivating Customers', level: 2 },
    { id: 'invoices', label: 'Invoices', level: 1 },
    { id: 'invoices-create', label: 'Creating an Invoice', level: 2 },
    { id: 'invoices-fields', label: 'Invoice Form Fields', level: 2 },
    { id: 'invoices-lifecycle', label: 'Invoice Status Lifecycle', level: 2 },
    { id: 'invoices-void-cancel', label: 'Voiding vs Cancelling', level: 2 },
    { id: 'returns', label: 'Returns & Credit Notes', level: 1 },
    { id: 'returns-create', label: 'Creating a Return', level: 2 },
    { id: 'returns-fields', label: 'Credit Note Fields', level: 2 },
    { id: 'returns-lifecycle', label: 'Credit Note Lifecycle', level: 2 },
  ],
  sections: [
    // ========================================================================
    // 1. CLIENTS
    // ========================================================================
    {
      id: 'customers',
      title: 'Customers',
      icon: Users,
      roles: ['Admin', 'Sales Officer'],
      content: [
        {
          type: 'paragraph',
          text: 'Customers represent the businesses or individuals you sell to. Each customer record stores contact details, location, credit terms, and tax-exemption status. Maintaining accurate customer data ensures invoices, payments, and reports are correctly attributed.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Quick Search',
          text: 'Use the search bar on the Customers list page to filter by name, city, or contact person. The search is case-insensitive.',
        },
      ],
      subSections: [
        {
          id: 'customers-create',
          title: 'Creating a Customer',
          content: [
            {
              type: 'steps',
              steps: [
                {
                  title: 'Navigate to Sales > Customers',
                  description: 'Open the Customers list page from the sidebar.',
                },
                {
                  title: 'Click "Add Customer"',
                  description: 'Opens the customer creation form.',
                },
                {
                  title: 'Fill in required fields',
                  description: 'At minimum, provide the customer name. All other fields are optional but recommended for complete records.',
                },
                {
                  title: 'Set credit limit and payment terms',
                  description: 'Define the maximum outstanding balance allowed and the default number of days for payment. These values drive credit-limit alerts and overdue calculations.',
                },
                {
                  title: 'Save',
                  description: 'Click Save to create the customer. The customer will appear in the list and be available for invoice creation.',
                },
              ],
            },
          ],
        },
        {
          id: 'customers-fields',
          title: 'Customer Fields',
          content: [
            {
              type: 'fieldTable',
              fields: [
                { name: 'name', fieldType: 'text', required: true, description: 'Full name of the customer or business. Must be unique.' },
                { name: 'contactPerson', fieldType: 'text', required: false, description: 'Name of the primary point of contact at the customer.' },
                { name: 'email', fieldType: 'email', required: false, description: 'Email address for correspondence and invoice delivery.' },
                { name: 'phone', fieldType: 'text', required: false, description: 'Primary phone number for the customer.' },
                { name: 'whatsapp', fieldType: 'text', required: false, description: 'WhatsApp number for quick communication.' },
                { name: 'city', fieldType: 'text', required: false, description: 'City where the customer is located.' },
                { name: 'area', fieldType: 'text', required: false, description: 'Area or locality within the city.' },
                { name: 'creditLimit', fieldType: 'number', required: false, description: 'Maximum outstanding balance allowed for this customer. Defaults to 0 (no limit enforcement). Decimal value up to 12 digits.' },
                { name: 'paymentTermsDays', fieldType: 'number', required: false, description: 'Default number of days from invoice date until payment is due. Defaults to 30.' },
                { name: 'taxExempt', fieldType: 'boolean', required: false, description: 'When enabled, invoices for this customer will not include tax.' },
                { name: 'taxExemptReason', fieldType: 'text', required: false, description: 'Reason for tax exemption (required when taxExempt is true).' },
                { name: 'status', fieldType: 'select', required: false, description: 'ACTIVE or INACTIVE. Inactive customers cannot be selected when creating new invoices.' },
              ],
            },
          ],
        },
        {
          id: 'customers-credit-limit',
          title: 'Credit Limit Enforcement',
          content: [
            {
              type: 'paragraph',
              text: 'When a credit limit is set for a customer, the system checks the customer\'s current outstanding balance before allowing a new invoice to be created. If adding the new invoice would push the balance beyond the credit limit, a warning is displayed to the user.',
            },
            {
              type: 'flow',
              steps: [
                'Create Invoice',
                'System checks customer balance + new invoice total',
                'Balance within limit? Proceed',
                'Balance exceeds limit? Show warning',
                'User can override or cancel',
              ],
            },
            {
              type: 'callout',
              variant: 'warning',
              title: 'Credit Limit Warnings',
              text: 'The credit limit check is a soft warning, not a hard block. Admin and Sales Officer users can choose to proceed with the invoice even when the limit would be exceeded. However, the dashboard will show the customer in the credit limit alerts section.',
            },
            {
              type: 'keyValue',
              pairs: [
                { key: 'Credit Limit = 0', value: 'No credit limit enforcement. The customer can have unlimited outstanding balance.' },
                { key: 'Balance > 80% of Limit', value: 'Customer appears as a yellow alert on the dashboard.' },
                { key: 'Balance > 100% of Limit', value: 'Customer appears as a red alert on the dashboard. Warning shown when creating new invoices.' },
              ],
            },
          ],
        },
        {
          id: 'customers-edit-delete',
          title: 'Editing & Deactivating Customers',
          content: [
            {
              type: 'paragraph',
              text: 'You can edit any customer field at any time. Changes to credit limit or payment terms apply to future invoices only; existing invoices retain their original terms. Customers with existing invoices or payments cannot be deleted; instead, set their status to INACTIVE to prevent further use.',
            },
            {
              type: 'callout',
              variant: 'note',
              title: 'Inactive Customers',
              text: 'Deactivating a customer hides them from the customer dropdown when creating invoices but preserves all historical data. Existing invoices and payments remain unaffected.',
            },
          ],
        },
      ],
    },

    // ========================================================================
    // 2. INVOICES
    // ========================================================================
    {
      id: 'invoices',
      title: 'Invoices',
      icon: Receipt,
      roles: ['Admin', 'Sales Officer'],
      content: [
        {
          type: 'paragraph',
          text: 'Invoices are the core sales documents. Each invoice records a sale to a customer, including the products sold, quantities, prices, discounts, and applicable tax. Invoices drive the accounts receivable balance and are the basis for payment tracking.',
        },
        {
          type: 'paragraph',
          text: 'Invoice numbers are auto-generated and unique. Each invoice is linked to a specific customer and warehouse (determining which stock is deducted).',
        },
      ],
      subSections: [
        {
          id: 'invoices-create',
          title: 'Creating an Invoice',
          content: [
            {
              type: 'steps',
              steps: [
                {
                  title: 'Navigate to Sales > Invoices',
                  description: 'Open the Invoices list page from the sidebar.',
                },
                {
                  title: 'Click "Create Invoice"',
                  description: 'Opens the invoice creation form.',
                },
                {
                  title: 'Select a customer',
                  description: 'Choose the customer from the dropdown. The system will check their credit limit and display a warning if it would be exceeded.',
                },
                {
                  title: 'Select a warehouse',
                  description: 'Choose which warehouse the stock will be dispatched from.',
                },
                {
                  title: 'Set invoice date and due date',
                  description: 'The invoice date defaults to today. The due date is auto-calculated based on the customer\'s payment terms but can be overridden.',
                },
                {
                  title: 'Choose payment type',
                  description: 'Select CASH or CREDIT. Cash invoices are expected to be paid immediately.',
                },
                {
                  title: 'Add line items',
                  description: 'For each item, select the product, enter quantity, unit price, and optional discount percentage. The line total is calculated automatically.',
                },
                {
                  title: 'Review totals',
                  description: 'The form displays the subtotal (sum of line totals), tax amount (calculated from the system tax rate unless customer is tax-exempt), and grand total.',
                },
                {
                  title: 'Save',
                  description: 'Click Save to create the invoice. Stock is deducted from inventory, and the customer\'s balance is updated.',
                },
              ],
            },
            {
              type: 'callout',
              variant: 'important',
              title: 'Stock Deduction',
              text: 'Saving an invoice immediately deducts the specified quantities from the selected warehouse. Ensure the correct warehouse and quantities are selected before saving.',
            },
          ],
        },
        {
          id: 'invoices-fields',
          title: 'Invoice Form Fields',
          content: [
            {
              type: 'fieldTable',
              fields: [
                { name: 'invoiceNumber', fieldType: 'text (auto)', required: true, description: 'Auto-generated unique invoice number. Cannot be edited.' },
                { name: 'customerId', fieldType: 'select', required: true, description: 'The customer being invoiced. Select from active customers.' },
                { name: 'warehouseId', fieldType: 'select', required: true, description: 'The warehouse from which stock will be dispatched.' },
                { name: 'invoiceDate', fieldType: 'date', required: true, description: 'Date of the invoice. Defaults to today.' },
                { name: 'dueDate', fieldType: 'date', required: true, description: 'Payment due date. Auto-calculated from customer payment terms.' },
                { name: 'paymentType', fieldType: 'select', required: true, description: 'CASH or CREDIT. Determines payment expectations.' },
                { name: 'notes', fieldType: 'textarea', required: false, description: 'Free-text notes or special instructions for the invoice.' },
              ],
            },
            {
              type: 'paragraph',
              text: 'Each line item in the invoice has the following fields:',
            },
            {
              type: 'fieldTable',
              fields: [
                { name: 'productId', fieldType: 'select', required: true, description: 'The product being sold. Select from the product catalogue.' },
                { name: 'productVariantId', fieldType: 'select', required: false, description: 'Optional variant of the selected product (e.g., size, color).' },
                { name: 'batchNo', fieldType: 'text', required: false, description: 'Batch number for traceability. Auto-populated if batch tracking is enabled.' },
                { name: 'quantity', fieldType: 'number', required: true, description: 'Number of units being sold. Must be greater than zero.' },
                { name: 'unitPrice', fieldType: 'number', required: true, description: 'Price per unit. Can be edited to apply custom pricing.' },
                { name: 'discount', fieldType: 'number', required: false, description: 'Discount percentage applied to this line item. Defaults to 0.' },
                { name: 'total', fieldType: 'number (auto)', required: true, description: 'Calculated as: quantity x unitPrice x (1 - discount/100).' },
              ],
            },
            {
              type: 'keyValue',
              pairs: [
                { key: 'Subtotal', value: 'Sum of all line item totals before tax.' },
                { key: 'Tax Rate', value: 'System-wide tax rate, snapshotted at invoice creation. Zero if customer is tax-exempt.' },
                { key: 'Tax Amount', value: 'Subtotal multiplied by the tax rate.' },
                { key: 'Total', value: 'Subtotal plus tax amount. This is the amount the customer owes.' },
              ],
            },
          ],
        },
        {
          id: 'invoices-lifecycle',
          title: 'Invoice Status Lifecycle',
          content: [
            {
              type: 'paragraph',
              text: 'An invoice progresses through several statuses based on payment activity. The status is updated automatically as payments are recorded against the invoice.',
            },
            {
              type: 'flow',
              steps: [
                'Create Invoice',
                'PENDING',
                'Receive partial payment',
                'PARTIAL',
                'Receive remaining payment',
                'PAID',
              ],
            },
            {
              type: 'keyValue',
              pairs: [
                { key: 'PENDING', value: 'Invoice has been created but no payment has been received yet.' },
                { key: 'PARTIAL', value: 'One or more payments have been received, but the total paid is less than the invoice total.' },
                { key: 'PAID', value: 'The full invoice amount has been received. No further payments are expected.' },
                { key: 'OVERDUE', value: 'The due date has passed and the invoice is not fully paid. Overdue invoices appear in dashboard alerts.' },
                { key: 'CANCELLED', value: 'The invoice was cancelled before any payment was received. No financial impact.' },
                { key: 'VOIDED', value: 'The invoice was voided after creation (possibly after partial payment). Reverses financial entries.' },
              ],
            },
            {
              type: 'callout',
              variant: 'note',
              title: 'Automatic Status Updates',
              text: 'You do not manually change an invoice from PENDING to PARTIAL or PAID. The system automatically updates the status when payments are recorded via the Payments module.',
            },
          ],
        },
        {
          id: 'invoices-void-cancel',
          title: 'Voiding vs Cancelling',
          content: [
            {
              type: 'callout',
              variant: 'warning',
              title: 'Understand the Difference',
              text: 'Voiding and cancelling are different operations with different implications. Choose carefully, as both actions are irreversible.',
            },
            {
              type: 'keyValue',
              pairs: [
                { key: 'Cancel', value: 'Use when the invoice was created in error and no payment has been received. Cancelling sets the status to CANCELLED. Stock is returned to inventory. The customer balance is not affected since no payment was involved.' },
                { key: 'Void', value: 'Use when the invoice needs to be reversed after it has been partially or fully processed. Voiding sets the status to VOIDED, records who voided it and why (voidedBy, voidedAt, voidReason), reverses stock movements, and adjusts the customer balance.' },
              ],
            },
            {
              type: 'fieldTable',
              fields: [
                { name: 'voidReason', fieldType: 'textarea', required: true, description: 'A mandatory explanation for why the invoice is being voided. Recorded for audit purposes.' },
                { name: 'voidedBy', fieldType: 'text (auto)', required: true, description: 'Automatically set to the current user performing the void action.' },
                { name: 'voidedAt', fieldType: 'datetime (auto)', required: true, description: 'Automatically set to the current timestamp when the invoice is voided.' },
              ],
            },
            {
              type: 'callout',
              variant: 'important',
              title: 'Irreversible Actions',
              text: 'Once an invoice is voided or cancelled, it cannot be reopened or edited. If the sale is still valid, you must create a new invoice. All void and cancel actions are recorded in the audit trail.',
            },
          ],
        },
      ],
    },

    // ========================================================================
    // 3. RETURNS / CREDIT NOTES
    // ========================================================================
    {
      id: 'returns',
      title: 'Returns & Credit Notes',
      icon: RotateCcw,
      roles: ['Admin', 'Sales Officer'],
      content: [
        {
          type: 'paragraph',
          text: 'When a customer returns goods, a credit note is created against the original invoice. The credit note records which items were returned, in what quantity, and the reason for the return. Stock is automatically added back to inventory, and the credit is applied to the customer\'s account.',
        },
        {
          type: 'paragraph',
          text: 'Credit notes can only be created against invoices that are in PENDING, PARTIAL, or PAID status. You cannot create a return against a VOIDED or CANCELLED invoice.',
        },
      ],
      subSections: [
        {
          id: 'returns-create',
          title: 'Creating a Return',
          content: [
            {
              type: 'steps',
              steps: [
                {
                  title: 'Navigate to Sales > Credit Notes',
                  description: 'Open the Credit Notes page from the sidebar.',
                },
                {
                  title: 'Click "Create Credit Note"',
                  description: 'Opens the credit note creation form.',
                },
                {
                  title: 'Select the original invoice',
                  description: 'Choose the invoice the return is being made against. The form will load all line items from that invoice.',
                },
                {
                  title: 'Choose items to return',
                  description: 'For each item being returned, enter the quantity returned. The quantity cannot exceed the originally invoiced quantity minus any previously returned quantity.',
                },
                {
                  title: 'Provide a reason',
                  description: 'Enter the reason for the return. This is a required field and is recorded for audit and reporting purposes.',
                },
                {
                  title: 'Review and save',
                  description: 'Review the credit note totals (subtotal, tax, total). Click Save to create the credit note. Stock is returned to inventory and the customer balance is adjusted.',
                },
              ],
            },
            {
              type: 'flow',
              steps: [
                'Select Invoice',
                'Choose return items & quantities',
                'Enter reason',
                'Create Credit Note',
                'Stock returned to inventory',
                'Customer balance adjusted',
              ],
            },
            {
              type: 'callout',
              variant: 'tip',
              title: 'Partial Returns',
              text: 'You do not need to return all items from an invoice. Select only the items and quantities being returned. You can create multiple credit notes against the same invoice for separate return events.',
            },
          ],
        },
        {
          id: 'returns-fields',
          title: 'Credit Note Fields',
          content: [
            {
              type: 'fieldTable',
              fields: [
                { name: 'creditNoteNumber', fieldType: 'text (auto)', required: true, description: 'Auto-generated unique credit note number. Cannot be edited.' },
                { name: 'invoiceId', fieldType: 'select', required: true, description: 'The original invoice this return is being made against.' },
                { name: 'customerId', fieldType: 'text (auto)', required: true, description: 'Automatically set to the customer from the selected invoice.' },
                { name: 'reason', fieldType: 'textarea', required: true, description: 'Explanation for the return. Required for audit compliance.' },
                { name: 'subtotal', fieldType: 'number (auto)', required: true, description: 'Sum of all return line item totals before tax.' },
                { name: 'taxRate', fieldType: 'number (auto)', required: true, description: 'Tax rate snapshotted from the original invoice.' },
                { name: 'taxAmount', fieldType: 'number (auto)', required: true, description: 'Tax calculated on the return subtotal.' },
                { name: 'totalAmount', fieldType: 'number (auto)', required: true, description: 'Total credit amount (subtotal + tax). This is credited to the customer.' },
              ],
            },
            {
              type: 'paragraph',
              text: 'Each return line item has the following fields:',
            },
            {
              type: 'fieldTable',
              fields: [
                { name: 'invoiceItemId', fieldType: 'select', required: true, description: 'The original invoice line item being returned.' },
                { name: 'productId', fieldType: 'text (auto)', required: true, description: 'Product from the original line item.' },
                { name: 'productVariantId', fieldType: 'text (auto)', required: false, description: 'Variant from the original line item, if applicable.' },
                { name: 'batchNo', fieldType: 'text (auto)', required: false, description: 'Batch number from the original line item.' },
                { name: 'quantityReturned', fieldType: 'number', required: true, description: 'Number of units being returned. Must be between 1 and the original quantity minus previously returned quantity.' },
                { name: 'unitPrice', fieldType: 'number (auto)', required: true, description: 'Unit price from the original invoice line item.' },
                { name: 'discount', fieldType: 'number (auto)', required: true, description: 'Discount percentage from the original invoice line item.' },
                { name: 'total', fieldType: 'number (auto)', required: true, description: 'Calculated as: quantityReturned x unitPrice x (1 - discount/100).' },
              ],
            },
          ],
        },
        {
          id: 'returns-lifecycle',
          title: 'Credit Note Lifecycle',
          content: [
            {
              type: 'paragraph',
              text: 'Credit notes have a simple lifecycle with three possible statuses. Once created, a credit note starts as OPEN and can be applied against future invoices or payments.',
            },
            {
              type: 'flow',
              steps: [
                'Create Credit Note',
                'OPEN',
                'Apply to payment or balance',
                'APPLIED',
              ],
            },
            {
              type: 'keyValue',
              pairs: [
                { key: 'OPEN', value: 'The credit note has been created. The credit amount is available to be applied against the customer\'s outstanding balance or future invoices.' },
                { key: 'APPLIED', value: 'The credit note has been fully applied. No remaining credit balance.' },
                { key: 'VOIDED', value: 'The credit note was voided, reversing the credit and the stock return. Use this if the credit note was created in error.' },
              ],
            },
            {
              type: 'callout',
              variant: 'warning',
              title: 'Voiding a Credit Note',
              text: 'Voiding a credit note reverses the stock addition and removes the credit from the customer\'s account. This action is irreversible. Only void a credit note if it was created in error. An APPLIED credit note cannot be voided.',
            },
          ],
        },
      ],
    },
  ],
};
