# Story 2.3: Import Documentation & Landed Cost Tracking

**Epic:** Epic 2 - Import & Container Tracking + Basic Inventory
**Story ID:** STORY-2.3
**Priority:** High
**Estimated Effort:** 8-10 hours
**Dependencies:** Story 2.2 (Purchase Order Creation)
**Status:** Draft

---

## User Story

**As an** accountant,
**I want** to record import documentation details on purchase orders and calculate landed costs,
**So that** true product costs (product + customs + taxes + shipping) are tracked accurately.

---

## Acceptance Criteria

1. **Database Schema:**
   - [ ] PurchaseOrder table expanded: containerNo, shipDate, arrivalDate
   - [ ] POCost table created: id, poId, type (SHIPPING/CUSTOMS/TAX/OTHER), amount, description, createdAt

2. **Backend API Endpoints:**
   - [ ] POST /api/purchase-orders/:id/costs - Adds additional costs to PO
   - [ ] GET /api/purchase-orders/:id/landed-cost - Returns landed cost breakdown

3. **Landed Cost Calculation:**
   - [ ] For each product in PO:
     - Product Ratio = Product Cost / Total Product Cost
     - Allocated Additional Cost = Sum(Additional Costs) × Product Ratio
     - Landed Cost Per Unit = (Product Cost + Allocated Additional Cost) / Quantity
   - [ ] Import details can be added when PO status = IN_TRANSIT or RECEIVED

4. **Validation:**
   - [ ] All cost fields validated as positive numbers or zero
   - [ ] Container number format validation (optional alphanumeric)

5. **Frontend Pages:**
   - [ ] PO detail page displays import documentation section
   - [ ] Form to add multiple cost types (shipping, customs, tax, etc.)
   - [ ] Landed cost calculation displayed prominently
   - [ ] Cost breakdown shown per product

6. **Authorization:**
   - [ ] Only Accountant and Admin can edit import documentation
   - [ ] All roles can view import costs and landed cost

7. **Audit Logging:**
   - [ ] Import cost updates logged in audit trail

---

## Tasks / Subtasks

### Backend Tasks

- [ ] **Task 1: Database Schema & Migration (AC: 1)**
  - [ ] Add fields to PurchaseOrder: containerNo, shipDate, arrivalDate
  - [ ] Create POCost model: id, poId, type, amount, description, createdAt
  - [ ] Create POCostType enum: SHIPPING, CUSTOMS, TAX, OTHER
  - [ ] Add foreign key: poId references PurchaseOrder
  - [ ] Run migration

- [ ] **Task 2: Landed Cost Calculation Service (AC: 3)**
  - [ ] Create `landed-cost.service.ts` with calculation logic
  - [ ] Implement `calculateLandedCost(poId)` method
  - [ ] Calculate product ratios based on cost
  - [ ] Allocate additional costs proportionally
  - [ ] Calculate landed cost per unit for each product
  - [ ] Return breakdown: productId, productCost, allocatedCost, totalLandedCost, quantity, landedCostPerUnit

- [ ] **Task 3: PO Cost Repository (AC: 2)**
  - [ ] Extend `purchase-orders.repository.ts`
  - [ ] Implement `addCost(poId, costData)` method
  - [ ] Implement `getCosts(poId)` method
  - [ ] Implement `updateImportDetails(poId, details)` method (containerNo, shipDate, arrivalDate)

- [ ] **Task 4: PO Cost Controller & Routes (AC: 2)**
  - [ ] Extend `purchase-orders.controller.ts`
  - [ ] Implement POST /api/purchase-orders/:id/costs
  - [ ] Implement GET /api/purchase-orders/:id/landed-cost
  - [ ] Implement PATCH /api/purchase-orders/:id/import-details (update container info)
  - [ ] Validate PO status (must be IN_TRANSIT or RECEIVED to add costs)
  - [ ] Add routes to `purchase-orders.routes.ts`

- [ ] **Task 5: Validation & Business Logic (AC: 3, 4)**
  - [ ] Validate cost amount > 0
  - [ ] Validate cost type is valid enum value
  - [ ] Validate PO exists and status allows import cost addition
  - [ ] Container number format validation (alphanumeric, optional dashes/slashes)

- [ ] **Task 6: Authorization Middleware (AC: 6)**
  - [ ] POST /api/purchase-orders/:id/costs - Admin, Accountant only
  - [ ] PATCH /api/purchase-orders/:id/import-details - Admin, Accountant only
  - [ ] GET endpoints - All authenticated users

- [ ] **Task 7: Audit Logging Integration (AC: 7)**
  - [ ] Log IMPORT_COST_ADDED with cost type, amount, description
  - [ ] Log IMPORT_DETAILS_UPDATED with container number, dates

### Frontend Tasks

