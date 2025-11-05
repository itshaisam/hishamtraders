# Hisham Traders ERP - API Endpoints Documentation

**Version:** 1.0
**Last Updated:** 2025-01-15
**Author:** Winston (Architect)
**Base URL:** `http://localhost:3001/api/v1` (Development)
**Base URL:** `https://api.hishamtraders.com/api/v1` (Production)

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-01-15 | 1.0 | Initial API endpoints documentation | Winston (Architect) |

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Standard Response Format](#standard-response-format)
4. [Error Handling](#error-handling)
5. [Authentication Endpoints](#authentication-endpoints)
6. [User Management](#user-management)
7. [Supplier Management](#supplier-management)
8. [Purchase Orders](#purchase-orders)
9. [Product Management](#product-management)
10. [Warehouse Management](#warehouse-management)
11. [Inventory](#inventory)
12. [Client Management](#client-management)
13. [Sales Invoices](#sales-invoices)
14. [Payments](#payments)
15. [Expenses](#expenses)
16. [Reports](#reports)
17. [Audit Logs](#audit-logs)

---

## Overview

This document defines all RESTful API endpoints for the Hisham Traders ERP system.

**API Versioning:**
- Current version: v1
- Version included in URL path: `/api/v1/`

**Authentication:**
- All endpoints (except `/auth/login`) require JWT authentication
- Token passed in `Authorization` header: `Bearer {token}`

**Content Type:**
- Request: `application/json`
- Response: `application/json`

**HTTP Methods:**
- `GET` - Retrieve resources
- `POST` - Create resources
- `PUT` - Update resources (full replacement)
- `PATCH` - Update resources (partial update)
- `DELETE` - Delete/deactivate resources

---

## Authentication

All endpoints require a valid JWT token in the Authorization header (except `/auth/login`).

**Header Format:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Token Expiry:** 24 hours

**Unauthorized Response (401):**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

---

## Standard Response Format

All API responses follow this structure:

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2025-01-15T10:30:00Z",
    "requestId": "req_abc123",
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { ... }
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PUT, PATCH, DELETE |
| 201 | Created | Successful POST |
| 400 | Bad Request | Validation error, malformed request |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource does not exist |
| 409 | Conflict | Duplicate resource (e.g., duplicate SKU) |
| 422 | Unprocessable Entity | Business logic validation failed |
| 500 | Internal Server Error | Server error |

### Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Input validation failed |
| `UNAUTHORIZED` | Authentication required |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `DUPLICATE_RECORD` | Unique constraint violation |
| `INSUFFICIENT_STOCK` | Not enough inventory |
| `CREDIT_LIMIT_EXCEEDED` | Client credit limit exceeded |
| `INTERNAL_SERVER_ERROR` | Unexpected server error |

---

## Authentication Endpoints

### POST /auth/login

Login with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "ADMIN"
    }
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

**Errors:**
- `401` - Invalid credentials

---

### GET /auth/me

Get current authenticated user.

**Auth Required:** Yes

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "ADMIN",
    "lastLoginAt": "2025-01-15T09:00:00Z"
  }
}
```

---

### POST /auth/logout

Logout current user (client-side token removal).

**Auth Required:** Yes

**Response (200):**
```json
{
  "success": true,
  "data": null
}
```

---

## User Management

### GET /users

Get paginated list of users.

**Auth Required:** Yes
**Roles:** Admin

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 10)
- `role` (string, optional) - Filter by role
- `status` (string, optional) - Filter by status
- `search` (string, optional) - Search by name or email

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "user_123",
      "email": "user@example.com",
      "name": "John Doe",
      "role": {
        "id": "role_1",
        "name": "ADMIN"
      },
      "status": "ACTIVE",
      "lastLoginAt": "2025-01-15T09:00:00Z",
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

---

### POST /users

Create new user.

**Auth Required:** Yes
**Roles:** Admin

**Request:**
```json
{
  "email": "newuser@example.com",
  "name": "Jane Smith",
  "password": "password123",
  "roleId": "role_2"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "user_456",
    "email": "newuser@example.com",
    "name": "Jane Smith",
    "role": {
      "id": "role_2",
      "name": "SALES_OFFICER"
    },
    "status": "ACTIVE"
  }
}
```

**Errors:**
- `409` - Email already exists
- `400` - Validation error

---

### PUT /users/:id

Update user.

**Auth Required:** Yes
**Roles:** Admin

**Request:**
```json
{
  "name": "Jane Smith Updated",
  "roleId": "role_3",
  "status": "INACTIVE"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "user_456",
    "email": "newuser@example.com",
    "name": "Jane Smith Updated",
    "role": {
      "id": "role_3",
      "name": "WAREHOUSE_MANAGER"
    },
    "status": "INACTIVE"
  }
}
```

---

### DELETE /users/:id

Soft delete user (set status to INACTIVE).

**Auth Required:** Yes
**Roles:** Admin

**Response (200):**
```json
{
  "success": true,
  "data": null
}
```

---

## Supplier Management

### GET /suppliers

Get paginated list of suppliers.

**Auth Required:** Yes
**Roles:** Admin, Accountant, Warehouse Manager

**Query Parameters:**
- `page` (number)
- `limit` (number)
- `status` (string) - ACTIVE, INACTIVE
- `search` (string) - Search by name

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "sup_123",
      "name": "ABC Suppliers Ltd",
      "country": "China",
      "contactPerson": "Li Wei",
      "email": "contact@abcsuppliers.com",
      "phone": "+86-123-456-7890",
      "paymentTerms": "30 days net",
      "status": "ACTIVE",
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "pagination": { ... }
  }
}
```

---

### POST /suppliers

Create new supplier.

**Auth Required:** Yes
**Roles:** Admin, Accountant

**Request:**
```json
{
  "name": "XYZ Suppliers",
  "country": "China",
  "contactPerson": "Wang Chen",
  "email": "wang@xyzsuppliers.com",
  "phone": "+86-987-654-3210",
  "address": "123 Industrial Zone, Guangzhou",
  "paymentTerms": "50% advance, 50% on delivery"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "sup_456",
    "name": "XYZ Suppliers",
    "country": "China",
    "status": "ACTIVE"
  }
}
```

---

### GET /suppliers/:id

Get supplier details with PO history.

**Auth Required:** Yes

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "sup_123",
    "name": "ABC Suppliers Ltd",
    "contactPerson": "Li Wei",
    "purchaseOrders": [
      {
        "id": "po_789",
        "poNumber": "PO-2025-001",
        "orderDate": "2025-01-10T00:00:00Z",
        "totalAmount": 50000.00,
        "status": "IN_TRANSIT"
      }
    ]
  }
}
```

---

### PUT /suppliers/:id

Update supplier.

**Auth Required:** Yes
**Roles:** Admin, Accountant

---

### DELETE /suppliers/:id

Soft delete supplier (only if no active POs).

**Auth Required:** Yes
**Roles:** Admin

---

## Purchase Orders

### GET /purchase-orders

Get paginated list of purchase orders.

**Auth Required:** Yes
**Roles:** Admin, Accountant, Warehouse Manager

**Query Parameters:**
- `page`, `limit`
- `supplierId` (string)
- `status` (string) - PENDING, IN_TRANSIT, RECEIVED, CANCELLED
- `startDate`, `endDate` (date range)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "po_789",
      "poNumber": "PO-2025-001",
      "supplier": {
        "id": "sup_123",
        "name": "ABC Suppliers Ltd"
      },
      "orderDate": "2025-01-10T00:00:00Z",
      "expectedArrivalDate": "2025-02-15T00:00:00Z",
      "totalAmount": 50000.00,
      "status": "IN_TRANSIT",
      "containerNo": "CONT-12345"
    }
  ]
}
```

---

### POST /purchase-orders

Create new purchase order.

**Auth Required:** Yes
**Roles:** Admin, Accountant, Warehouse Manager

**Request:**
```json
{
  "supplierId": "sup_123",
  "orderDate": "2025-01-10",
  "expectedArrivalDate": "2025-02-15",
  "notes": "Urgent order",
  "items": [
    {
      "productId": "prod_456",
      "quantity": 1000,
      "unitCost": 50.00
    },
    {
      "productId": "prod_789",
      "quantity": 500,
      "unitCost": 75.00
    }
  ]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "po_999",
    "poNumber": "PO-2025-002",
    "supplierId": "sup_123",
    "orderDate": "2025-01-10T00:00:00Z",
    "totalAmount": 87500.00,
    "status": "PENDING",
    "items": [...]
  }
}
```

**Errors:**
- `400` - Validation error (invalid product, negative quantity)

---

### GET /purchase-orders/:id

Get PO details with items and costs.

**Auth Required:** Yes

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "po_789",
    "poNumber": "PO-2025-001",
    "supplier": { ... },
    "orderDate": "2025-01-10T00:00:00Z",
    "totalAmount": 50000.00,
    "status": "IN_TRANSIT",
    "containerNo": "CONT-12345",
    "items": [
      {
        "id": "item_1",
        "product": {
          "id": "prod_456",
          "sku": "SKU-001",
          "name": "Product A"
        },
        "quantity": 1000,
        "unitCost": 50.00,
        "totalCost": 50000.00
      }
    ],
    "costs": [
      {
        "id": "cost_1",
        "type": "shipping",
        "amount": 2000.00,
        "description": "Sea freight"
      }
    ]
  }
}
```

---

### PUT /purchase-orders/:id

Update PO (only if status = PENDING).

**Auth Required:** Yes
**Roles:** Admin, Accountant, Warehouse Manager

---

### PATCH /purchase-orders/:id/status

Update PO status.

**Auth Required:** Yes
**Roles:** Admin, Warehouse Manager

**Request:**
```json
{
  "status": "IN_TRANSIT",
  "containerNo": "CONT-12345",
  "shipDate": "2025-01-15"
}
```

---

### POST /purchase-orders/:id/costs

Add additional costs to PO.

**Auth Required:** Yes
**Roles:** Admin, Accountant

**Request:**
```json
{
  "type": "customs",
  "amount": 5000.00,
  "description": "Customs duties"
}
```

---

### GET /purchase-orders/:id/landed-cost

Get landed cost calculation.

**Auth Required:** Yes

**Response (200):**
```json
{
  "success": true,
  "data": {
    "poId": "po_789",
    "totalProductCost": 50000.00,
    "additionalCosts": {
      "shipping": 2000.00,
      "customs": 5000.00,
      "total": 7000.00
    },
    "grandTotal": 57000.00,
    "itemBreakdown": [
      {
        "productId": "prod_456",
        "quantity": 1000,
        "productCost": 50000.00,
        "allocatedAdditionalCost": 7000.00,
        "landedCostPerUnit": 57.00
      }
    ]
  }
}
```

---

### POST /purchase-orders/:id/receive

Record goods receipt.

**Auth Required:** Yes
**Roles:** Admin, Warehouse Manager

**Request:**
```json
{
  "warehouseId": "wh_123",
  "receivedDate": "2025-02-20",
  "items": [
    {
      "productId": "prod_456",
      "quantity": 1000,
      "batchNo": "20250220-001",
      "binLocation": "A1-05"
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "poId": "po_789",
    "status": "RECEIVED",
    "inventoryUpdated": true
  }
}
```

---

## Product Management

### GET /products

Get paginated product list.

**Auth Required:** Yes

**Query Parameters:**
- `page`, `limit`
- `category` (string)
- `status` (string) - ACTIVE, INACTIVE
- `search` (string) - Search by SKU or name

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "prod_456",
      "sku": "SKU-001",
      "name": "Bathroom Sink Model A",
      "brand": "SuperSink",
      "category": "Sinks",
      "costPrice": 50.00,
      "sellingPrice": 75.00,
      "reorderLevel": 100,
      "status": "ACTIVE",
      "currentStock": 850
    }
  ]
}
```

---

### POST /products

Create new product.

**Auth Required:** Yes
**Roles:** Admin, Warehouse Manager

**Request:**
```json
{
  "sku": "SKU-002",
  "name": "Toilet Model B",
  "brand": "FlushMaster",
  "category": "Toilets",
  "costPrice": 100.00,
  "sellingPrice": 150.00,
  "reorderLevel": 50,
  "binLocation": "B2-10"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "prod_999",
    "sku": "SKU-002",
    "name": "Toilet Model B",
    "status": "ACTIVE"
  }
}
```

**Errors:**
- `409` - SKU already exists

---

### GET /products/:id

Get product details with current stock.

**Auth Required:** Yes

---

### PUT /products/:id

Update product.

**Auth Required:** Yes
**Roles:** Admin, Warehouse Manager

---

### DELETE /products/:id

Soft delete product (set status to INACTIVE).

**Auth Required:** Yes
**Roles:** Admin

---

### GET /products/low-stock

Get products at or below reorder level.

**Auth Required:** Yes

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "prod_456",
      "sku": "SKU-001",
      "name": "Bathroom Sink Model A",
      "reorderLevel": 100,
      "currentStock": 45,
      "status": "LOW_STOCK"
    }
  ]
}
```

---

## Warehouse Management

### GET /warehouses

Get list of warehouses.

**Auth Required:** Yes

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "wh_123",
      "name": "Main Warehouse",
      "location": "Industrial Zone",
      "city": "Karachi",
      "status": "ACTIVE"
    }
  ]
}
```

---

### POST /warehouses

Create warehouse.

**Auth Required:** Yes
**Roles:** Admin, Warehouse Manager

---

### PUT /warehouses/:id

Update warehouse.

**Auth Required:** Yes
**Roles:** Admin, Warehouse Manager

---

### DELETE /warehouses/:id

Soft delete warehouse (only if no active stock).

**Auth Required:** Yes
**Roles:** Admin

---

## Inventory

### GET /inventory

Get inventory across all warehouses.

**Auth Required:** Yes

**Query Parameters:**
- `productId` (string)
- `warehouseId` (string)
- `lowStock` (boolean) - Only show low stock items
- `outOfStock` (boolean) - Only show out of stock items

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "inv_123",
      "product": {
        "id": "prod_456",
        "sku": "SKU-001",
        "name": "Bathroom Sink Model A"
      },
      "warehouse": {
        "id": "wh_123",
        "name": "Main Warehouse"
      },
      "quantity": 850,
      "batchNo": "20250220-001",
      "binLocation": "A1-05",
      "status": "IN_STOCK",
      "updatedAt": "2025-02-20T10:00:00Z"
    }
  ]
}
```

---

### GET /inventory/product/:productId

Get stock for specific product across all warehouses.

**Auth Required:** Yes

---

### GET /inventory/warehouse/:warehouseId

Get all stock in specific warehouse.

**Auth Required:** Yes

---

## Client Management

### GET /clients

Get paginated client list.

**Auth Required:** Yes
**Roles:** All roles

**Query Parameters:**
- `page`, `limit`
- `city` (string)
- `status` (string)
- `hasBalance` (boolean) - Clients with outstanding balance
- `search` (string)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "client_123",
      "name": "ABC Hardware Store",
      "contactPerson": "Ahmed Ali",
      "phone": "+92-300-1234567",
      "city": "Karachi",
      "creditLimit": 500000.00,
      "paymentTermsDays": 30,
      "balance": 125000.00,
      "creditUtilization": 25.0,
      "status": "ACTIVE"
    }
  ]
}
```

---

### POST /clients

Create new client.

**Auth Required:** Yes
**Roles:** Admin, Sales Officer, Accountant

**Request:**
```json
{
  "name": "XYZ Building Supplies",
  "contactPerson": "Hassan Khan",
  "phone": "+92-321-9876543",
  "email": "hassan@xyzsupplies.com",
  "city": "Lahore",
  "area": "Johar Town",
  "creditLimit": 300000.00,
  "paymentTermsDays": 15
}
```

---

### GET /clients/:id

Get client details with invoice/payment history.

**Auth Required:** Yes

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "client_123",
    "name": "ABC Hardware Store",
    "balance": 125000.00,
    "creditLimit": 500000.00,
    "creditUtilization": 25.0,
    "recentInvoices": [...],
    "recentPayments": [...]
  }
}
```

---

### PUT /clients/:id

Update client.

**Auth Required:** Yes
**Roles:** Admin, Sales Officer, Accountant

---

### DELETE /clients/:id

Soft delete client (only if balance = 0).

**Auth Required:** Yes
**Roles:** Admin

---

## Sales Invoices

### GET /invoices

Get paginated invoice list.

**Auth Required:** Yes

**Query Parameters:**
- `page`, `limit`
- `clientId` (string)
- `status` (string) - PENDING, PARTIAL, PAID, OVERDUE, CANCELLED
- `startDate`, `endDate` (date range)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "inv_123",
      "invoiceNumber": "INV-20250115-001",
      "client": {
        "id": "client_123",
        "name": "ABC Hardware Store"
      },
      "invoiceDate": "2025-01-15T00:00:00Z",
      "dueDate": "2025-02-14T00:00:00Z",
      "paymentType": "CREDIT",
      "total": 25000.00,
      "paidAmount": 10000.00,
      "status": "PARTIAL"
    }
  ]
}
```

