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
   - [ ] Queue actions (payments, adjustments) for sync when online
   - [ ] Display "Offline Mode" banner when disconnected

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

// Background sync for queued actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-actions') {
    event.waitUntil(syncQueuedActions());
  }
});

async function syncQueuedActions() {
  const db = await openDB('erp-queue');
  const actions = await db.getAll('actions');

  for (const action of actions) {
    try {
      await fetch(action.url, {
        method: action.method,
        body: JSON.stringify(action.data)
      });
      await db.delete('actions', action.id);
    } catch (error) {
      console.error('Sync failed:', error);
    }
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
