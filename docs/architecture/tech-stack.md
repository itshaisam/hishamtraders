# Technology Stack

**Purpose:** This document defines the complete technology stack for the Hisham Traders ERP system, including justification for each technology choice.

**Decision Date:** 2025-01-15

---

## Executive Summary

**Chosen Stack:** Node.js + TypeScript + React + MySQL

**Key Reasons:**
- **30-40% faster development** compared to Java
- **3-5x cheaper hosting** ($12-24/month vs $70-120/month)
- **Perfect for real-time** (native async, WebSockets)
- **Huge talent pool** (easier to hire developers)
- **Single language** (TypeScript on frontend and backend)

---

## Stack Comparison: Node.js vs Java

| Factor                  | Weight | Node.js | Java | Winner  |
|------------------------|--------|---------|------|---------|
| Development Speed      | 30%    | 10      | 6    | Node.js |
| Cost (Hosting)         | 25%    | 10      | 5    | Node.js |
| Performance            | 20%    | 9       | 9    | Tie     |
| Real-time Features     | 15%    | 10      | 7    | Node.js |
| Developer Availability | 10%    | 10      | 7    | Node.js |

**Total Score:** Node.js 9.6/10 vs Java 6.9/10

---

## Frontend Stack

### React 18 + TypeScript

**Why React:**
- Most popular frontend framework (huge ecosystem)
- Component-based architecture (reusable UI)
- Virtual DOM (fast rendering)
- Strong TypeScript support
- Mature tooling and community

**Why TypeScript:**
- Type safety prevents runtime errors
- Better IDE support (autocomplete, refactoring)
- Shared types with backend (DRY principle)
- Catch errors at compile time
- Self-documenting code

**Version:** React 18.2+, TypeScript 5.3+

---

### Build Tool: Vite

**Why Vite (not Create React App):**
- **10-100x faster** dev server startup
- Hot Module Replacement (HMR) in < 50ms
- Optimized production builds with esbuild
- Native ES modules support
- Better developer experience

**Configuration:**
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001'
    }
  }
});
```

---

### Styling: Tailwind CSS v3

**Why Tailwind (not Bootstrap/Material UI):**
- **Utility-first** approach (faster development)
- **Smaller bundle size** (only used utilities included)
- **Highly customizable** (no opinionated design)
- **Responsive by default** (mobile-first)
- **Dark mode support** (built-in)

**Installation:**
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init
```

**Configuration:**
```typescript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',   // Blue
        success: '#10b981',   // Green
        warning: '#f59e0b',   // Yellow
        danger: '#ef4444',    // Red
      }
    }
  }
};
```

---

### Icons: Lucide React

**Why Lucide (not FontAwesome/Material Icons):**
- **Modern and clean** design
- **Tree-shakeable** (only imported icons bundled)
- **Consistent style** across all icons
- **MIT license** (free for commercial use)
- **1000+ icons** available

**Usage:**
```typescript
import { User, Package, TrendingUp } from 'lucide-react';

<User size={24} className="text-blue-500" />
```

---

### State Management: TanStack Query + Zustand

**TanStack Query (React Query v5):**
- **Server state management** (API data fetching/caching)
- Automatic background refetching
- Optimistic updates
- Cache invalidation
- Loading/error states

**Zustand:**
- **Client state management** (UI state, auth context)
- Lightweight (1KB gzipped)
- No boilerplate (simpler than Redux)
- TypeScript-first

**Example:**
```typescript
// State: Zustand
import create from 'zustand';

const useAuthStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null })
}));

// Server Data: TanStack Query
import { useQuery } from '@tanstack/react-query';

const { data, isLoading } = useQuery({
  queryKey: ['products'],
  queryFn: fetchProducts
});
```

---

### Forms: React Hook Form + Zod

**React Hook Form:**
- **Minimal re-renders** (better performance)
- Easy validation
- Form state management
- TypeScript support