---

### POST /invoices

Create new invoice with automatic inventory deduction.

**Auth Required:** Yes
**Roles:** Admin, Sales Officer, Accountant

**Request:**
```json
{
  "clientId": "client_123",
  "invoiceDate": "2025-01-15",
  "paymentType": "CREDIT",
  "notes": "Monthly order",
  "items": [
    {
      "productId": "prod_456",
      "quantity": 50,
      "unitPrice": 75.00,
      "discount": 5.0
    }
  ]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "inv_789",
    "invoiceNumber": "INV-20250115-002",
    "clientId": "client_123",
    "subtotal": 3562.50,
    "taxAmount": 605.63,
    "total": 4168.13,
    "status": "PENDING",
    "inventoryUpdated": true
  }
}
```

**Errors:**
- `400` - Insufficient stock
- `422` - Credit limit exceeded (for Admin, this is a warning)

---

### GET /invoices/:id

Get invoice details with items.

**Auth Required:** Yes

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "inv_123",
    "invoiceNumber": "INV-20250115-001",
    "client": { ... },
    "invoiceDate": "2025-01-15T00:00:00Z",
    "dueDate": "2025-02-14T00:00:00Z",
    "subtotal": 23809.52,
    "taxAmount": 4047.62,
    "total": 27857.14,
    "paidAmount": 10000.00,
    "status": "PARTIAL",
    "items": [
      {
        "id": "item_1",
        "product": {
          "id": "prod_456",
          "sku": "SKU-001",
          "name": "Bathroom Sink Model A"
        },
        "quantity": 50,
        "unitPrice": 75.00,
        "discount": 5.0,
        "taxAmount": 595.95,
        "total": 4168.13
      }
    ]
  }
}
```

---

### DELETE /invoices/:id

Void invoice and reverse inventory (only if unpaid).

**Auth Required:** Yes
**Roles:** Admin

**Request:**
```json
{
  "reason": "Incorrect pricing"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "inv_123",
    "status": "CANCELLED",
    "inventoryRestored": true
  }
}
```

---

## Payments

### POST /payments/client

Record payment from client.

**Auth Required:** Yes
**Roles:** Admin, Accountant, Recovery Agent

**Request:**
```json
{
  "clientId": "client_123",
  "amount": 50000.00,
  "method": "BANK_TRANSFER",
  "referenceNumber": "TXN123456",
  "date": "2025-01-15",
  "notes": "Payment for Invoice INV-20250115-001",
  "invoiceAllocations": [
    {
      "invoiceId": "inv_123",
      "amount": 50000.00
    }
  ]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "payment_456",
    "clientId": "client_123",
    "amount": 50000.00,
    "method": "BANK_TRANSFER",
    "date": "2025-01-15T00:00:00Z",
    "clientBalanceAfter": 75000.00,
    "allocations": [...]
  }
}
```

---

### GET /payments/client

Get client payment history.

**Auth Required:** Yes

**Query Parameters:**
- `clientId` (string)
- `startDate`, `endDate`
- `method` (string)

---

### POST /payments/supplier

Record payment to supplier.

**Auth Required:** Yes
**Roles:** Admin, Accountant

**Request:**
```json
{
  "supplierId": "sup_123",
  "amount": 100000.00,
  "method": "BANK_TRANSFER",
  "referenceNumber": "TXN789012",
  "date": "2025-01-15",
  "notes": "Payment for PO-2025-001"
}
```

---

### GET /payments/supplier

Get supplier payment history.

**Auth Required:** Yes

---

## Expenses

### GET /expenses

Get expense list.

**Auth Required:** Yes
**Roles:** Admin, Accountant

**Query Parameters:**
- `category` (string)
- `startDate`, `endDate`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "exp_123",
      "date": "2025-01-15T00:00:00Z",
      "category": "RENT",
      "amount": 50000.00,
      "method": "BANK_TRANSFER",
      "description": "Office rent for January 2025",
      "paidTo": "Property Owner"
    }
  ]
}
```

