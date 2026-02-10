# Story 8.10: Advanced Search and Filtering

**Epic:** Epic 8 - Audit Trail Viewer & Advanced Features
**Story ID:** STORY-8.10
**Priority:** High
**Estimated Effort:** 8-10 hours
**Dependencies:** All epics (searches across all modules)
**Status:** Draft — Phase 2 (v2.0 — Revised)

---

## User Story

**As an** admin,
**I want** advanced search capabilities across all modules,
**So that** I can quickly find any record or transaction.

---

## Acceptance Criteria

1. **Backend API:**
   - [ ] GET /api/v1/search?q=query&entity=TYPE - searches across multiple entity types
   - [ ] Case-insensitive (MySQL default with utf8 collation -- no special handling needed)
   - [ ] Supports partial matches via `contains`

2. **Entity Types Searchable:**
   - [ ] Product, Client, Supplier, Invoice, PurchaseOrder, Payment

3. **Search Matches:**
   - [ ] SKU, name, invoice number, PO number, container number (`containerNo`), phone, email

4. **Search Results:**
   - [ ] Grouped by entity type: Products (5 results), Invoices (5 results), etc.
   - [ ] Each result includes: entity type, primary identifier (name, number), secondary info (date, amount), link to detail page
   - [ ] Limited to entities user has permission to view

5. **Frontend - Global Search Bar:**
   - [ ] Search input in navigation header
   - [ ] Autocomplete dropdown (displays results as user types)
   - [ ] Debounced API calls (300ms delay) using inline `setTimeout` or a simple `useDebounce` hook (must be created)
   - [ ] "View All Results" link if > 10 matches

6. **Frontend - Search Results Page:**
   - [ ] All matches grouped by entity type
   - [ ] Filters to narrow by entity type
   - [ ] Clickable result cards navigate to detail page

7. **Performance:**
   - [ ] < 500ms for databases with 10K records

8. **Recent Searches:**
   - [ ] Stores last 5 searches in localStorage

9. **Authorization:**
   - [ ] All roles can search within their permissions

---

## Dev Notes

### Backend -- Global Search Service

**Important MySQL notes:**
- Do NOT use `mode: 'insensitive'` -- MySQL with utf8 collation is case-insensitive by default. Prisma's `mode: 'insensitive'` is only for PostgreSQL and will cause errors on MySQL.
- Product model has NO `barcode` field. Search by `sku` and `name` only.
- PurchaseOrder field is `containerNo` (NOT `containerNumber`).
- Invoice has NO `createdBy` field. Role-based filtering for non-admin users should use a different approach (e.g., warehouse-based filtering or no restriction for search).

```typescript
import { prisma } from '../prisma.js';

interface SearchResult {
  entityType: string;
  entityId: string;
  primaryText: string;
  secondaryText: string;
  link: string;
}

async function globalSearch(
  query: string,
  entityType?: string,
  userRole?: string,
  userId?: string
): Promise<{ results: SearchResult[]; total: number }> {
  const results: SearchResult[] = [];

  // Search Products
  if (!entityType || entityType === 'Product') {
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { sku: { contains: query } },
          { name: { contains: query } }
          // NOTE: No barcode field on Product model
        ]
      },
      take: 5
    });

    results.push(
      ...products.map(p => ({
        entityType: 'Product',
        entityId: p.id,
        primaryText: p.name,
        secondaryText: `SKU: ${p.sku}`,
        link: `/products/${p.id}`
      }))
    );
  }

  // Search Clients
  if (!entityType || entityType === 'Client') {
    const clients = await prisma.client.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { phone: { contains: query } },
          { email: { contains: query } }
        ]
      },
      take: 5
    });

    results.push(
      ...clients.map(c => ({
        entityType: 'Client',
        entityId: c.id,
        primaryText: c.name,
        secondaryText: c.phone || c.email || '',
        link: `/clients/${c.id}`
      }))
    );
  }

  // Search Invoices
  if (!entityType || entityType === 'Invoice') {
    // NOTE: Invoice has NO createdBy field.
    // For role-based filtering, consider warehouse-based access or
    // allow all authenticated users to search invoices.
    const invoices = await prisma.invoice.findMany({
      where: {
        invoiceNumber: { contains: query }
      },
      include: { client: true },
      take: 5
    });

    results.push(
      ...invoices.map(inv => ({
        entityType: 'Invoice',
        entityId: inv.id,
        primaryText: inv.invoiceNumber,
        secondaryText: `${inv.client.name} - Rs.${parseFloat(inv.total.toString()).toLocaleString()}`,
        link: `/invoices/${inv.id}`
      }))
    );
  }

  // Search Purchase Orders
  if (!entityType || entityType === 'PurchaseOrder') {
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: {
        OR: [
          { poNumber: { contains: query } },
          { containerNo: { contains: query } }  // Correct field name: containerNo
        ]
      },
      include: { supplier: true },
      take: 5
    });

    results.push(
      ...purchaseOrders.map(po => ({
        entityType: 'PurchaseOrder',
        entityId: po.id,
        primaryText: po.poNumber,
        secondaryText: `${po.supplier.name} - ${po.containerNo || 'No container'}`,
        link: `/purchase-orders/${po.id}`
      }))
    );
  }

  return {
    results,
    total: results.length
  };
}
```

