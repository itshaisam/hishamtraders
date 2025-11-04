# 🏢 HISHAM TRADERS ERP - Import-Distribution Management Platform

**Modern ERP solution for import-distribution businesses**

---

## 📋 Project Overview

A comprehensive ERP system designed for Hisham Traders (sanitary products importer/distributor) to manage the complete business lifecycle from China procurement to Pakistan retail distribution.

### Key Features
- 📦 **Container/Import Management** - Track shipments, calculate landed costs
- 🏭 **Multi-warehouse Inventory** - Real-time stock across locations with bin tracking
- 💰 **Sales & Credit Management** - Invoicing with credit limit enforcement
- 📊 **Real-time Dashboards** - Live metrics for Admin, Sales, and Warehouse teams
- 📈 **Comprehensive Reports** - Stock, sales, payments, imports, expenses
- 👥 **Role-based Access** - 5 user roles with granular permissions

---

## 🚀 Quick Start

**Get started in 30 minutes:**

1. **Prerequisites**
   ```bash
   # Install Node.js 20 LTS, pnpm, Docker Desktop
   node --version  # v20.x.x
   pnpm --version  # 8.x.x
   docker --version
   ```

2. **Follow the Quick Start Guide**
   ```bash
   # See QUICK_START.md for detailed setup instructions
   cat QUICK_START.md
   ```

3. **Start Building**
   ```bash
   # Follow MVP_FEATURE_CHECKLIST.md week by week
   cat MVP_FEATURE_CHECKLIST.md
   ```

---

## 📚 Documentation

### 🎯 Planning Documents
- **[MVP Roadmap](docs/planning/mvp-roadmap.md)** - Complete 6-week implementation plan
- **[MVP Feature Checklist](docs/planning/feature-checklist.md)** - Detailed task tracking with acceptance criteria
- **[Phase 2 Roadmap](docs/planning/phase-2-roadmap.md)** - 12-16 week expansion plan (Account Heads, Gate Passes, Recovery, Audit UI)
- **[Quick Start Guide](docs/planning/quick-start.md)** - 30-minute development setup
- **[Tech Stack Decision](docs/planning/tech-stack-decision.md)** - Why Node.js over Java

### 📋 Product Requirements
- **[Main PRD](docs/prd.md)** - Product Requirements Document (complete specifications)
- **[Project Brief](docs/brief.md)** - Original business requirements

### 🏗️ Architecture
- **[Architecture Overview](docs/architecture/architecture.md)** - System design, diagrams, data flow
- **[Tech Stack](docs/architecture/tech-stack.md)** - Detailed technology choices
- **[Audit Logging](docs/architecture/audit-logging.md)** - Automatic audit trail from Day 1 ⭐

### 📦 Epic Specifications

**MVP Epics (6 Weeks):**
1. **[Epic 1: Foundation & Audit](docs/prd/epic-1-foundation-auth-audit.md)** - Auth, users, **audit logging from Day 1** ⭐
2. **[Epic 2: Import & Inventory](docs/prd/epic-2-import-inventory.md)** - Suppliers, POs, landed cost, inventory
3. **[Epic 3: Sales & Payments](docs/prd/epic-3-sales-payments.md)** - Clients, invoices, payments, expenses
4. **[Epic 4: Dashboards & Reports](docs/prd/epic-4-dashboards-reports.md)** - Real-time dashboards, Excel exports

**Phase 2 Epics (Post-MVP):**
5. **[Epic 5: Account Heads & GL](docs/prd/epic-5-account-heads-gl.md)** - Double-entry bookkeeping, FBR compliance
6. **[Epic 6: Advanced Inventory](docs/prd/epic-6-advanced-inventory.md)** - **Gate passes** ⭐, transfers, batch/expiry tracking
7. **[Epic 7: Recovery Management](docs/prd/epic-7-recovery-management.md)** - Weekly schedules, aging analysis, agent performance
8. **[Epic 8: Audit & Advanced](docs/prd/epic-8-audit-advanced.md)** - Audit viewer UI, barcode scanning, mobile PWA

