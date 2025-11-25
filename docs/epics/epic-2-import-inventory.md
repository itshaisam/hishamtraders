# Epic 2: Import & Container Tracking + Basic Inventory

**Epic Goal:** Build the complete purchase order and supplier management workflow including PO creation, import documentation tracking (container numbers, customs, taxes), landed cost calculation, product master data, warehouse setup, and basic inventory tracking. This epic enables digitization of the procurement process from Chinese suppliers to warehouse receipt with real-time inventory visibility.

**Timeline:** MVP Week 1-2 (Days 5-14)

**Status:** MVP - Required for 6-week delivery

**Dependencies:** Epic 1 (Foundation & Audit)

---

## Stories

### Story 2.1: Supplier Management

**As an** accountant,
**I want** to maintain a database of suppliers with contact and payment details,
**So that** purchase orders can reference suppliers and payment terms are tracked.

**Acceptance Criteria:**
1. Supplier table created: id, name, country, contactPerson, email, phone, address, paymentTerms, status, createdAt
2. POST /api/suppliers creates new supplier
3. GET /api/suppliers returns paginated supplier list with search
4. GET /api/suppliers/:id returns supplier details with PO history
5. PUT /api/suppliers/:id updates supplier
6. DELETE /api/suppliers/:id soft-deletes (only if no active POs)
7. Email and phone validation
8. Country field uses dropdown (or free text)
9. Payment terms stored as text (e.g., "30 days net", "50% advance, 50% on delivery")
10. Frontend Supplier List page with add/edit modals
11. Frontend displays supplier status (active/inactive)
12. Only Admin and Accountant can manage suppliers
13. **All supplier CRUD operations logged in audit trail**

**Story File:** [docs/stories/story-2-1-supplier-management.md](../stories/story-2-1-supplier-management.md)

---

### Story 2.2: Purchase Order Creation

**As a** warehouse manager,
**I want** to create purchase orders for suppliers with line items and quantities,
**So that** incoming shipments are documented and expected.

**Acceptance Criteria:**
1. PurchaseOrder table: id, supplierId, poNumber, orderDate, expectedArrivalDate, status (PENDING/IN_TRANSIT/RECEIVED/CANCELLED), totalAmount, notes
2. POItem table: id, poId, productId, quantity, unitCost, totalCost
3. POST /api/purchase-orders creates PO with line items
4. Line items validated: productId exists, quantity > 0, unitCost >= 0
5. Total amount calculated automatically (sum of line item totals)
6. PO assigned unique sequential number (PO-2025-001, PO-2025-002, etc.)
7. GET /api/purchase-orders returns paginated PO list with filters (supplierId, status, date range)
8. GET /api/purchase-orders/:id returns PO with line items and supplier details
9. PUT /api/purchase-orders/:id updates PO (only if status = PENDING)
10. PATCH /api/purchase-orders/:id/status changes PO status workflow
11. Frontend Create PO page with supplier selection and dynamic line item rows
12. Frontend allows adding/removing line items
13. Frontend displays calculated total
14. Only Warehouse Manager, Accountant, Admin can create POs
15. **PO creation and updates logged in audit trail**

**Story File:** [docs/stories/story-2-2-purchase-order-creation.md](../stories/story-2-2-purchase-order-creation.md)

---

### Story 2.3: Import Documentation & Landed Cost Tracking

**As an** accountant,
**I want** to record import documentation details on purchase orders and calculate landed costs,
**So that** true product costs (product + customs + taxes + shipping) are tracked accurately.

**Acceptance Criteria:**
1. PurchaseOrder table expanded: containerNo, shipDate, arrivalDate
2. POCost table: id, poId, type (shipping, customs, tax, other), amount, description
3. POST /api/purchase-orders/:id/costs adds additional costs to PO
4. GET /api/purchase-orders/:id/landed-cost calculates and returns landed cost breakdown
5. **Landed cost calculation formula:**
   ```
   For each product in PO:
     Product Ratio = Product Cost / Total Product Cost
     Allocated Additional Cost = Sum(Additional Costs) × Product Ratio
     Landed Cost Per Unit = (Product Cost + Allocated Additional Cost) / Quantity
   ```
