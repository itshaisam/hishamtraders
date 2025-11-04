# Epic 6: Advanced Inventory Operations

**Epic Goal:** Implement advanced inventory management features including configurable gate pass system for controlled outbound movements, stock transfers between warehouses, detailed bin location tracking, batch/lot management with expiry alerts, and comprehensive inventory controls. This epic provides complete inventory lifecycle management with full traceability.

**Timeline:** Phase 2 (Post-MVP, estimated 3-4 weeks)

**Status:** PHASE 2 - Not included in 6-week MVP

**Dependencies:** Epic 1, 2 (MVP inventory must be operational)

---

## Overview

The MVP provides **basic inventory tracking** (stock receiving, adjustments, movements). Phase 2 adds **advanced controls and workflows** for precise warehouse management, multi-warehouse operations, and gate pass authorization.

### What's Missing in MVP:
- ❌ Gate pass system (authorization for goods leaving warehouse)
- ❌ Stock transfers between warehouses
- ❌ Detailed bin location management (add/edit bins within warehouses)
- ❌ Bin-to-bin transfers within same warehouse
- ❌ Batch/lot tracking with expiry date alerts
- ❌ Stock write-off workflows (wastage approval)
- ❌ Physical stock count/cycle counting
- ❌ Stock reservation for pending orders

### What Phase 2 Adds:
✅ Gate pass system with configurable approval (auto/manual per warehouse)
✅ Stock transfer workflow between warehouses
✅ Bin location CRUD within warehouses
✅ Bin-to-bin transfers
✅ Batch/lot expiry tracking and alerts
✅ Stock adjustment approval workflows
✅ Physical count reconciliation
✅ Stock reservation for sales orders

---

## Stories

### Story 6.1: Gate Pass System - Configuration

**As a** warehouse manager,
**I want** to configure gate pass generation mode per warehouse (automatic or manual approval),
**So that** I can control authorization levels based on warehouse security requirements.

**Acceptance Criteria:**
1. Warehouse table expanded: gatePassMode (AUTO/MANUAL), default AUTO
2. PUT /api/warehouses/:id/gate-pass-config updates gatePassMode
3. GatePass table created: id, gatePassNumber (unique, sequential per warehouse), warehouseId, date, purpose (SALE/TRANSFER/RETURN/OTHER), referenceType (INVOICE/TRANSFER/ADJUSTMENT), referenceId, status (PENDING/APPROVED/IN_TRANSIT/COMPLETED/CANCELLED), issuedBy, approvedBy, notes, createdAt
4. GatePassItem table: id, gatePassId, productId, batchNo, binLocation, quantity, description
5. Gate pass number format: GP-{WarehouseCode}-YYYYMMDD-XXX (e.g., GP-WH1-20250115-001)
6. When warehouse gatePassMode = AUTO:
   - Gate pass created automatically when invoice/transfer saved
   - Status = APPROVED immediately
   - Inventory deducted when gate pass created
7. When warehouse gatePassMode = MANUAL:
   - Gate pass created with status = PENDING
   - Requires explicit approval before goods can leave
   - Inventory deducted when status changes to IN_TRANSIT
8. Frontend Warehouse Settings page includes gate pass mode toggle
9. Only Admin and Warehouse Manager can configure gate pass mode
10. **Gate pass configuration changes logged in audit trail**

**Story File:** [docs/stories/story-6-1-gate-pass-config.md](../stories/story-6-1-gate-pass-config.md)

---

### Story 6.2: Gate Pass Creation

**As a** warehouse manager,
**I want** to create gate passes for outbound shipments,
**So that** all goods leaving the warehouse are properly authorized and documented.

**Acceptance Criteria:**
1. **Automatic creation from invoice** (Epic 3.2 integration):
   - When invoice saved, gate pass auto-created if invoice includes warehouse items
   - Gate pass linked to invoice (referenceType=INVOICE, referenceId=invoiceId)
   - Gate pass items match invoice items (product, quantity, batch, bin)
   - Status = APPROVED if gatePassMode=AUTO, PENDING if MANUAL
2. **Manual gate pass creation:**
   - POST /api/gate-passes creates gate pass
   - Purpose dropdown: SALE, TRANSFER, RETURN, OTHER
   - Can create standalone gate pass (not linked to invoice/transfer)
3. GET /api/gate-passes returns gate pass list with filters (warehouseId, status, date range, purpose)
4. GET /api/gate-passes/:id returns gate pass details with items
5. Frontend Gate Pass Management page lists passes with status badges
6. Frontend displays gate pass items table (product, batch, bin, quantity)
7. Frontend "Create Gate Pass" form (manual creation)
8. Frontend shows linked invoice/transfer if applicable
9. Warehouse Manager and Admin can create gate passes
10. **Gate pass creation logged in audit trail**

