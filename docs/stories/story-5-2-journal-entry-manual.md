# Story 5.2: Journal Entry Creation (Manual)

**Epic:** Epic 5 - Account Heads & General Ledger
**Story ID:** STORY-5.2
**Priority:** Critical
**Estimated Effort:** 10-12 hours
**Dependencies:** Story 5.1 (Chart of Accounts)
**Status:** Draft - Phase 2

---

## User Story

**As an** accountant,
**I want** to create manual journal entries for accounting adjustments,
**So that** corrections, accruals, and special transactions can be recorded.

---

## Acceptance Criteria

1. **Database Schema:**
   - [ ] JournalEntry table: id, entryNumber (unique), date, description, status (DRAFT/POSTED), createdBy, approvedBy
   - [ ] JournalEntryLine table: id, journalEntryId, accountHeadId, debitAmount, creditAmount, description
   - [ ] **Validation: Sum(debits) MUST equal Sum(credits)** (double-entry rule)

2. **Entry Status Workflow:**
   - [ ] DRAFT (editable) → POSTED (posted to GL, immutable)
   - [ ] When POSTED, account balances updated
   - [ ] Entry number auto-generated: JE-YYYYMMDD-XXX

3. **Backend API:**
   - [ ] POST /api/journal-entries - Creates journal entry with lines
   - [ ] GET /api/journal-entries - Returns entry list with filters
   - [ ] GET /api/journal-entries/:id - Returns entry details with lines
   - [ ] PUT /api/journal-entries/:id - Updates entry (only if DRAFT)
   - [ ] POST /api/journal-entries/:id/post - Posts entry to GL
   - [ ] DELETE /api/journal-entries/:id - Deletes draft entry

4. **Frontend:**
   - [ ] Journal Entry page with date, description, line item rows
   - [ ] Add debit/credit lines with account selection
   - [ ] Display running debit/credit totals and difference (must be 0)
   - [ ] "Post to GL" button (requires confirmation)

5. **Authorization:**
   - [ ] Only Accountant and Admin can create journal entries
   - [ ] Journal entries logged in audit trail

---

## Dev Notes

### Database Schema

```prisma
model JournalEntry {
  id           String              @id @default(cuid())
  entryNumber  String              @unique
  date         DateTime            @default(now())
  description  String              @db.Text
  status       JournalEntryStatus  @default(DRAFT)
  referenceType String?
  referenceId  String?
  createdBy    String
  approvedBy   String?
  createdAt    DateTime            @default(now())
  updatedAt    DateTime            @updatedAt

  creator      User                @relation("CreatedJournalEntries", fields: [createdBy], references: [id])
  approver     User?               @relation("ApprovedJournalEntries", fields: [approvedBy], references: [id])
  lines        JournalEntryLine[]

  @@index([status, date])
  @@map("journal_entries")
}

model JournalEntryLine {
  id             String        @id @default(cuid())
  journalEntryId String
  accountHeadId  String
  debitAmount    Decimal       @db.Decimal(12, 2) @default(0)
  creditAmount   Decimal       @db.Decimal(12, 2) @default(0)
  description    String?       @db.Text
  createdAt      DateTime      @default(now())

  journalEntry   JournalEntry  @relation(fields: [journalEntryId], references: [id], onDelete: Cascade)
  accountHead    AccountHead   @relation(fields: [accountHeadId], references: [id])

  @@index([journalEntryId, accountHeadId])
  @@map("journal_entry_lines")
}

enum JournalEntryStatus {
  DRAFT
  POSTED
}
```

### Journal Entry Service

