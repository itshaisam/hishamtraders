# Story 3.5: Tax Calculation on Sales

**Epic:** Epic 3 - Sales & Client Management + Payments
**Story ID:** STORY-3.5
**Priority:** Medium
**Estimated Effort:** 4-6 hours
**Dependencies:** Story 3.2 (Sales Invoice Creation)
**Status:** Draft

---

## User Story

**As an** accountant,
**I want** sales tax to be automatically calculated on invoices,
**So that** tax compliance is maintained and tax reporting is accurate.

---

## Acceptance Criteria

1. **System Configuration:**
   - [ ] Default sales tax rate stored in configuration (e.g., 17% for Pakistan GST)
   - [ ] Tax rate configurable by Admin through settings page (only one global rate for MVP)
   - [ ] Tax rate validation: 0-100%
   - [ ] Tax rate changes apply only to NEW invoices, not retroactively to old invoices

2. **Integration with Story 3.2:**
   - [ ] **Tax is calculated AND applied in Story 3.2 (Sales Invoice Creation), NOT here**
   - [ ] This story (3.5) provides the configuration and reporting infrastructure
   - [ ] Tax calculation responsibility: Story 3.2 uses config from 3.5
   - [ ] No separate tax creation step required

3. **Client Tax Exemption:**
   - [ ] Client model has `taxExempt` boolean field (default: false)
   - [ ] Tax-exempt clients have 0% tax applied automatically in Story 3.2
   - [ ] Tax exemption reason optional field on client (free text)

4. **Invoice Tax Calculation:**
   - [ ] Tax calculated on subtotal (sum of line items)
   - [ ] Formula: taxAmount = subtotal × (taxRate / 100)
   - [ ] Invoice total = subtotal + taxAmount
   - [ ] Tax rate SNAPSHOT at creation time (stored on invoice for historical accuracy)
   - [ ] **Rounding: Round to nearest cent using standard banker's rounding**

5. **Tax Exemption Validation:**
   - [ ] Tax exemption field is informational only for MVP (no certificate validation)
   - [ ] Admin responsible for ensuring exemptions are valid

6. **No Tax Override:**
   - [ ] **For MVP: Tax override NOT allowed (removed from AC)**
   - [ ] Tax amount calculated by Story 3.2 formula, not adjustable

7. **Tax Reporting:**
   - [ ] GET /api/reports/tax-summary endpoint
   - [ ] Returns total tax collected for date range
   - [ ] Group by tax rate (supports historical rate changes)

---

## Tasks / Subtasks

### Backend Tasks

- [ ] **Task 1: Configuration Model (AC: 1)**
  - [ ] Create Configuration model with key-value pairs
  - [ ] Seed default tax rate (e.g., TAX_RATE_DEFAULT = 17)
  - [ ] Create getter/setter methods for configuration

- [ ] **Task 2: Extend Client Model (AC: 2)**
  - [ ] Add `taxExempt` boolean field (default: false)
  - [ ] Add `taxExemptReason` string field (optional)
  - [ ] Run migration

- [ ] **Task 3: Extend Invoice Model (AC: 3, 5)**
  - [ ] Add `taxRate` decimal field (snapshot of rate at creation)
  - [ ] Add `taxOverride` boolean field (default: false)
  - [ ] Add `taxOverrideReason` string field (optional)
  - [ ] Tax field already exists (from Story 3.2)

- [ ] **Task 4: Tax Calculation Service (AC: 3)**
  - [ ] Create `tax-calculation.service.ts`
  - [ ] Implement `calculateTax(subtotal, clientId)` method
  - [ ] Check if client is tax-exempt
  - [ ] Apply default tax rate or 0%
  - [ ] Return: taxAmount, taxRate, isTaxExempt

- [ ] **Task 5: Invoice Creation Integration (AC: 3)**
  - [ ] Update invoice creation to call tax calculation service
  - [ ] Allow manual tax override with reason
  - [ ] Store taxRate used on invoice

- [ ] **Task 6: Tax Report Endpoint (AC: 6)**
  - [ ] Create `tax-report.controller.ts`
  - [ ] Implement GET /api/reports/tax-summary
  - [ ] Accept date range filters
  - [ ] Group by tax rate
  - [ ] Return total tax collected

