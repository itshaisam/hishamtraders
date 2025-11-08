# Story 8.6: Mobile Optimization and PWA Features

**Epic:** Epic 8 - Audit Trail Viewer & Advanced Features
**Story ID:** STORY-8.6
**Priority:** Medium
**Estimated Effort:** 10-12 hours
**Dependencies:** All existing epics
**Status:** Draft - Phase 2

---

## User Story

**As a** user,
**I want** optimized mobile experience with offline support,
**So that** I can use the system on the go without constant connectivity.

---

## Acceptance Criteria

1. **Progressive Web App (PWA) Configuration:**
   - [ ] manifest.json with app name, icons, theme colors
   - [ ] Service worker for offline support
   - [ ] Install prompt for "Add to Home Screen"

2. **Offline Functionality:**
   - [ ] Cache critical pages (dashboard, inventory list, client list)
   - [ ] Allow viewing cached data when offline
   - [ ] Queue actions (payments, adjustments, stock adjustments, recovery visits) for sync when online
   - [ ] Queue stored in IndexedDB with max 5 retries per action
   - [ ] Exponential backoff retry strategy (1s, 2s, 4s, 8s)
   - [ ] Display "Offline Mode" banner when disconnected
   - [ ] Display sync status indicator (pending, syncing, synced, error)

3. **Mobile-Optimized Workflows:**
   - [ ] Payment recording (simplified form with large buttons)
   - [ ] Stock lookup (barcode scan + quick view)
   - [ ] Client balance check (search client, display balance)
   - [ ] Invoice creation (touch-optimized, numeric keypad for quantities)

4. **Touch-Friendly UI:**
   - [ ] Buttons min 44px tap target
   - [ ] Swipe gestures (swipe to delete, swipe to approve)
   - [ ] Pull-to-refresh on list pages
   - [ ] Bottom navigation bar for key actions

5. **Mobile-Specific Features:**
   - [ ] Click-to-call phone numbers
   - [ ] Tap to open address in Google Maps
   - [ ] Camera access for barcode scanning
   - [ ] Tap to expand accordion sections

6. **Responsive Breakpoints:**
   - [ ] Mobile: 320px - 767px (portrait and landscape)
   - [ ] Tablet: 768px - 1023px
   - [ ] Desktop: 1024px+

7. **PWA Features:**
   - [ ] Install prompt displays on mobile browsers
   - [ ] Service worker caches API responses for 5 minutes (stale-while-revalidate)
   - [ ] Syncs queued actions automatically when connection restored
   - [ ] Displays sync status indicator (syncing, synced, offline)

8. **Authorization:**
   - [ ] All roles benefit from mobile optimization

---

## Dev Notes

**manifest.json:**
```json
{
  "name": "Hisham Traders ERP",
  "short_name": "HT ERP",
  "description": "Enterprise Resource Planning System",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#3b82f6",
  "background_color": "#ffffff",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**Service Worker (service-worker.js):**
```javascript
const CACHE_NAME = 'ht-erp-v1';
const urlsToCache = [
  '/',
  '/dashboard',
  '/inventory',
  '/clients',
  '/static/css/main.css',
  '/static/js/main.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }

      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200) {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});

// Offline Queue Management with IndexedDB
async function syncQueuedActions() {
  const db = await openDB('erp-queue');
  const actions = await db.getAll('actions');

  for (const action of actions) {
    try {
      await executeQueuedAction(action, db);
      await db.delete('actions', action.id);
    } catch (error) {
      console.error('Sync failed for action:', action.id, error);
      await updateActionRetry(action, db);
    }
  }
}

async function executeQueuedAction(action, db) {
  const response = await fetch(action.url, {
    method: action.method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(action.payload)
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function updateActionRetry(action, db) {
  const maxRetries = 5;
  const retryDelays = [1000, 2000, 4000, 8000, 16000]; // Exponential backoff

  if (!action.retryCount) {
    action.retryCount = 0;
  }

  if (action.retryCount >= maxRetries) {
    // Mark action as permanently failed
    action.status = 'FAILED';
    action.lastError = 'Max retries exceeded';
    await db.put('actions', action);
  } else {
    // Schedule next retry
    const nextRetryDelay = retryDelays[action.retryCount];
    action.retryCount += 1;
    action.nextRetryAt = Date.now() + nextRetryDelay;
    action.status = 'PENDING';
    await db.put('actions', action);
  }
}

// Background sync triggered when connection restored
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-actions') {
    event.waitUntil(syncQueuedActions());
  }
});
```

**Offline Queue Structure (IndexedDB):**
```typescript
// Queue item interface
interface OfflineQueueItem {
  id: string; // UUID
  action: QueueableAction; // Action type
  timestamp: Date; // When queued
  payload: Record<string, any>; // API request body
  url: string; // API endpoint
  method: 'POST' | 'PUT' | 'PATCH'; // HTTP method
  retryCount: number; // Number of retries attempted
  maxRetries: number; // Default: 5
  nextRetryAt?: number; // Timestamp for next retry
  status: 'PENDING' | 'SYNCING' | 'FAILED'; // Queue item status
  lastError?: string; // Error message if failed
  createdAt: Date; // Created timestamp
  updatedAt: Date; // Last update timestamp
}

// Queueable actions
enum QueueableAction {
  CREATE_PAYMENT = 'CREATE_PAYMENT',
  CREATE_INVOICE = 'CREATE_INVOICE',
  UPDATE_STOCK_ADJUSTMENT = 'UPDATE_STOCK_ADJUSTMENT',
  LOG_RECOVERY_VISIT = 'LOG_RECOVERY_VISIT'
}

// IndexedDB Schema
interface QueueDB {
  actions: OfflineQueueItem[];
}

// Storage implementation
class OfflineQueueManager {
  private db: IDBDatabase;
  private storeName = 'offline-actions';

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('erp-offline-queue', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('action', 'action', { unique: false });
        store.createIndex('nextRetryAt', 'nextRetryAt', { unique: false });
      };
    });
  }

  async enqueue(item: Omit<OfflineQueueItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<OfflineQueueItem> {
    const queueItem: OfflineQueueItem = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      retryCount: 0,
      maxRetries: 5,
      status: 'PENDING'
    };

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([this.storeName], 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.add(queueItem);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(queueItem);
    });
  }

  async getPendingActions(): Promise<OfflineQueueItem[]> {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([this.storeName], 'readonly');
      const store = tx.objectStore(this.storeName);
      const index = store.index('status');
      const request = index.getAll('PENDING');

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async updateStatus(id: string, status: 'PENDING' | 'SYNCING' | 'FAILED', error?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([this.storeName], 'readwrite');
      const store = tx.objectStore(this.storeName);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const item = getRequest.result;
        item.status = status;
        item.updatedAt = new Date();
        if (error) item.lastError = error;

        const updateRequest = store.put(item);
        updateRequest.onerror = () => reject(updateRequest.error);
        updateRequest.onsuccess = () => resolve();
      };
    });
  }

  async remove(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([this.storeName], 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}
```

**Frontend - Offline Detection:**
```tsx
export const OfflineBanner: FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="bg-yellow-500 text-white p-3 text-center">
      You are currently offline. Changes will sync when connection is restored.
    </div>
  );
};
```

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