- [ ] **Task 8: Import Cost Types & API Client (AC: 2, 5)**
  - [ ] Create types in `purchase-order.types.ts`: POCost, POCostType, LandedCostBreakdown
  - [ ] Extend `purchaseOrdersService.ts`:
    - [ ] `addCost(poId, costData)` method
    - [ ] `getLandedCost(poId)` method
    - [ ] `updateImportDetails(poId, details)` method
  - [ ] Create TanStack Query hooks: `useAddPOCost`, `useLandedCost`

- [ ] **Task 9: Import Documentation Section (AC: 5)**
  - [ ] Create `ImportDocumentationSection.tsx` component
  - [ ] Display in PO detail page when status = IN_TRANSIT or RECEIVED
  - [ ] Form fields: Container Number, Ship Date, Arrival Date
  - [ ] "Save Import Details" button
  - [ ] Display existing import details when present

- [ ] **Task 10: Additional Costs Component (AC: 5)**
  - [ ] Create `POAdditionalCostsTable.tsx` component
  - [ ] Display existing costs in table: Type | Amount | Description | Date Added
  - [ ] "Add Cost" button opens modal/form
  - [ ] Form fields: Cost Type (dropdown), Amount (number input), Description (text input)
  - [ ] Submit handler calls `addCost` mutation
  - [ ] Display total additional costs at bottom

- [ ] **Task 11: Landed Cost Display (AC: 5)**
  - [ ] Create `LandedCostBreakdown.tsx` component
  - [ ] Fetch landed cost data when costs exist
  - [ ] Display summary card:
    - [ ] Total Product Cost
    - [ ] Total Additional Costs (Shipping + Customs + Tax + Other)
    - [ ] Grand Total
  - [ ] Display per-product breakdown table:
    - [ ] Product | Quantity | Product Cost | Allocated Additional Cost | Total Landed Cost | Landed Cost Per Unit
  - [ ] Highlight landed cost per unit (important metric)

- [ ] **Task 12: Role-Based UI (AC: 6)**
  - [ ] Show "Add Cost" button only for Admin/Accountant
  - [ ] Show "Edit Import Details" button only for Admin/Accountant
  - [ ] All roles can view costs and landed cost breakdown

### Testing Tasks

- [ ] **Task 13: Backend Tests**
  - [ ] Unit test for landed cost calculation logic
  - [ ] Test proportional allocation of additional costs
  - [ ] Test POST /api/purchase-orders/:id/costs
  - [ ] Test GET /api/purchase-orders/:id/landed-cost
  - [ ] Test validation: cost amount > 0
  - [ ] Test validation: PO status allows cost addition
  - [ ] Test audit logging

- [ ] **Task 14: Frontend Tests**
  - [ ] Component test for `POAdditionalCostsTable` (add cost, display list)
  - [ ] Component test for `LandedCostBreakdown` (display calculation)
  - [ ] Test role-based button visibility

---

## Dev Notes

### Database Schema (Prisma)

```prisma
model PurchaseOrder {
  id                  String   @id @default(cuid())
  poNumber            String   @unique
  supplierId          String
  orderDate           DateTime
  expectedArrivalDate DateTime?

  // Import documentation fields (Story 2.3)
  containerNo         String?
  shipDate            DateTime?
  arrivalDate         DateTime?

  status              POStatus @default(PENDING)
  totalAmount         Decimal  @db.Decimal(12, 2)
  notes               String?  @db.Text

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  supplier            Supplier @relation(fields: [supplierId], references: [id])
  items               POItem[]
  costs               POCost[] // Story 2.3

  @@map("purchase_orders")
}

model POCost {
  id          String     @id @default(cuid())
  poId        String
  type        POCostType
  amount      Decimal    @db.Decimal(10, 2)
  description String?    @db.Text

  createdAt   DateTime   @default(now())

  purchaseOrder PurchaseOrder @relation(fields: [poId], references: [id], onDelete: Cascade)

  @@map("po_costs")
}

enum POCostType {
  SHIPPING
  CUSTOMS
  TAX
  OTHER
}
```

### Backend Architecture

**Location:** `apps/api/src/modules/purchase-orders/`

**Files to Create/Modify:**
- `landed-cost.service.ts` - Landed cost calculation logic (new)
- `purchase-orders.repository.ts` - Add cost methods (extend)
- `purchase-orders.controller.ts` - Add cost endpoints (extend)
- `purchase-orders.routes.ts` - Add cost routes (extend)
- `dto/add-po-cost.dto.ts` - Zod schema for adding costs (new)
- `dto/update-import-details.dto.ts` - Zod schema for import details (new)

**Landed Cost Calculation Algorithm:**

