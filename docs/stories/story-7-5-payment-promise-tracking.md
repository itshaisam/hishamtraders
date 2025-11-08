# Story 7.5: Payment Promise Tracking

**Epic:** Epic 7 - Recovery & Collection Management
**Story ID:** STORY-7.5
**Priority:** High
**Estimated Effort:** 5-7 hours
**Dependencies:** Story 7.4
**Status:** Draft - Phase 2

---

## User Story

**As a** recovery agent,
**I want** to track payment promises and their fulfillment,
**So that** I can follow up on commitments and measure client reliability.

---

## Acceptance Criteria

1. **Database Schema:**
   - [ ] PaymentPromise table: clientId, promiseDate, promiseAmount, actualPaymentDate, actualAmount, status (PENDING/FULFILLED/BROKEN/PARTIAL), recoveryVisitId, notes, createdBy

2. **Promise Statuses:**
   - [ ] PENDING: Promise date not yet reached
   - [ ] FULFILLED: Full payment received on or before promise date
   - [ ] PARTIAL: Partial payment received
   - [ ] BROKEN: Promise date passed, no payment
   - [ ] CANCELLED: Promise cancelled by agent/admin

3. **Backend API:**
   - [ ] POST /api/recovery/promises - creates payment promise
   - [ ] PUT /api/recovery/promises/:id/fulfill - marks promise as fulfilled
   - [ ] PUT /api/recovery/promises/:id/cancel - cancels promise
   - [ ] GET /api/recovery/promises/due - promises due today or overdue
   - [ ] GET /api/recovery/promises?clientId=xxx - client's promise history

4. **Auto-Update Logic:**
   - [ ] When payment recorded, check for pending promises (earliest first - FIFO)
   - [ ] Match payment against promises in order of promise date
   - [ ] If payment >= promiseAmount: Mark promise FULFILLED, apply remaining to next promise
   - [ ] If payment < promiseAmount: Mark promise PARTIAL, remaining amount to next promise
   - [ ] **Promise matching is FIFO by promise date** (earliest promise gets first matching payment)
   - [ ] Daily job: Mark promises as BROKEN if promise date passed and status = PENDING

5. **Frontend:**
   - [ ] Payment Promise form
   - [ ] Due Promises page (today and overdue)
   - [ ] Promise history on client page
   - [ ] Promise fulfillment rate widget on dashboard
   - [ ] Color coding: Green (fulfilled), Yellow (pending), Red (broken)

6. **Alerts:**
   - [ ] Alert recovery agent on promise due date
   - [ ] Alert if promise broken

7. **Authorization:**
   - [ ] Recovery Agent can create/fulfill promises for their clients
   - [ ] Admin can view all promises

---

## Dev Notes

```prisma
model PaymentPromise {
  id                String         @id @default(cuid())
  clientId          String
  promiseDate       DateTime
  promiseAmount     Decimal        @db.Decimal(12, 2)
  actualPaymentDate DateTime?
  actualAmount      Decimal?       @db.Decimal(12, 2)
  status            PromiseStatus  @default(PENDING)
  recoveryVisitId   String?
  notes             String?        @db.Text
  createdBy         String
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt

  client            Client         @relation(fields: [clientId], references: [id])
  recoveryVisit     RecoveryVisit? @relation(fields: [recoveryVisitId], references: [id])
  creator           User           @relation(fields: [createdBy], references: [id])

  @@map("payment_promises")
}

enum PromiseStatus {
  PENDING
  FULFILLED
  PARTIAL
  BROKEN
  CANCELLED
}
```

