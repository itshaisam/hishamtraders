# Story 9.6: Tenant Isolation Testing & Verification

**Epic:** Epic 9 - Multi-Tenant SaaS Architecture
**Story ID:** STORY-9.6
**Priority:** Critical
**Estimated Effort:** 2-3 hours
**Dependencies:** Stories 9.1-9.5 (all implementation stories complete)
**Status:** Draft -- Phase 3 (v1.0)

---

## User Story

**As a** platform operator,
**I want** verified cross-tenant isolation,
**So that** no tenant can ever see, modify, or access another tenant's data.

---

## Acceptance Criteria

1. **Setup: Two Tenants Exist:**
   - [ ] Default tenant "Hisham Traders" (from migration) with admin user
   - [ ] Test tenant "Test Corp" created via `create-tenant` script
   - [ ] Each tenant has its own chart of accounts, settings, and admin user

2. **Data Isolation — Read Operations:**
   - [ ] Login as Hisham Traders admin → GET /api/v1/products returns ONLY Hisham Traders products
   - [ ] Login as Test Corp admin → GET /api/v1/products returns EMPTY (no products yet)
   - [ ] Same isolation verified for: suppliers, clients, invoices, payments, POs, inventory, expenses
   - [ ] GET /api/v1/settings/company-name returns tenant-specific company name when authenticated

3. **Data Isolation — Write Operations:**
   - [ ] Login as Test Corp admin → Create a product → product gets Test Corp tenantId
   - [ ] Login as Hisham Traders admin → Product list does NOT include Test Corp's product
   - [ ] Create invoice in Test Corp → not visible in Hisham Traders
   - [ ] Create payment in Test Corp → not visible in Hisham Traders

4. **Data Isolation — Direct ID Access:**
   - [ ] Copy a product ID from Hisham Traders
   - [ ] Login as Test Corp admin → GET /api/v1/products/:id → returns 404 (not 403)
   - [ ] Same for: invoices, POs, clients, payments, suppliers
   - [ ] This proves the Prisma extension adds tenantId to `findUnique` queries

5. **Data Isolation — Update/Delete Operations:**
   - [ ] Login as Test Corp admin → PUT /api/v1/products/:htProductId → returns 404
   - [ ] Login as Test Corp admin → DELETE /api/v1/products/:htProductId → returns 404
   - [ ] Cannot modify or delete another tenant's records

6. **Accounting Isolation:**
   - [ ] Each tenant has its own chart of accounts (same codes, different data)
   - [ ] Journal entries only show for the tenant that created them
   - [ ] Account balances are per-tenant
   - [ ] Trial balance, balance sheet, general ledger — all tenant-scoped

7. **User Isolation:**
   - [ ] Users can only see other users from their own tenant
   - [ ] GET /api/v1/users returns only tenant's users
   - [ ] Cannot change another tenant user's password or role

8. **System Settings Isolation:**
   - [ ] Hisham Traders → COMPANY_NAME = "Hisham Traders"
   - [ ] Test Corp → COMPANY_NAME = "Test Corp"
   - [ ] Changing tax rate in one tenant doesn't affect the other

9. **Shared Reference Data Accessible:**
   - [ ] Both tenants can access Roles (ADMIN, SALES_OFFICER, etc.)
   - [ ] Both tenants can access Countries, PaymentTerms, ProductCategories, Brands, UOMs
   - [ ] These are shared and not filtered by tenantId

10. **Line Item Isolation:**
    - [ ] Create invoice in Hisham Traders → InvoiceItems have Hisham Traders tenantId
    - [ ] Login as Test Corp → GET /api/v1/invoices/:htInvoiceId → returns 404 (line items also invisible)
    - [ ] Create PO in Hisham Traders → POItems have correct tenantId
    - [ ] Journal entry lines from one tenant not visible to another
    - [ ] Gate pass items, stock transfer items, credit note items — all tenant-scoped

11. **Transaction Isolation:**
    - [ ] Record a payment (uses $transaction) → all created records have correct tenantId
    - [ ] Receive goods (uses $transaction) → inventory, stock movements, journal entries all tenant-scoped
    - [ ] Create invoice with items (uses $transaction) → invoice + items + journal entry all tenant-scoped