```typescript
interface LandedCostBreakdown {
  productId: string;
  productName: string;
  quantity: number;
  productCost: number;
  productRatio: number; // Percentage of total product cost
  allocatedAdditionalCost: number;
  totalLandedCost: number;
  landedCostPerUnit: number;
}

interface LandedCostResult {
  totalProductCost: number;
  totalAdditionalCosts: number;
  grandTotal: number;
  breakdown: LandedCostBreakdown[];
}

async function calculateLandedCost(poId: string): Promise<LandedCostResult> {
  // 1. Fetch PO with items and costs
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: poId },
    include: {
      items: { include: { product: true } },
      costs: true
    }
  });

  if (!po) throw new NotFoundError('Purchase order not found');

  // 2. Calculate total product cost (sum of all line items)
  const totalProductCost = po.items.reduce((sum, item) =>
    sum + parseFloat(item.totalCost.toString()), 0
  );

  // 3. Calculate total additional costs (sum of all POCost records)
  const totalAdditionalCosts = po.costs.reduce((sum, cost) =>
    sum + parseFloat(cost.amount.toString()), 0
  );

  // 4. Calculate landed cost per product
  const breakdown: LandedCostBreakdown[] = po.items.map(item => {
    const productCost = parseFloat(item.totalCost.toString());
    const productRatio = totalProductCost > 0 ? productCost / totalProductCost : 0;
    const allocatedAdditionalCost = totalAdditionalCosts * productRatio;
    const totalLandedCost = productCost + allocatedAdditionalCost;
    const landedCostPerUnit = totalLandedCost / item.quantity;

    return {
      productId: item.productId,
      productName: item.product.name,
      quantity: item.quantity,
      productCost,
      productRatio,
      allocatedAdditionalCost,
      totalLandedCost,
      landedCostPerUnit
    };
  });

  return {
    totalProductCost,
    totalAdditionalCosts,
    grandTotal: totalProductCost + totalAdditionalCosts,
    breakdown
  };
}
```

**Example Calculation:**

```
Purchase Order PO-2025-001:
  Line Items:
    - Product A: 100 units × $10 = $1,000
    - Product B: 50 units × $20 = $1,000
  Total Product Cost: $2,000

  Additional Costs:
    - Shipping: $200
    - Customs: $100
    - Tax: $100
  Total Additional Costs: $400

  Landed Cost Calculation:
    Product A:
      - Product Ratio: $1,000 / $2,000 = 50%
      - Allocated Additional Cost: $400 × 50% = $200
      - Total Landed Cost: $1,000 + $200 = $1,200
      - Landed Cost Per Unit: $1,200 / 100 = $12.00

    Product B:
      - Product Ratio: $1,000 / $2,000 = 50%
      - Allocated Additional Cost: $400 × 50% = $200
      - Total Landed Cost: $1,000 + $200 = $1,200
      - Landed Cost Per Unit: $1,200 / 50 = $24.00
```

**Validation:**

```typescript
const addPOCostSchema = z.object({
  type: z.enum(['SHIPPING', 'CUSTOMS', 'TAX', 'OTHER']),
  amount: z.number().positive('Amount must be greater than 0'),
  description: z.string().optional()
});

const updateImportDetailsSchema = z.object({
  containerNo: z.string().regex(/^[A-Z0-9-/]*$/i, 'Invalid container number format').optional(),
  shipDate: z.date().optional(),
  arrivalDate: z.date().optional()
});
```

**Business Rules:**

1. Import costs can only be added when PO status is IN_TRANSIT or RECEIVED
2. Container number format: alphanumeric with optional dashes/slashes (e.g., ABCD1234567, CONT-2025-001)
3. Landed cost is calculated in real-time (not stored)
4. All costs are immutable once added (no update/delete for audit integrity)

### Frontend Architecture

**Location:** `apps/web/src/features/purchase-orders/`

**Files to Create/Modify:**
- `components/ImportDocumentationSection.tsx` - Import details form (new)
- `components/POAdditionalCostsTable.tsx` - Additional costs display/add (new)
- `components/LandedCostBreakdown.tsx` - Landed cost calculation display (new)
- `components/AddCostModal.tsx` - Modal to add new cost (new)
- `pages/PurchaseOrderDetailPage.tsx` - Add import documentation sections (extend)

**Import Documentation Section UI:**

```tsx
// Displayed when PO status = IN_TRANSIT or RECEIVED
<ImportDocumentationSection po={po}>
  <Form>
    <Input label="Container Number" name="containerNo" />
    <DatePicker label="Ship Date" name="shipDate" />
    <DatePicker label="Arrival Date" name="arrivalDate" />
    <Button>Save Import Details</Button>
  </Form>

  <POAdditionalCostsTable poId={po.id} costs={po.costs}>
    {/* Display existing costs */}
    <Button onClick={openAddCostModal}>+ Add Cost</Button>
  </POAdditionalCostsTable>

  <LandedCostBreakdown poId={po.id}>
    {/* Display landed cost calculation */}
  </LandedCostBreakdown>
</ImportDocumentationSection>
```

