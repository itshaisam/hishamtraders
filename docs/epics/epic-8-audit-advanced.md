# Epic 8: Audit Trail Viewer & Advanced Features

**Epic Goal:** Implement comprehensive audit trail viewer with search/filter capabilities, change history tracking with version comparison, and advanced features including barcode scanning, mobile optimization, and system configuration management. This epic provides complete visibility into system activity and enhances usability with modern features.

**Timeline:** Phase 2 (Post-MVP, estimated 2-3 weeks)

**Status:** PHASE 2 - Not included in 6-week MVP

**Dependencies:** Epic 1 (Audit logging infrastructure must be operational from MVP)

---

## Overview

The MVP includes **audit logging infrastructure from Day 1** (all user actions automatically logged in AuditLog table). Phase 2 adds the **UI layer** to search, view, and analyze audit logs, plus advanced features for enhanced usability.

### What's Missing in MVP:
- ❌ Audit trail viewer UI (search, filter, view logs)
- ❌ Change history viewer (side-by-side comparison of old vs new values)
- ❌ Rollback capability (revert to previous version)
- ❌ Advanced audit analytics (user activity patterns, peak usage times)
- ❌ Barcode/QR code scanning for products and stock operations
- ❌ Mobile app optimization (progressive web app features)
- ❌ System configuration UI (manage settings without code changes)
- ❌ Notification preferences (email/SMS alerts configuration)

### What Phase 2 Adds:
✅ Comprehensive audit trail viewer with search and filters
✅ Change history viewer with side-by-side comparison
✅ Rollback to previous version (Admin only)
✅ Audit analytics and user activity reports
✅ Barcode scanning integration for inventory operations
✅ Mobile-optimized workflows (PWA features, offline support)
✅ System configuration management UI
✅ Notification preferences and alert configuration

---

## Stories

### Story 8.1: Audit Trail Viewer with Search

**As an** admin,
**I want** to search and view the complete audit trail of user actions,
**So that** any suspicious activity or data changes can be investigated.

**Acceptance Criteria:**
1. GET /api/audit-logs returns audit log entries with pagination (default 50 per page)
2. Filters supported:
   - userId (user who performed action)
   - entityType (Product, Invoice, Payment, Client, etc.)
   - action (CREATE, UPDATE, DELETE, VIEW)
   - date range (from/to timestamps)
   - entityId (specific record ID)
   - ipAddress (filter by source IP)
