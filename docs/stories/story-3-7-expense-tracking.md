# Story 3.7: Expense Tracking

**Epic:** Epic 3 - Sales & Client Management + Payments
**Story ID:** STORY-3.7
**Priority:** Medium
**Estimated Effort:** 6-8 hours
**Dependencies:** Epic 1 (Foundation & Audit)
**Status:** Draft

---

## User Story

**As an** accountant,
**I want** to record and categorize business expenses,
**So that** financial reporting and profit/loss calculations are accurate.

---

## Acceptance Criteria

1. **Database Schema:**
   - [ ] Expense table: id, category, amount, description, date, paymentMethod, recordedBy, receiptUrl, createdAt, updatedAt
   - [ ] ExpenseCategory enum: RENT, UTILITIES, SALARIES, SUPPLIES, MAINTENANCE, MARKETING, TRANSPORT, MISC

2. **Backend API Endpoints:**
   - [ ] POST /api/expenses - Creates new expense
   - [ ] GET /api/expenses - Returns paginated expense list with filters (category, date range)
   - [ ] GET /api/expenses/:id - Returns expense details
   - [ ] PUT /api/expenses/:id - Updates expense
   - [ ] DELETE /api/expenses/:id - Soft-deletes expense

3. **Expense Validation:**
   - [ ] Amount must be > 0
   - [ ] Date cannot be in future
   - [ ] Description required (min 3 characters)
   - [ ] Category must be valid enum value

4. **Receipt Upload (Optional for MVP):**
   - [ ] receiptUrl field stores file path/URL
   - [ ] File upload to local storage or cloud (S3, etc.)
   - [ ] Supported formats: PDF, JPG, PNG

5. **Frontend Pages:**
   - [ ] Expense List page with add/edit modals
   - [ ] Filter by category, date range
   - [ ] Display total expenses for selected period
   - [ ] View receipt (open in new tab or modal)

6. **Expense Summary:**
   - [ ] GET /api/reports/expense-summary endpoint
   - [ ] Group expenses by category for date range
   - [ ] Return total per category and grand total

7. **Authorization:**
   - [ ] Only Accountant and Admin can create/edit/delete expenses
   - [ ] All roles can view expenses (read-only)

8. **Audit Logging:**
   - [ ] Expense CRUD operations logged in audit trail

---

## Tasks / Subtasks

### Backend Tasks

- [ ] **Task 1: Database Schema & Migration (AC: 1)**
  - [ ] Create Expense model with all fields
  - [ ] Create ExpenseCategory enum
  - [ ] Add PaymentMethod enum (if not already exists)
  - [ ] Run migration

- [ ] **Task 2: Expense Repository**
  - [ ] Create `expenses.repository.ts`
  - [ ] Implement CRUD methods
  - [ ] Implement filters: category, date range
  - [ ] Implement pagination

- [ ] **Task 3: Expense Service (AC: 3)**
  - [ ] Create `expenses.service.ts`
  - [ ] Validate amount > 0
  - [ ] Validate date not in future
  - [ ] Validate description min length
  - [ ] Validate category enum

- [ ] **Task 4: Controller & Routes (AC: 2)**
  - [ ] Create `expenses.controller.ts`
  - [ ] Implement all CRUD endpoints
  - [ ] Create `expenses.routes.ts`

- [ ] **Task 5: Expense Summary Endpoint (AC: 6)**
  - [ ] Extend `reports.controller.ts`
  - [ ] Implement GET /api/reports/expense-summary
  - [ ] Accept date range filters
  - [ ] Group by category
  - [ ] Return total per category and grand total

- [ ] **Task 6: File Upload (Optional) (AC: 4)**
  - [ ] Implement receipt file upload
  - [ ] Validate file type (PDF, JPG, PNG)
  - [ ] Store file path in receiptUrl
  - [ ] Use multer or similar middleware

- [ ] **Task 7: Authorization & Audit (AC: 7, 8)**
  - [ ] Apply role guards
  - [ ] Add audit logging

### Frontend Tasks

- [ ] **Task 8: Expense Types & API Client**
  - [ ] Create `expense.types.ts`
  - [ ] Create `expensesService.ts`
  - [ ] Create TanStack Query hooks

- [ ] **Task 9: Expense List Page (AC: 5)**
  - [ ] Create `ExpensesPage.tsx`
  - [ ] Display expenses in table/card view
  - [ ] Filters: category dropdown, date range pickers
  - [ ] Display total expenses for selected period
  - [ ] Pagination

- [ ] **Task 10: Expense Form Modal (AC: 5)**
  - [ ] Create `ExpenseFormModal.tsx`
  - [ ] Form fields: category (dropdown), amount, description, date, payment method, receipt upload (optional)
  - [ ] Validation: amount > 0, description min 3 chars, date not in future