12. **Audit Trail:**
    - [ ] AuditLog records include the user's tenantId (via the user relation)
    - [ ] Platform admin can see all audit logs across tenants
    - [ ] Tenant admin sees only their tenant's audit logs (if audit viewer is tenant-scoped)

---

## Dev Notes

### Testing Script

Create a manual testing checklist (or automate with a test script):

```bash
# 1. Reset database and seed
pnpm db:reset
pnpm db:seed
pnpm db:seed:demo

# 2. Create test tenant
pnpm -F @hishamtraders/api db:create-tenant \
  --name "Test Corp" \
  --slug "test-corp" \
  --admin-email "admin@testcorp.com" \
  --admin-password "test123"

# 3. Login as Hisham Traders admin
curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@admin.com","password":"admin123"}' | jq '.token'
# → Save as HT_TOKEN

# 4. Login as Test Corp admin
curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@testcorp.com","password":"test123"}' | jq '.token'
# → Save as TC_TOKEN

# 5. Verify product isolation
curl -s http://localhost:3001/api/v1/products -H "Authorization: Bearer $HT_TOKEN" | jq '.data | length'
# → Should return 10 (demo data products)

curl -s http://localhost:3001/api/v1/products -H "Authorization: Bearer $TC_TOKEN" | jq '.data | length'
# → Should return 0 (no products in Test Corp yet)

# 6. Create product in Test Corp
curl -s -X POST http://localhost:3001/api/v1/products \
  -H "Authorization: Bearer $TC_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test Product","sku":"TC-001","categoryId":"...","uomId":"...","sellingPrice":100}' | jq '.id'
# → Save as TC_PRODUCT_ID

# 7. Verify HT cannot see Test Corp's product
curl -s http://localhost:3001/api/v1/products/$TC_PRODUCT_ID \
  -H "Authorization: Bearer $HT_TOKEN" | jq '.message'
# → Should return "Product not found" (404)

# 8. Verify supplier isolation
curl -s http://localhost:3001/api/v1/suppliers -H "Authorization: Bearer $TC_TOKEN" | jq '.data | length'
# → Should return 0

# 9. Verify settings isolation
curl -s http://localhost:3001/api/v1/settings/company-name \
  -H "Authorization: Bearer $HT_TOKEN" | jq '.companyName'
# → "Hisham Traders"

curl -s http://localhost:3001/api/v1/settings/company-name \
  -H "Authorization: Bearer $TC_TOKEN" | jq '.companyName'
# → "Test Corp"
```

### Browser Testing via Playwright

1. Navigate to `http://localhost:5173`
2. Login as `admin@admin.com` / `admin123` → verify sees Hisham Traders data
3. Logout
4. Login as `admin@testcorp.com` / `test123` → verify sees empty dashboard
5. Create a product in Test Corp
6. Logout, login as Hisham Traders → verify Test Corp product is NOT visible

### Edge Cases to Test

| Scenario | Expected Result |
|----------|----------------|
| User with NULL tenantId tries to login | JWT includes null tenantId → tenant middleware returns 403 |
| Direct SQL query without tenantId | Only possible via Prisma Studio or raw SQL — not through API |
| Seed script runs without HTTP context | No tenant filtering applied — seeds can write to any tenant |
| Transaction inside tenant context | tenantId inherited via AsyncLocalStorage |
| Prisma `$queryRaw` called | **NOT filtered by extension** — avoid raw queries or manually add WHERE tenantId |
| `createMany` with mixed tenantIds | Extension overrides with current tenant — prevents injection |

### Security Considerations

1. **Never trust client-provided tenantId:** The extension injects tenantId from AsyncLocalStorage (server-side JWT), NOT from request body
2. **Raw SQL queries bypass the extension:** Audit all `$queryRaw` / `$executeRaw` calls and add manual tenantId filtering
3. **Prisma Studio access:** Should be restricted in production (already not exposed)
4. **JWT tampering:** JWT is signed with server secret — tenantId cannot be modified by client
5. **Error messages:** Return 404 (not 403) for cross-tenant access — don't reveal that the resource exists in another tenant

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-02-14 | 1.0 | Initial story creation | Claude (Tech Review) |
