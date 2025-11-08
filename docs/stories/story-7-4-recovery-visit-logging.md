# Story 7.4: Recovery Visit Logging

**Epic:** Epic 7 - Recovery & Collection Management
**Story ID:** STORY-7.4
**Priority:** High
**Estimated Effort:** 6-8 hours
**Dependencies:** Story 7.1
**Status:** Draft - Phase 2

---

## User Story

**As a** recovery agent,
**I want** to log each recovery visit with outcome and notes,
**So that** there's a complete history of collection efforts.

---

## Acceptance Criteria

1. **Database Schema:**
   - [ ] RecoveryVisit table: clientId, visitDate, visitTime, outcome, amountCollected, promiseDate, promiseAmount, notes, visitedBy, location (lat/lng), createdAt

2. **Visit Outcomes:**
   - [ ] PAYMENT_COLLECTED
   - [ ] PROMISE_MADE
   - [ ] CLIENT_UNAVAILABLE
   - [ ] REFUSED_TO_PAY
   - [ ] PARTIAL_PAYMENT
   - [ ] DISPUTE_RAISED
   - [ ] OTHER

3. **Backend API:**
   - [ ] POST /api/recovery/visits - creates visit log
   - [ ] GET /api/recovery/visits?clientId=xxx - visit history for client
   - [ ] GET /api/recovery/visits/my - logged-in agent's visits
   - [ ] Validation: If outcome = PAYMENT_COLLECTED or PARTIAL_PAYMENT, amountCollected required
   - [ ] Validation: If outcome = PROMISE_MADE, promiseDate and promiseAmount required

4. **Integration:**
   - [ ] If amountCollected > 0, optionally create payment record
   - [ ] If promise made, create PaymentPromise record

5. **Location Capture:**
   - [ ] Capture GPS coordinates when visit logged (mobile)
   - [ ] Verify location matches client address (within reasonable distance)

6. **Frontend:**
   - [ ] Visit Log form
   - [ ] Quick action buttons for common outcomes
   - [ ] Voice notes support (optional)
   - [ ] Photo upload (optional - proof of visit)
   - [ ] Visit history timeline on client page

7. **Authorization:**
   - [ ] Recovery Agent can log visits for their assigned clients
   - [ ] Admin can view all visits

---

## Dev Notes

```prisma
model RecoveryVisit {
  id              String         @id @default(cuid())
  visitNumber     String         @unique
  clientId        String
  visitDate       DateTime       @default(now())
  visitTime       String?
  outcome         VisitOutcome
  amountCollected Decimal        @default(0) @db.Decimal(12, 2)
  promiseDate     DateTime?
  promiseAmount   Decimal?       @db.Decimal(12, 2)
  notes           String?        @db.Text
  visitedBy       String
  latitude        Float?
  longitude       Float?
  photoUrl        String?
  voiceNoteUrl    String?
  createdAt       DateTime       @default(now())

  client          Client         @relation(fields: [clientId], references: [id])
  agent           User           @relation(fields: [visitedBy], references: [id])

  @@map("recovery_visits")
}

enum VisitOutcome {
  PAYMENT_COLLECTED
  PROMISE_MADE
  CLIENT_UNAVAILABLE
  REFUSED_TO_PAY
  PARTIAL_PAYMENT
  DISPUTE_RAISED
  OTHER
}
```