- [ ] **Task 11: Expense Summary Report (AC: 6)**
  - [ ] Create `ExpenseSummaryReportPage.tsx`
  - [ ] Date range filters
  - [ ] Display total per category (pie/bar chart optional)
  - [ ] Export to Excel

- [ ] **Task 12: Receipt Viewer (AC: 4)**
  - [ ] Open receipt in new tab or modal
  - [ ] Support PDF, JPG, PNG display

- [ ] **Task 13: Testing**
  - [ ] Backend tests (CRUD, validation, expense summary)
  - [ ] Frontend tests (form validation, filters, display)

---

## Dev Notes

### Database Schema (Prisma)

```prisma
model Expense {
  id            String          @id @default(cuid())
  category      ExpenseCategory
  amount        Decimal         @db.Decimal(12, 2)
  description   String          @db.Text
  date          DateTime
  paymentMethod PaymentMethod
  receiptUrl    String?         @db.Text
  recordedBy    String

  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  user          User            @relation(fields: [recordedBy], references: [id])

  @@index([category, date])
  @@map("expenses")
}

enum ExpenseCategory {
  RENT
  UTILITIES
  SALARIES
  SUPPLIES
  MAINTENANCE
  MARKETING
  TRANSPORT
  MISC
}

enum PaymentMethod {
  CASH
  BANK_TRANSFER
  CHEQUE
}
```

### Expense Validation Schema

```typescript
const createExpenseSchema = z.object({
  category: z.enum([
    'RENT',
    'UTILITIES',
    'SALARIES',
    'SUPPLIES',
    'MAINTENANCE',
    'MARKETING',
    'TRANSPORT',
    'MISC'
  ]),
  amount: z.number().positive('Amount must be greater than 0'),
  description: z.string().min(3, 'Description must be at least 3 characters'),
  date: z.date().max(new Date(), 'Date cannot be in the future'),
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'CHEQUE']),
  receiptUrl: z.string().url().optional()
});

const updateExpenseSchema = createExpenseSchema.partial();
```

### Expense Service

```typescript
interface CreateExpenseDto {
  category: ExpenseCategory;
  amount: number;
  description: string;
  date: Date;
  paymentMethod: PaymentMethod;
  receiptUrl?: string;
}

class ExpenseService {
  async create(data: CreateExpenseDto, userId: string): Promise<Expense> {
    // Validation
    if (data.amount <= 0) {
      throw new BadRequestError('Amount must be greater than 0');
    }

    if (data.date > new Date()) {
      throw new BadRequestError('Date cannot be in the future');
    }

    if (!data.description || data.description.trim().length < 3) {
      throw new BadRequestError('Description must be at least 3 characters');
    }

    // Create expense
    const expense = await prisma.expense.create({
      data: {
        category: data.category,
        amount: data.amount,
        description: data.description,
        date: data.date,
        paymentMethod: data.paymentMethod,
        receiptUrl: data.receiptUrl,
        recordedBy: userId
      },
      include: { user: true }
    });

    // Log audit
    await auditLogger.log({
      action: 'EXPENSE_CREATE',
      userId,
      resource: 'Expense',
      resourceId: expense.id,
      details: {
        category: data.category,
        amount: data.amount,
        description: data.description
      }
    });

    return expense;
  }

  async getAll(filters: {
    category?: ExpenseCategory;
    dateFrom?: Date;
    dateTo?: Date;
    page?: number;
    limit?: number;
  }): Promise<{ expenses: Expense[]; total: number }> {
    const { category, dateFrom, dateTo, page = 1, limit = 20 } = filters;

    const where: any = {};

    if (category) {
      where.category = category;
    }

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = dateFrom;
      if (dateTo) where.date.lte = dateTo;
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: { user: true },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.expense.count({ where })
    ]);

    return { expenses, total };
  }

  async getById(id: string): Promise<Expense | null> {
    return await prisma.expense.findUnique({
      where: { id },
      include: { user: true }
    });
  }

  async update(id: string, data: Partial<CreateExpenseDto>, userId: string): Promise<Expense> {
    // Validate expense exists
    const existing = await this.getById(id);
    if (!existing) {
      throw new NotFoundError('Expense not found');
    }

    // Validation
    if (data.amount !== undefined && data.amount <= 0) {
      throw new BadRequestError('Amount must be greater than 0');
    }

    if (data.date && data.date > new Date()) {
      throw new BadRequestError('Date cannot be in the future');
    }

    if (data.description && data.description.trim().length < 3) {
      throw new BadRequestError('Description must be at least 3 characters');
    }

    // Update expense
    const expense = await prisma.expense.update({
      where: { id },
      data,
      include: { user: true }
    });

    // Log audit
    await auditLogger.log({
      action: 'EXPENSE_UPDATE',
      userId,
      resource: 'Expense',
      resourceId: expense.id,
      details: { updated: data }
    });

    return expense;
  }

  async delete(id: string, userId: string): Promise<void> {
    // Validate expense exists
    const existing = await this.getById(id);
    if (!existing) {
      throw new NotFoundError('Expense not found');
    }

    // Soft delete (or hard delete if preferred)
    await prisma.expense.delete({
      where: { id }
    });

    // Log audit
    await auditLogger.log({
      action: 'EXPENSE_DELETE',
      userId,
      resource: 'Expense',
      resourceId: id,
      details: {
        category: existing.category,
        amount: existing.amount,
        description: existing.description
      }
    });
  }
}

export const expenseService = new ExpenseService();
```