- [ ] **Task 7: Configuration Endpoints (AC: 1)**
  - [ ] Create `configuration.controller.ts`
  - [ ] Implement GET /api/configuration/tax-rate
  - [ ] Implement PUT /api/configuration/tax-rate (Admin only)
  - [ ] Validate rate 0-100

### Frontend Tasks

- [ ] **Task 8: Tax Configuration Page (AC: 1)**
  - [ ] Create `TaxSettingsPage.tsx` (under Settings)
  - [ ] Form to update default tax rate
  - [ ] Validation: 0-100%
  - [ ] Admin only access

- [ ] **Task 9: Client Form Tax Exemption (AC: 2)**
  - [ ] Add tax exemption checkbox to client form
  - [ ] If checked, show reason textarea (optional)
  - [ ] Display tax exempt badge on client list/detail

- [ ] **Task 10: Invoice Form Tax Display (AC: 3, 4)**
  - [ ] Display subtotal calculation (sum of line items)
  - [ ] Display tax amount with rate (e.g., "Tax (17%): Rs.850.00")
  - [ ] Display total (subtotal + tax)
  - [ ] If client tax-exempt, show "Tax Exempt" label
  - [ ] Optional: Admin can override tax with reason

- [ ] **Task 11: Tax Summary Report (AC: 6)**
  - [ ] Create `TaxSummaryReportPage.tsx`
  - [ ] Date range filters
  - [ ] Display total tax collected
  - [ ] Group by tax rate (table format)
  - [ ] Export to Excel

- [ ] **Task 12: Testing**
  - [ ] Backend tests (tax calculation, exemption, override)
  - [ ] Frontend tests (tax display, exemption checkbox)

---

## Dev Notes

### Database Schema

**Configuration Model:**

```prisma
model Configuration {
  id        String   @id @default(cuid())
  key       String   @unique
  value     String   @db.Text
  updatedBy String?
  updatedAt DateTime @updatedAt
  createdAt DateTime @default(now())

  user      User?    @relation(fields: [updatedBy], references: [id])

  @@map("configurations")
}
```

**Client Model Extension:**

```prisma
model Client {
  id                String       @id @default(cuid())
  name              String
  contactPerson     String?
  phone             String?
  email             String?
  city              String?
  area              String?
  creditLimit       Decimal      @db.Decimal(12, 2) @default(0)
  paymentTermsDays  Int          @default(30)
  balance           Decimal      @db.Decimal(12, 2) @default(0)
  status            ClientStatus @default(ACTIVE)

  // Tax exemption
  taxExempt         Boolean      @default(false)
  taxExemptReason   String?      @db.Text

  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt

  invoices          Invoice[]
  payments          Payment[]

  @@map("clients")
}
```

**Invoice Model Extension:**

```prisma
model Invoice {
  id              String         @id @default(cuid())
  invoiceNumber   String         @unique
  clientId        String
  warehouseId     String
  status          InvoiceStatus  @default(UNPAID)
  subtotal        Decimal        @db.Decimal(12, 2)

  // Tax fields
  tax             Decimal        @db.Decimal(12, 2) @default(0)
  taxRate         Decimal        @db.Decimal(5, 2) @default(0) // Snapshot: e.g., 17.00
  taxOverride     Boolean        @default(false)
  taxOverrideReason String?      @db.Text

  total           Decimal        @db.Decimal(12, 2)
  notes           String?        @db.Text
  invoiceDate     DateTime       @default(now())
  dueDate         DateTime?

  voidedAt        DateTime?
  voidedBy        String?
  voidReason      String?        @db.Text

  createdBy       String
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  client          Client         @relation(fields: [clientId], references: [id])
  warehouse       Warehouse      @relation(fields: [warehouseId], references: [id])
  creator         User           @relation("CreatedInvoices", fields: [createdBy], references: [id])
  voider          User?          @relation("VoidedInvoices", fields: [voidedBy], references: [id])
  items           InvoiceItem[]
  payments        Payment[]

  @@map("invoices")
}
```

### Tax Calculation Service