---

### POST /expenses

Record new expense.

**Auth Required:** Yes
**Roles:** Admin, Accountant

**Request:**
```json
{
  "date": "2025-01-15",
  "category": "UTILITIES",
  "amount": 15000.00,
  "method": "CASH",
  "description": "Electricity bill for December 2024",
  "paidTo": "K-Electric"
}
```

---

### PUT /expenses/:id

Update expense.

**Auth Required:** Yes
**Roles:** Admin, Accountant

---

### DELETE /expenses/:id

Delete expense.

**Auth Required:** Yes
**Roles:** Admin

---

### GET /expenses/summary

Get expense summary by category.

**Auth Required:** Yes
**Roles:** Admin, Accountant

**Query Parameters:**
- `startDate`, `endDate`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalExpenses": 215000.00,
    "byCategory": {
      "RENT": 50000.00,
      "UTILITIES": 15000.00,
      "SALARIES": 120000.00,
      "TRANSPORT": 20000.00,
      "MISCELLANEOUS": 10000.00
    }
  }
}
```

---

## Reports

### GET /reports/sales-summary

Sales summary report.

**Auth Required:** Yes

**Query Parameters:**
- `startDate`, `endDate`
- `groupBy` (string) - day, week, month

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalSales": 5000000.00,
    "totalInvoices": 150,
    "avgInvoiceValue": 33333.33,
    "cashSales": 2000000.00,
    "creditSales": 3000000.00,
    "breakdown": [
      {
        "period": "2025-01",
        "sales": 5000000.00,
        "invoices": 150
      }
    ]
  }
}
```