3. Search by: entity ID, user email/name, reference number (invoice #, PO #, etc.)
4. Results sorted by timestamp desc (newest first)
5. Response includes: timestamp, user (name + email), action, entityType, entityId, ipAddress, changed fields summary
6. GET /api/audit-logs/:id returns detailed audit log entry with full changedFields JSON
7. Frontend Audit Trail page:
   - Filter panel (user, entity type, action, date range)
   - Search bar (entity ID, user, reference)
   - Results table: Timestamp | User | Action | Entity Type | Entity ID | IP Address | Details
   - Expandable rows show changed fields (old vs new values)
   - Pagination controls
   - "Export to Excel" button
8. Frontend displays critical actions (DELETE) in red
9. Frontend allows clicking entity ID to navigate to entity detail (if accessible to user)
10. Frontend clicking user name shows all actions by that user
11. Only Admin can access full audit trail viewer
12. Other roles can view audit history for entities they own (e.g., Sales Officer sees audit for their invoices)

**Story File:** [docs/stories/story-8-1-audit-viewer.md](../stories/story-8-1-audit-viewer.md)

---

### Story 8.2: Change History Tracking with Version Comparison

**As a** user,
**I want** to see the last 2 previous versions of critical records,
**So that** I can understand what changed and potentially rollback errors.

**Acceptance Criteria:**
1. **ChangeHistory table created (MVP Epic 1.6 reference):** id, entityType, entityId, version, changedBy, changedAt, snapshot (JSON), changeReason
2. Base service layer hooks capture current state before update and store in ChangeHistory
3. Maintains maximum 2 previous versions per entity (deletes older versions automatically)
4. Critical entities tracked: Product, Client, Supplier, PurchaseOrder, Invoice, Payment
5. GET /api/change-history/:entityType/:entityId returns version history for entity
6. Response includes: version number, changed by (user), changed at (timestamp), snapshot (full entity state)
7. Frontend entity detail pages display "Last Modified" information:
   - Modified by (user name)
   - Modified on (date and time)
   - "View History" button/link
8. Frontend "View History" opens modal with change history:
   - Version selector (dropdown or tabs: Current, Version 1, Version 2)
   - Side-by-side comparison table:
     - Field | Old Value | New Value
     - Highlights changed fields in yellow
   - "Restore This Version" button (Admin only)
9. Change history modal displays user-provided change reason (if provided during update)
10. Frontend allows comparing any two versions (Current vs Version 1, Version 1 vs Version 2)
11. All users can view change history for entities they can access; only Admin can rollback

**Story File:** [docs/stories/story-8-2-change-history.md](../stories/story-8-2-change-history.md)

---

### Story 8.3: Rollback to Previous Version

**As an** admin,
**I want** to rollback a record to a previous version,
**So that** errors can be corrected without manual re-entry.

**Acceptance Criteria:**
1. POST /api/change-history/rollback creates rollback operation
2. Payload: entityType, entityId, targetVersion (which version to restore)
3. Rollback process:
   - Load snapshot from ChangeHistory for targetVersion
   - Create new UPDATE operation with old values (restores previous state)
   - New update captured in ChangeHistory as new version
   - Audit log records rollback action with reason
4. Rollback validation:
   - Cannot rollback if entity has dependent transactions (e.g., cannot rollback invoice if payments exist)
   - Cannot rollback deleted entities
5. Rollback reason required (text input)
6. GET /api/change-history/:entityType/:entityId/can-rollback validates if rollback is safe
7. Frontend "Restore This Version" button (change history modal):
   - Displays confirmation modal with warning
   - Requires rollback reason input
   - Shows which fields will change
   - Confirms before executing
8. Frontend displays success/error message after rollback
9. Frontend reloads entity detail page to show restored values
10. Only Admin role can perform rollbacks
11. **Rollback operations logged in audit trail with reason**

**Story File:** [docs/stories/story-8-3-rollback-version.md](../stories/story-8-3-rollback-version.md)

---

### Story 8.4: Audit Analytics and User Activity Reports

**As an** admin,
**I want** to analyze audit log data to identify usage patterns and potential issues,
**So that** system usage is optimized and security is maintained.

**Acceptance Criteria:**
1. GET /api/reports/audit-analytics generates analytics report
2. Parameters: date range (required), userId (optional), entityType (optional)
3. Metrics calculated:
   - Total actions by type (CREATE, UPDATE, DELETE, VIEW)
   - Actions by user (top 10 most active users)
   - Actions by entity type (which modules used most)
   - Actions by hour (peak usage times)
   - Failed actions (4xx/5xx errors from application logs)
   - Unusual activity (large deletes, bulk updates, off-hours access)
4. GET /api/reports/user-activity/:userId generates detailed user activity report
5. User activity report shows:
   - Total actions (this week, this month, all time)
   - Action breakdown (by type and entity)
   - Recent activity timeline (last 50 actions)
   - Login history (timestamps, IP addresses)
   - Most accessed modules
6. Frontend Audit Analytics page displays:
   - Date range selector
   - Metric cards (total actions, unique users, peak hour)
   - Actions by type (pie chart)
   - Actions over time (line chart, daily totals)
   - Top users by activity (bar chart)
   - Most accessed modules (bar chart)
7. Frontend User Activity page (per user):
   - User info and role
   - Activity metrics
   - Action breakdown charts
   - Recent activity timeline
   - Login history table
8. Frontend Admin dashboard includes "System Activity" widget (actions today/week)
9. Only Admin can access audit analytics

**Story File:** [docs/stories/story-8-4-audit-analytics.md](../stories/story-8-4-audit-analytics.md)

---

### Story 8.5: Barcode Scanning for Inventory Operations

**As a** warehouse manager,
**I want** to scan barcodes/QR codes for products and stock operations,
**So that** data entry is faster and more accurate.

**Acceptance Criteria:**
1. Product table expanded: barcode (unique, nullable), qrCode (nullable)
2. PUT /api/products/:id/barcode updates product barcode
3. GET /api/products/by-barcode/:barcode searches product by barcode
4. Barcode formats supported: EAN-13, UPC-A, Code 128, QR Code
5. Frontend uses device camera or external barcode scanner (via browser API or USB)
6. **Stock receiving workflow:**
   - Scan barcode → auto-populate product in receipt form
   - Enter quantity
   - Repeat for all items
   - Submit receipt
7. **Sales invoice workflow:**
   - Scan barcode → auto-add product to invoice
   - Enter quantity
   - Repeat for all items
   - Complete invoice
8. **Inventory lookup:**
   - Scan barcode → display product details with current stock
9. **Stock adjustment:**
   - Scan barcode → auto-populate product
   - Enter adjustment quantity
10. Frontend Barcode Scanner modal:
    - Camera preview (if using device camera)
    - "Scan" button
    - Manual barcode entry fallback
    - Detected barcode display
11. Frontend Product form includes "Generate Barcode" button (auto-generates Code 128)
12. Frontend Product detail page displays barcode image (if exists)
13. Barcode generation library: jsbarcode (frontend) or bwip-js (backend)
14. Warehouse Manager and Admin can manage barcodes
15. **Barcode scanning events logged in audit trail**

**Story File:** [docs/stories/story-8-5-barcode-scanning.md](../stories/story-8-5-barcode-scanning.md)

---

### Story 8.6: Mobile Optimization and PWA Features

**As a** user,
**I want** optimized mobile experience with offline support,
**So that** I can use the system on the go without constant connectivity.

**Acceptance Criteria:**
1. **Progressive Web App (PWA) configuration:**
   - manifest.json with app name, icons, theme colors
   - Service worker for offline support
   - Install prompt for "Add to Home Screen"
2. **Offline functionality:**
   - Cache critical pages (dashboard, inventory list, client list)
   - Allow viewing cached data when offline
   - Queue actions (payments, adjustments) for sync when online
   - Display "Offline Mode" banner when disconnected
3. **Mobile-optimized workflows:**
   - Payment recording (simplified form with large buttons)
   - Stock lookup (barcode scan + quick view)
   - Client balance check (search client, display balance)
   - Invoice creation (touch-optimized, numeric keypad for quantities)
4. **Touch-friendly UI:**
   - Buttons min 44px tap target
   - Swipe gestures (swipe to delete, swipe to approve)
   - Pull-to-refresh on list pages
   - Bottom navigation bar for key actions
5. **Mobile-specific features:**
   - Click-to-call phone numbers
   - Tap to open address in Google Maps
   - Camera access for barcode scanning
   - Tap to expand accordion sections (product details, invoice line items)
6. **Responsive breakpoints:**
   - Mobile: 320px - 767px (portrait and landscape)
   - Tablet: 768px - 1023px
   - Desktop: 1024px+
7. Frontend PWA install prompt displays on mobile browsers (Chrome, Safari, Edge)
8. Frontend service worker caches API responses for 5 minutes (stale-while-revalidate)
9. Frontend syncs queued actions automatically when connection restored
10. Frontend displays sync status indicator (syncing, synced, offline)
11. All roles benefit from mobile optimization

**Story File:** [docs/stories/story-8-6-mobile-pwa.md](../stories/story-8-6-mobile-pwa.md)

---

### Story 8.7: System Configuration Management UI

**As an** admin,
**I want** to manage system settings through UI without code changes,
**So that** configuration is easy and doesn't require developer intervention.

**Acceptance Criteria:**
1. SystemConfig table: id, key (unique), value (JSON), category, description, updatedBy, updatedAt
2. Configuration categories:
   - **General:** company name, logo URL, timezone, date format
   - **Tax:** default sales tax rate, withholding tax rates
   - **Inventory:** low stock threshold multiplier, adjustment approval threshold
   - **Recovery:** DSO target, collection effectiveness target
   - **Security:** session timeout, password policy, login attempt limit
   - **Notifications:** email SMTP settings, SMS gateway config
3. POST /api/system-config creates configuration entry
4. PUT /api/system-config/:key updates configuration value
5. GET /api/system-config returns all configurations grouped by category
6. GET /api/system-config/:key returns specific configuration
7. Configuration validation: type checking (number, boolean, string, etc.)
8. Frontend System Settings page:
   - Category tabs (General, Tax, Inventory, Recovery, Security, Notifications)
   - Configuration forms with appropriate input types
   - "Save" button per category
   - "Reset to Defaults" button
9. Frontend displays current values with edit capability
10. Frontend validates inputs before saving (e.g., tax rate 0-100%, timeout > 0)
11. Frontend displays success message on save
12. Only Admin role can access system configuration
13. **Configuration changes logged in audit trail**

**Story File:** [docs/stories/story-8-7-system-config.md](../stories/story-8-7-system-config.md)

---

### Story 8.8: Notification Preferences and Alert Configuration

**As a** user,
**I want** to configure my notification preferences,
**So that** I receive alerts via my preferred channels (email, SMS, in-app).

**Acceptance Criteria:**
1. UserPreferences table: id, userId, emailNotifications (boolean), smsNotifications (boolean), inAppNotifications (boolean), alertTypes (JSON array), updatedAt
2. Alert types user can subscribe to:
   - LOW_STOCK (inventory alerts)
   - OUT_OF_STOCK (critical stock alerts)
   - CREDIT_LIMIT_EXCEEDED (client credit alerts)
   - OVERDUE_PAYMENT (receivables alerts)
   - PENDING_APPROVAL (gate pass, adjustment approvals)
   - BROKEN_PROMISE (payment promise not kept)
   - NEAR_EXPIRY (products expiring soon)
3. PUT /api/users/me/preferences updates user preferences
4. GET /api/users/me/preferences returns current preferences
5. **Email notifications** (if enabled):
   - Daily digest of alerts
   - Immediate alerts for CRITICAL severity
   - Uses configured SMTP settings from system config
6. **SMS notifications** (if enabled):
   - Critical alerts only (stock out, credit exceeded)
   - Uses SMS gateway (Twilio, local provider)
7. **In-app notifications** (always enabled):
   - Real-time alerts in navigation bar (badge count)
   - Notification dropdown with recent alerts
   - Mark as read/dismiss functionality
8. Frontend User Preferences page:
   - Notification channel toggles (Email, SMS, In-app)
   - Alert type checkboxes (which alerts to receive)
   - "Save Preferences" button
9. Frontend displays notification delivery status (sent, failed)
10. Frontend allows testing notification (send test email/SMS)
11. All users can configure their own preferences
12. **Preference changes logged in audit trail**

**Story File:** [docs/stories/story-8-8-notification-preferences.md](../stories/story-8-8-notification-preferences.md)

---

### Story 8.9: Export Audit Logs to Excel

**As an** admin,
**I want** to export audit logs to Excel for compliance and archiving,
**So that** audit data can be reviewed offline or submitted to auditors.

**Acceptance Criteria:**
1. GET /api/audit-logs/export generates Excel file
2. Parameters: same filters as audit log viewer (userId, entityType, action, date range)
3. Excel file includes:
   - Export metadata (generated by, generated at, filters applied)
   - Audit log table: Timestamp, User, Action, Entity Type, Entity ID, IP Address, Changed Fields
   - Changed fields expanded (one column per field with old → new values)
   - Formatted columns (timestamps, user-friendly action names)
4. Excel styling: headers bold, alternating row colors, auto-sized columns
5. File naming: `audit-log-{from-date}-to-{to-date}.xlsx`
6. Export includes all matching records (not just paginated view, up to 50,000 rows)
7. Export performance: < 10 seconds for 10,000 rows
8. Frontend "Export to Excel" button on Audit Trail page
9. Frontend displays progress indicator during export
10. Frontend triggers download when complete
11. Only Admin can export audit logs

**Story File:** [docs/stories/story-8-9-export-audit-logs.md](../stories/story-8-9-export-audit-logs.md)

---

### Story 8.10: Advanced Search and Filtering

**As an** admin,
**I want** advanced search capabilities across all modules,
**So that** I can quickly find any record or transaction.

**Acceptance Criteria:**
1. GET /api/search?q=query&entity=TYPE searches across multiple entity types
2. Entity types searchable: Product, Client, Supplier, Invoice, PurchaseOrder, Payment
3. Search matches: SKU, name, invoice number, PO number, container number, phone, email
4. Search is case-insensitive and supports partial matches
5. Results grouped by entity type: Products (5 results), Invoices (3 results), etc.
6. Each result includes: entity type, primary identifier (name, number), secondary info (date, amount), link to detail page
7. Search results limited to entities user has permission to view
8. Frontend global search bar (in navigation header):
   - Search input with icon
   - Autocomplete dropdown (displays results as user types)
   - Debounced API calls (300ms delay)
   - "View All Results" link if > 10 matches
9. Frontend search results page:
   - Displays all matches grouped by entity type
   - Filters to narrow by entity type
   - Clickable result cards navigate to detail page
10. Frontend recent searches stored in localStorage (last 5 searches)
11. Search performance: < 500ms for databases with 10K records
12. All roles can search within their permissions

**Story File:** [docs/stories/story-8-10-advanced-search.md](../stories/story-8-10-advanced-search.md)

---

## Epic 8 Dependencies

- **Epic 1** - Audit logging infrastructure (operational from MVP Day 1)
- All other epics - Audit viewer displays logs from all modules

## Epic 8 Deliverables

✅ Comprehensive audit trail viewer with search and filters
✅ Change history viewer with side-by-side comparison
✅ Rollback to previous version (Admin only)
✅ Audit analytics and user activity reports
✅ Barcode scanning for inventory operations
✅ Mobile optimization and PWA features
✅ System configuration management UI
✅ Notification preferences and alert configuration
✅ Audit log export to Excel
✅ Advanced search across all modules
✅ **Complete visibility into all system activity**

## Success Criteria

- Admin can search and view complete audit trail
- Change history displays last 2 versions with comparison
- Rollback functionality works safely for critical entities
- Audit analytics identify usage patterns and anomalies
- Barcode scanning accelerates inventory operations
- Mobile users can perform key tasks offline
- System settings configurable via UI (no code changes)
- Users can customize notification preferences
- Audit logs exportable for compliance
- Global search finds any record in < 500ms

## Links

- **Stories:** [docs/stories/](../stories/) (story-8-1 through story-8-10)
- **Architecture:** [docs/architecture/audit-logging.md](../architecture/audit-logging.md)
- **Phase 2 Roadmap:** [docs/planning/phase-2-roadmap.md](../planning/phase-2-roadmap.md)