```typescript
interface TaxCalculationResult {
  taxAmount: number;
  taxRate: number;
  isTaxExempt: boolean;
  message?: string;
}

class TaxCalculationService {
  async calculateTax(
    subtotal: number,
    clientId: string
  ): Promise<TaxCalculationResult> {
    // Fetch client
    const client = await prisma.client.findUnique({
      where: { id: clientId }
    });

    if (!client) {
      throw new NotFoundError('Client not found');
    }

    // Check if tax-exempt
    if (client.taxExempt) {
      return {
        taxAmount: 0,
        taxRate: 0,
        isTaxExempt: true,
        message: 'Client is tax-exempt'
      };
    }

    // Get default tax rate from configuration
    const taxRateConfig = await prisma.configuration.findUnique({
      where: { key: 'TAX_RATE_DEFAULT' }
    });

    const taxRate = taxRateConfig
      ? parseFloat(taxRateConfig.value)
      : 17; // Default to 17% if not configured

    // Calculate tax
    const taxAmount = subtotal * (taxRate / 100);

    return {
      taxAmount: parseFloat(taxAmount.toFixed(2)),
      taxRate,
      isTaxExempt: false
    };
  }
}

export const taxCalculationService = new TaxCalculationService();
```

### Invoice Creation with Tax

```typescript
interface CreateInvoiceDto {
  clientId: string;
  warehouseId: string;
  items: InvoiceItemDto[];
  notes?: string;
  dueDate?: Date;

  // Tax override (optional)
  taxOverride?: boolean;
  manualTaxAmount?: number;
  taxOverrideReason?: string;
}

async function createInvoice(
  data: CreateInvoiceDto,
  userId: string
): Promise<Invoice> {
  // Calculate subtotal
  const subtotal = data.items.reduce((sum, item) => {
    return sum + (item.unitPrice * item.quantity);
  }, 0);

  // Calculate tax
  let taxAmount: number;
  let taxRate: number;

  if (data.taxOverride && data.manualTaxAmount !== undefined) {
    // Validate user is Admin
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.role !== 'ADMIN') {
      throw new ForbiddenError('Only Admin can override tax');
    }

    if (!data.taxOverrideReason) {
      throw new BadRequestError('Tax override reason is required');
    }

    taxAmount = data.manualTaxAmount;
    taxRate = subtotal > 0 ? (taxAmount / subtotal) * 100 : 0;
  } else {
    // Automatic tax calculation
    const taxResult = await taxCalculationService.calculateTax(
      subtotal,
      data.clientId
    );
    taxAmount = taxResult.taxAmount;
    taxRate = taxResult.taxRate;
  }

  const total = subtotal + taxAmount;

  // Generate invoice number
  const invoiceNumber = await generateInvoiceNumber();

  // Create invoice in transaction
  return await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.create({
      data: {
        invoiceNumber,
        clientId: data.clientId,
        warehouseId: data.warehouseId,
        subtotal,
        tax: taxAmount,
        taxRate,
        taxOverride: data.taxOverride || false,
        taxOverrideReason: data.taxOverrideReason,
        total,
        notes: data.notes,
        dueDate: data.dueDate,
        createdBy: userId,
        items: {
          create: data.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.unitPrice * item.quantity,
            batchNo: item.batchNo
          }))
        }
      },
      include: { items: true, client: true }
    });

    // Update client balance
    await tx.client.update({
      where: { id: data.clientId },
      data: {
        balance: { increment: total }
      }
    });

    // Deduct stock (FIFO)
    await deductStockFIFO(data.items, data.warehouseId, tx);

    return invoice;
  });
}
```

### Tax Summary Report

