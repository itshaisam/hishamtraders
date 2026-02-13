import { ShoppingCart, Users, ClipboardList, PackageCheck } from 'lucide-react';
import { GuideContent } from '../types';

export const purchasesContent: GuideContent = {
  title: 'Purchases',
  icon: ShoppingCart,
  introduction:
    'The Purchases module covers the full procurement lifecycle: managing suppliers, creating purchase orders with landed cost tracking, and receiving goods into inventory. This guide walks through each step from supplier setup to goods receipt.',
  tableOfContents: [
    { id: 'suppliers', label: 'Suppliers', level: 1 },
    { id: 'suppliers-creating', label: 'Creating a Supplier', level: 2 },
    { id: 'suppliers-managing', label: 'Managing Suppliers', level: 2 },
    { id: 'purchase-orders', label: 'Purchase Orders', level: 1 },
    { id: 'po-creating', label: 'Creating a Purchase Order', level: 2 },
    { id: 'po-line-items', label: 'Line Items', level: 2 },
    { id: 'po-additional-costs', label: 'Additional Costs (Landed Cost)', level: 2 },
    { id: 'po-statuses', label: 'PO Statuses', level: 2 },
    { id: 'po-lifecycle', label: 'PO Lifecycle', level: 2 },
    { id: 'goods-receiving', label: 'Goods Receiving', level: 1 },
    { id: 'gr-process', label: 'Receiving Process', level: 2 },
    { id: 'gr-partial', label: 'Partial Receiving', level: 2 },
  ],
  sections: [
    // =========================================================================
    // 1. Suppliers
    // =========================================================================
    {
      id: 'suppliers',
      title: 'Suppliers',
      icon: Users,
      roles: ['ADMIN', 'WAREHOUSE_MANAGER'],
      content: [
        {
          type: 'paragraph',
          text: 'Suppliers represent the vendors you purchase goods from. Each supplier record stores contact details, country, and payment terms. You must create at least one supplier before you can raise a purchase order.',
        },
        { type: 'roles', roles: ['ADMIN', 'WAREHOUSE_MANAGER'] },
      ],
      subSections: [
        {
          id: 'suppliers-creating',
          title: 'Creating a Supplier',
          content: [
            {
              type: 'steps',
              steps: [
                {
                  title: 'Open the Suppliers page',
                  description:
                    'Navigate to Purchases > Suppliers from the sidebar.',
                },
                {
                  title: 'Click "Add Supplier"',
                  description:
                    'The supplier form will open with fields for contact and address information.',
                },
                {
                  title: 'Fill in the required fields',
                  description:
                    'At minimum, enter the supplier name. All other fields are optional but recommended for complete records.',
                },
                {
                  title: 'Save',
                  description:
                    'Click Save to create the supplier. The supplier will be set to ACTIVE status by default.',
                },
              ],
            },
            {
              type: 'fieldTable',
              fields: [
                {
                  name: 'Name',
                  fieldType: 'Text',
                  required: true,
                  description:
                    'Unique supplier name. Used throughout the system for identification.',
                },
                {
                  name: 'Contact Person',
                  fieldType: 'Text',
                  required: false,
                  description:
                    'Primary point of contact at the supplier company.',
                },
                {
                  name: 'Email',
                  fieldType: 'Email',
                  required: false,
                  description:
                    'Supplier email address. Must be unique across all suppliers if provided.',
                },
                {
                  name: 'Phone',
                  fieldType: 'Text',
                  required: false,
                  description: 'Phone number for the supplier.',
                },
                {
                  name: 'Address',
                  fieldType: 'Textarea',
                  required: false,
                  description: 'Full mailing address of the supplier.',
                },
                {
                  name: 'Country',
                  fieldType: 'Select',
                  required: false,
                  description:
                    'Country of origin. Selected from the countries reference list.',
                },
                {
                  name: 'Payment Term',
                  fieldType: 'Select',
                  required: false,
                  description:
                    'Default payment term for this supplier (e.g., Net 30, COD).',
                },
                {
                  name: 'Status',
                  fieldType: 'Select',
                  required: false,
                  description:
                    'ACTIVE (default) or INACTIVE. Inactive suppliers cannot be selected for new POs.',
                },
              ],
            },
          ],
        },
        {
          id: 'suppliers-managing',
          title: 'Managing Suppliers',
          content: [
            {
              type: 'paragraph',
              text: 'The Suppliers list page displays all suppliers in a searchable, filterable table. You can search by name or contact person, and filter by status (Active / Inactive).',
            },
            {
              type: 'steps',
              steps: [
                {
                  title: 'Search',
                  description:
                    'Type in the search box to filter suppliers by name or contact person. The list updates as you type.',
                },
                {
                  title: 'Filter by status',
                  description:
                    'Use the status dropdown to show only Active or Inactive suppliers.',
                },
                {
                  title: 'Edit a supplier',
                  description:
                    'Click a supplier row or the edit button to open the supplier form with pre-filled values. Update any fields and save.',
                },
                {
                  title: 'Deactivate a supplier',
                  description:
                    'Change the status to INACTIVE. This prevents the supplier from being selected on new purchase orders while preserving historical data.',
                },
              ],
            },
            {
              type: 'callout',
              variant: 'note',
              title: 'Supplier Uniqueness',
              text: 'Both the supplier name and email (if provided) must be unique. The system will show a validation error if you try to create a duplicate.',
            },
          ],
        },
      ],
    },

    // =========================================================================
    // 2. Purchase Orders
    // =========================================================================
    {
      id: 'purchase-orders',
      title: 'Purchase Orders',
      icon: ClipboardList,
      roles: ['ADMIN', 'WAREHOUSE_MANAGER'],
      content: [
        {
          type: 'paragraph',
          text: 'Purchase Orders (POs) track what you are buying, from whom, and at what cost. Each PO links to a supplier and contains one or more line items. Additional costs such as shipping, customs, and tax can be added to calculate an accurate landed cost for inventory valuation.',
        },
        { type: 'roles', roles: ['ADMIN', 'WAREHOUSE_MANAGER'] },
      ],
      subSections: [
        {
          id: 'po-creating',
          title: 'Creating a Purchase Order',
          content: [
            {
              type: 'steps',
              steps: [
                {
                  title: 'Open the Purchase Orders page',
                  description:
                    'Navigate to Purchases > Purchase Orders from the sidebar.',
                },
                {
                  title: 'Click "Create Purchase Order"',
                  description: 'The PO creation form will open.',
                },
                {
                  title: 'Select a supplier',
                  description:
                    'Choose the supplier from the dropdown. Only active suppliers are listed.',
                },
                {
                  title: 'Enter header details',
                  description:
                    'Set the order date, expected arrival date, and optionally a container number and notes.',
                },
                {
                  title: 'Add line items',
                  description:
                    'Add one or more products with quantity and unit price. The total cost per line is calculated automatically.',
                },
                {
                  title: 'Add additional costs (optional)',
                  description:
                    'Enter shipping, customs, tax, or other costs. These are used for landed cost calculation.',
                },
                {
                  title: 'Save',
                  description:
                    'Click Save to create the PO with PENDING status. A unique PO number is generated automatically.',
                },
              ],
            },
            {
              type: 'fieldTable',
              fields: [
                {
                  name: 'Supplier',
                  fieldType: 'Select',
                  required: true,
                  description:
                    'The vendor supplying the goods. Only active suppliers are available.',
                },
                {
                  name: 'Order Date',
                  fieldType: 'Date',
                  required: true,
                  description: 'The date the purchase order is placed.',
                },
                {
                  name: 'Expected Arrival Date',
                  fieldType: 'Date',
                  required: false,
                  description:
                    'When the goods are expected to arrive at the warehouse.',
                },
                {
                  name: 'Container No',
                  fieldType: 'Text',
                  required: false,
                  description:
                    'Shipping container number for import tracking purposes.',
                },
                {
                  name: 'Ship Date',
                  fieldType: 'Date',
                  required: false,
                  description:
                    'Date when the shipment leaves the supplier.',
                },
                {
                  name: 'Arrival Date',
                  fieldType: 'Date',
                  required: false,
                  description:
                    'Actual arrival date (filled when goods arrive).',
                },
                {
                  name: 'Notes',
                  fieldType: 'Textarea',
                  required: false,
                  description:
                    'Any additional remarks or special instructions for the order.',
                },
              ],
            },
          ],
        },
        {
          id: 'po-line-items',
          title: 'Line Items',
          content: [
            {
              type: 'paragraph',
              text: 'Each purchase order must have at least one line item. A line item links a product (and optionally a product variant) to a quantity and unit cost.',
            },
            {
              type: 'fieldTable',
              fields: [
                {
                  name: 'Product',
                  fieldType: 'Select',
                  required: true,
                  description:
                    'The product being ordered. Select from the product catalog.',
                },
                {
                  name: 'Product Variant',
                  fieldType: 'Select',
                  required: false,
                  description:
                    'Optional variant (e.g., size or color) if the product has variants.',
                },
                {
                  name: 'Quantity',
                  fieldType: 'Number',
                  required: true,
                  description: 'Number of units to order.',
                },
                {
                  name: 'Unit Cost',
                  fieldType: 'Decimal',
                  required: true,
                  description:
                    'Cost per unit in the purchase currency. Total cost is calculated as quantity x unit cost.',
                },
              ],
            },
          ],
        },
        {
          id: 'po-additional-costs',
          title: 'Additional Costs (Landed Cost)',
          content: [
            {
              type: 'paragraph',
              text: 'Additional costs are expenses incurred on top of the product cost to bring goods into your warehouse. These are distributed across line items to calculate the true landed cost of each product, which is used for accurate inventory valuation and margin analysis.',
            },
            {
              type: 'keyValue',
              pairs: [
                {
                  key: 'SHIPPING',
                  value:
                    'Freight and transportation charges to move goods from the supplier to your warehouse.',
                },
                {
                  key: 'CUSTOMS',
                  value:
                    'Import duties and customs clearance fees applicable to international purchases.',
                },
                {
                  key: 'TAX',
                  value:
                    'Any taxes applicable to the purchase (e.g., sales tax, VAT).',
                },
                {
                  key: 'OTHER',
                  value:
                    'Any other incidental costs such as handling, insurance, or inspection fees.',
                },
              ],
            },
            {
              type: 'callout',
              variant: 'tip',
              title: 'Landed Cost Accuracy',
              text: 'Adding all relevant costs to the PO ensures your inventory valuation reflects the true cost of goods. This improves profit margin calculations on sales.',
            },
          ],
        },
        {
          id: 'po-statuses',
          title: 'PO Statuses',
          content: [
            {
              type: 'paragraph',
              text: 'A purchase order progresses through the following statuses during its lifecycle:',
            },
            {
              type: 'keyValue',
              pairs: [
                {
                  key: 'PENDING',
                  value:
                    'The PO has been created but goods have not yet shipped. It can still be edited or cancelled.',
                },
                {
                  key: 'IN_TRANSIT',
                  value:
                    'Goods have been shipped by the supplier and are on their way. The container number and ship date are typically filled at this stage.',
                },
                {
                  key: 'RECEIVED',
                  value:
                    'All goods on the PO have been fully received into inventory.',
                },
                {
                  key: 'CANCELLED',
                  value:
                    'The PO has been cancelled. No further receiving can be done against it.',
                },
              ],
            },
          ],
        },
        {
          id: 'po-lifecycle',
          title: 'PO Lifecycle',
          content: [
            {
              type: 'paragraph',
              text: 'The following flow shows the typical lifecycle of a purchase order from creation to completion:',
            },
            {
              type: 'flow',
              steps: [
                'Create PO (PENDING)',
                'Submit / Ship (IN_TRANSIT)',
                'Receive Goods (partial or full)',
                'Fully Received (RECEIVED)',
              ],
            },
            {
              type: 'callout',
              variant: 'note',
              title: 'Cancellation',
              text: 'A PO can be cancelled from the PENDING or IN_TRANSIT status. Once goods have been fully received, the PO cannot be cancelled.',
            },
          ],
        },
      ],
    },

    // =========================================================================
    // 3. Goods Receiving
    // =========================================================================
    {
      id: 'goods-receiving',
      title: 'Goods Receiving',
      icon: PackageCheck,
      roles: ['ADMIN', 'WAREHOUSE_MANAGER'],
      content: [
        {
          type: 'paragraph',
          text: 'Goods Receiving is the process of accepting delivered goods against a purchase order and adding them to your inventory. When goods are received, inventory quantities are updated, stock movements are recorded, and the PO status is updated accordingly.',
        },
        { type: 'roles', roles: ['ADMIN', 'WAREHOUSE_MANAGER'] },
      ],
      subSections: [
        {
          id: 'gr-process',
          title: 'Receiving Process',
          content: [
            {
              type: 'paragraph',
              text: 'Follow these steps to receive goods against a purchase order:',
            },
            {
              type: 'flow',
              steps: [
                'Select Purchase Order',
                'Enter Received Quantities',
                'Allocate Warehouse & Bin Location',
                'Confirm Receipt',
                'Inventory Updated',
              ],
            },
            {
              type: 'steps',
              steps: [
                {
                  title: 'Select a Purchase Order',
                  description:
                    'Choose an open PO (PENDING or IN_TRANSIT status) from the list. The PO details including line items and expected quantities are displayed.',
                },
                {
                  title: 'Enter received quantities',
                  description:
                    'For each line item, enter the quantity actually received. This may be less than or equal to the ordered quantity.',
                },
                {
                  title: 'Allocate warehouse and bin location',
                  description:
                    'Select the destination warehouse for the received goods. Optionally specify a bin location within the warehouse for precise storage tracking.',
                },
                {
                  title: 'Confirm receipt',
                  description:
                    'Review the quantities and allocations, then confirm. The system will create stock movements of type RECEIPT and update inventory levels.',
                },
                {
                  title: 'Verify inventory',
                  description:
                    'After confirmation, the inventory is updated immediately. You can verify by checking the stock levels in the Inventory module.',
                },
              ],
            },
            {
              type: 'callout',
              variant: 'important',
              title: 'Batch and Bin Tracking',
              text: 'Each received batch can be assigned a batch number and bin location. These details are stored in the inventory record and help with traceability and warehouse organization.',
            },
          ],
        },
        {
          id: 'gr-partial',
          title: 'Partial Receiving',
          content: [
            {
              type: 'paragraph',
              text: 'The system supports partial receiving, which means you do not have to receive all items on a PO at once. This is useful when shipments arrive in multiple batches or when some items are short-shipped.',
            },
            {
              type: 'steps',
              steps: [
                {
                  title: 'Receive a partial quantity',
                  description:
                    'Enter the quantity received for each line item. Items not yet received can be left at zero or skipped.',
                },
                {
                  title: 'PO remains open',
                  description:
                    'After a partial receipt, the PO stays in its current status (PENDING or IN_TRANSIT) so you can receive the remaining items later.',
                },
                {
                  title: 'Receive remaining items',
                  description:
                    'Open the same PO again and enter the quantities for the remaining items. The system tracks cumulative received quantities.',
                },
                {
                  title: 'Automatic status update',
                  description:
                    'Once all line items are fully received, the PO status is automatically updated to RECEIVED.',
                },
              ],
            },
            {
              type: 'callout',
              variant: 'tip',
              title: 'Partial Receiving Tip',
              text: 'You can perform multiple partial receipts against the same PO. The system keeps track of how much has been received per line item and prevents you from receiving more than the ordered quantity.',
            },
          ],
        },
      ],
    },
  ],
};
