import {
  Package, Warehouse, ArrowLeftRight, ClipboardList, BarChart3,
  AlertTriangle, FileOutput, Truck, ClipboardCheck, Layers,
  MapPin, RotateCcw,
} from 'lucide-react';
import { GuideContent } from '../types';

export const inventoryContent: GuideContent = {
  title: 'Inventory Management',
  icon: Package,
  introduction:
    'The Inventory module is the backbone of warehouse operations. It covers product management, real-time stock tracking across warehouses, bin-level storage, stock adjustments with approval workflows, inter-warehouse transfers, physical stock counts, gate passes, and expiry monitoring. This guide walks through every feature in detail so your team can manage inventory accurately and efficiently.',
  tableOfContents: [
    { id: 'products', label: 'Products', level: 1 },
    { id: 'products-creating', label: 'Creating a Product', level: 2 },
    { id: 'products-editing', label: 'Editing & Deleting', level: 2 },
    { id: 'products-fields', label: 'Product Fields', level: 2 },
    { id: 'stock-levels', label: 'Stock Levels', level: 1 },
    { id: 'warehouses', label: 'Warehouses', level: 1 },
    { id: 'warehouses-fields', label: 'Warehouse Fields', level: 2 },
    { id: 'bin-locations', label: 'Bin Locations', level: 1 },
    { id: 'bin-transfers', label: 'Bin Transfers', level: 1 },
    { id: 'stock-adjustments', label: 'Stock Adjustments', level: 1 },
    { id: 'adjustments-creating', label: 'Creating an Adjustment', level: 2 },
    { id: 'adjustments-approval', label: 'Approval Workflow', level: 2 },
    { id: 'adjustments-fields', label: 'Adjustment Fields', level: 2 },
    { id: 'stock-movements', label: 'Stock Movements', level: 1 },
    { id: 'expiry-alerts', label: 'Expiry Alerts', level: 1 },
    { id: 'gate-passes', label: 'Gate Passes', level: 1 },
    { id: 'stock-transfers', label: 'Stock Transfers', level: 1 },
    { id: 'transfers-workflow', label: 'Transfer Workflow', level: 2 },
    { id: 'stock-counts', label: 'Stock Counts', level: 1 },
    { id: 'counts-workflow', label: 'Count Workflow', level: 2 },
  ],
  sections: [
    // ── 1. Products ──────────────────────────────────────────────
    {
      id: 'products',
      title: 'Products',
      icon: Package,
      roles: ['Admin', 'Warehouse Manager'],
      content: [
        {
          type: 'paragraph',
          text: 'Products are the core master data in the inventory system. Every stock movement, purchase order, invoice, and adjustment references a product record. Maintaining accurate product data ensures that downstream operations such as pricing, reporting, and stock valuation work correctly.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'SKU Best Practice',
          text: 'SKUs must be unique across the entire system. While the format is user-defined, we recommend a consistent convention such as category prefix + sequential number (e.g., TILE-0001, GROUT-0042). A predictable SKU format makes searching, filtering, and physical counting significantly easier.',
        },
      ],
      subSections: [
        {
          id: 'products-creating',
          title: 'Creating a Product',
          content: [
            {
              type: 'steps',
              steps: [
                {
                  title: 'Navigate to Products',
                  description: 'Open the sidebar and click Inventory > Products to view the product list.',
                },
                {
                  title: 'Click "Add Product"',
                  description: 'The button is located in the top-right corner of the product list page.',
                },
                {
                  title: 'Fill in Required Fields',
                  description: 'Enter the product name and a unique SKU. Select a category if applicable and provide the unit of measurement (e.g., pcs, kg, box).',
                },
                {
                  title: 'Set Optional Details',
                  description: 'Add a description, reorder level (minimum stock threshold), and weight/dimensions if relevant for logistics.',
                },
                {
                  title: 'Save',
                  description: 'Click the Save button. The product will now appear in the product list and be available for use in purchase orders, invoices, and stock operations.',
                },
              ],
            },
          ],
        },
        {
          id: 'products-editing',
          title: 'Editing & Deleting',
          content: [
            {
              type: 'paragraph',
              text: 'To edit a product, click the edit icon on the product row in the list view. Update the fields as needed and click Save. To delete a product, click the delete icon. Products that are referenced by existing inventory records, purchase orders, or invoices cannot be deleted — you will see an error message if this is the case.',
            },
            {
              type: 'callout',
              variant: 'warning',
              title: 'Changing SKU',
              text: 'Changing a product SKU after it has been used in transactions is not recommended, as it may cause confusion in historical reports and audit trails. If you must change a SKU, verify that no pending operations reference the old value.',
            },
          ],
        },
        {
          id: 'products-fields',
          title: 'Product Fields',
          content: [
            {
              type: 'fieldTable',
              fields: [
                { name: 'Name', fieldType: 'Text', required: true, description: 'The display name of the product. Used throughout the system in lists, invoices, and reports.' },
                { name: 'SKU', fieldType: 'Text', required: true, description: 'Stock Keeping Unit — a unique identifier for the product. Must be unique across all products.' },
                { name: 'Category', fieldType: 'Select', required: false, description: 'Product category for grouping and filtering. Categories are predefined in the system.' },
                { name: 'Unit', fieldType: 'Text', required: false, description: 'Unit of measurement (e.g., pcs, kg, box, meter). Displayed on invoices and purchase orders.' },
                { name: 'Description', fieldType: 'Textarea', required: false, description: 'Detailed product description. Useful for products that are similar and need differentiation.' },
                { name: 'Reorder Level', fieldType: 'Number', required: false, description: 'Minimum stock quantity threshold. When stock falls below this level, it can trigger alerts or appear in low-stock reports.' },
                { name: 'Weight', fieldType: 'Number', required: false, description: 'Product weight for logistics and shipping calculations.' },
                { name: 'Dimensions', fieldType: 'Text', required: false, description: 'Product dimensions (length x width x height). Useful for storage planning and shipping.' },
              ],
            },
          ],
        },
      ],
    },

    // ── 2. Stock Levels ──────────────────────────────────────────
    {
      id: 'stock-levels',
      title: 'Stock Levels',
      icon: Layers,
      roles: ['Admin', 'Warehouse Manager'],
      content: [
        {
          type: 'paragraph',
          text: 'The Stock Levels page provides a real-time view of current inventory quantities across all warehouses. It is a read-only view — stock cannot be modified directly here. Instead, stock changes flow through purchases (goods receiving), sales, adjustments, and transfers.',
        },
        {
          type: 'paragraph',
          text: 'The table is searchable and filterable, allowing you to quickly locate specific products or narrow down to a particular warehouse. Each row shows the product name, warehouse, current quantity, batch number, and bin location.',
        },
        {
          type: 'keyValue',
          pairs: [
            { key: 'Product', value: 'The product name and SKU for the inventory record.' },
            { key: 'Warehouse', value: 'Which warehouse holds this stock.' },
            { key: 'Quantity', value: 'Current available quantity on hand.' },
            { key: 'Batch Number', value: 'The batch or lot number associated with the stock, useful for traceability.' },
            { key: 'Bin Location', value: 'The specific bin or shelf location within the warehouse where the stock is stored.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Quick Filter',
          text: 'Use the warehouse filter dropdown to focus on a single warehouse. Combine it with the search bar to find a specific product within that warehouse. This is especially useful during physical stock verification.',
        },
      ],
    },

    // ── 3. Warehouses ────────────────────────────────────────────
    {
      id: 'warehouses',
      title: 'Warehouses',
      icon: Warehouse,
      roles: ['Admin', 'Warehouse Manager'],
      content: [
        {
          type: 'paragraph',
          text: 'Warehouses represent physical storage locations where inventory is held. Every inventory record is tied to a warehouse. You must create at least one warehouse before receiving stock or making adjustments.',
        },
        {
          type: 'steps',
          steps: [
            {
              title: 'Navigate to Warehouses',
              description: 'Open the sidebar and click Inventory > Warehouses to view the warehouse list.',
            },
            {
              title: 'Click "Add Warehouse"',
              description: 'Opens the creation form. Enter the warehouse name (required), location, and city.',
            },
            {
              title: 'Set Active Status',
              description: 'New warehouses are active by default. Deactivate a warehouse to prevent new stock operations against it without deleting it.',
            },
            {
              title: 'Save',
              description: 'Click Save to create the warehouse. It will immediately be available in dropdowns throughout the system.',
            },
          ],
        },
        {
          type: 'callout',
          variant: 'note',
          title: 'Deactivating a Warehouse',
          text: 'Deactivating a warehouse does not remove existing stock records. It only prevents the warehouse from being selected in new transactions. You should transfer all stock out before deactivating a warehouse.',
        },
      ],
      subSections: [
        {
          id: 'warehouses-fields',
          title: 'Warehouse Fields',
          content: [
            {
              type: 'fieldTable',
              fields: [
                { name: 'Name', fieldType: 'Text', required: true, description: 'The display name of the warehouse. Must be descriptive enough to identify the location (e.g., "Main Warehouse", "Lahore Godown").' },
                { name: 'Location', fieldType: 'Text', required: false, description: 'The street address or area of the warehouse. Helpful for logistics and delivery coordination.' },
                { name: 'City', fieldType: 'Text', required: false, description: 'The city where the warehouse is located. Used for filtering and reporting by region.' },
                { name: 'Is Active', fieldType: 'Checkbox', required: false, description: 'Controls whether the warehouse appears in selection dropdowns for new operations. Defaults to active.' },
              ],
            },
          ],
        },
      ],
    },

    // ── 4. Bin Locations ─────────────────────────────────────────
    {
      id: 'bin-locations',
      title: 'Bin Locations',
      icon: MapPin,
      roles: ['Admin', 'Warehouse Manager'],
      content: [
        {
          type: 'paragraph',
          text: 'Bin locations represent specific storage positions within a warehouse — racks, shelves, aisles, or zones. They provide granular tracking of where exactly a product is stored, making physical retrieval faster and stock counts more organized.',
        },
        {
          type: 'steps',
          steps: [
            {
              title: 'Select a Warehouse',
              description: 'Use the warehouse filter at the top of the Bin Locations page to choose which warehouse you want to manage bins for.',
            },
            {
              title: 'Add a Bin Location',
              description: 'Click "Add Bin" and enter a unique bin code or name (e.g., A-01-03, RACK-B-SHELF-2). The name should follow your warehouse labeling convention.',
            },
            {
              title: 'Edit or Delete',
              description: 'Edit a bin location name using the edit icon. Delete a bin using the delete icon — bins that currently hold stock cannot be deleted.',
            },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Naming Convention',
          text: 'Use a consistent naming pattern for bin locations such as Aisle-Rack-Shelf (e.g., A-01-03). This makes it easy for warehouse staff to physically locate items and speeds up the picking process.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Deleting Bins',
          text: 'A bin location that has stock assigned to it cannot be deleted. You must first transfer or adjust the stock out of that bin before removing it.',
        },
      ],
    },

    // ── 5. Bin Transfers ─────────────────────────────────────────
    {
      id: 'bin-transfers',
      title: 'Bin Transfers',
      icon: ArrowLeftRight,
      roles: ['Admin', 'Warehouse Manager'],
      content: [
        {
          type: 'paragraph',
          text: 'Bin transfers move stock between bin locations within the same warehouse. This is used during warehouse reorganization, when consolidating stock, or when moving items closer to the dispatch area for upcoming orders. Bin transfers do not change the warehouse-level stock quantity — they only update the bin location assignment.',
        },
        {
          type: 'steps',
          steps: [
            {
              title: 'Navigate to Bin Transfers',
              description: 'Open the sidebar and click Inventory > Bin Transfers.',
            },
            {
              title: 'Select Warehouse',
              description: 'Choose the warehouse where the transfer will take place. Both source and destination bins must be in the same warehouse.',
            },
            {
              title: 'Select Product',
              description: 'Choose the product you want to move. The system will show available stock in the source bin.',
            },
            {
              title: 'Choose Source and Destination Bins',
              description: 'Select the bin where the stock currently resides (source) and the bin where you want to move it (destination).',
            },
            {
              title: 'Enter Quantity',
              description: 'Enter the quantity to transfer. This cannot exceed the available quantity in the source bin.',
            },
            {
              title: 'Submit',
              description: 'Click Transfer to execute the move. The stock will immediately reflect in the new bin location.',
            },
          ],
        },
        {
          type: 'callout',
          variant: 'note',
          title: 'Same Warehouse Only',
          text: 'Bin transfers are strictly within a single warehouse. To move stock between different warehouses, use the Stock Transfers feature instead.',
        },
      ],
    },

    // ── 6. Stock Adjustments ─────────────────────────────────────
    {
      id: 'stock-adjustments',
      title: 'Stock Adjustments',
      icon: ClipboardList,
      roles: ['Admin', 'Warehouse Manager'],
      content: [
        {
          type: 'paragraph',
          text: 'Stock adjustments allow you to manually increase or decrease inventory quantities to correct discrepancies. Common reasons include damage, theft, miscounts, or stock received without a purchase order. All adjustments go through an approval workflow to maintain accountability and prevent unauthorized changes.',
        },
        {
          type: 'callout',
          variant: 'important',
          title: 'Approval Required',
          text: 'Stock adjustments are not applied immediately. Every adjustment must be approved by an Admin before stock quantities are updated. This ensures an audit trail and prevents accidental or unauthorized inventory changes.',
        },
      ],
      subSections: [
        {
          id: 'adjustments-creating',
          title: 'Creating an Adjustment',
          content: [
            {
              type: 'steps',
              steps: [
                {
                  title: 'Navigate to Stock Adjustments',
                  description: 'Open the sidebar and click Inventory > Stock Adjustments.',
                },
                {
                  title: 'Click "New Adjustment"',
                  description: 'Opens the adjustment creation form.',
                },
                {
                  title: 'Select Warehouse',
                  description: 'Choose the warehouse where the stock discrepancy exists.',
                },
                {
                  title: 'Select Product',
                  description: 'Choose the product that needs adjustment. The current stock level will be displayed for reference.',
                },
                {
                  title: 'Choose Adjustment Type',
                  description: 'Select "Increase" to add stock or "Decrease" to reduce stock.',
                },
                {
                  title: 'Enter Quantity',
                  description: 'Enter the quantity to adjust. For decreases, this cannot exceed the current stock level.',
                },
                {
                  title: 'Provide a Reason',
                  description: 'Enter a clear reason for the adjustment (e.g., "Damaged goods found during inspection", "Physical count variance"). This reason is recorded in the audit trail.',
                },
                {
                  title: 'Submit for Approval',
                  description: 'Click Submit. The adjustment will be created with a "Pending" status and await admin review.',
                },
              ],
            },
          ],
        },
        {
          id: 'adjustments-approval',
          title: 'Approval Workflow',
          content: [
            {
              type: 'paragraph',
              text: 'Every stock adjustment follows a strict approval workflow. Only users with the Admin role can approve or reject adjustments. The stock quantity is updated only after an adjustment is approved.',
            },
            {
              type: 'flow',
              steps: [
                'Create Adjustment',
                'Pending Approval',
                'Admin Reviews',
                'Approved / Rejected',
                'Stock Updated',
              ],
            },
            {
              type: 'keyValue',
              pairs: [
                { key: 'Created', value: 'The adjustment has been submitted and is waiting for admin review.' },
                { key: 'Approved', value: 'An admin has reviewed and approved the adjustment. Stock quantities are updated immediately upon approval.' },
                { key: 'Rejected', value: 'An admin has rejected the adjustment. No stock changes are made. The reason for rejection should be communicated to the requestor.' },
              ],
            },
            {
              type: 'callout',
              variant: 'warning',
              title: 'Rejected Adjustments',
              text: 'A rejected adjustment cannot be re-submitted. If the stock discrepancy still exists, create a new adjustment with a more detailed reason so the admin can make an informed decision.',
            },
          ],
        },
        {
          id: 'adjustments-fields',
          title: 'Adjustment Fields',
          content: [
            {
              type: 'fieldTable',
              fields: [
                { name: 'Warehouse', fieldType: 'Select', required: true, description: 'The warehouse where the stock adjustment applies.' },
                { name: 'Product', fieldType: 'Select', required: true, description: 'The product whose stock quantity needs to be corrected.' },
                { name: 'Adjustment Type', fieldType: 'Select', required: true, description: 'Either "Increase" (add stock) or "Decrease" (reduce stock).' },
                { name: 'Quantity', fieldType: 'Number', required: true, description: 'The number of units to add or remove. Must be a positive number.' },
                { name: 'Reason', fieldType: 'Textarea', required: true, description: 'A clear explanation of why the adjustment is needed. This is permanently recorded for audit purposes.' },
              ],
            },
          ],
        },
      ],
    },

    // ── 7. Stock Movements ───────────────────────────────────────
    {
      id: 'stock-movements',
      title: 'Stock Movements',
      icon: RotateCcw,
      roles: ['Admin', 'Warehouse Manager'],
      content: [
        {
          type: 'paragraph',
          text: 'The Stock Movements page is a comprehensive, read-only log of every stock change that has occurred across all warehouses. Each movement records what changed, when, by how much, and why. This is the single source of truth for inventory audit trails.',
        },
        {
          type: 'paragraph',
          text: 'Movements are created automatically by other operations — receiving goods from a PO creates a RECEIPT movement, creating an invoice creates a SALE movement, and so on. You cannot create movements directly; they are always the result of another action.',
        },
        {
          type: 'keyValue',
          pairs: [
            { key: 'RECEIPT', value: 'Stock added through goods receiving against a purchase order.' },
            { key: 'SALE', value: 'Stock deducted when an invoice is created and dispatched.' },
            { key: 'ADJUSTMENT', value: 'Stock increased or decreased through an approved stock adjustment.' },
            { key: 'TRANSFER', value: 'Stock moved between warehouses via a stock transfer.' },
            { key: 'SALES_RETURN', value: 'Stock added back when a sales return or credit note is processed.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Investigating Discrepancies',
          text: 'If stock levels do not match expectations, use the Stock Movements page to trace every change. Filter by product and date range to see exactly when and why the quantity changed. Each movement links back to the originating document (PO, invoice, adjustment, etc.).',
        },
        {
          type: 'paragraph',
          text: 'You can filter movements by movement type, date range, specific product, or warehouse to narrow down exactly what you are looking for.',
        },
      ],
    },

    // ── 8. Expiry Alerts ─────────────────────────────────────────
    {
      id: 'expiry-alerts',
      title: 'Expiry Alerts',
      icon: AlertTriangle,
      roles: ['Admin', 'Warehouse Manager'],
      content: [
        {
          type: 'paragraph',
          text: 'The Expiry Alerts page monitors stock that is approaching its expiry date. For businesses that deal with perishable or time-sensitive goods, this feature ensures that products are sold or rotated before they expire, reducing waste and financial loss.',
        },
        {
          type: 'paragraph',
          text: 'The system checks inventory batch records for expiry dates and flags items that fall within the configured alert threshold. Items are displayed in order of urgency — those closest to expiry appear first.',
        },
        {
          type: 'keyValue',
          pairs: [
            { key: 'Alert Threshold', value: 'The number of days before expiry at which the system begins flagging items. This is configurable in system settings.' },
            { key: 'Expired', value: 'Items that have already passed their expiry date. These should be removed from sellable stock immediately.' },
            { key: 'Expiring Soon', value: 'Items within the alert threshold. Plan to sell, return, or dispose of these products promptly.' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Expired Stock',
          text: 'Products that have already expired should not be sold to clients. Create a stock adjustment (decrease) to remove expired items from inventory and document the reason as "Expired stock disposal".',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'FIFO Principle',
          text: 'Follow the First In, First Out (FIFO) principle when dispatching goods. Always ship older batches first to minimize the risk of stock expiring in the warehouse.',
        },
      ],
    },

    // ── 9. Gate Passes ───────────────────────────────────────────
    {
      id: 'gate-passes',
      title: 'Gate Passes',
      icon: FileOutput,
      roles: ['Admin', 'Warehouse Manager'],
      content: [
        {
          type: 'paragraph',
          text: 'A gate pass is a document authorizing goods to leave the warehouse premises. It serves as a security checkpoint — no goods should leave without a corresponding gate pass. Gate passes can optionally be linked to an invoice for full traceability from sale to dispatch.',
        },
        {
          type: 'flow',
          steps: [
            'Create Gate Pass',
            'Print Gate Pass',
            'Goods Leave Warehouse',
          ],
        },
        {
          type: 'steps',
          steps: [
            {
              title: 'Create Gate Pass',
              description: 'Navigate to Inventory > Gate Passes and click "New Gate Pass". Enter the details of the goods leaving the warehouse, including product, quantity, destination, and vehicle information.',
            },
            {
              title: 'Link to Invoice (Optional)',
              description: 'If the goods are being dispatched for a sale, link the gate pass to the relevant invoice. This creates a complete audit trail from order to delivery.',
            },
            {
              title: 'Print Gate Pass',
              description: 'Click the Print button to generate a printable gate pass document. This should be handed to the driver or security personnel at the warehouse gate.',
            },
            {
              title: 'Verify at Gate',
              description: 'Security personnel verify the physical goods against the gate pass details before allowing the shipment to leave.',
            },
          ],
        },
        {
          type: 'callout',
          variant: 'important',
          title: 'Security Protocol',
          text: 'Gate passes are a critical security control. Ensure that warehouse staff understand that no goods should leave the premises without a printed and verified gate pass. This protects against unauthorized removal of stock.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Invoice Linking',
          text: 'Linking a gate pass to an invoice makes it easy to verify during audits that every sale was properly dispatched. It also helps resolve disputes about whether goods were delivered.',
        },
      ],
    },

    // ── 10. Stock Transfers ──────────────────────────────────────
    {
      id: 'stock-transfers',
      title: 'Stock Transfers',
      icon: Truck,
      roles: ['Admin', 'Warehouse Manager'],
      content: [
        {
          type: 'paragraph',
          text: 'Stock transfers move inventory between different warehouses. Unlike bin transfers (which are within a single warehouse), stock transfers involve physically shipping goods from one location to another. Each transfer goes through a multi-step workflow to track the goods from dispatch to receipt.',
        },
        {
          type: 'steps',
          steps: [
            {
              title: 'Create a Transfer',
              description: 'Navigate to Inventory > Stock Transfers and click "New Transfer". Select the source warehouse (where goods will leave) and the destination warehouse (where goods will arrive).',
            },
            {
              title: 'Add Line Items',
              description: 'Add one or more products to the transfer. For each product, specify the quantity and batch number. The quantity cannot exceed available stock in the source warehouse.',
            },
            {
              title: 'Submit the Transfer',
              description: 'Click Submit to initiate the transfer. Stock is deducted from the source warehouse and the transfer enters "In Transit" status.',
            },
            {
              title: 'Receive at Destination',
              description: 'When goods physically arrive at the destination warehouse, open the transfer and click "Receive". Stock is added to the destination warehouse and the transfer status changes to "Received".',
            },
          ],
        },
      ],
      subSections: [
        {
          id: 'transfers-workflow',
          title: 'Transfer Workflow',
          content: [
            {
              type: 'flow',
              steps: [
                'Create Transfer',
                'In Transit',
                'Received',
              ],
            },
            {
              type: 'keyValue',
              pairs: [
                { key: 'Created', value: 'Transfer has been created with line items. Stock is deducted from the source warehouse.' },
                { key: 'In Transit', value: 'Goods are physically being moved between warehouses. Stock is not yet available at the destination.' },
                { key: 'Received', value: 'Goods have arrived and been confirmed at the destination warehouse. Stock is now available at the new location.' },
              ],
            },
            {
              type: 'callout',
              variant: 'warning',
              title: 'In-Transit Inventory',
              text: 'While a transfer is in transit, the stock has been deducted from the source warehouse but not yet added to the destination. This means the total system-wide quantity for those products will temporarily appear lower. This is expected and resolves once the transfer is received.',
            },
            {
              type: 'callout',
              variant: 'tip',
              title: 'Batch Tracking',
              text: 'When adding line items to a transfer, specify the batch number to maintain lot traceability across warehouses. This is especially important for products with expiry dates.',
            },
          ],
        },
      ],
    },

    // ── 11. Stock Counts ─────────────────────────────────────────
    {
      id: 'stock-counts',
      title: 'Stock Counts',
      icon: ClipboardCheck,
      roles: ['Admin', 'Warehouse Manager'],
      content: [
        {
          type: 'paragraph',
          text: 'Stock counts (physical inventory audits) verify that actual warehouse quantities match system records. Regular stock counts help identify discrepancies caused by theft, damage, receiving errors, or data entry mistakes. The system supports creating count sheets, recording actual quantities, reviewing variances, and generating adjustments from the results.',
        },
        {
          type: 'callout',
          variant: 'important',
          title: 'Schedule Regular Counts',
          text: 'It is strongly recommended to perform stock counts at least quarterly for high-value items and monthly for fast-moving products. Regular counts catch discrepancies early before they compound into significant losses.',
        },
      ],
      subSections: [
        {
          id: 'counts-workflow',
          title: 'Count Workflow',
          content: [
            {
              type: 'flow',
              steps: [
                'Create Count Sheet',
                'Enter Actual Quantities',
                'Review Variances',
                'Create Adjustments',
              ],
            },
            {
              type: 'steps',
              steps: [
                {
                  title: 'Create a Count Sheet',
                  description: 'Navigate to Inventory > Stock Counts and click "New Count". Select the warehouse and optionally filter by product category or bin location. The system generates a count sheet pre-populated with the expected (system) quantities.',
                },
                {
                  title: 'Perform the Physical Count',
                  description: 'Print the count sheet or use it on-screen. Warehouse staff physically count the products and record the actual quantities found.',
                },
                {
                  title: 'Enter Actual Quantities',
                  description: 'Enter the actual counted quantities into the count sheet for each product. The system calculates the variance (difference between expected and actual) automatically.',
                },
                {
                  title: 'Review Variances',
                  description: 'Review all items where the actual quantity differs from the expected quantity. Investigate significant variances before proceeding — check for misplaced stock, pending receipts, or unrecorded sales.',
                },
                {
                  title: 'Create Adjustments from Variances',
                  description: 'For confirmed variances, create stock adjustments directly from the count results. Each adjustment will go through the standard approval workflow (Admin approval required) before stock is updated.',
                },
              ],
            },
            {
              type: 'callout',
              variant: 'tip',
              title: 'Freeze Operations During Counting',
              text: 'For the most accurate results, try to pause receiving and dispatching operations in the warehouse during a stock count. Any movements that occur during counting can cause false variances.',
            },
            {
              type: 'callout',
              variant: 'note',
              title: 'Adjustments from Counts',
              text: 'Adjustments created from stock count variances follow the same approval workflow as manually created adjustments. They will appear in the Stock Adjustments list with the count reference and must be approved by an Admin before stock quantities are corrected.',
            },
          ],
        },
      ],
    },
  ],
};