```typescript
interface CreateRecoveryVisitDto {
  clientId: string;
  visitDate: Date;
  visitTime?: string;
  outcome: VisitOutcome;
  amountCollected?: number;
  promiseDate?: Date;
  promiseAmount?: number;
  notes?: string;
  latitude?: number;
  longitude?: number;
  photoUrl?: string;
  voiceNoteUrl?: string;
}

async function createRecoveryVisit(
  data: CreateRecoveryVisitDto,
  userId: string
): Promise<RecoveryVisit> {
  // Validate outcome-specific requirements
  if (['PAYMENT_COLLECTED', 'PARTIAL_PAYMENT'].includes(data.outcome)) {
    if (!data.amountCollected || data.amountCollected <= 0) {
      throw new BadRequestError('Amount collected is required for this outcome');
    }
  }

  if (data.outcome === 'PROMISE_MADE') {
    if (!data.promiseDate || !data.promiseAmount) {
      throw new BadRequestError('Promise date and amount are required');
    }
  }

  // Verify agent is assigned to this client
  const client = await prisma.client.findUnique({
    where: { id: data.clientId }
  });

  if (client?.recoveryAgentId !== userId) {
    throw new ForbiddenError('You are not assigned to this client');
  }

  // Verify location if provided
  if (data.latitude && data.longitude && client.latitude && client.longitude) {
    const distance = calculateDistance(
      data.latitude,
      data.longitude,
      client.latitude,
      client.longitude
    );

    // If more than 5km away, log warning
    if (distance > 5000) {
      console.warn(`Visit logged ${distance}m away from client address`);
    }
  }

  // Generate visit number
  const visitNumber = await generateVisitNumber();

  // Create visit
  const visit = await prisma.recoveryVisit.create({
    data: {
      visitNumber,
      clientId: data.clientId,
      visitDate: data.visitDate,
      visitTime: data.visitTime,
      outcome: data.outcome,
      amountCollected: data.amountCollected || 0,
      promiseDate: data.promiseDate,
      promiseAmount: data.promiseAmount,
      notes: data.notes,
      visitedBy: userId,
      latitude: data.latitude,
      longitude: data.longitude,
      photoUrl: data.photoUrl,
      voiceNoteUrl: data.voiceNoteUrl
    }
  });

  // If promise made, create payment promise
  if (data.outcome === 'PROMISE_MADE' && data.promiseDate && data.promiseAmount) {
    await prisma.paymentPromise.create({
      data: {
        clientId: data.clientId,
        promiseDate: data.promiseDate,
        promiseAmount: data.promiseAmount,
        status: 'PENDING',
        recoveryVisitId: visit.id
      }
    });
  }

  await auditLogger.log({
    action: 'RECOVERY_VISIT_LOGGED',
    userId,
    resource: 'RecoveryVisit',
    resourceId: visit.id,
    details: {
      clientId: data.clientId,
      outcome: data.outcome,
      amountCollected: data.amountCollected
    }
  });

  return visit;
}

async function generateVisitNumber(): Promise<string> {
  const today = format(new Date(), 'yyyyMMdd');
  const lastVisit = await prisma.recoveryVisit.findFirst({
    where: {
      visitNumber: { startsWith: `RV-${today}` }
    },
    orderBy: { visitNumber: 'desc' }
  });

  let sequence = 1;
  if (lastVisit) {
    const lastSequence = parseInt(lastVisit.visitNumber.split('-')[2]);
    sequence = lastSequence + 1;
  }

  return `RV-${today}-${sequence.toString().padStart(4, '0')}`;
}

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

async function getClientVisitHistory(clientId: string): Promise<RecoveryVisit[]> {
  return await prisma.recoveryVisit.findMany({
    where: { clientId },
    include: {
      agent: {
        select: { name: true }
      }
    },
    orderBy: { visitDate: 'desc' }
  });
}
```