**Story File:** [docs/stories/story-6-2-gate-pass-creation.md](../stories/story-6-2-gate-pass-creation.md)

---

### Story 6.3: Gate Pass Approval and Status Tracking

**As a** warehouse manager,
**I want** to approve pending gate passes and track their status through completion,
**So that** only authorized shipments leave the warehouse.

**Acceptance Criteria:**
1. PUT /api/gate-passes/:id/approve changes status PENDING → APPROVED (manual mode only)
2. PUT /api/gate-passes/:id/dispatch changes status APPROVED → IN_TRANSIT
   - **Inventory deducted when dispatched** (if not already deducted)
   - StockMovement records created (type=GATE_PASS_OUT)
3. PUT /api/gate-passes/:id/complete changes status IN_TRANSIT → COMPLETED
   - Timestamp recorded for delivery confirmation
4. PUT /api/gate-passes/:id/cancel cancels gate pass (only if status = PENDING or APPROVED)
   - If inventory already deducted, restore stock
5. Status workflow validation: cannot skip statuses (PENDING → APPROVED → IN_TRANSIT → COMPLETED)
6. Status changes logged with timestamp and user
7. GET /api/gate-passes/pending returns pending approvals for warehouse managers
8. **Alert created for Warehouse Manager when gate passes await approval** (manual mode)
9. Frontend displays gate pass status with visual workflow indicator (stepper/timeline)
10. Frontend action buttons conditional on status (Approve, Dispatch, Complete, Cancel)
11. Frontend displays who issued, approved, dispatched gate pass with timestamps
12. Frontend "Print Gate Pass" button (PDF or browser print)
13. Only Warehouse Manager and Admin can approve/dispatch gate passes
14. **All status changes logged in audit trail**

**Story File:** [docs/stories/story-6-3-gate-pass-approval.md](../stories/story-6-3-gate-pass-approval.md)

---

### Story 6.4: Stock Transfer Between Warehouses

**As a** warehouse manager,
**I want** to transfer inventory from one warehouse to another,
**So that** stock can be redistributed based on demand.

**Acceptance Criteria:**
1. StockTransfer table: id, transferNumber, fromWarehouseId, toWarehouseId, transferDate, status (PENDING/APPROVED/IN_TRANSIT/RECEIVED/CANCELLED), requestedBy, approvedBy, receivedBy, notes, createdAt
2. StockTransferItem table: id, transferId, productId, batchNo, fromBinLocation, toBinLocation, quantity
3. POST /api/stock-transfers creates transfer request with items
4. Transfer number format: ST-YYYYMMDD-XXX
5. Status workflow: PENDING → APPROVED → IN_TRANSIT → RECEIVED
6. When status = APPROVED:
   - **Gate pass auto-created for source warehouse** (purpose=TRANSFER)
   - Gate pass status follows gate pass workflow
7. When status = IN_TRANSIT (gate pass dispatched):
   - Inventory decremented from source warehouse
   - StockMovement created (type=TRANSFER_OUT, warehouseId=fromWarehouseId)
8. When status = RECEIVED (destination warehouse confirms receipt):
   - Inventory incremented at destination warehouse
   - StockMovement created (type=TRANSFER_IN, warehouseId=toWarehouseId)
   - Batch/lot tracking maintained across transfer
9. PUT /api/stock-transfers/:id/approve approves transfer (Warehouse Manager or Admin)
10. PUT /api/stock-transfers/:id/receive completes transfer at destination
11. GET /api/stock-transfers returns transfer list with filters (warehouseId, status, date range)
12. Frontend Stock Transfer page lists pending, in-transit, completed transfers
13. Frontend Create Transfer form: select source/destination warehouses, add items with quantities and bins
14. Frontend displays transfer status with progress indicator
15. Frontend destination warehouse can view incoming transfers and mark as received
16. Only Warehouse Manager and Admin can create/approve transfers
17. **Stock transfers logged in audit trail**

**Story File:** [docs/stories/story-6-4-stock-transfers.md](../stories/story-6-4-stock-transfers.md)

---

### Story 6.5: Bin Location Management

**As a** warehouse manager,
**I want** to define and manage bin locations within warehouses,
**So that** products can be stored in specific physical locations for efficient picking.