```typescript
interface TaxSummaryDto {
  dateFrom: Date;
  dateTo: Date;
}

interface TaxSummaryResult {
  totalTaxCollected: number;
  byTaxRate: Array<{
    taxRate: number;
    taxAmount: number;
    invoiceCount: number;
  }>;
}

async function getTaxSummary(filters: TaxSummaryDto): Promise<TaxSummaryResult> {
  const invoices = await prisma.invoice.findMany({
    where: {
      invoiceDate: {
        gte: filters.dateFrom,
        lte: filters.dateTo
      },
      status: { not: 'VOIDED' }
    },
    select: {
      tax: true,
      taxRate: true
    }
  });

  // Group by tax rate
  const groupedByRate = invoices.reduce((acc, invoice) => {
    const rate = parseFloat(invoice.taxRate.toString());
    const tax = parseFloat(invoice.tax.toString());

    if (!acc[rate]) {
      acc[rate] = { taxRate: rate, taxAmount: 0, invoiceCount: 0 };
    }

    acc[rate].taxAmount += tax;
    acc[rate].invoiceCount += 1;

    return acc;
  }, {} as Record<number, { taxRate: number; taxAmount: number; invoiceCount: number }>);

  const byTaxRate = Object.values(groupedByRate);

  const totalTaxCollected = byTaxRate.reduce((sum, item) => sum + item.taxAmount, 0);

  return {
    totalTaxCollected,
    byTaxRate
  };
}
```

### Validation Schemas

```typescript
const updateTaxRateSchema = z.object({
  taxRate: z.number()
    .min(0, 'Tax rate cannot be negative')
    .max(100, 'Tax rate cannot exceed 100%')
});

const createClientSchema = z.object({
  name: z.string().min(1, 'Client name is required'),
  // ... other fields
  taxExempt: z.boolean().optional().default(false),
  taxExemptReason: z.string().optional()
});
```

### Frontend Implementation

**Tax Settings Page:**

```tsx
export const TaxSettingsPage: FC = () => {
  const { data: currentRate, isLoading } = useGetTaxRate();
  const updateRateMutation = useUpdateTaxRate();
  const [taxRate, setTaxRate] = useState<number>(17);

  useEffect(() => {
    if (currentRate) {
      setTaxRate(currentRate);
    }
  }, [currentRate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (taxRate < 0 || taxRate > 100) {
      toast.error('Tax rate must be between 0% and 100%');
      return;
    }

    updateRateMutation.mutate(taxRate);
  };

  if (isLoading) return <Spinner />;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Tax Settings</h1>

      <Card>
        <Card.Body>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Alert variant="info">
              This is the default sales tax rate applied to all invoices.
              Tax-exempt clients will have 0% tax applied automatically.
            </Alert>

            <Input
              type="number"
              label="Default Sales Tax Rate (%)"
              value={taxRate}
              onChange={(e) => setTaxRate(parseFloat(e.target.value))}
              step="0.01"
              min="0"
              max="100"
              required
              helperText="Current: Pakistan GST is typically 17%"
            />

            <Button
              type="submit"
              loading={updateRateMutation.isPending}
            >
              Update Tax Rate
            </Button>
          </form>
        </Card.Body>
      </Card>

      <Card className="mt-6">
        <Card.Header>Tax Rate History</Card.Header>
        <Card.Body>
          <p className="text-sm text-gray-600">
            Each invoice stores the tax rate used at creation time,
            so historical rate changes don't affect past invoices.
          </p>
        </Card.Body>
      </Card>
    </div>
  );
};
```

**Client Form Tax Exemption:**

```tsx
<div className="space-y-4">
  <Checkbox
    name="taxExempt"
    label="Tax Exempt"
    helperText="If checked, this client will not be charged sales tax"
  />

  {watch('taxExempt') && (
    <Textarea
      name="taxExemptReason"
      label="Tax Exemption Reason (Optional)"
      placeholder="e.g., Government organization, Diplomatic mission, etc."
      rows={3}
    />
  )}
</div>
```

**Invoice Form Tax Display:**