6. Import details can be added when PO status = IN_TRANSIT or RECEIVED
7. All cost fields validated as positive numbers or zero
8. Frontend PO detail page displays import documentation section
9. Frontend allows adding multiple cost types (shipping, customs, tax, etc.)
10. Frontend displays landed cost calculation prominently
11. Frontend shows cost breakdown per product
12. Only Accountant and Admin can edit import documentation
13. **Import cost updates logged in audit trail**

**Story File:** [docs/stories/story-2-3-import-landed-cost.md](../stories/story-2-3-import-landed-cost.md)

---

### Story 2.4: Product Master Data Management

**As a** warehouse manager,
**I want** to create and manage product records with all relevant details,
**So that** inventory can be tracked accurately across the system.

**Acceptance Criteria:**
1. Product table created: id, sku (unique), name, brand, category, costPrice, sellingPrice, reorderLevel, binLocation, status (active/inactive), createdAt, updatedAt
2. POST /api/products creates new product with validation
3. GET /api/products returns paginated product list with filters (category, status, search by SKU/name)
4. GET /api/products/:id returns single product with full details and current stock
5. PUT /api/products/:id updates product (tracked in audit log)
6. DELETE /api/products/:id soft-deletes product (status=inactive)
7. SKU must be unique and cannot be changed after creation
8. Price fields validated as positive numbers
9. Category field uses predefined list or free text
10. Frontend Product List page displays products in responsive table
11. Frontend includes Add/Edit Product modal with form validation
12. Frontend displays product status with visual indicator (active=green, inactive=gray)
13. Frontend shows current stock levels across all warehouses
14. Only Admin and Warehouse Manager can create/edit products
15. **Product CRUD operations logged in audit trail**

**Story File:** [docs/stories/story-2-4-product-master.md](../stories/story-2-4-product-master.md)

---

### Story 2.4.1: Product Variant Management

**As a** warehouse manager,
**I want** to create and manage product variants with different attributes (color, size, finish, length, etc.),
**So that** I can track different versions of the same base product with variant-specific pricing and inventory.

**Acceptance Criteria:**
1. ProductVariant table created: id, productId, sku (unique), variantName, attributes (JSON), costPrice, sellingPrice, reorderLevel, binLocation, status, createdAt, updatedAt
2. Product model updated with hasVariants flag and variants relationship
3. POItem model updated with optional productVariantId foreign key
4. POST /api/products/:productId/variants creates new variant with auto-generated SKU
5. GET /api/products/:productId/variants lists all variants with stock levels
6. GET /api/variants/:id returns variant details with parent product info
7. PUT /api/variants/:id updates variant (pricing, attributes, status)
8. DELETE /api/variants/:id soft-deletes variant (status=INACTIVE)
9. Variant SKU must be unique across all products and variants
10. Variant attributes stored as JSON for flexibility (color, size, finish, length, etc.)
11. Each variant has independent pricing, reorder levels, and bin locations
12. Frontend Product Detail page includes Variants section with table
13. Frontend Add/Edit Variant modal with attribute builder component
14. Frontend Product Form enhanced with "Has Variants" checkbox and variant creation
15. Frontend PO Form updated to show variant dropdown when product has variants
16. Only Admin and Warehouse Manager can create/edit/delete variants
17. **Variant CRUD operations logged in audit trail**

**Story File:** [docs/stories/story-2-4-1-product-variants.md](../stories/story-2-4-1-product-variants.md)

---

### Story 2.5: Warehouse Management

**As a** warehouse manager,
**I want** to define warehouses and their storage bin locations,
**So that** inventory can be tracked by specific physical locations.

**Acceptance Criteria:**
1. Warehouse table created: id, name, location, city, status, createdAt
2. POST /api/warehouses creates warehouse
3. GET /api/warehouses returns list of warehouses
4. PUT /api/warehouses/:id updates warehouse details
5. DELETE /api/warehouses/:id soft-deletes (only if no active stock)
6. Frontend Warehouse Management page lists warehouses
7. Frontend allows adding/editing warehouses via modal
8. Bin location tracking is simplified for MVP (stored as string in Product/Inventory)
9. Only Admin and Warehouse Manager can manage warehouses
10. **Warehouse CRUD operations logged in audit trail**