---

### GET /reports/inventory-valuation

Inventory valuation report.

**Auth Required:** Yes

---

### GET /reports/receivables-aging

Accounts receivable aging report.

**Auth Required:** Yes

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalReceivables": 1500000.00,
    "aging": {
      "current": 500000.00,
      "30days": 400000.00,
      "60days": 300000.00,
      "90daysPlus": 300000.00
    },
    "byClient": [...]
  }
}
```

---

### GET /reports/tax-summary

Tax summary report.

**Auth Required:** Yes
**Roles:** Admin, Accountant

**Query Parameters:**
- `startDate`, `endDate`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalSales": 5000000.00,
    "taxableAmount": 4237288.14,
    "taxCollected": 720338.98,
    "netSales": 4279661.02
  }
}
```

---

## Audit Logs

### GET /audit-logs

Get audit log entries.

**Auth Required:** Yes
**Roles:** Admin

**Query Parameters:**
- `page`, `limit`
- `userId` (string)
- `action` (string)
- `entityType` (string)
- `startDate`, `endDate`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "audit_123",
      "user": {
        "id": "user_456",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "action": "UPDATE",
      "entityType": "Product",
      "entityId": "prod_789",
      "timestamp": "2025-01-15T10:30:00Z",
      "ipAddress": "192.168.1.100",
      "changedFields": {
        "sellingPrice": {
          "old": 75.00,
          "new": 80.00
        }
      }
    }
  ]
}
```

---

### GET /audit-logs/entity/:entityType/:entityId

Get audit history for specific entity.

**Auth Required:** Yes
**Roles:** Admin

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "audit_123",
      "action": "CREATE",
      "timestamp": "2025-01-10T00:00:00Z",
      "user": { ... }
    },
    {
      "id": "audit_124",
      "action": "UPDATE",
      "timestamp": "2025-01-15T10:30:00Z",
      "user": { ... },
      "changedFields": { ... }
    }
  ]
}
```

---

## Rate Limiting

**Global Rate Limit:** 100 requests per minute per IP

**Response when rate limit exceeded (429):**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later."
  }
}
```

---

## Pagination

All list endpoints support pagination using `page` and `limit` query parameters.

**Default Values:**
- `page`: 1
- `limit`: 10

**Maximum `limit`:** 100

**Pagination Metadata:**
```json
{
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 250,
    "totalPages": 25
  }
}
```

---

## Changelog

### v1.0 (2025-01-15)
- Initial API documentation
- All MVP endpoints (Epics 1-4)
- Standard response format
- Error handling conventions

---

**Document Version:** 1.0
**Last Updated:** 2025-01-15
**Status:** Approved for Development