```tsx
export const InvoiceForm: FC = () => {
  const { watch } = useFormContext();
  const items = watch('items') as InvoiceItemDto[];
  const clientId = watch('clientId') as string;

  const { data: client } = useGetClient(clientId, { enabled: !!clientId });
  const { data: taxRate } = useGetTaxRate();

  // Calculate subtotal
  const subtotal = items.reduce((sum, item) => {
    return sum + (item.unitPrice * item.quantity);
  }, 0);

  // Calculate tax
  const isTaxExempt = client?.taxExempt || false;
  const calculatedTaxRate = isTaxExempt ? 0 : (taxRate || 17);
  const taxAmount = subtotal * (calculatedTaxRate / 100);
  const total = subtotal + taxAmount;

  return (
    <div>
      {/* Form fields... */}

      <Card className="mt-6">
        <Card.Body>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-medium">Rs.{subtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span>
                Tax {isTaxExempt ? '(Exempt)' : `(${calculatedTaxRate}%)`}:
              </span>
              <span className="font-medium">Rs.{taxAmount.toFixed(2)}</span>
            </div>

            {isTaxExempt && (
              <Alert variant="info" size="sm">
                This client is tax-exempt. No sales tax will be charged.
              </Alert>
            )}

            <Separator />

            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>Rs.{total.toFixed(2)}</span>
            </div>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};
```

**Tax Summary Report:**

```tsx
export const TaxSummaryReportPage: FC = () => {
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });

  const { data: taxSummary, isLoading } = useGetTaxSummary(dateRange);

  const handleExport = () => {
    // Export to Excel logic
    const worksheet = XLSX.utils.json_to_sheet([
      {
        'Tax Rate': 'Total',
        'Tax Amount': `Rs.${taxSummary?.totalTaxCollected.toFixed(2)}`,
        'Invoice Count': taxSummary?.byTaxRate.reduce((sum, r) => sum + r.invoiceCount, 0)
      },
      ...taxSummary?.byTaxRate.map(rate => ({
        'Tax Rate': `${rate.taxRate}%`,
        'Tax Amount': `Rs.${rate.taxAmount.toFixed(2)}`,
        'Invoice Count': rate.invoiceCount
      })) || []
    ]);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tax Summary');
    XLSX.writeFile(workbook, `tax-summary-${format(new Date(), 'yyyyMMdd')}.xlsx`);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Tax Summary Report</h1>
        <Button onClick={handleExport} disabled={!taxSummary}>
          <Download className="h-4 w-4 mr-2" />
          Export to Excel
        </Button>
      </div>

      <Card className="mb-6">
        <Card.Body>
          <div className="flex gap-4">
            <DatePicker
              label="From Date"
              value={dateRange.from}
              onChange={(date) => setDateRange(prev => ({ ...prev, from: date }))}
            />
            <DatePicker
              label="To Date"
              value={dateRange.to}
              onChange={(date) => setDateRange(prev => ({ ...prev, to: date }))}
            />
          </div>
        </Card.Body>
      </Card>

      {isLoading ? (
        <Spinner />
      ) : taxSummary ? (
        <>
          <Card className="mb-6">
            <Card.Body>
              <div className="text-center">
                <div className="text-sm text-gray-600">Total Tax Collected</div>
                <div className="text-3xl font-bold text-green-600 mt-2">
                  Rs.{taxSummary.totalTaxCollected.toFixed(2)}
                </div>
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>Tax Breakdown by Rate</Card.Header>
            <Card.Body>
              <Table>
                <thead>
                  <tr>
                    <th>Tax Rate</th>
                    <th>Tax Amount</th>
                    <th>Invoice Count</th>
                  </tr>
                </thead>
                <tbody>
                  {taxSummary.byTaxRate.map((rate, idx) => (
                    <tr key={idx}>
                      <td>{rate.taxRate}%</td>
                      <td>Rs.{rate.taxAmount.toFixed(2)}</td>
                      <td>{rate.invoiceCount}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </>
      ) : (
        <Alert>No tax data found for selected period</Alert>
      )}
    </div>
  );
};
```

---

## Testing

### Backend Testing
- Tax calculation with default rate
- Tax calculation for tax-exempt client (0%)
- Tax override by Admin with reason
- Non-admin cannot override tax
- Configuration update (tax rate)
- Tax rate validation (0-100%)
- Tax summary report calculation
- Group by tax rate accuracy

### Frontend Testing
- Tax settings page (Admin only)
- Tax rate update validation
- Client form tax exemption checkbox
- Invoice form tax display
- Tax-exempt client indicator
- Tax summary report display
- Excel export functionality

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |

---

## Dev Agent Record

*To be populated by dev agent*

---

## QA Results

*To be populated by QA agent*
