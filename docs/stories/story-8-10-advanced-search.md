# Story 8.10: Advanced Search and Filtering

**Epic:** Epic 8 - Audit Trail Viewer & Advanced Features
**Story ID:** STORY-8.10
**Priority:** High
**Estimated Effort:** 8-10 hours
**Dependencies:** All epics (searches across all modules)
**Status:** Draft - Phase 2

---

## User Story

**As an** admin,
**I want** advanced search capabilities across all modules,
**So that** I can quickly find any record or transaction.

---

## Acceptance Criteria

1. **Backend API:**
   - [ ] GET /api/search?q=query&entity=TYPE - searches across multiple entity types
   - [ ] Case-insensitive and supports partial matches

2. **Entity Types Searchable:**
   - [ ] Product, Client, Supplier, Invoice, PurchaseOrder, Payment

3. **Search Matches:**
   - [ ] SKU, name, invoice number, PO number, container number, phone, email

4. **Search Results:**
   - [ ] Grouped by entity type: Products (5 results), Invoices (3 results), etc.
   - [ ] Each result includes: entity type, primary identifier (name, number), secondary info (date, amount), link to detail page
   - [ ] Limited to entities user has permission to view

5. **Frontend - Global Search Bar:**
   - [ ] Search input in navigation header
   - [ ] Autocomplete dropdown (displays results as user types)
   - [ ] Debounced API calls (300ms delay)
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

```typescript
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
  userRole: string,
  userId: string
): Promise<{ results: SearchResult[]; total: number }> {
  const searchTerm = query.toLowerCase();
  const results: SearchResult[] = [];

  // Search Products
  if (!entityType || entityType === 'Product') {
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { sku: { contains: searchTerm, mode: 'insensitive' } },
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { barcode: { contains: searchTerm, mode: 'insensitive' } }
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
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { phone: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } }
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
    const where: any = {
      invoiceNumber: { contains: searchTerm, mode: 'insensitive' }
    };

    // Non-admins see only their invoices
    if (userRole === 'SALES_OFFICER') {
      where.createdBy = userId;
    }

    const invoices = await prisma.invoice.findMany({
      where,
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
          { poNumber: { contains: searchTerm, mode: 'insensitive' } },
          { containerNumber: { contains: searchTerm, mode: 'insensitive' } }
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
        secondaryText: `${po.supplier.name} - ${po.containerNumber || 'No container'}`,
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

**Frontend:**
```tsx
import { FC, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

export const GlobalSearchBar: FC = () => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  const { data: results } = useQuery({
    queryKey: ['global-search', debouncedQuery],
    queryFn: () =>
      fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`).then(res => res.json()),
    enabled: debouncedQuery.length >= 2
  });

  useEffect(() => {
    // Save to recent searches
    if (debouncedQuery && results?.total > 0) {
      const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
      recent.unshift(debouncedQuery);
      localStorage.setItem('recentSearches', JSON.stringify(recent.slice(0, 5)));
    }
  }, [debouncedQuery, results]);

  return (
    <div className="relative">
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
          className="pl-10 pr-4 py-2 w-80 border rounded-lg"
        />
      </div>

      {isOpen && query.length >= 2 && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-xl border z-50 max-h-96 overflow-y-auto">
          {results?.results.length === 0 ? (
            <div className="p-4 text-gray-500 text-center">No results found</div>
          ) : (
            <>
              {Object.entries(
                results?.results.reduce((acc: any, result: SearchResult) => {
                  if (!acc[result.entityType]) acc[result.entityType] = [];
                  acc[result.entityType].push(result);
                  return acc;
                }, {})
              ).map(([entityType, items]: [string, any]) => (
                <div key={entityType}>
                  <div className="px-4 py-2 bg-gray-50 font-semibold text-sm">
                    {entityType}s ({items.length})
                  </div>
                  {items.map((result: SearchResult) => (
                    <a
                      key={result.entityId}
                      href={result.link}
                      className="block px-4 py-3 hover:bg-gray-50 border-b"
                      onClick={() => setIsOpen(false)}
                    >
                      <div className="font-semibold">{result.primaryText}</div>
                      <div className="text-sm text-gray-600">{result.secondaryText}</div>
                    </a>
                  ))}
                </div>
              ))}

              {results?.total > 10 && (
                <a
                  href={`/search?q=${encodeURIComponent(query)}`}
                  className="block px-4 py-3 text-center text-blue-600 hover:bg-gray-50"
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

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