**Acceptance Criteria:**
1. BinLocation table: id, warehouseId, code (unique within warehouse), aisle, rack, shelf, capacity, description, status (ACTIVE/INACTIVE), createdAt
2. Bin code format: {Aisle}-{Rack}-{Shelf} (e.g., A-01-05 means Aisle A, Rack 01, Shelf 05)
3. POST /api/warehouses/:id/bins creates bin location within warehouse
4. GET /api/warehouses/:id/bins returns all bins for a warehouse with current stock info
5. GET /api/bins/:id returns bin details with products stored in it
6. PUT /api/bins/:id updates bin details (code, capacity, description)
7. DELETE /api/bins/:id soft-deletes bin (only if no active stock assigned)
8. Bin code validated (no duplicates within same warehouse)
9. Capacity optional (integer representing max quantity or volume)
10. Frontend Warehouse detail page includes Bin Management section
11. Frontend displays bins in grid or list view with stock utilization
12. Frontend "Add Bin" modal with code format guidance
13. Frontend shows products currently stored in each bin
14. Frontend supports bulk bin creation (CSV upload optional)
15. Only Admin and Warehouse Manager can manage bins
16. **Bin CRUD operations logged in audit trail**

**Story File:** [docs/stories/story-6-5-bin-management.md](../stories/story-6-5-bin-management.md)

---

### Story 6.6: Bin-to-Bin Transfer Within Warehouse

**As a** warehouse manager,
**I want** to move stock from one bin location to another within the same warehouse,
**So that** warehouse organization can be optimized.

**Acceptance Criteria:**
1. POST /api/inventory/bin-transfer creates bin transfer
2. Payload: productId, warehouseId, fromBinLocation, toBinLocation, quantity, batchNo, reason
3. Validation: sufficient stock in source bin
4. Inventory record updated: bin location changed for specified quantity
5. StockMovement record created (type=BIN_TRANSFER, notes include from/to bins)
6. Quantity remains the same (no gain/loss, just location change)
7. GET /api/inventory/bin-transfers returns bin transfer history
8. Frontend Bin Transfer page:
   - Select warehouse
   - Select product
   - Display current bin locations with quantities
   - Select source bin, destination bin, quantity
   - Enter reason
   - Submit transfer
9. Frontend displays bin transfer history with before/after bin locations
10. Only Warehouse Manager and Admin can perform bin transfers
11. **Bin transfers logged in audit trail**

**Story File:** [docs/stories/story-6-6-bin-transfers.md](../stories/story-6-6-bin-transfers.md)

---

### Story 6.7: Batch/Lot Tracking with Expiry Alerts

**As a** warehouse manager,
**I want** to track batch numbers and expiry dates for products,
**So that** we can use FIFO and avoid selling expired goods.

**Acceptance Criteria:**
1. Inventory table expanded: expiryDate (nullable)
2. Product table expanded: hasExpiry (boolean, default false), shelfLifeDays (integer, nullable)
3. When receiving stock (Epic 2.6), if product.hasExpiry = true:
   - Prompt for expiry date or auto-calculate: receivedDate + shelfLifeDays
   - Expiry date stored per batch in Inventory table
4. GET /api/inventory/expiring returns products expiring within X days (default 60)
5. **Automated daily job checks for near-expiry products:**
   - Products expiring within 60 days: create LOW_PRIORITY alert
   - Products expiring within 30 days: create MEDIUM_PRIORITY alert
   - Products expiring within 7 days: create HIGH_PRIORITY alert
   - Products expired: create CRITICAL alert
6. When creating invoice (Epic 3.2), **FIFO stock deduction considers expiry:**
   - Deduct from batches with earliest expiry date first
   - Warn if selecting batch expiring within 30 days
   - Block sale of expired batches (expiryDate < today)
7. GET /api/inventory/:id/batches returns all batches for a product with expiry info
8. Frontend Inventory View displays expiry date column
9. Frontend color-codes expiry status:
   - Green: > 60 days
   - Yellow: 30-60 days
   - Orange: 7-30 days
   - Red: < 7 days or expired
10. Frontend Expiring Stock page lists products approaching expiry
11. Dashboard displays "Near Expiry" widget with count
12. Only Warehouse Manager can configure product expiry settings
13. **Expiry date changes logged in audit trail**

**Story File:** [docs/stories/story-6-7-batch-expiry-tracking.md](../stories/story-6-7-batch-expiry-tracking.md)

---

### Story 6.8: Stock Adjustment Approval Workflow

**As an** admin,
**I want** stock adjustments to require approval for large quantities,
**So that** inventory shrinkage is properly authorized.

**Acceptance Criteria:**
1. System configuration: adjustmentApprovalThreshold (e.g., adjustments > 100 units or > $1000 value require approval)
2. StockAdjustment table expanded: status (PENDING/APPROVED/REJECTED), approvedBy, approvedAt
3. POST /api/inventory/adjustment creates adjustment:
   - If value < threshold: status = APPROVED (immediately applied)
   - If value >= threshold: status = PENDING (awaits approval)