```typescript
interface CreateJournalEntryDto {
  date: Date;
  description: string;
  lines: Array<{
    accountHeadId: string;
    debitAmount: number;
    creditAmount: number;
    description?: string;
  }>;
}

class JournalEntryService {
  async createJournalEntry(
    data: CreateJournalEntryDto,
    userId: string
  ): Promise<JournalEntry> {
    // Validate double-entry rule
    const totalDebits = data.lines.reduce((sum, line) => sum + line.debitAmount, 0);
    const totalCredits = data.lines.reduce((sum, line) => sum + line.creditAmount, 0);

    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      throw new BadRequestError(
        `Journal entry not balanced. Debits: ${totalDebits}, Credits: ${totalCredits}`
      );
    }

    // Validate each line has debit XOR credit (not both, not neither)
    data.lines.forEach((line, index) => {
      if (line.debitAmount > 0 && line.creditAmount > 0) {
        throw new BadRequestError(`Line ${index + 1}: Cannot have both debit and credit`);
      }
      if (line.debitAmount === 0 && line.creditAmount === 0) {
        throw new BadRequestError(`Line ${index + 1}: Must have either debit or credit`);
      }
    });

    // Generate entry number
    const entryNumber = await this.generateEntryNumber(data.date);

    // Create journal entry
    const entry = await prisma.journalEntry.create({
      data: {
        entryNumber,
        date: data.date,
        description: data.description,
        status: 'DRAFT',
        createdBy: userId,
        lines: {
          create: data.lines.map(line => ({
            accountHeadId: line.accountHeadId,
            debitAmount: line.debitAmount,
            creditAmount: line.creditAmount,
            description: line.description
          }))
        }
      },
      include: { lines: { include: { accountHead: true } } }
    });

    return entry;
  }

  async generateEntryNumber(date: Date): Promise<string> {
    const dateStr = format(date, 'yyyyMMdd');
    const prefix = `JE-${dateStr}-`;

    const latestEntry = await prisma.journalEntry.findFirst({
      where: { entryNumber: { startsWith: prefix } },
      orderBy: { entryNumber: 'desc' }
    });

    if (!latestEntry) {
      return `${prefix}001`;
    }

    const lastNumber = parseInt(latestEntry.entryNumber.split('-')[2]);
    const nextNumber = (lastNumber + 1).toString().padStart(3, '0');
    return `${prefix}${nextNumber}`;
  }

  async postJournalEntry(id: string, userId: string): Promise<JournalEntry> {
    // Validate entry exists and is DRAFT
    const entry = await prisma.journalEntry.findUnique({
      where: { id },
      include: { lines: true }
    });

    if (!entry) {
      throw new NotFoundError('Journal entry not found');
    }

    if (entry.status === 'POSTED') {
      throw new BadRequestError('Journal entry already posted');
    }

    // Verify balance
    const totalDebits = entry.lines.reduce(
      (sum, line) => sum + parseFloat(line.debitAmount.toString()),
      0
    );
    const totalCredits = entry.lines.reduce(
      (sum, line) => sum + parseFloat(line.creditAmount.toString()),
      0
    );

    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      throw new BadRequestError('Journal entry not balanced');
    }

    // Post entry in transaction
    return await prisma.$transaction(async (tx) => {
      // Update entry status
      const posted = await tx.journalEntry.update({
        where: { id },
        data: {
          status: 'POSTED',
          approvedBy: userId
        },
        include: { lines: { include: { accountHead: true } } }
      });

      // Update account balances
      for (const line of posted.lines) {
        const account = line.accountHead;
        const debit = parseFloat(line.debitAmount.toString());
        const credit = parseFloat(line.creditAmount.toString());

        // Calculate balance change based on account type
        let balanceChange = 0;

        if (['ASSET', 'EXPENSE'].includes(account.accountType)) {
          // Debit increases, credit decreases
          balanceChange = debit - credit;
        } else {
          // LIABILITY, EQUITY, REVENUE: Credit increases, debit decreases
          balanceChange = credit - debit;
        }

        await tx.accountHead.update({
          where: { id: line.accountHeadId },
          data: {
            currentBalance: {
              increment: balanceChange
            }
          }
        });
      }

      return posted;
    });
  }

  async updateJournalEntry(
    id: string,
    data: Partial<CreateJournalEntryDto>
  ): Promise<JournalEntry> {
    // Validate entry is DRAFT
    const entry = await prisma.journalEntry.findUnique({
      where: { id }
    });

    if (!entry) {
      throw new NotFoundError('Journal entry not found');
    }

    if (entry.status === 'POSTED') {
      throw new BadRequestError('Cannot update posted journal entry');
    }

    // If updating lines, validate balance
    if (data.lines) {
      const totalDebits = data.lines.reduce((sum, line) => sum + line.debitAmount, 0);
      const totalCredits = data.lines.reduce((sum, line) => sum + line.creditAmount, 0);

      if (Math.abs(totalDebits - totalCredits) > 0.01) {
        throw new BadRequestError('Journal entry not balanced');
      }

      // Delete old lines and create new ones
      await prisma.journalEntryLine.deleteMany({
        where: { journalEntryId: id }
      });
    }

    return await prisma.journalEntry.update({
      where: { id },
      data: {
        ...(data.date && { date: data.date }),
        ...(data.description && { description: data.description }),
        ...(data.lines && {
          lines: {
            create: data.lines.map(line => ({
              accountHeadId: line.accountHeadId,
              debitAmount: line.debitAmount,
              creditAmount: line.creditAmount,
              description: line.description
            }))
          }
        })
      },
      include: { lines: { include: { accountHead: true } } }
    });
  }
}
```

### Frontend - Journal Entry Form