```typescript
interface CreatePaymentPromiseDto {
  clientId: string;
  promiseDate: Date;
  promiseAmount: number;
  recoveryVisitId?: string;
  notes?: string;
}

async function createPaymentPromise(
  data: CreatePaymentPromiseDto,
  userId: string
): Promise<PaymentPromise> {
  // Verify agent is assigned to client
  const client = await prisma.client.findUnique({
    where: { id: data.clientId }
  });

  if (client?.recoveryAgentId !== userId) {
    throw new ForbiddenError('You are not assigned to this client');
  }

  // Verify promise date is in future
  if (data.promiseDate < new Date()) {
    throw new BadRequestError('Promise date must be in the future');
  }

  const promise = await prisma.paymentPromise.create({
    data: {
      clientId: data.clientId,
      promiseDate: data.promiseDate,
      promiseAmount: data.promiseAmount,
      recoveryVisitId: data.recoveryVisitId,
      notes: data.notes,
      status: 'PENDING',
      createdBy: userId
    }
  });

  await auditLogger.log({
    action: 'PAYMENT_PROMISE_CREATED',
    userId,
    resource: 'PaymentPromise',
    resourceId: promise.id,
    details: {
      clientId: data.clientId,
      promiseDate: data.promiseDate,
      promiseAmount: data.promiseAmount
    }
  });

  return promise;
}

async function fulfillPaymentPromise(
  promiseId: string,
  paymentId: string,
  userId: string
): Promise<PaymentPromise> {
  const promise = await prisma.paymentPromise.findUnique({
    where: { id: promiseId }
  });

  if (!promise) {
    throw new NotFoundError('Payment promise not found');
  }

  if (promise.status !== 'PENDING') {
    throw new BadRequestError('Promise is not pending');
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId }
  });

  if (!payment) {
    throw new NotFoundError('Payment not found');
  }

  // Determine status based on payment amount and date
  let status: PromiseStatus;
  const paymentAmount = parseFloat(payment.amount.toString());
  const promiseAmount = parseFloat(promise.promiseAmount.toString());

  if (paymentAmount >= promiseAmount) {
    status = 'FULFILLED';
  } else {
    status = 'PARTIAL';
  }

  const updated = await prisma.paymentPromise.update({
    where: { id: promiseId },
    data: {
      status,
      actualPaymentDate: payment.date,
      actualAmount: payment.amount
    }
  });

  await auditLogger.log({
    action: 'PAYMENT_PROMISE_FULFILLED',
    userId,
    resource: 'PaymentPromise',
    resourceId: promiseId,
    details: { status, actualAmount: paymentAmount }
  });

  return updated;
}

// Match payment to promises (FIFO by promise date)
async function matchPaymentToPromises(
  clientId: string,
  paymentAmount: number,
  paymentDate: Date
): Promise<void> {
  let remainingAmount = paymentAmount;

  // Get all PENDING promises for client, sorted by promise date (FIFO)
  const promises = await prisma.paymentPromise.findMany({
    where: {
      clientId,
      status: 'PENDING'
    },
    orderBy: { promiseDate: 'asc' } // Earliest promises first
  });

  for (const promise of promises) {
    if (remainingAmount <= 0) break;

    const promiseAmount = parseFloat(promise.promiseAmount.toString());

    if (remainingAmount >= promiseAmount) {
      // Full payment for this promise
      await prisma.paymentPromise.update({
        where: { id: promise.id },
        data: {
          status: 'FULFILLED',
          actualPaymentDate: paymentDate,
          actualAmount: promiseAmount
        }
      });

      await auditLogger.log({
        action: 'PAYMENT_PROMISE_FULFILLED',
        userId: 'SYSTEM',
        resource: 'PaymentPromise',
        resourceId: promise.id,
        details: { matchedToPayment: true, amount: promiseAmount }
      });

      remainingAmount -= promiseAmount;
    } else if (remainingAmount > 0) {
      // Partial payment toward this promise
      await prisma.paymentPromise.update({
        where: { id: promise.id },
        data: {
          status: 'PARTIAL',
          actualPaymentDate: paymentDate,
          actualAmount: remainingAmount
        }
      });

      await auditLogger.log({
        action: 'PAYMENT_PROMISE_PARTIAL',
        userId: 'SYSTEM',
        resource: 'PaymentPromise',
        resourceId: promise.id,
        details: { matchedToPayment: true, amount: remainingAmount }
      });

      remainingAmount = 0;
    }
  }
}

async function checkBrokenPromises(): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const brokenPromises = await prisma.paymentPromise.findMany({
    where: {
      status: 'PENDING',
      promiseDate: { lt: today }
    },
    include: {
      client: true,
      creator: true
    }
  });

  for (const promise of brokenPromises) {
    await prisma.paymentPromise.update({
      where: { id: promise.id },
      data: { status: 'BROKEN' }
    });

    // Create alert for recovery agent
    await prisma.alert.create({
      data: {
        type: 'PROMISE_BROKEN',
        priority: 'HIGH',
        message: `Payment promise broken: ${promise.client.name} failed to pay Rs.${parseFloat(promise.promiseAmount.toString()).toLocaleString()} by ${format(promise.promiseDate, 'PPP')}`,
        targetUsers: [promise.createdBy]
      }
    });

    await auditLogger.log({
      action: 'PAYMENT_PROMISE_BROKEN',
      userId: 'SYSTEM',
      resource: 'PaymentPromise',
      resourceId: promise.id
    });
  }
}

async function getDuePromises(userId: string, role: string): Promise<any[]> {
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today

  const where: any = {
    status: 'PENDING',
    promiseDate: { lte: today }
  };

  if (role === 'RECOVERY_AGENT') {
    where.createdBy = userId;
  }

  const promises = await prisma.paymentPromise.findMany({
    where,
    include: {
      client: {
        include: {
          recoveryAgent: true
        }
      }
    },
    orderBy: { promiseDate: 'asc' }
  });

  return promises.map(promise => {
    const daysOverdue = differenceInDays(today, promise.promiseDate);
    const isOverdue = daysOverdue > 0;

    return {
      promiseId: promise.id,
      clientId: promise.client.id,
      clientName: promise.client.name,
      contactPerson: promise.client.contactPerson,
      phone: promise.client.phone,
      promiseDate: promise.promiseDate,
      promiseAmount: parseFloat(promise.promiseAmount.toString()),
      daysOverdue: isOverdue ? daysOverdue : 0,
      isOverdue,
      recoveryAgent: promise.client.recoveryAgent?.name || 'Unassigned',
      notes: promise.notes
    };
  });
}

async function getPromiseFulfillmentRate(
  agentId?: string,
  dateFrom?: Date,
  dateTo?: Date
): Promise<{
  total: number;
  fulfilled: number;
  partial: number;
  broken: number;
  fulfillmentRate: number;
}> {
  const where: any = {
    status: { in: ['FULFILLED', 'PARTIAL', 'BROKEN'] }
  };

  if (agentId) {
    where.createdBy = agentId;
  }

  if (dateFrom || dateTo) {
    where.promiseDate = {};
    if (dateFrom) where.promiseDate.gte = dateFrom;
    if (dateTo) where.promiseDate.lte = dateTo;
  }

  const promises = await prisma.paymentPromise.findMany({ where });

  const total = promises.length;
  const fulfilled = promises.filter(p => p.status === 'FULFILLED').length;
  const partial = promises.filter(p => p.status === 'PARTIAL').length;
  const broken = promises.filter(p => p.status === 'BROKEN').length;

  const fulfillmentRate = total > 0 ? ((fulfilled + partial * 0.5) / total) * 100 : 0;

  return {
    total,
    fulfilled,
    partial,
    broken,
    fulfillmentRate: Math.round(fulfillmentRate * 10) / 10
  };
}
```