4. PUT /api/inventory/adjustments/:id/approve approves adjustment:
   - Changes status to APPROVED
   - Applies inventory change
   - Creates StockMovement record
5. PUT /api/inventory/adjustments/:id/reject rejects adjustment (no inventory change)
6. GET /api/inventory/adjustments/pending returns pending adjustments for Admin
7. **Alert created for Admin when adjustments await approval**
8. Frontend Stock Adjustment form displays "Requires Approval" notice if over threshold
9. Frontend Pending Adjustments page (Admin only) shows approval queue
10. Frontend approval modal displays: product, type, quantity, value, reason, requested by
11. Only Admin can approve/reject adjustments
12. **Adjustment approvals logged in audit trail**

**Story File:** [docs/stories/story-6-8-adjustment-approval.md](../stories/story-6-8-adjustment-approval.md)

---

### Story 6.9: Physical Stock Count / Cycle Counting

**As a** warehouse manager,
**I want** to perform physical stock counts and reconcile with system records,
**So that** inventory accuracy is maintained.

**Acceptance Criteria:**
1. StockCount table: id, countNumber, warehouseId, countDate, countType (FULL/CYCLE), status (IN_PROGRESS/COMPLETED), countedBy, createdAt
2. StockCountItem table: id, stockCountId, productId, binLocation, batchNo, systemQty, countedQty, variance, notes
3. POST /api/stock-counts creates stock count session
4. GET /api/stock-counts/:id/items returns items to count (from Inventory table)
5. PUT /api/stock-counts/:id/items/:itemId updates counted quantity
6. Variance calculated: countedQty - systemQty
7. When count COMPLETED:
   - For each item with variance, create StockAdjustment (type=PHYSICAL_COUNT)
   - Update inventory quantities
   - Generate variance report
8. GET /api/stock-counts/:id/report generates count report showing variances
9. Frontend Stock Count page:
   - Create new count (full or cycle - select products)
   - Display items with system qty
   - Input counted qty
   - Highlight variances (red if significant)
   - Complete count button
10. Frontend variance report shows items with discrepancies
11. Frontend allows adding notes per item (e.g., "damaged units found")
12. Only Warehouse Manager and Admin can perform stock counts
13. **Stock count completion logged in audit trail**

**Story File:** [docs/stories/story-6-9-physical-count.md](../stories/story-6-9-physical-count.md)

---

### Story 6.10: Gate Pass Reports

**As a** warehouse manager,
**I want** gate pass reports showing issued, pending, and completed passes,
**So that** outbound shipment tracking is complete.

**Acceptance Criteria:**
1. GET /api/reports/gate-passes generates gate pass report
2. Filters: warehouseId, status, date range, purpose, referenceType
3. Report shows: Gate Pass #, Date, Purpose, Reference (invoice/transfer #), Status, Issued By, Approved By, Items Count, Total Quantity
4. GET /api/reports/gate-passes/:id/details returns item-wise details for specific gate pass
5. Report sortable by date, status, warehouse
6. Report exportable to Excel
7. Frontend Gate Pass Reports page with comprehensive filters
8. Frontend displays gate pass list with action buttons (View Details, Print)
9. Frontend allows clicking gate pass # to view full details
10. Frontend clicking reference # navigates to source document (invoice, transfer)
11. All roles can view gate pass reports (read-only for non-warehouse roles)

**Story File:** [docs/stories/story-6-10-gate-pass-reports.md](../stories/story-6-10-gate-pass-reports.md)

---

## Epic 6 Dependencies

- **Epic 1, 2** - MVP inventory and audit infrastructure
- **Epic 3** - Sales invoices (trigger gate passes)

## Epic 6 Deliverables

✅ Gate pass system with configurable approval (auto/manual per warehouse)
✅ Gate pass creation, approval, and status tracking
✅ Stock transfer workflow between warehouses
✅ Bin location CRUD and management
✅ Bin-to-bin transfers within warehouses
✅ Batch/lot expiry tracking with alerts
✅ FIFO enforcement considering expiry dates
✅ Stock adjustment approval workflows
✅ Physical stock count and cycle counting
✅ Gate pass reports
✅ **All operations logged in audit trail**

## Success Criteria

- Gate passes control all outbound movements
- Stock transfers work seamlessly between warehouses
- Bin locations tracked accurately
- Expiry alerts prevent selling expired goods
- Stock counts reconcile system vs physical inventory
- Large adjustments require approval
- Gate pass reports provide complete visibility

## Links

- **Stories:** [docs/stories/](../stories/) (story-6-1 through story-6-10)
- **Architecture:** [docs/architecture/database-schema.md](../architecture/database-schema.md)
- **Phase 2 Roadmap:** [docs/planning/phase-2-roadmap.md](../planning/phase-2-roadmap.md)