**Frontend:**
```tsx
import { FC, useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Camera, Mic, Calendar } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const visitSchema = z.object({
  clientId: z.string(),
  visitDate: z.date(),
  visitTime: z.string().optional(),
  outcome: z.enum([
    'PAYMENT_COLLECTED',
    'PROMISE_MADE',
    'CLIENT_UNAVAILABLE',
    'REFUSED_TO_PAY',
    'PARTIAL_PAYMENT',
    'DISPUTE_RAISED',
    'OTHER'
  ]),
  amountCollected: z.number().optional(),
  promiseDate: z.date().optional(),
  promiseAmount: z.number().optional(),
  notes: z.string().optional()
});

export const RecoveryVisitLogPage: FC<{ clientId: string }> = ({ clientId }) => {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const queryClient = useQueryClient();

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(visitSchema),
    defaultValues: {
      clientId,
      visitDate: new Date(),
      visitTime: format(new Date(), 'HH:mm')
    }
  });

  const outcome = watch('outcome');

  // Capture GPS location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Failed to get location:', error);
        }
      );
    }
  }, []);

  const createVisit = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/recovery/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          latitude: location?.lat,
          longitude: location?.lng
        })
      });
      if (!response.ok) throw new Error('Failed to create visit');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['recovery-visits']);
      toast.success('Visit logged successfully');
    }
  });

  const onSubmit = (data: any) => {
    createVisit.mutate(data);
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Log Recovery Visit</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="mb-6">
          <Card.Body>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <DatePicker
                label="Visit Date"
                {...register('visitDate')}
                error={errors.visitDate?.message}
              />

              <Input
                type="time"
                label="Visit Time"
                {...register('visitTime')}
              />
            </div>

            {location && (
              <div className="mb-4 p-3 bg-green-50 rounded flex items-center gap-2 text-sm text-green-700">
                <MapPin className="h-4 w-4" />
                Location captured: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
              </div>
            )}

            <Select
              label="Visit Outcome"
              {...register('outcome')}
              error={errors.outcome?.message}
            >
              <option value="">Select outcome...</option>
              <option value="PAYMENT_COLLECTED">Payment Collected</option>
              <option value="PARTIAL_PAYMENT">Partial Payment</option>
              <option value="PROMISE_MADE">Promise Made</option>
              <option value="CLIENT_UNAVAILABLE">Client Unavailable</option>
              <option value="REFUSED_TO_PAY">Refused to Pay</option>
              <option value="DISPUTE_RAISED">Dispute Raised</option>
              <option value="OTHER">Other</option>
            </Select>

            {(outcome === 'PAYMENT_COLLECTED' || outcome === 'PARTIAL_PAYMENT') && (
              <Input
                type="number"
                label="Amount Collected"
                {...register('amountCollected', { valueAsNumber: true })}
                error={errors.amountCollected?.message}
                placeholder="0.00"
              />
            )}

            {outcome === 'PROMISE_MADE' && (
              <div className="grid grid-cols-2 gap-4">
                <DatePicker
                  label="Promise Date"
                  {...register('promiseDate')}
                  error={errors.promiseDate?.message}
                />

                <Input
                  type="number"
                  label="Promise Amount"
                  {...register('promiseAmount', { valueAsNumber: true })}
                  error={errors.promiseAmount?.message}
                  placeholder="0.00"
                />
              </div>
            )}

            <Textarea
              label="Notes"
              {...register('notes')}
              rows={4}
              placeholder="Add any relevant notes about the visit..."
            />

            <div className="grid grid-cols-2 gap-4 mt-4">
              <Button type="button" variant="outline">
                <Camera className="h-4 w-4 mr-2" />
                Add Photo
              </Button>

              <Button type="button" variant="outline">
                <Mic className="h-4 w-4 mr-2" />
                Voice Note
              </Button>
            </div>
          </Card.Body>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" variant="primary" className="flex-1">
            Log Visit
          </Button>
          <Button type="button" variant="secondary" onClick={() => history.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

// Visit History Timeline Component
export const VisitHistoryTimeline: FC<{ clientId: string }> = ({ clientId }) => {
  const { data: visits, isLoading } = useQuery({
    queryKey: ['recovery-visits', clientId],
    queryFn: () => fetch(`/api/recovery/visits?clientId=${clientId}`).then(res => res.json())
  });

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'PAYMENT_COLLECTED': return 'text-green-600 bg-green-50';
      case 'PROMISE_MADE': return 'text-blue-600 bg-blue-50';
      case 'CLIENT_UNAVAILABLE': return 'text-gray-600 bg-gray-50';
      case 'REFUSED_TO_PAY': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Visit History</h3>

      {visits?.length === 0 ? (
        <p className="text-gray-500 text-sm">No visits logged yet.</p>
      ) : (
        <div className="relative border-l-2 border-gray-200 ml-3">
          {visits?.map((visit: any, index: number) => (
            <div key={visit.id} className="mb-6 ml-6">
              <div className="absolute w-3 h-3 bg-blue-600 rounded-full -left-[7px] border-2 border-white"></div>

              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-sm text-gray-600">
                      {format(visit.visitDate, 'PPP')} {visit.visitTime && `at ${visit.visitTime}`}
                    </div>
                    <Badge className={getOutcomeColor(visit.outcome)}>
                      {visit.outcome.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-500">
                    by {visit.agent.name}
                  </div>
                </div>

                {visit.amountCollected > 0 && (
                  <div className="text-sm font-semibold text-green-600 mb-2">
                    Amount Collected: Rs.{parseFloat(visit.amountCollected).toLocaleString()}
                  </div>
                )}

                {visit.promiseDate && (
                  <div className="text-sm text-blue-600 mb-2">
                    <Calendar className="h-3 w-3 inline mr-1" />
                    Promise: Rs.{parseFloat(visit.promiseAmount).toLocaleString()} by {format(visit.promiseDate, 'PPP')}
                  </div>
                )}

                {visit.notes && (
                  <p className="text-sm text-gray-700">{visit.notes}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