### Frontend -- useDebounce Hook (Must Be Created)

This hook does not exist in the codebase and must be created. Place it at `apps/web/src/hooks/useDebounce.ts`.

```typescript
// apps/web/src/hooks/useDebounce.ts
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

### Frontend -- Global Search Bar

Uses `apiClient` instead of raw `fetch()`. Uses relative imports (project does NOT use `@/` path aliases).

```tsx
import { FC, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import { apiClient } from '../lib/api-client';

interface SearchResult {
  entityType: string;
  entityId: string;
  primaryText: string;
  secondaryText: string;
  link: string;
}

export const GlobalSearchBar: FC = () => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  const { data: results } = useQuery({
    queryKey: ['global-search', debouncedQuery],
    queryFn: async () => {
      const response = await apiClient.get('/search', {
        params: { q: debouncedQuery }
      });
      return response.data.data;
    },
    enabled: debouncedQuery.length >= 2
  });

  useEffect(() => {
    // Save to recent searches
    if (debouncedQuery && results?.total > 0) {
      const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
      const updated = [debouncedQuery, ...recent.filter((s: string) => s !== debouncedQuery)];
      localStorage.setItem('recentSearches', JSON.stringify(updated.slice(0, 5)));
    }
  }, [debouncedQuery, results]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setIsOpen(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search anything..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-4 py-2 w-80 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {isOpen && query.length >= 2 && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-xl border z-50 max-h-96 overflow-y-auto">
          {!results?.results || results.results.length === 0 ? (
            <div className="p-4 text-gray-500 text-center">No results found</div>
          ) : (
            <>
              {Object.entries(
                results.results.reduce((acc: Record<string, SearchResult[]>, result: SearchResult) => {
                  if (!acc[result.entityType]) acc[result.entityType] = [];
                  acc[result.entityType].push(result);
                  return acc;
                }, {} as Record<string, SearchResult[]>)
              ).map(([entityType, items]) => (
                <div key={entityType}>
                  <div className="px-4 py-2 bg-gray-50 font-semibold text-sm text-gray-700">
                    {entityType}s ({items.length})
                  </div>
                  {items.map((result: SearchResult) => (
                    <a
                      key={result.entityId}
                      href={result.link}
                      className="block px-4 py-3 hover:bg-gray-50 border-b last:border-b-0"
                      onClick={() => setIsOpen(false)}
                    >
                      <div className="font-semibold text-sm">{result.primaryText}</div>
                      <div className="text-xs text-gray-600">{result.secondaryText}</div>
                    </a>
                  ))}
                </div>
              ))}

              {results.total > 10 && (
                <a
                  href={`/search?q=${encodeURIComponent(query)}`}
                  className="block px-4 py-3 text-center text-blue-600 hover:bg-gray-50 text-sm font-medium"
                >
                  View All Results ({results.total})
                </a>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
```

---

### Key Corrections (from v1.0)

1. **API path corrected** -- `/api/search` changed to `/api/v1/search`. Frontend `apiClient` base URL already includes `/api/v1`, so the call uses `/search`.
2. **Removed ALL `mode: 'insensitive'`** -- MySQL is case-insensitive by default with utf8 collation. Prisma's `mode: 'insensitive'` is PostgreSQL-only and will error on MySQL.
3. **Fixed `containerNumber` to `containerNo`** -- the actual PurchaseOrder field name is `containerNo`, not `containerNumber`.
4. **Removed `barcode` search on Product** -- Product model has no `barcode` field. Search limited to `sku` and `name`.
5. **Removed Invoice `createdBy` filter** -- Invoice model has no `createdBy` field. Role-based authorization needs a different approach (documented as a note in the code).
6. **`useDebounce` hook must be created** -- v1.0 imported from `@/hooks/useDebounce` but this hook does not exist. Provided implementation and noted it must be created at `apps/web/src/hooks/useDebounce.ts`.
7. **Fixed import path alias** -- project does NOT use `@/` path aliases. Changed to relative import `../hooks/useDebounce`.
8. **Frontend uses `apiClient`** -- replaced raw `fetch()` calls with axios `apiClient` pattern from `../lib/api-client`.
9. **Added click-outside handler** -- closes dropdown when clicking outside the search bar.
10. **Deduplicated recent searches** -- v1.0 could add duplicate entries to the recent searches list. Revised to filter out duplicates before saving.

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
| 2026-02-10 | 2.0     | Major revision: fix API path to /api/v1/, remove mode:'insensitive' (MySQL incompatible), fix containerNumber to containerNo, remove barcode search (field doesn't exist), remove Invoice.createdBy filter (field doesn't exist), note useDebounce must be created, fix @/ import path to relative, replace fetch() with apiClient | Claude (Dev Review) |