---

## 🏗️ Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Tanstack Query** - Data fetching/caching
- **Zustand** - State management
- **Recharts** - Charts/dashboards

### Backend
- **Node.js 20 LTS** - Runtime
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Prisma** - ORM (type-safe database access)
- **PostgreSQL 15** - Database
- **JWT** - Authentication
- **bcrypt** - Password hashing

### DevOps
- **Docker** - PostgreSQL container
- **pnpm** - Fast package manager
- **Vite** - Frontend build tool
- **Prisma Studio** - Database GUI

---

## 📁 Project Structure

```
hisham-erp/
├── apps/
│   ├── web/              # React frontend
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── services/
│   │   │   └── store/
│   │   └── package.json
│   │
│   └── api/              # Express backend
│       ├── src/
│       │   ├── routes/
│       │   ├── controllers/
│       │   ├── middleware/
│       │   └── services/
│       └── package.json
│
├── packages/
│   └── shared/           # Shared TypeScript types
│
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── migrations/      # Migration files
│
├── docker-compose.yml   # PostgreSQL setup
└── pnpm-workspace.yaml  # Monorepo config
```

---

## 🎯 MVP Scope (6 Weeks)

### Week 1-2: Foundation & Import Module
- ✅ Authentication (JWT + role-based)
- ✅ Supplier management
- ✅ Purchase order creation
- ✅ Container tracking
- ✅ Landed cost calculator

### Week 2: Product & Inventory
- ✅ Product master data
- ✅ Warehouse setup
- ✅ Stock receiving from POs
- ✅ Real-time inventory tracking
- ✅ Stock adjustments

### Week 3: Sales & Clients
- ✅ Client database with credit limits
- ✅ Sales invoicing
- ✅ Auto stock deduction
- ✅ Credit limit enforcement

### Week 4: Payments & Expenses
- ✅ Client payment recording
- ✅ Supplier payment tracking
- ✅ Expense categorization
- ✅ Balance updates

### Week 5-6: Dashboards & Reports
- ✅ Real-time dashboards (Admin, Sales, Warehouse)
- ✅ Stock reports
- ✅ Sales reports
- ✅ Payment collection reports
- ✅ Import/container reports
- ✅ Expense reports
- ✅ Excel export

---

## 🚦 Getting Started Roadmap

### Day 1: Environment Setup
```bash
# Follow QUICK_START.md to set up:
1. Install Node.js, pnpm, Docker
2. Create monorepo structure
3. Start PostgreSQL with Docker
4. Initialize Prisma
5. Set up Express backend
6. Set up React frontend
7. Verify everything works
```

### Day 2-3: Authentication
```bash
# Build auth system:
1. Create User model
2. Build registration/login API
3. Implement JWT middleware
4. Create login UI
5. Test auth flow
```

### Day 4+: Follow the Checklist
```bash
# Open MVP_FEATURE_CHECKLIST.md
# Follow week-by-week tasks
# Check off items as you complete them
```

---

## 🎓 Key Concepts

### Landed Cost Calculation
```
Total Product Cost = Sum of all product costs in PO
Additional Costs = Shipping + Customs + Taxes

For each product:
  Product Ratio = Product Cost / Total Product Cost
  Allocated Additional Cost = Additional Costs × Product Ratio
  Landed Cost Per Unit = (Product Cost + Allocated Additional Cost) / Quantity
```

### Credit Limit Enforcement
```
Client has credit limit of PKR 100,000
Current balance: PKR 80,000
New invoice total: PKR 30,000

New balance = 80,000 + 30,000 = 110,000
If 110,000 > 100,000:
  Show warning, allow Admin to override
```

### Stock Deduction (FIFO)
```
When invoice is created:
1. Check stock availability for all items
2. Deduct from oldest batch first (FIFO)
3. Create stock movement audit record
4. If insufficient stock, reject invoice
```

---

## 🔐 Security Features