### Expense Summary Report

```typescript
interface ExpenseSummaryDto {
  dateFrom: Date;
  dateTo: Date;
}

interface ExpenseSummaryResult {
  totalExpenses: number;
  byCategory: Array<{
    category: ExpenseCategory;
    total: number;
    count: number;
  }>;
}

async function getExpenseSummary(filters: ExpenseSummaryDto): Promise<ExpenseSummaryResult> {
  const expenses = await prisma.expense.findMany({
    where: {
      date: {
        gte: filters.dateFrom,
        lte: filters.dateTo
      }
    },
    select: {
      category: true,
      amount: true
    }
  });

  // Group by category
  const groupedByCategory = expenses.reduce((acc, expense) => {
    const category = expense.category;
    const amount = parseFloat(expense.amount.toString());

    if (!acc[category]) {
      acc[category] = { category, total: 0, count: 0 };
    }

    acc[category].total += amount;
    acc[category].count += 1;

    return acc;
  }, {} as Record<ExpenseCategory, { category: ExpenseCategory; total: number; count: number }>);

  const byCategory = Object.values(groupedByCategory);

  const totalExpenses = byCategory.reduce((sum, item) => sum + item.total, 0);

  return {
    totalExpenses,
    byCategory
  };
}
```

### File Upload (Optional)

```typescript
import multer from 'multer';
import path from 'path';

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/receipts/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'receipt-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, JPG, and PNG are allowed.'));
  }
};

export const receiptUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

// Controller usage
router.post('/expenses',
  authenticate,
  authorize(['ADMIN', 'ACCOUNTANT']),
  receiptUpload.single('receipt'),
  async (req, res) => {
    const data = req.body;
    data.receiptUrl = req.file ? `/uploads/receipts/${req.file.filename}` : undefined;
    const expense = await expenseService.create(data, req.user.id);
    res.status(201).json(expense);
  }
);
```

### Frontend Implementation

**Expense List Page:**

```tsx
export const ExpensesPage: FC = () => {
  const [filters, setFilters] = useState({
    category: '',
    dateFrom: startOfMonth(new Date()),
    dateTo: endOfMonth(new Date()),
    page: 1
  });

  const { data, isLoading } = useGetExpenses(filters);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const canManage = ['ADMIN', 'ACCOUNTANT'].includes(currentUser.role);

  // Calculate total for filtered period
  const totalExpenses = useMemo(() => {
    return data?.expenses.reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0) || 0;
  }, [data]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Expenses</h1>
        {canManage && (
          <Button onClick={() => setShowFormModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        )}
      </div>

      <Card className="mb-6">
        <Card.Body>
          <div className="flex gap-4 items-end">
            <Select
              label="Category"
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value, page: 1 }))}
            >
              <option value="">All Categories</option>
              <option value="RENT">Rent</option>
              <option value="UTILITIES">Utilities</option>
              <option value="SALARIES">Salaries</option>
              <option value="SUPPLIES">Supplies</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="MARKETING">Marketing</option>
              <option value="TRANSPORT">Transport</option>
              <option value="MISC">Miscellaneous</option>
            </Select>

            <DatePicker
              label="From Date"
              value={filters.dateFrom}
              onChange={(date) => setFilters(prev => ({ ...prev, dateFrom: date, page: 1 }))}
            />

            <DatePicker
              label="To Date"
              value={filters.dateTo}
              onChange={(date) => setFilters(prev => ({ ...prev, dateTo: date, page: 1 }))}
            />
          </div>

          <div className="mt-4 text-center">
            <div className="text-sm text-gray-600">Total Expenses (Filtered Period)</div>
            <div className="text-2xl font-bold text-red-600 mt-1">
              Rs.{totalExpenses.toFixed(2)}
            </div>
          </div>
        </Card.Body>
      </Card>

      {isLoading ? (
        <Spinner />
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Payment Method</th>
                <th>Recorded By</th>
                <th>Receipt</th>
                {canManage && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {data?.expenses.map(expense => (
                <tr key={expense.id}>
                  <td>{format(expense.date, 'PPP')}</td>
                  <td>
                    <Badge variant="secondary">{expense.category}</Badge>
                  </td>
                  <td>{expense.description}</td>
                  <td className="font-semibold">Rs.{expense.amount.toFixed(2)}</td>
                  <td>{expense.paymentMethod}</td>
                  <td>{expense.user.name}</td>
                  <td>
                    {expense.receiptUrl ? (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => window.open(expense.receiptUrl!, '_blank')}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                    ) : (
                      '-'
                    )}
                  </td>
                  {canManage && (
                    <td>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingExpense(expense);
                            setShowFormModal(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          color="red"
                          size="sm"
                          onClick={() => handleDelete(expense.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </Table>

          <Pagination
            currentPage={filters.page}
            totalPages={Math.ceil((data?.total || 0) / 20)}
            onPageChange={(page) => setFilters(prev => ({ ...prev, page }))}
          />
        </>
      )}

      {showFormModal && (
        <ExpenseFormModal
          expense={editingExpense}
          onClose={() => {
            setShowFormModal(false);
            setEditingExpense(null);
          }}
        />
      )}
    </div>
  );
};
```