```tsx
export const JournalEntryPage: FC = () => {
  const { id } = useParams();
  const [entry, setEntry] = useState({
    date: new Date(),
    description: '',
    lines: [{ accountHeadId: '', debitAmount: 0, creditAmount: 0, description: '' }]
  });

  const { data: accounts } = useGetAccountHeads();
  const createMutation = useCreateJournalEntry();
  const postMutation = usePostJournalEntry();

  const addLine = () => {
    setEntry({
      ...entry,
      lines: [...entry.lines, { accountHeadId: '', debitAmount: 0, creditAmount: 0, description: '' }]
    });
  };

  const removeLine = (index: number) => {
    setEntry({
      ...entry,
      lines: entry.lines.filter((_, i) => i !== index)
    });
  };

  const updateLine = (index: number, field: string, value: any) => {
    const newLines = [...entry.lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setEntry({ ...entry, lines: newLines });
  };

  // Calculate totals
  const totalDebits = entry.lines.reduce((sum, line) => sum + (line.debitAmount || 0), 0);
  const totalCredits = entry.lines.reduce((sum, line) => sum + (line.creditAmount || 0), 0);
  const difference = Math.abs(totalDebits - totalCredits);
  const isBalanced = difference < 0.01;

  const handleSave = () => {
    if (!isBalanced) {
      toast.error('Journal entry must be balanced');
      return;
    }
    createMutation.mutate(entry);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        {id ? 'Edit Journal Entry' : 'New Journal Entry'}
      </h1>

      <Card className="mb-6">
        <Card.Body className="space-y-4">
          <DatePicker
            label="Entry Date"
            value={entry.date}
            onChange={(date) => setEntry({ ...entry, date })}
            required
          />

          <Textarea
            label="Description"
            value={entry.description}
            onChange={(e) => setEntry({ ...entry, description: e.target.value })}
            placeholder="Enter journal entry description..."
            rows={2}
            required
          />
        </Card.Body>
      </Card>

      <Card className="mb-6">
        <Card.Header>
          <div className="flex items-center justify-between">
            <span>Journal Entry Lines</span>
            <Button variant="outline" size="sm" onClick={addLine}>
              <Plus className="h-4 w-4 mr-2" />
              Add Line
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          <Table>
            <thead>
              <tr>
                <th>Account</th>
                <th>Description</th>
                <th>Debit</th>
                <th>Credit</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {entry.lines.map((line, index) => (
                <tr key={index}>
                  <td>
                    <Select
                      value={line.accountHeadId}
                      onChange={(e) => updateLine(index, 'accountHeadId', e.target.value)}
                      required
                    >
                      <option value="">Select account...</option>
                      {accounts?.map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.code} - {acc.name}
                        </option>
                      ))}
                    </Select>
                  </td>
                  <td>
                    <Input
                      value={line.description}
                      onChange={(e) => updateLine(index, 'description', e.target.value)}
                      placeholder="Line description"
                    />
                  </td>
                  <td>
                    <Input
                      type="number"
                      value={line.debitAmount || ''}
                      onChange={(e) => {
                        updateLine(index, 'debitAmount', parseFloat(e.target.value) || 0);
                        updateLine(index, 'creditAmount', 0);
                      }}
                      step="0.01"
                      min="0"
                    />
                  </td>
                  <td>
                    <Input
                      type="number"
                      value={line.creditAmount || ''}
                      onChange={(e) => {
                        updateLine(index, 'creditAmount', parseFloat(e.target.value) || 0);
                        updateLine(index, 'debitAmount', 0);
                      }}
                      step="0.01"
                      min="0"
                    />
                  </td>
                  <td>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLine(index)}
                      disabled={entry.lines.length === 1}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-bold">
                <td colSpan={2}>TOTALS</td>
                <td className="text-green-600">Rs.{totalDebits.toFixed(2)}</td>
                <td className="text-red-600">Rs.{totalCredits.toFixed(2)}</td>
                <td></td>
              </tr>
              <tr>
                <td colSpan={5}>
                  {isBalanced ? (
                    <Alert variant="success">Entry is balanced ✓</Alert>
                  ) : (
                    <Alert variant="error">
                      Entry is NOT balanced. Difference: Rs.{difference.toFixed(2)}
                    </Alert>
                  )}
                </td>
              </tr>
            </tfoot>
          </Table>
        </Card.Body>
      </Card>

      <div className="flex gap-4">
        <Button onClick={handleSave} disabled={!isBalanced}>
          Save as Draft
        </Button>
        <Button variant="primary" onClick={() => postMutation.mutate(id)} disabled={!isBalanced}>
          Post to General Ledger
        </Button>
      </div>
    </div>
  );
};
```

---

## Testing

### Backend Testing
- Journal entry balance validation
- Entry number generation
- Posting updates account balances correctly
- Cannot update posted entry
- Cannot delete posted entry

### Frontend Testing
- Add/remove journal lines
- Debit/credit totals calculation
- Balance validation
- Post confirmation modal

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
