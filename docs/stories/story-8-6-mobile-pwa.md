# Story 8.6: Mobile Optimization and PWA Features

**Epic:** Epic 8 - Audit Trail Viewer & Advanced Features
**Story ID:** STORY-8.6
**Priority:** Medium
**Estimated Effort:** 6-8 hours
**Dependencies:** All existing epics
**Status:** Draft — Phase 2 (v2.0 — Revised)

---

## User Story

**As a** user,
**I want** an optimized mobile experience with basic PWA install support,
**So that** I can use the system on mobile devices with a native-like experience.

---

## Acceptance Criteria

1. **Progressive Web App (PWA) Configuration:**
   - [ ] `manifest.json` with app name, icons, theme colors
   - [ ] Service worker via `vite-plugin-pwa` (Workbox-based) for asset caching
   - [ ] Install prompt for "Add to Home Screen"

2. **Basic Caching (via vite-plugin-pwa / Workbox):**
   - [ ] Pre-cache the app shell (HTML, JS, CSS bundles — Vite-hashed filenames handled automatically)
   - [ ] Runtime cache API responses with stale-while-revalidate strategy (5-minute TTL)
   - [ ] Display "Offline Mode" banner when disconnected

3. **Responsive Design:**
   - [ ] Mobile: 320px - 767px (portrait and landscape)
   - [ ] Tablet: 768px - 1023px
   - [ ] Desktop: 1024px+
   - [ ] All existing pages render correctly at all breakpoints

4. **Touch-Friendly UI:**
   - [ ] Buttons min 44px tap target
   - [ ] Tap to expand accordion sections
   - [ ] Adequate spacing between interactive elements on mobile

5. **Mobile-Specific Features:**
   - [ ] Click-to-call phone numbers (`tel:` links)
   - [ ] Tap to open address in Google Maps
   - [ ] Responsive tables (horizontal scroll or card layout on mobile)

6. **Authorization:**
   - [ ] All roles benefit from mobile optimization

---

## POST-MVP Deferred

The following features are deferred to post-MVP. They are documented here for future reference but are NOT part of this story's scope:

- **Offline queue with IndexedDB** — queuing mutations (payments, adjustments) for sync when online. Requires careful conflict resolution logic.
- **Background sync** — `self.addEventListener('sync', ...)` for retrying queued actions.
- **Exponential backoff retry strategy** — over-engineered for MVP.
- **Swipe gestures** — swipe to delete, swipe to approve.
- **Pull-to-refresh** — on list pages.
- **Bottom navigation bar** — for key mobile actions.
- **Barcode/camera scanning** — requires additional library integration.
- **Mobile-optimized invoice creation** — touch-optimized numeric keypad for quantities.

---

## Dev Notes

### Install vite-plugin-pwa

```bash
cd apps/web
npm install -D vite-plugin-pwa
```

### Vite Configuration (vite.config.ts)

```typescript
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png'],
      manifest: {
        name: 'Hisham Traders ERP',
        short_name: 'HT ERP',
        description: 'Enterprise Resource Planning System',
        start_url: '/',
        display: 'standalone',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        // Pre-cache app shell (Vite hashed filenames handled automatically)
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Runtime caching for API calls
        runtimeCaching: [
          {
            urlPattern: /^http:\/\/localhost:3001\/api\/v1\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 300 // 5 minutes
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ]
});
```

> **Note:** `vite-plugin-pwa` uses Workbox under the hood. It automatically handles Vite's hashed filenames in the precache manifest. Do NOT write a manual `service-worker.js` with hardcoded paths like `/static/css/main.css` -- Vite hashes all output filenames.

### Frontend -- Offline Detection Banner

```tsx
import { useState, useEffect, FC } from 'react';
import { Alert } from '../../components/ui/Alert';

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
    <div className="bg-yellow-500 text-white p-3 text-center text-sm font-medium">
      You are currently offline. Some features may be unavailable.
    </div>
  );
};
```

### Responsive Table Wrapper

```tsx
// Wrap existing Table components on mobile for horizontal scroll
export const ResponsiveTableWrapper: FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <div className="inline-block min-w-full align-middle">
        {children}
      </div>
    </div>
  );
};
```

### Click-to-Call Pattern

```tsx
// In client detail pages, wrap phone numbers:
<a href={`tel:${client.phone}`} className="text-blue-600 hover:underline">
  {client.phone}
</a>

// In client detail pages, wrap addresses for Google Maps:
<a
  href={`https://maps.google.com/?q=${encodeURIComponent(client.city + ' ' + client.area)}`}
  target="_blank"
  rel="noopener noreferrer"
  className="text-blue-600 hover:underline"
>
  {client.city}, {client.area}
</a>
```

---

### Key Corrections (from v1.0)

1. **Removed hand-rolled service worker** -- v1.0 had a manual `service-worker.js` with hardcoded paths like `/static/css/main.css` and `/static/js/main.js`. Vite uses hashed filenames so those paths would never match. Replaced with `vite-plugin-pwa` which handles this correctly.
2. **Removed IndexedDB offline queue** -- `OfflineQueueManager` class with `openDB` (from `idb` library, never imported) and full retry logic was over-engineered for MVP. Deferred to post-MVP.
3. **Removed exponential backoff retry strategy** -- queued actions with max 5 retries and backoff (1s, 2s, 4s, 8s) is post-MVP complexity.
4. **Removed background sync** -- `self.addEventListener('sync', ...)` handler deferred to post-MVP.
5. **Removed swipe gestures, pull-to-refresh, bottom nav bar** -- all deferred to post-MVP.
6. **Removed barcode scanning** -- Product model has no `barcode` field. Camera-based scanning deferred.
7. **Simplified scope** -- MVP focuses on responsive design, manifest.json, and basic service worker via vite-plugin-pwa. Estimated effort reduced from 10-12 hours to 6-8 hours.

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
| 2026-02-10 | 2.0     | Major revision: replaced hand-rolled service worker with vite-plugin-pwa, removed IndexedDB offline queue / background sync / exponential backoff (deferred to post-MVP), removed swipe gestures / pull-to-refresh / bottom nav bar, simplified to responsive design + basic PWA for MVP | Claude (Dev Review) |