- ✅ **Password Hashing** - bcrypt with salt
- ✅ **JWT Authentication** - Token-based auth
- ✅ **Role-based Access** - Granular permissions
- ✅ **SQL Injection Prevention** - Prisma parameterized queries
- ✅ **Input Validation** - Express-validator
- ✅ **CORS Protection** - Configured origins
- ✅ **Audit Trail** - All critical operations logged

---

## 📊 Success Metrics

### Performance Targets
- Page load time: **< 2 seconds**
- API response time: **< 500ms** (95th percentile)
- Concurrent users: **20+** without degradation

### Business Impact Goals
- **40% efficiency gain** - Reduce manual admin time
- **25% inventory improvement** - Better turnover
- **60% fewer stockouts** - Real-time visibility
- **30% faster recovery** - Systematic tracking

---

## 🛠️ Common Commands

```bash
# Start all services (backend + frontend)
pnpm dev

# Database migrations
pnpx prisma migrate dev --name migration_name

# Generate Prisma Client (after schema changes)
pnpx prisma generate

# Open database GUI
pnpx prisma studio

# Install package to specific workspace
cd apps/api
pnpm add package-name

# Install to root
pnpm add -w package-name

# Build for production
pnpm build

# Start production server
pnpm start
```

---

## 🐛 Troubleshooting

### Database connection error
```bash
# Verify Docker is running
docker ps

# Restart database
docker-compose restart
```

### Port already in use
```bash
# Kill process on port 3001
npx kill-port 3001

# Or change port in .env
API_PORT=3002
```

### Prisma Client not found
```bash
# Regenerate client
pnpx prisma generate
```

---

## 📦 Deployment

### Production Checklist
- [ ] Environment variables configured
- [ ] Database backed up
- [ ] SSL certificate installed
- [ ] Nginx configured as reverse proxy
- [ ] PM2 process manager running
- [ ] Firewall rules set
- [ ] Monitoring enabled

### Recommended Hosting
- **DigitalOcean Droplet** - $12-24/month (2GB RAM)
- **Railway.app** - $5-20/month (auto-scaling)
- **AWS/Azure** - For larger scale

---

## 🚧 Post-MVP Roadmap

### Phase 2 Features (3-6 months)
- [ ] Mobile apps (React Native)
- [ ] Barcode scanning
- [ ] WhatsApp integration for recovery reminders
- [ ] Advanced analytics & forecasting
- [ ] Batch/lot expiry tracking
- [ ] Stock transfers between warehouses

### Phase 3 Features (6-12 months)
- [ ] FBR e-invoice integration
- [ ] Supplier portal
- [ ] Customer portal
- [ ] Multi-currency support
- [ ] Bank reconciliation
- [ ] Advanced reporting & BI

---

## 🤝 Contributing

This is a private project for Hisham Traders, but if you're building something similar:

1. Fork the structure
2. Follow the MVP roadmap
3. Adapt to your business needs
4. Keep the modular architecture

---

## 📞 Support & Resources

### Documentation
- [Prisma Docs](https://www.prisma.io/docs)
- [Express.js Guide](https://expressjs.com/)
- [React Query Docs](https://tanstack.com/query/latest)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

### Tools
- [Prisma Studio](https://www.prisma.io/studio) - Database GUI
- [Postman](https://www.postman.com/) - API testing
- [Excalidraw](https://excalidraw.com/) - Diagrams

---

## 📄 License

Private project for Hisham Traders. All rights reserved.

---

## 🎯 Next Steps

**Ready to start? Here's what to do:**

1. **Read [Quick Start Guide](docs/planning/quick-start.md)** - Set up environment (30 min)
2. **Read [MVP Roadmap](docs/planning/mvp-roadmap.md)** - Understand the 6-week plan
3. **Open [MVP Feature Checklist](docs/planning/feature-checklist.md)** - Start building!
4. **Review [Architecture Overview](docs/architecture/architecture.md)** - Understand system design
5. **Check [Epic 1: Foundation](docs/prd/epic-1-foundation-auth-audit.md)** - Start with authentication & **audit logging** ⭐

**Let's build this ERP! 🚀**

---

*Last updated: January 2025*
*Version: 1.0.0 - MVP Planning Phase*