**Story File:** [docs/stories/story-2-5-warehouse-management.md](../stories/story-2-5-warehouse-management.md)

---

### Story 2.6: Stock Receiving from Purchase Orders

**As a** warehouse manager,
**I want** to record receipt of goods from a purchase order,
**So that** inventory is updated and PO is marked as complete.

**Acceptance Criteria:**
1. Inventory table created: id, productId, warehouseId, quantity, batchNo, binLocation, createdAt, updatedAt
2. POST /api/purchase-orders/:id/receive creates stock receipt
3. Receipt includes: warehouseId, receivedDate, items with quantities and bin locations
4. When receipt created, inventory updated: Inventory quantity increased by received quantity
5. If product doesn't exist in warehouse, create new Inventory record
6. If product exists, increment quantity
7. Batch/lot number auto-generated: YYYYMMDD-XXX or manually entered
8. PO status updated to RECEIVED when goods received
9. StockMovement record created (type=RECEIPT, productId, quantity, referenceType=PO, referenceId=poId)
10. GET /api/purchase-orders/:id/can-receive validates PO is ready for receipt
11. Frontend PO detail page includes "Receive Goods" button (if status = IN_TRANSIT or PENDING)
12. Frontend goods receipt form lists PO items with input for bin location per item
13. Frontend shows receipt confirmation with updated inventory
14. Only Warehouse Manager and Admin can record goods receipts
15. **Stock receipt logged in audit trail with before/after quantities**

**Story File:** [docs/stories/story-2-6-stock-receiving.md](../stories/story-2-6-stock-receiving.md)

---

### Story 2.7: Real-Time Inventory Tracking

**As a** warehouse manager,
**I want** to see real-time inventory quantities by product and warehouse,
**So that** I know exactly what stock is available at all times.

**Acceptance Criteria:**
1. GET /api/inventory returns inventory across all warehouses with filters (productId, warehouseId, low stock, out of stock)
2. GET /api/inventory/product/:productId returns stock for specific product across all warehouses
3. GET /api/inventory/warehouse/:warehouseId returns all stock in specific warehouse
4. Inventory quantities updated automatically by stock movements (receipts, sales, adjustments)
5. Stock status calculated: in-stock (qty > reorderLevel), low-stock (qty <= reorderLevel but > 0), out-of-stock (qty = 0)
6. GET /api/inventory/low-stock returns products at or below reorder level
7. Frontend Inventory View displays filterable table: Product | SKU | Warehouse | Bin | Quantity | Status
8. Frontend displays status with color coding (green/yellow/red)
9. Frontend allows searching by SKU or product name
10. Frontend shows last updated timestamp for each inventory record
11. Inventory view updates on data refetch (TanStack Query cache invalidation)
12. All roles can view inventory (read-only for Sales/Recovery, read-write for Warehouse/Admin)

**Story File:** [docs/stories/story-2-7-inventory-tracking.md](../stories/story-2-7-inventory-tracking.md)

---

### Story 2.8: Stock Adjustments

**As a** warehouse manager,
**I want** to record stock adjustments for wastage, damage, or corrections,
**So that** inventory quantities reflect actual physical stock.

**Acceptance Criteria:**
1. POST /api/inventory/adjustment creates stock adjustment
2. Adjustment payload: productId, warehouseId, adjustmentType (WASTAGE/DAMAGE/THEFT/CORRECTION), quantity (+ or -), reason, notes
3. Inventory quantity updated immediately
4. StockMovement record created (type=ADJUSTMENT, quantity, reason)
5. Quantity can be positive (count increase) or negative (count decrease)
6. Stock never goes negative (validation: newQty >= 0)
7. Reason field required (free text explanation)
8. GET /api/inventory/adjustments returns adjustment history with filters
9. Frontend Stock Adjustment page with form: product, warehouse, type, quantity, reason
10. Frontend displays adjustment history with type-specific icons
11. Only Warehouse Manager and Admin can create adjustments
12. **Stock adjustments logged in audit trail with reason**