**TanStack Query Hooks:**

```typescript
export const useAddPOCost = (poId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddPOCostDto) => purchaseOrdersService.addCost(poId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrder', poId] });
      queryClient.invalidateQueries({ queryKey: ['landedCost', poId] });
      toast.success('Additional cost added successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add cost');
    },
  });
};

export const useLandedCost = (poId: string) => {
  return useQuery({
    queryKey: ['landedCost', poId],
    queryFn: () => purchaseOrdersService.getLandedCost(poId),
    enabled: !!poId, // Only fetch when poId exists
    staleTime: 60 * 1000, // 1 minute
  });
};
```

**Landed Cost Display Component:**

```tsx
export const LandedCostBreakdown: FC<{ poId: string }> = ({ poId }) => {
  const { data: landedCost, isLoading } = useLandedCost(poId);

  if (isLoading) return <Spinner />;
  if (!landedCost) return null;

  return (
    <Card>
      <h3>Landed Cost Summary</h3>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Product Cost" value={landedCost.totalProductCost} />
        <StatCard label="Additional Costs" value={landedCost.totalAdditionalCosts} />
        <StatCard label="Grand Total" value={landedCost.grandTotal} highlight />
      </div>

      {/* Per-Product Breakdown */}
      <Table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Qty</th>
            <th>Product Cost</th>
            <th>Allocated Additional Cost</th>
            <th>Total Landed Cost</th>
            <th>Landed Cost Per Unit</th>
          </tr>
        </thead>
        <tbody>
          {landedCost.breakdown.map(item => (
            <tr key={item.productId}>
              <td>{item.productName}</td>
              <td>{item.quantity}</td>
              <td>${item.productCost.toFixed(2)}</td>
              <td>${item.allocatedAdditionalCost.toFixed(2)}</td>
              <td>${item.totalLandedCost.toFixed(2)}</td>
              <td className="font-bold text-blue-600">
                ${item.landedCostPerUnit.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Card>
  );
};
```

### Authorization

**Roles with Access:**
- **Admin**: Full access (add costs, edit import details)
- **Accountant**: Full access (add costs, edit import details)
- **Warehouse Manager**: Read-only (view costs, view landed cost)
- **Sales Officer**: Read-only
- **Recovery Agent**: Read-only

### Audit Logging

**Events to Log:**
- `IMPORT_COST_ADDED` - Cost type, amount, description, PO number
- `IMPORT_DETAILS_UPDATED` - Container number, ship date, arrival date

---

## Testing

### Backend Testing

**Test File Location:** `apps/api/src/modules/purchase-orders/landed-cost.service.test.ts`

**Test Cases:**
1. **Landed Cost Calculation**
   - ✓ Calculates product ratios correctly
   - ✓ Allocates additional costs proportionally
   - ✓ Calculates landed cost per unit correctly
   - ✓ Handles zero additional costs (landed cost = product cost)
   - ✓ Handles single product PO (100% ratio)

2. **POST /api/purchase-orders/:id/costs**
   - ✓ Adds cost with valid data
   - ✓ Returns 400 for negative amount
   - ✓ Returns 400 for invalid cost type
   - ✓ Returns 400 if PO status = PENDING (not yet shipped)
   - ✓ Returns 403 for unauthorized role (Warehouse Manager)
   - ✓ Creates audit log entry

3. **GET /api/purchase-orders/:id/landed-cost**
   - ✓ Returns correct calculation with multiple products and costs
   - ✓ Returns correct calculation with no additional costs
   - ✓ Returns 404 for non-existent PO

### Frontend Testing

**Test File Location:** `apps/web/src/features/purchase-orders/components/LandedCostBreakdown.test.tsx`

**Test Cases:**
1. **LandedCostBreakdown Component**
   - ✓ Displays summary with correct totals
   - ✓ Displays per-product breakdown table
   - ✓ Highlights landed cost per unit
   - ✓ Shows loading spinner while fetching data

2. **POAdditionalCostsTable Component**
   - ✓ Displays existing costs in table
   - ✓ "Add Cost" button visible for Admin/Accountant
   - ✓ "Add Cost" button hidden for other roles
   - ✓ Opens modal when "Add Cost" clicked
   - ✓ Adds cost and refreshes list on success

---

## Change Log

| Date       | Version | Description                     | Author |
|------------|---------|--------------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation          | Sarah (Product Owner) |

---

## Dev Agent Record

*This section will be populated by the development agent during implementation.*

### Agent Model Used

*To be filled by dev agent*

### Debug Log References

*To be filled by dev agent*

### Completion Notes

*To be filled by dev agent*

### File List

*To be filled by dev agent*

---

## QA Results

*This section will be populated by the QA agent after testing.*