**Expense Form Modal:**

```tsx
interface ExpenseFormModalProps {
  expense?: Expense | null;
  onClose: () => void;
}

export const ExpenseFormModal: FC<ExpenseFormModalProps> = ({ expense, onClose }) => {
  const createMutation = useCreateExpense();
  const updateMutation = useUpdateExpense();

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: expense || {
      category: 'MISC',
      amount: 0,
      description: '',
      date: new Date(),
      paymentMethod: 'CASH'
    }
  });

  const onSubmit = (data: any) => {
    if (expense) {
      updateMutation.mutate({ id: expense.id, ...data }, { onSuccess: onClose });
    } else {
      createMutation.mutate(data, { onSuccess: onClose });
    }
  };

  return (
    <Modal open onClose={onClose}>
      <Modal.Header>{expense ? 'Edit Expense' : 'Add Expense'}</Modal.Header>

      <Form onSubmit={handleSubmit(onSubmit)}>
        <Modal.Body className="space-y-4">
          <Select label="Category" {...register('category')} required>
            <option value="RENT">Rent</option>
            <option value="UTILITIES">Utilities</option>
            <option value="SALARIES">Salaries</option>
            <option value="SUPPLIES">Supplies</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="MARKETING">Marketing</option>
            <option value="TRANSPORT">Transport</option>
            <option value="MISC">Miscellaneous</option>
          </Select>

          <Input
            type="number"
            label="Amount"
            {...register('amount', { valueAsNumber: true })}
            step="0.01"
            min="0.01"
            required
            error={errors.amount?.message}
          />

          <Textarea
            label="Description"
            {...register('description', { minLength: 3 })}
            placeholder="Enter expense details..."
            rows={3}
            required
            error={errors.description?.message}
          />

          <DatePicker
            label="Expense Date"
            {...register('date')}
            max={new Date()}
            required
          />

          <Select label="Payment Method" {...register('paymentMethod')} required>
            <option value="CASH">Cash</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="CHEQUE">Cheque</option>
          </Select>

          <Input
            type="file"
            label="Receipt (Optional)"
            accept="application/pdf,image/jpeg,image/png"
            helperText="PDF, JPG, or PNG (max 5MB)"
          />
        </Modal.Body>

        <Modal.Footer>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            loading={createMutation.isPending || updateMutation.isPending}
          >
            {expense ? 'Update' : 'Create'} Expense
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};
```

**TanStack Query Hooks:**

```typescript
export const useGetExpenses = (filters: any) => {
  return useQuery({
    queryKey: ['expenses', filters],
    queryFn: () => expensesService.getAll(filters)
  });
};

export const useCreateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateExpenseDto) => expensesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create expense');
    },
  });
};

export const useUpdateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<CreateExpenseDto>) =>
      expensesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update expense');
    },
  });
};
```

---

## Testing

### Backend Testing
- Expense CRUD operations
- Validation: amount > 0
- Validation: date not in future
- Validation: description min 3 characters
- Validation: category enum
- Expense summary calculation
- Group by category accuracy
- File upload validation (type, size)
- Audit logging

### Frontend Testing
- Expense form validation
- Category filter
- Date range filter
- Total expense calculation
- Receipt upload
- Edit/delete expense
- Authorization (Admin/Accountant only for write operations)

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