**Frontend:**
```tsx
import { FC } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { format, isPast } from 'date-fns';

export const DuePromisesPage: FC = () => {
  const queryClient = useQueryClient();

  const { data: promises, isLoading } = useQuery({
    queryKey: ['due-promises'],
    queryFn: () => fetch('/api/recovery/promises/due').then(res => res.json())
  });

  const getStatusColor = (isOverdue: boolean) => {
    return isOverdue ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200';
  };

  if (isLoading) return <Spinner />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Due Payment Promises</h1>

      {promises?.length === 0 ? (
        <Card>
          <Card.Body className="text-center text-gray-500 py-8">
            No payment promises due today.
          </Card.Body>
        </Card>
      ) : (
        <div className="space-y-4">
          {promises?.map((promise: any) => (
            <Card
              key={promise.promiseId}
              className={`border-2 ${getStatusColor(promise.isOverdue)}`}
            >
              <Card.Body>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold">{promise.clientName}</h3>
                    <p className="text-sm text-gray-600">{promise.contactPerson}</p>
                    <p className="text-sm text-gray-600">{promise.phone}</p>
                  </div>
                  {promise.isOverdue && (
                    <Badge className="bg-red-100 text-red-800">
                      {promise.daysOverdue} days overdue
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-gray-600">Promise Date</div>
                    <div className="font-semibold flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {format(promise.promiseDate, 'PPP')}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Promise Amount</div>
                    <div className="text-lg font-semibold text-green-600">
                      Rs.{promise.promiseAmount.toLocaleString()}
                    </div>
                  </div>
                </div>

                {promise.notes && (
                  <div className="mb-4 p-2 bg-gray-50 rounded text-sm">
                    <strong>Notes:</strong> {promise.notes}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => navigate(`/payments/new?clientId=${promise.clientId}&promiseId=${promise.promiseId}`)}
                  >
                    Record Payment
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate(`/recovery/visit/${promise.clientId}`)}
                  >
                    Log Visit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = `tel:${promise.phone}`}
                  >
                    Call Client
                  </Button>
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// Promise History Component
export const PromiseHistoryTimeline: FC<{ clientId: string }> = ({ clientId }) => {
  const { data: promises, isLoading } = useQuery({
    queryKey: ['payment-promises', clientId],
    queryFn: () => fetch(`/api/recovery/promises?clientId=${clientId}`).then(res => res.json())
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'FULFILLED':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'BROKEN':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'PARTIAL':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Calendar className="h-5 w-5 text-blue-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'FULFILLED': return 'text-green-600 bg-green-50';
      case 'BROKEN': return 'text-red-600 bg-red-50';
      case 'PARTIAL': return 'text-yellow-600 bg-yellow-50';
      case 'PENDING': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Payment Promise History</h3>

      {promises?.length === 0 ? (
        <p className="text-gray-500 text-sm">No payment promises recorded.</p>
      ) : (
        <div className="space-y-3">
          {promises?.map((promise: any) => (
            <div key={promise.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(promise.status)}
                  <Badge className={getStatusColor(promise.status)}>
                    {promise.status}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600">
                  {format(promise.promiseDate, 'PPP')}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Promised Amount</div>
                  <div className="font-semibold">Rs.{parseFloat(promise.promiseAmount).toLocaleString()}</div>
                </div>

                {promise.actualAmount && (
                  <div>
                    <div className="text-gray-600">Actual Amount</div>
                    <div className="font-semibold">Rs.{parseFloat(promise.actualAmount).toLocaleString()}</div>
                  </div>
                )}
              </div>

              {promise.notes && (
                <p className="text-sm text-gray-700 mt-2">{promise.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Fulfillment Rate Widget
export const PromiseFulfillmentWidget: FC<{ agentId?: string }> = ({ agentId }) => {
  const { data: stats } = useQuery({
    queryKey: ['promise-fulfillment-rate', agentId],
    queryFn: () => {
      const url = agentId
        ? `/api/recovery/promises/fulfillment-rate?agentId=${agentId}`
        : '/api/recovery/promises/fulfillment-rate';
      return fetch(url).then(res => res.json());
    }
  });

  return (
    <Card>
      <Card.Body>
        <h3 className="font-semibold mb-4">Promise Fulfillment Rate</h3>

        <div className="text-center mb-4">
          <div className="text-4xl font-bold text-blue-600">
            {stats?.fulfillmentRate || 0}%
          </div>
          <div className="text-sm text-gray-600">Overall Rate</div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Total Promises:</span>
            <span className="font-semibold">{stats?.total || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-green-600">Fulfilled:</span>
            <span className="font-semibold">{stats?.fulfilled || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-yellow-600">Partial:</span>
            <span className="font-semibold">{stats?.partial || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-red-600">Broken:</span>
            <span className="font-semibold">{stats?.broken || 0}</span>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};
```

**Cron Job:**
```typescript
// Run daily at 9:00 AM
cron.schedule('0 9 * * *', async () => {
  console.log('Running broken promises check...');
  await checkBrokenPromises();
});
```

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