**Zod:**
- **Schema validation** (shared with backend)
- Type inference (automatic TypeScript types)
- Detailed error messages

**Example:**
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Name required'),
  email: z.string().email('Invalid email'),
  age: z.number().min(18, 'Must be 18+')
});

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema)
});
```

---

### Data Tables: TanStack Table v8

**Why TanStack Table:**
- Headless UI (full styling control)
- Sorting, filtering, pagination built-in
- Virtualization for large datasets
- TypeScript-first

---

### Charts: Recharts

**Why Recharts:**
- React-native (not D3 wrapper)
- Responsive charts
- 10+ chart types (line, bar, pie, area)
- Good documentation

**Alternative:** Chart.js (if Recharts too heavy)

---

### HTTP Client: Axios + TanStack Query

**Why Axios (not fetch):**
- Automatic JSON transformation
- Request/response interceptors (for auth tokens)
- Better error handling
- Request cancellation

**Integration with TanStack Query:**
```typescript
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to all requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const fetchProducts = () =>
  apiClient.get('/products').then(res => res.data);
```

---

### Routing: React Router v6

**Why React Router:**
- De facto standard for React
- Nested routes
- Protected routes (auth guards)
- URL parameters and query strings

**Example:**
```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';

<BrowserRouter>
  <Routes>
    <Route path="/" element={<Dashboard />} />
    <Route path="/products" element={<ProductList />} />
    <Route path="/products/:id" element={<ProductDetail />} />
    <Route path="/invoices" element={<ProtectedRoute><InvoiceList /></ProtectedRoute>} />
  </Routes>
</BrowserRouter>
```

---

### Date Handling: date-fns

**Why date-fns (not moment.js):**
- **Lightweight** (11KB vs moment 230KB)
- **Tree-shakeable** (import only needed functions)
- **Immutable** (safer date operations)
- **TypeScript support**

**Usage:**
```typescript
import { format, addDays, differenceInDays } from 'date-fns';

format(new Date(), 'yyyy-MM-dd');  // "2025-01-15"
addDays(new Date(), 7);            // Date 7 days from now
```

---

### Notifications: react-hot-toast

**Why react-hot-toast:**
- Beautiful default styles
- Promise-based API (loading → success/error)
- Customizable
- Accessible

**Usage:**
```typescript
import toast from 'react-hot-toast';

toast.success('Product created!');
toast.error('Failed to save');
toast.loading('Saving...');
```

---

## Backend Stack

### Node.js 20 LTS + TypeScript

**Why Node.js:**
- **Non-blocking I/O** (handles many concurrent connections)
- **JavaScript/TypeScript** (same language as frontend)
- **npm ecosystem** (largest package registry)
- **Fast development** (less boilerplate than Java)

**Why LTS (Long-Term Support):**
- Stable and production-ready
- Security patches for 30 months
- Used by major companies (Netflix, PayPal, Uber)

**Version:** Node.js 20.x (LTS until 2026-04-30)

---

### Framework: Express.js

**Why Express (not Nest.js/Fastify):**
- **Simple and unopinionated** (flexible architecture)
- **Mature and stable** (13+ years old)
- **Huge ecosystem** (middleware for everything)
- **Easy to learn** (gentle learning curve)

**Alternative Considered:**
- **Nest.js**: More opinionated (Angular-like), heavier, better for large teams
- **Fastify**: Faster, but smaller ecosystem

**For MVP:** Express is perfect (simple, flexible, proven)

---

### ORM: Prisma 5

**Why Prisma (not Sequelize/TypeORM):**
- **Type-safe** (auto-generated TypeScript types)
- **Declarative schema** (schema.prisma file)
- **Migrations** (version-controlled schema changes)
- **Prisma Studio** (visual database browser)
- **Query performance** (optimized queries)

**Example:**
```prisma
// prisma/schema.prisma
model Product {
  id          String   @id @default(cuid())
  sku         String   @unique
  name        String
  price       Decimal
  stock       Int
  createdAt   DateTime @default(now())

  invoiceItems InvoiceItem[]
}
```

**Generated TypeScript:**
```typescript
// Auto-generated by Prisma
const product = await prisma.product.create({
  data: {
    sku: 'PRD-001',
    name: 'Test Product',
    price: 100.00,
    stock: 50
  }
});
// product is fully typed!
```

---

### Validation: Zod

**Why Zod:**
- **Shared schemas** between frontend and backend
- **Type inference** (automatic TypeScript types)
- **Composable** (build complex schemas from simple ones)

**Example:**
```typescript
import { z } from 'zod';

const createProductSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(3),
  price: z.number().positive(),
  stock: z.number().int().nonnegative()
});

// Validate request body
const result = createProductSchema.safeParse(req.body);
if (!result.success) {
  return res.status(400).json({ errors: result.error });
}
```

---

### Authentication: JWT + bcrypt

**JWT (JSON Web Tokens):**
- Stateless (no session storage needed)
- Self-contained (includes user info)
- Works across services (microservices-ready)

**bcrypt:**
- Industry-standard password hashing
- Salted hashes (prevents rainbow table attacks)
- Configurable rounds (10+ recommended)

**Example:**
```typescript
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// Hash password
const hash = await bcrypt.hash(password, 10);

// Verify password
const match = await bcrypt.compare(password, hash);

// Generate JWT
const token = jwt.sign(
  { userId: user.id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);

// Verify JWT
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

---

### Logging: Winston

**Why Winston:**
- **Multiple transports** (console, file, remote)
- **Log levels** (error, warn, info, debug)
- **Structured logging** (JSON format)
- **Log rotation** (prevent disk fill)

**Configuration:**
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});
```

---

## Database

### MySQL 8+

**Why MySQL:**
- **ACID compliant** (data integrity guaranteed with InnoDB)
- **Mature and stable** (widely used in production)
- **Good performance** (excellent for reads and writes)
- **Open source and free**
- **Excellent Prisma support**
- **Wide adoption** (easy to find hosting and expertise)

**MySQL 8+ Features:**
- Window functions
- CTE (WITH queries)
- JSON support
- Full ACID compliance with InnoDB
- Better optimizer and query performance

**MongoDB NOT suitable:**
- ERP needs ACID transactions (inventory must be consistent)
- Relational data (products, invoices, clients are highly connected)
- No foreign key constraints (data integrity risk)

**Verdict:** MySQL 8+ is perfect for MVP with excellent performance and reliability.

---

## Development Tools

### Package Manager: pnpm

**Why pnpm (not npm/yarn):**
- **3x faster** than npm
- **Disk space efficient** (symlinks, not copies)
- **Monorepo support** (workspaces)
- **Strict** (prevents phantom dependencies)

**Installation:**
```bash
npm install -g pnpm
pnpm init
```

---

### Monorepo Structure: pnpm Workspaces

**Why Monorepo:**
- **Atomic commits** (frontend + backend changes together)
- **Shared types** (TypeScript interfaces)
- **Single repo** (easier CI/CD)

**Structure:**
```
hishamtraders/
├── apps/
│   ├── web/         # React frontend
│   └── api/         # Express backend
├── packages/
│   └── shared/      # Shared TypeScript types
├── prisma/          # Database schema
├── docs/            # Documentation
├── pnpm-workspace.yaml
└── package.json
```

---

### Code Quality: ESLint + Prettier

**ESLint:**
- Catches bugs and bad practices
- TypeScript rules
- React rules

**Prettier:**
- Consistent code formatting
- Auto-format on save

**Husky + lint-staged:**
- Pre-commit hooks
- Format and lint before commit

---

### Docker: Development Environment

**Why Docker:**
- **Consistent environment** (same on all machines)
- **Easy MySQL setup** (no manual install)
- **Isolated services**

**docker-compose.yml:**
```yaml
version: '3.8'
services:
  mysql:
    image: mysql:8
    ports:
      - '3306:3306'
    environment:
      MYSQL_ROOT_PASSWORD: password
      MYSQL_DATABASE: hisham_erp
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:
```

---

## Deployment Stack

### Hosting: DigitalOcean Droplet

**Why DigitalOcean (not AWS/Azure/Heroku):**
- **Affordable** ($12-24/month for 2GB RAM droplet)
- **Simple** (no complex billing, predictable costs)
- **Good performance** (SSD-backed)
- **1-click apps** (Docker, Node.js pre-installed)

**Droplet Specs (MVP):**
- **CPU:** 2 vCPUs
- **RAM:** 2 GB
- **Storage:** 50 GB SSD
- **Cost:** $18/month (Basic plan)

---

### Web Server: Nginx

**Why Nginx:**
- **Reverse proxy** (routes requests to Node.js)
- **SSL termination** (HTTPS)
- **Static file serving** (React build)
- **Fast and lightweight**

**Configuration:**
```nginx
server {
  listen 80;
  server_name erp.hishamtraders.com;

  # Serve React frontend
  location / {
    root /var/www/hishamtraders/web/dist;
    try_files $uri $uri/ /index.html;
  }

  # Proxy API requests to Node.js
  location /api {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

---

### Process Manager: PM2

**Why PM2:**
- **Auto-restart** on crash
- **Log management**
- **Cluster mode** (multiple Node.js instances)
- **Zero-downtime reload**

**Usage:**
```bash
pm2 start npm --name "hisham-api" -- start
pm2 startup
pm2 save
```

---

### SSL: Let's Encrypt (Free)

**Why Let's Encrypt:**
- **Free SSL certificates**
- **Auto-renewal** (every 90 days)
- **Trusted by browsers**

**Installation:**
```bash
sudo certbot --nginx -d erp.hishamtraders.com
```

---

## Cost Breakdown

### Development (One-time)

| Item | Cost |
|------|------|
| Domain name (.com) | $12/year |
| Development tools | $0 (all open-source) |

### Production (Monthly)

| Item | Cost |
|------|------|
| DigitalOcean Droplet (2GB) | $18/month |
| Database backup (DigitalOcean) | $2/month |
| SSL Certificate (Let's Encrypt) | $0 (free) |
| **Total** | **$20/month** |

### Comparison: Java Alternative

| Item | Cost |
|------|------|
| DigitalOcean Droplet (4GB, Java needs more RAM) | $42/month |
| Database backup | $2/month |
| **Total** | **$44/month** |

**Savings with Node.js:** $24/month = $288/year

---

## Performance Benchmarks

### API Response Times (Target)

- Simple queries (list products): < 100ms
- Complex queries (invoice with items): < 300ms
- Report generation (1000 rows): < 2 seconds
- Dashboard load: < 1 second

### Frontend Performance (Target)

- Initial page load: < 2 seconds
- Route transitions: < 500ms
- Form submissions: < 1 second
- Real-time updates (via polling): 5-second intervals

---

## Security Stack

| Layer | Technology |
|-------|-----------|
| HTTPS | Let's Encrypt SSL |
| Authentication | JWT (24-hour expiry) |
| Password Hashing | bcrypt (10 rounds) |
| SQL Injection Prevention | Prisma (parameterized queries) |
| XSS Prevention | React (escapes by default) |
| CORS | Express CORS middleware |
| Rate Limiting | express-rate-limit |
| Input Validation | Zod schemas |

---

## Related Documentation

- [Database Schema](./database-schema.md)
- [API Endpoints](./api-endpoints.md)
- [Source Tree Structure](./source-tree.md)
- [Audit Logging Architecture](./audit-logging.md)

---

**Last Updated:** 2025-01-15
**Status:** Approved for MVP