**Story File:** [docs/stories/story-2-8-stock-adjustments.md](../stories/story-2-8-stock-adjustments.md)

---

### Story 2.9: Stock Movement Audit Trail

**As a** warehouse manager,
**I want** to see complete movement history for any product,
**So that** I can trace exactly when and why quantities changed.

**Acceptance Criteria:**
1. StockMovement table: id, productId, warehouseId, movementType (RECEIPT/SALE/ADJUSTMENT/TRANSFER), quantity, referenceType, referenceId, movementDate, userId, notes
2. Stock movements automatically created for: goods receipt, sales invoice, stock adjustment
3. GET /api/inventory/movements returns movement history with filters (productId, warehouseId, date range, movementType)
4. Movement records are immutable (insert only, no update/delete)
5. Each movement links to source document (PO, invoice, adjustment)
6. Running balance calculated per movement (previous quantity + change = new quantity)
7. Frontend Inventory Movement Report displays: Date | Type | Reference | Quantity In | Quantity Out | Balance | User
8. Frontend allows filtering by product, warehouse, date range
9. Frontend clicking reference number navigates to source document
10. Movement report exportable to Excel
11. All roles can view movement history (read-only)
12. **Stock movements automatically logged (separate from user audit trail)**

**Story File:** [docs/stories/story-2-9-stock-movements.md](../stories/story-2-9-stock-movements.md)

---

### Story 2.10: Supplier Payment Recording

**As an** accountant,
**I want** to record payments made to suppliers and link them to purchase orders,
**So that** supplier balances are tracked and payment history is visible.

**Acceptance Criteria:**
1. Payment table created: id, paymentType (SUPPLIER/CLIENT), referenceType (PO/INVOICE/GENERAL), referenceId, amount, method (CASH/BANK_TRANSFER/CHEQUE), date, notes, recordedBy
2. POST /api/payments/supplier creates supplier payment
3. Payment can be linked to specific PO or treated as advance/general payment
4. Payment method validation (if CHEQUE or BANK_TRANSFER, reference number required)
5. GET /api/payments/supplier returns supplier payment history with filters
6. GET /api/suppliers/:id/payments returns payment history for specific supplier
7. PO outstanding balance calculated: PO totalAmount - sum(payments linked to PO)
8. Frontend Record Supplier Payment page with supplier/PO selection
9. Frontend displays PO outstanding amount when PO selected
10. Accountant and Admin can record supplier payments
11. **Supplier payments logged in audit trail**

**Story File:** [docs/stories/story-2-10-supplier-payments.md](../stories/story-2-10-supplier-payments.md)

---

## Epic 2 Dependencies

- **Epic 1** - Foundation, authentication, audit infrastructure

## Epic 2 Deliverables

✅ Supplier database with contact and payment terms
✅ Purchase order creation with line items
✅ Container tracking (number, ship date, arrival date)
✅ Import cost tracking (shipping, customs, taxes)
✅ Landed cost calculation per product
✅ Product master data with SKU, pricing, categories
✅ Product variant management with flexible attributes
✅ Warehouse management
✅ Stock receiving from POs into inventory
✅ Real-time inventory tracking (per product and per variant)
✅ Stock adjustments for wastage/corrections
✅ Stock movement audit trail
✅ Supplier payment recording
✅ **All operations automatically logged in audit trail**

## Success Criteria

- User can create POs with container details
- System calculates accurate landed cost per product
- Stock receiving updates inventory correctly
- Real-time inventory visibility across warehouses
- Stock movements fully traceable
- Supplier payments tracked

## Links

- **Stories:** [docs/stories/](../stories/) (story-2-1 through story-2-10, story-2-4-1)
- **Architecture:** [docs/architecture/database-schema.md](../architecture/database-schema.md)
- **MVP Roadmap:** [docs/planning/mvp-roadmap.md](../planning/mvp-roadmap.md)

---

## Notes

**Story 2.4.1 (Product Variants)** was added on 2025-11-24 to address the architectural gap in variant management. This story is essential for properly handling products with multiple variations (e.g., faucets with different finishes, sinks with different sizes) which are common in the sanitary ware business.
