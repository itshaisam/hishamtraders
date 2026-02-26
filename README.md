# 🏢 ENTERPRISEONE ERP - Multi-Tenant Business Management Platform

**Enterprise-grade ERP solution for SMBs. The modern alternative to Odoo and SAP Business One.**

[![License](https://img.shields.io/badge/License-Private-blue.svg)](LICENSE)
[![Tech Stack](https://img.shields.io/badge/Stack-Node.js%20%7C%20React%20%7C%20TypeScript-green.svg)](docs/architecture/tech-stack.md)
[![Database](https://img.shields.io/badge/Database-MySQL%20%7C%20PostgreSQL-orange.svg)]()

---

## 📋 Platform Overview

EnterpriseOne is a **comprehensive, multi-tenant SaaS ERP platform** designed for small and medium businesses across manufacturing, distribution, retail, and services industries. Originally developed as a specialized import-distribution solution, it has evolved into a full-featured ERP competing with enterprise solutions like **Odoo** and **SAP Business One**.

### 🎯 Positioning: EnterpriseOne vs Competitors

| Feature | EnterpriseOne | Odoo | SAP B1 |
|---------|--------------|------|--------|
| **Multi-Tenancy** | ✅ Native | ❌ Single-tenant | ❌ Single-tenant |
| **Pricing** | 💰 Affordable per-user | 💰💰 Mid-range | 💰💰💰 Premium |
| **Implementation** | ⚡ Days | 🕐 Weeks-Months | 🕐🕐 Months |
| **Customization** | 🔧 Full source code | 🔧 Module-based | 🔧 Limited/Expensive |
| **Mobile-First** | ✅ PWA + Responsive | ⚠️ Apps required | ⚠️ Limited mobile |
| **Audit Logging** | ✅ Automatic (Day 1) | ⚠️ Add-on required | ⚠️ Add-on required |
| **Accounting** | ✅ Double-entry GL | ✅ Yes | ✅ Yes |
| **Manufacturing** | 🚧 MRP (Roadmap) | ✅ MRP | ✅ MRP |

---

## 🚀 Core Capabilities

### 📦 Supply Chain Management
- **Procurement** - Purchase orders, supplier management, landed cost calculation
- **Inventory** - Multi-warehouse, bin locations, batch/lot tracking, FIFO
- **Sales** - Quotations, sales orders, delivery notes, invoicing
- **Returns** - RMA processing, credit notes, stock reversals

### 💰 Financial Management
- **General Ledger** - Double-entry bookkeeping, chart of accounts
- **Accounts Receivable** - Customer invoices, payment allocation, aging analysis
- **Accounts Payable** - Supplier invoices, payment scheduling
- **Banking** - Multi-bank accounts, reconciliation, petty cash
- **Financial Reporting** - Trial balance, balance sheet, P&L, cash flow

### 🏭 Manufacturing & Operations *(Phase 3)*
- **Bill of Materials (BOM)**
- **Production Planning**
- **Work Orders**
- **Shop Floor Control**

### 👥 Customer Relationship Management
- **Lead Management**
- **Opportunity Tracking**
- **Customer Portal** *(Phase 3)*
- **Communication History**

### 📊 Business Intelligence
- **Real-time Dashboards** - Role-based views (Admin, Sales, Warehouse, Accountant)
- **Advanced Reporting** - 20+ reports with Excel/PDF export
- **KPI Tracking** - DSO, inventory turnover, collection efficiency
- **Audit Trail** - Complete activity logging with change history

### 🔐 Enterprise Security
- **Multi-Tenant Architecture** - Complete data isolation between organizations
- **Role-Based Access Control (RBAC)** - 5 roles + custom permissions
- **Audit Logging** - Automatic tracking of all transactions
- **Data Encryption** - At-rest and in-transit

---

## 🏗️ Architecture

### Multi-Tenant SaaS Design

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                              │
│  React 18 + TypeScript + Tailwind CSS + TanStack Query      │
│  - Responsive Web (Desktop/Tablet/Mobile)                   │
│  - Progressive Web App (PWA)                                │
│  - Mobile Apps (Future: React Native)                       │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS / JSON
                     │
┌────────────────────▼────────────────────────────────────────┐
│                      API GATEWAY                             │
│         Nginx / Kong - Rate Limiting, SSL                   │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                    APPLICATION LAYER                         │
│        Node.js 20 + Express + TypeScript + Prisma           │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Auth → Tenant Context → Audit → Business Logic      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Multi-Tenant Middleware:                                    │
│  - AsyncLocalStorage for tenant context                      │
│  - Prisma Client Extension for automatic filtering           │
│  - Row-level security (tenantId isolation)                   │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                       DATA LAYER                             │
│              PostgreSQL / MySQL 8+                           │
│                                                              │
│  - Shared database with tenant isolation                     │
│  - 50+ models covering all business domains                  │
│  - Automatic audit logging tables                            │
│  - Change history with versioning                            │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Tailwind CSS, TanStack Query, Zustand |
| **Backend** | Node.js 20 LTS, Express, TypeScript, Prisma ORM |
| **Database** | PostgreSQL 15 / MySQL 8+ |
| **Cache** | Redis (Future) |
| **Queue** | Bull/BullMQ (Future) |
| **Search** | Meilisearch/Elasticsearch (Future) |
| **Auth** | JWT with refresh tokens |
| **Docs** | Swagger/OpenAPI |

---

## 📦 Module Inventory

### ✅ Implemented (Production Ready)

| Module | Features | Comparable To |
|--------|----------|---------------|
| **Authentication** | JWT, RBAC, multi-tenant users | Odoo Users |
| **Audit Logging** | Automatic activity tracking | Odoo Audit Log |
| **Products** | SKU auto-generation, variants, categories | Odoo Inventory |
| **Inventory** | Multi-warehouse, bin locations, FIFO, batch tracking | Odoo Stock |
| **Purchasing** | POs, landed costs, GRN, 3-way matching | Odoo Purchase |
| **Sales** | Quotes, orders, delivery, invoicing | Odoo Sales |
| **CRM** | Clients, credit limits, payment terms | Odoo CRM |
| **Payments** | Customer/supplier payments, allocation | Odoo Accounting |
| **Accounting** | GL, journal entries, trial balance, balance sheet | Odoo Accounting |
| **Banking** | Multi-bank, reconciliation, petty cash | Odoo Accounting |
| **Recovery** | Collection schedules, visit logging, aging | Odoo Collections |
| **Gate Passes** | Delivery authorization, tracking | Custom |
| **Stock Transfers** | Inter-warehouse transfers | Odoo Inventory |
| **Reports** | 20+ reports with Excel/PDF export | Odoo Reports |

### 🚧 In Development

| Module | ETA |
|--------|-----|
| **MRP (Manufacturing)** | Q2 2026 |
| **POS (Point of Sale)** | Q2 2026 |
| **eCommerce Integration** | Q3 2026 |
| **Project Management** | Q3 2026 |
| **HR & Payroll** | Q4 2026 |
| **Advanced Analytics** | Q4 2026 |

---

## 🚀 Quick Start

### Prerequisites
```bash
# Install Node.js 20 LTS, pnpm, Docker Desktop
node --version  # v20.x.x
pnpm --version  # 8.x.x or 9.x.x
docker --version
```

### 1. Clone and Setup
```bash
git clone <repository-url>
cd enterpriseone-erp
cp .env.example .env
cp apps/api/.env.example apps/api/.env
```

### 2. Start Database
```bash
docker-compose up -d postgres
# or
docker-compose up -d mysql
```

### 3. Setup Database
```bash
pnpm db:migrate
pnpm db:seed
```

### 4. Start Development
```bash
pnpm dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- API Docs: http://localhost:3001/api-docs

---

## 📚 Documentation

### Getting Started
- [Quick Start Guide](docs/planning/quick-start.md) - 30-minute setup
- [Architecture Overview](docs/architecture/architecture.md) - System design
- [Database Schema](docs/architecture/database-schema.md) - Complete ER diagram

### Development
- [API Documentation](docs/architecture/api-endpoints.md) - REST API reference
- [Coding Standards](docs/architecture/coding-standards.md) - TypeScript/React conventions
- [Testing Guide](docs/testing.md) - Unit, integration, E2E testing

### Deployment
- [Deployment Guide](DEPLOYMENT.md) - Production deployment
- [Docker Setup](docker-compose.yml) - Container orchestration
- [Railway Deploy](docs/deployment/railway-setup.md) - Cloud deployment

### Modules
- [Product Requirements (PRD)](docs/prd.md) - Detailed specifications
- [Epic Specifications](docs/epics/) - Feature breakdowns
- [Story Specifications](docs/stories/) - Implementation details

---

## 🎯 Use Cases

### Import/Export Distribution
- Container tracking and landed cost calculation
- Multi-currency support (USD/EUR/CNY/local)
- Import documentation management
- Duty and customs cost allocation

### Manufacturing
- Bill of Materials (BOM) management
- Production planning and scheduling
- Raw material procurement
- Finished goods inventory

### Retail & Wholesale
- Multi-location inventory management
- POS integration (upcoming)
- Customer credit management
- Supplier payment scheduling

### Services
- Project-based billing
- Time tracking (upcoming)
- Expense management
- Client portal (upcoming)

---

## 💼 Competitive Advantages

### vs Odoo
- ✅ **True Multi-Tenancy** - Native SaaS architecture, not single-tenant
- ✅ **Faster Implementation** - Days vs weeks/months
- ✅ **Lower TCO** - No expensive implementation consultants
- ✅ **Modern Stack** - React/Node.js vs Python/Old JavaScript
- ✅ **Mobile-First** - Responsive PWA vs desktop-centric

### vs SAP Business One
- ✅ **Affordable** - SMB-friendly pricing
- ✅ **Flexible** - Full source code customization
- ✅ **Cloud-Native** - Built for cloud, not on-premise ported
- ✅ **Easy Integration** - REST API vs proprietary
- ✅ **No Vendor Lock-in** - Open architecture

---

## 📈 Roadmap

### Phase 1: Core ERP ✅
- [x] Multi-tenant foundation
- [x] Inventory & Purchasing
- [x] Sales & CRM
- [x] Accounting & Financials
- [x] Reporting & Analytics

### Phase 2: Advanced Operations ✅
- [x] Gate passes & warehouse operations
- [x] Recovery & collection management
- [x] Full double-entry accounting
- [x] Audit trail viewer
- [x] Advanced inventory (batch/expiry)

### Phase 3: Manufacturing & CRM 🚧
- [ ] Bill of Materials (BOM)
- [ ] MRP (Material Requirements Planning)
- [ ] Production planning
- [ ] Advanced CRM features
- [ ] Customer portal

### Phase 4: Scale & AI 📅
- [ ] AI-powered forecasting
- [ ] Advanced BI & dashboards
- [ ] Workflow automation
- [ ] Mobile apps (React Native)
- [ ] Marketplace & integrations

---

## 🤝 Contributing

This is a private commercial project. For partnership inquiries:
- Email: contact@enterpriseone.com
- Website: https://enterpriseone.com

---

## 📄 License

Private Software License - All rights reserved.

Copyright © 2025 EnterpriseOne Systems

---

**Built with ❤️ to democratize ERP for SMBs worldwide.**

*From a humble import-distribution solution to an enterprise-grade ERP platform.*
