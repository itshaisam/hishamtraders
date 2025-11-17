# Permission Matrix

This document outlines the Role-Based Access Control (RBAC) permissions for each role in the Hisham Traders ERP system.

**Legend:**
*   **C** - Create
*   **R** - Read
*   **U** - Update
*   **D** - Delete
*   **-** - No Access

## MVP Roles & Permissions (Epics 1-4)

| Resource | Admin | Accountant | Sales Officer | Warehouse Manager | Recovery Agent |
|---|---|---|---|---|---|
| **Users** | CRUD | - | - | - | - |
| **Roles** | R | - | - | - | - |
| **Products** | CRUD | R | R | CRUD | R |
| **Warehouses** | CRUD | R | R | CRUD | R |
| **Inventory** | CRUD | R | R | CRUD | R |
| **Suppliers** | CRUD | CRUD | R | R | R |
| **Purchase Orders** | CRUD | CRUD | R | CRUD | R |
| **Clients** | CRUD | CRUD | CRUD | - | R |
| **Invoices** | CRUD | CRUD | CRU | - | R |
| **Payments (Client)** | CRUD | CRUD | R | - | CR |
| **Payments (Supplier)**| CRUD | CRUD | - | - | - |
| **Expenses** | CRUD | CRUD | - | - | - |
| **Audit Logs** | R | - | - | - | - |
| **System Config** | CRUD | - | - | - | - |

---

## Phase 2 Roles & Permissions (Epics 5-8)

This section includes permissions for features introduced in Phase 2.

| Resource | Admin | Accountant | Sales Officer | Warehouse Manager | Recovery Agent |
|---|---|---|---|---|---|
| **Chart of Accounts** | CRUD | CRUD | - | - | - |
| **Journal Entries** | CRUD | CRUD | - | - | - |
| **Bank Reconciliation**| CRUD | CRUD | - | - | - |
| **Petty Cash** | CRUD | CRUD | - | - | - |
| **Month-End Close** | CRUD | R | - | - | - |
| **Gate Passes** | CRUD | R | R | CRUD | R |
| **Stock Transfers** | CRUD | R | - | CRUD | - |
| **Bin Locations** | CRUD | R | - | CRUD | - |
| **Recovery Schedules**| CRUD | CRUD | R | - | CRU |
| **Recovery Visits** | R | R | - | - | CRU |
| **Payment Promises** | R | R | - | - | CRU |
| **Audit Analytics** | R | - | - | - | - |

---

## Detailed Permission Breakdown

### Admin
*   **Full Access:** Has complete CRUD permissions on all resources across the entire system.
*   **System Configuration:** Can manage all system-level settings.
*   **User Management:** The only role that can create, update, and delete users and assign roles.

### Accountant
*   **Financial Control:** Has full control over financial records, including invoices, payments, expenses, and the chart of accounts.
*   **Read Access:** Can view most operational data (products, inventory, POs) for context.
*   **Limitations:** Cannot manage users or system-level configurations.

### Sales Officer
*   **Sales Focused:** Primarily responsible for creating and managing clients and sales invoices.
*   **Read Access:** Can view products and inventory to check stock levels before making a sale.
*   **Limitations:** Cannot see financial data beyond their own invoices, cannot manage inventory or purchases.

### Warehouse Manager
*   **Inventory Control:** Manages all aspects of inventory, including products, warehouses, purchase orders, stock receiving, and adjustments.
*   **Gatekeeper:** Responsible for the gate pass and stock transfer systems.
*   **Limitations:** Cannot access sales, client, or financial data.

### Recovery Agent
*   **Collection Focused:** Role is tightly scoped to payment collection.
*   **Primary Actions:** Can view their assigned clients, log recovery visits, and record client payments.
*   **Read Access:** Can view client and invoice details to understand outstanding balances.
*   **Limitations:** Cannot create invoices, manage products, or access any data outside of their assigned clients.
