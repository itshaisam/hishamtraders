# Hisham Traders ERP - Frontend Architecture Document

**Version:** 1.0
**Last Updated:** 2025-01-15
**Author:** Winston (Architect)

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-01-15 | 1.0 | Initial frontend architecture | Winston (Architect) |

---

## Table of Contents

1. [Template and Framework Selection](#template-and-framework-selection)
2. [Frontend Tech Stack](#frontend-tech-stack)
3. [Project Structure](#project-structure)
4. [Component Standards](#component-standards)
5. [State Management](#state-management)
6. [API Integration](#api-integration)
7. [Routing](#routing)
8. [Styling Guidelines](#styling-guidelines)
9. [Testing Requirements](#testing-requirements)
10. [Environment Configuration](#environment-configuration)
11. [Frontend Developer Standards](#frontend-developer-standards)

---

## Template and Framework Selection

This is a **greenfield project** using **Vite + React + TypeScript** starter.

**Selected Framework:** React 18
**Build Tool:** Vite
**Language:** TypeScript 5.3+
**Styling:** Tailwind CSS v3
**State Management:** TanStack Query v5 (server state) + Zustand (client state)
**Routing:** React Router v6
**Forms:** React Hook Form + Zod
**Icons:** Lucide React

**Rationale:**
- **Vite** chosen for 10-100x faster dev server compared to Create React App
- **React 18** provides component-based architecture with huge ecosystem
- **TypeScript** ensures type safety and prevents runtime errors
- **Tailwind CSS** offers utility-first approach with smaller bundle sizes
- **TanStack Query + Zustand** combination handles server and client state optimally

---

## Frontend Tech Stack

| Category | Technology | Version | Purpose | Rationale |
|----------|-----------|---------|---------|-----------|
| Framework | React | 18.2+ | UI library | Most popular, component-based, strong TypeScript support |
| Language | TypeScript | 5.3+ | Type safety | Prevents runtime errors, better IDE support, shared types with backend |
| Build Tool | Vite | Latest | Fast dev server + builds | 10-100x faster than CRA, HMR <50ms, optimized production builds |
| Styling | Tailwind CSS | v3 | Utility-first CSS | Smaller bundle, highly customizable, responsive by default |
| Icons | Lucide React | Latest | Icon library | Modern, tree-shakeable, 1000+ icons, MIT license |
| State (Server) | TanStack Query | v5 | API data fetching/caching | Automatic refetching, optimistic updates, cache invalidation |
| State (Client) | Zustand | Latest | Lightweight state management | 1KB gzipped, no boilerplate, TypeScript-first |
| Forms | React Hook Form + Zod | Latest | Form handling + validation | Minimal re-renders, schema validation shared with backend |
| Tables | TanStack Table | v8 | Data tables | Headless UI, sorting/filtering/pagination, virtualization |
| Charts | Recharts | Latest | Data visualization | React-native, responsive, 10+ chart types |
| Routing | React Router | v6 | Client-side routing | De facto standard, nested routes, protected routes |
| HTTP Client | Axios | Latest | API requests | Automatic JSON transformation, interceptors for auth |
| Date Handling | date-fns | Latest | Date utilities | Lightweight (11KB vs moment 230KB), tree-shakeable |
| Notifications | react-hot-toast | Latest | Toast notifications | Beautiful defaults, promise-based API, customizable |

---

## Project Structure

```
hishamtraders/
├── apps/
│   ├── web/                          # React frontend application
│   │   ├── public/                   # Static assets
│   │   │   ├── favicon.ico
│   │   │   └── logo.png
│   │   ├── src/
│   │   │   ├── components/           # Shared/reusable components
│   │   │   │   ├── ui/              # Base UI components (Button, Input, Modal, etc.)
│   │   │   │   │   ├── Button.tsx
│   │   │   │   │   ├── Input.tsx
│   │   │   │   │   ├── Select.tsx
│   │   │   │   │   ├── Modal.tsx
│   │   │   │   │   ├── Table.tsx
│   │   │   │   │   ├── Card.tsx
│   │   │   │   │   ├── Badge.tsx
│   │   │   │   │   ├── Alert.tsx
│   │   │   │   │   ├── Spinner.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   └── layout/          # Layout components
│   │   │   │       ├── DashboardLayout.tsx
│   │   │   │       ├── Sidebar.tsx
│   │   │   │       ├── Header.tsx
│   │   │   │       ├── ProtectedRoute.tsx
│   │   │   │       ├── RoleGuard.tsx
│   │   │   │       └── index.ts
│   │   │   ├── features/            # Feature modules (domain-driven)
│   │   │   │   ├── auth/            # Authentication feature
│   │   │   │   │   ├── components/
│   │   │   │   │   │   ├── LoginForm.tsx
│   │   │   │   │   │   └── LoginForm.test.tsx
│   │   │   │   │   ├── hooks/
│   │   │   │   │   │   └── useAuth.ts
│   │   │   │   │   ├── services/
│   │   │   │   │   │   └── authService.ts
│   │   │   │   │   ├── store/
│   │   │   │   │   │   └── authStore.ts
│   │   │   │   │   ├── types/
│   │   │   │   │   │   └── auth.types.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── dashboard/       # Dashboard feature (role-specific)
│   │   │   │   │   ├── components/
│   │   │   │   │   │   ├── AdminDashboard.tsx        # Admin sees all metrics + tabs
│   │   │   │   │   │   ├── WarehouseDashboard.tsx    # Warehouse Manager view
│   │   │   │   │   │   ├── SalesDashboard.tsx        # Sales Officer view
│   │   │   │   │   │   ├── AccountantDashboard.tsx   # Accountant view
│   │   │   │   │   │   ├── RecoveryDashboard.tsx     # Recovery Agent view
│   │   │   │   │   │   ├── DashboardRouter.tsx       # Routes to correct dashboard by role
│   │   │   │   │   │   └── widgets/                  # Shared dashboard widgets
│   │   │   │   │   │       ├── StatsCard.tsx
│   │   │   │   │   │       ├── RecentActivityWidget.tsx
│   │   │   │   │   │       ├── ChartWidget.tsx
│   │   │   │   │   │       └── QuickActionsWidget.tsx
│   │   │   │   │   ├── hooks/
│   │   │   │   │   │   ├── useDashboardData.ts       # Fetches role-specific data
│   │   │   │   │   │   └── useAdminDashboards.ts     # Admin viewing all dashboards
│   │   │   │   │   ├── services/
│   │   │   │   │   │   └── dashboardService.ts
│   │   │   │   │   ├── types/
│   │   │   │   │   │   └── dashboard.types.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── products/        # Product management
│   │   │   │   ├── inventory/       # Inventory tracking
│   │   │   │   ├── suppliers/       # Supplier management
│   │   │   │   ├── purchase-orders/ # Purchase orders
│   │   │   │   ├── clients/         # Client management
│   │   │   │   ├── invoices/        # Sales invoices
│   │   │   │   ├── payments/        # Payment tracking
│   │   │   │   ├── reports/         # Reports and analytics
│   │   │   │   ├── users/           # User management
│   │   │   │   └── audit-logs/      # Audit trail viewer
│   │   │   ├── hooks/               # Global custom hooks
│   │   │   │   ├── useApi.ts
│   │   │   │   ├── useDebounce.ts
│   │   │   │   ├── usePermissions.ts
│   │   │   │   └── useAppNavigation.ts
│   │   │   ├── lib/                 # Third-party library configurations
│   │   │   │   ├── axios.ts         # Axios instance config
│   │   │   │   ├── queryClient.ts   # TanStack Query config
│   │   │   │   └── router.tsx       # React Router config
│   │   │   ├── pages/               # Route-level page components
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   ├── DashboardPage.tsx
│   │   │   │   ├── ProductsPage.tsx
│   │   │   │   ├── InvoicesPage.tsx
│   │   │   │   ├── NotFoundPage.tsx
│   │   │   │   └── index.ts
│   │   │   ├── stores/              # Global Zustand stores
│   │   │   │   ├── uiStore.ts       # UI state (sidebar, modals)
│   │   │   │   └── preferencesStore.ts
│   │   │   ├── styles/              # Global styles
│   │   │   │   ├── globals.css      # Tailwind directives + global styles
│   │   │   │   └── theme.css        # CSS custom properties (theme variables)
│   │   │   ├── test/                # Test utilities
│   │   │   │   └── setup.ts         # Test setup file
│   │   │   ├── types/               # Global TypeScript types
│   │   │   │   ├── api.types.ts
│   │   │   │   └── common.types.ts
│   │   │   ├── utils/               # Utility functions
│   │   │   │   ├── cn.ts            # Class name utility
│   │   │   │   ├── env.ts           # Environment config helper
│   │   │   │   ├── formatters.ts    # Date, currency formatters
│   │   │   │   ├── validators.ts    # Custom validators
│   │   │   │   └── constants.ts     # App constants
│   │   │   ├── App.tsx              # Root App component
│   │   │   ├── main.tsx             # App entry point
│   │   │   └── vite-env.d.ts        # Vite type declarations
│   │   ├── .env.example             # Environment variables template
│   │   ├── .eslintrc.cjs            # ESLint configuration
│   │   ├── .prettierrc              # Prettier configuration
│   │   ├── index.html               # HTML entry point
│   │   ├── package.json             # Dependencies
│   │   ├── postcss.config.js        # PostCSS config (for Tailwind)
│   │   ├── tailwind.config.js       # Tailwind configuration
│   │   ├── tsconfig.json            # TypeScript config
│   │   ├── vitest.config.ts         # Vitest test configuration
│   │   └── vite.config.ts           # Vite configuration
│   └── api/                         # Express backend (separate)
├── packages/
│   └── shared/                      # Shared types between frontend/backend
│       ├── src/
│       │   ├── types/
│       │   │   └── index.ts
│       │   └── schemas/             # Zod schemas
│       │       └── index.ts
│       └── package.json
├── pnpm-workspace.yaml              # pnpm workspace config
└── package.json                     # Root package.json
```

**Key Structure Decisions:**
- **Feature-based organization** (`features/`) scales better than type-based for large apps
- **Role-specific dashboards** in `features/dashboard/components/` with separate components for each role
- **Colocated tests** (`.test.tsx` files next to components) for easier maintenance
- **Clear separation** of concerns: components, hooks, services, types, utils

---

## Component Standards

### Component Template

```typescript
import { FC } from 'react';

/**
 * Props for the ExampleComponent
 */
interface ExampleComponentProps {
  /** The title to display */
  title: string;
  /** Optional description text */
  description?: string;
  /** Click handler for the action button */
  onAction?: () => void;
  /** Whether the component is in loading state */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * ExampleComponent - Brief description of what this component does
 *
 * @example
 * ```tsx
 * <ExampleComponent
 *   title="Hello World"
 *   description="This is a demo"
 *   onAction={() => console.log('clicked')}
 * />
 * ```
 */
export const ExampleComponent: FC<ExampleComponentProps> = ({
  title,
  description,
  onAction,
  isLoading = false,
  className = '',
}) => {
  // Early return for loading state
  if (isLoading) {
    return <div className="animate-spin">Loading...</div>;
  }

  return (
    <div className={`p-4 border rounded-lg ${className}`}>
      <h2 className="text-xl font-bold">{title}</h2>
      {description && (
        <p className="mt-2 text-gray-600">{description}</p>
      )}
      {onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Take Action
        </button>
      )}
    </div>
  );
};
```

### Naming Conventions

**Files:**
- **Components**: PascalCase with `.tsx` extension
  Example: `ProductCard.tsx`, `InvoiceTable.tsx`
- **Hooks**: camelCase starting with `use`, `.ts` extension
  Example: `useAuth.ts`, `useProducts.ts`
- **Services**: camelCase with `Service` suffix, `.ts` extension
  Example: `authService.ts`, `productService.ts`
- **Types**: camelCase with `.types.ts` extension
  Example: `product.types.ts`, `invoice.types.ts`
- **Utils**: camelCase, `.ts` extension
  Example: `formatters.ts`, `validators.ts`
- **Stores (Zustand)**: camelCase with `Store` suffix, `.ts` extension
  Example: `authStore.ts`, `uiStore.ts`
- **Tests**: Same name as file with `.test.tsx` or `.test.ts`
  Example: `ProductCard.test.tsx`

**Components:**
- **PascalCase** for component names
- **Descriptive and specific**: `ProductListTable` not `Table`
- **Prefixes for variations**: `MobileProductCard`, `DesktopProductCard`

**Props Interfaces:**
- Component name + `Props` suffix
  Example: `ProductCardProps`, `InvoiceTableProps`

**Event Handlers:**
- Prefix with `on` for props: `onClick`, `onSubmit`, `onProductSelect`
- Prefix with `handle` for internal handlers: `handleClick`, `handleSubmit`

**Boolean Props:**
- Prefix with `is`, `has`, `should`, `can`
  Example: `isLoading`, `hasError`, `shouldShowModal`, `canEdit`

**State Variables:**
- camelCase, descriptive
  Example: `products`, `isModalOpen`, `selectedProduct`

**Constants:**
- SCREAMING_SNAKE_CASE for true constants
  Example: `API_BASE_URL`, `MAX_ITEMS_PER_PAGE`
- camelCase for configuration objects
  Example: `productStatusOptions`, `rolePermissions`

---

## State Management

We use a **hybrid state management approach**:
- **TanStack Query (React Query v5)** for **server state** (API data, caching, synchronization)
- **Zustand** for **client state** (UI state, auth context, preferences)

### Store Structure

```
src/
├── features/
│   ├── auth/
│   │   └── store/
│   │       └── authStore.ts          # Auth state (user, token)
│   ├── products/
│   │   ├── hooks/
│   │   │   ├── useProducts.ts        # TanStack Query hook
│   │   │   └── useProductMutations.ts
│   │   └── services/
│   │       └── productService.ts     # API calls
├── lib/
│   └── queryClient.ts                # TanStack Query config
└── stores/                           # Global Zustand stores
    ├── uiStore.ts                    # UI state (sidebar, modals)
    └── preferencesStore.ts           # User preferences
```

### Zustand Store Template (Client State)

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Auth Store State
 */
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

/**
 * Auth Store Actions
 */
interface AuthActions {
  setUser: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

/**
 * Complete Auth Store Type
 */
type AuthStore = AuthState & AuthActions;

/**
 * Initial state
 */
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
};

/**
 * Auth Store (persisted to localStorage)
 */
export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      ...initialState,

      setUser: (user, token) =>
        set({
          user,
          token,
          isAuthenticated: true,
        }),

      logout: () =>
        set(initialState),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: 'auth-storage', // localStorage key
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
```

### TanStack Query Hook Template (Server State)

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '../services/productService';
import { Product, CreateProductDto, UpdateProductDto } from '../types/product.types';
import toast from 'react-hot-toast';

/**
 * Query Keys (for cache management)
 */
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters: string) => [...productKeys.lists(), { filters }] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
};

/**
 * Fetch all products
 */
export const useProducts = (filters?: Record<string, any>) => {
  return useQuery({
    queryKey: productKeys.list(JSON.stringify(filters)),
    queryFn: () => productService.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Create product mutation
 */
export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProductDto) => productService.create(data),
    onSuccess: (newProduct) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      toast.success('Product created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create product');
    },
  });
};
```

### TanStack Query Configuration

```typescript
import { QueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute default
      retry: 1,
      refetchOnWindowFocus: false,
      onError: (error: any) => {
        if (error.response?.status === 401) {
          window.location.href = '/login';
        }
      },
    },
    mutations: {
      retry: 0,
    },
  },
});
```

---

## API Integration

### API Service Template

```typescript
import { apiClient } from '@/lib/axios';
import { Product, CreateProductDto, UpdateProductDto } from '../types/product.types';

/**
 * Product Service
 * Handles all product-related API calls
 */
export const productService = {
  /**
   * Get all products with optional filters
   */
  getAll: async (filters?: Record<string, any>): Promise<Product[]> => {
    const response = await apiClient.get('/products', { params: filters });
    return response.data;
  },

  /**
   * Get single product by ID
   */
  getById: async (id: string): Promise<Product> => {
    const response = await apiClient.get(`/products/${id}`);
    return response.data;
  },

  /**
   * Create new product
   */
  create: async (data: CreateProductDto): Promise<Product> => {
    const response = await apiClient.post('/products', data);
    return response.data;
  },

  /**
   * Update existing product
   */
  update: async (id: string, data: UpdateProductDto): Promise<Product> => {
    const response = await apiClient.put(`/products/${id}`, data);
    return response.data;
  },

  /**
   * Delete product (soft delete)
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/products/${id}`);
  },
};
```

### API Client Configuration

```typescript
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/features/auth/store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor - Add JWT token
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

/**
 * Response Interceptor - Handle errors globally
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          toast.error('Session expired. Please log in again.');
          useAuthStore.getState().logout();
          window.location.href = '/login';
          break;
        case 403:
          toast.error('Access denied. You do not have permission for this action.');
          break;
        case 404:
          toast.error(data.message || 'Resource not found');
          break;
        case 422:
          toast.error(data.message || 'Validation failed');
          break;
        case 500:
          toast.error('Server error. Please try again later.');
          break;
        default:
          toast.error(data.message || 'An error occurred');
      }
    } else if (error.request) {
      toast.error('Network error. Please check your connection.');
    }

    return Promise.reject(error);
  }
);
```

---

## Routing

### Route Configuration

See `lib/router.tsx` for complete routing setup with:
- Protected routes (require authentication)
- Role-based access control (RoleGuard)
- Lazy loading for code splitting
- Nested layouts

**Key Routes:**
- `/` - Dashboard (role-specific via DashboardRouter)
- `/products` - Product management
- `/inventory` - Inventory tracking
- `/invoices` - Sales invoices
- `/payments` - Payment tracking
- `/users` - User management (Admin only)
- `/audit-logs` - Audit logs (Admin only)

### Protected Route Component

```typescript
import { FC, ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/authStore';

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute: FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
```

### Role Guard Component

```typescript
import { FC, ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/authStore';
import { Alert } from '@/components/ui/Alert';

type UserRole = 'ADMIN' | 'WAREHOUSE_MANAGER' | 'SALES_OFFICER' | 'ACCOUNTANT' | 'RECOVERY_AGENT';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: ReactNode;
}

export const RoleGuard: FC<RoleGuardProps> = ({ allowedRoles, children }) => {
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const hasPermission = allowedRoles.includes(user.role as UserRole);

  if (!hasPermission) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Alert variant="error">
          <h2 className="text-lg font-semibold">Access Denied</h2>
          <p>You do not have permission to access this page.</p>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
};
```

---

## Styling Guidelines

### Tailwind Configuration

See `tailwind.config.js` for complete configuration including:
- Custom colors (primary, success, warning, danger)
- Font families
- Box shadows
- Border radius
- Responsive breakpoints

### Global Theme Variables

CSS custom properties defined in `styles/theme.css` for:
- Colors (with dark mode support for Phase 2)
- Spacing
- Typography
- Shadows
- Border radius
- Transitions

### Class Name Utility

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with conflict resolution
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Usage:**
```typescript
import { cn } from '@/utils/cn';

<button
  className={cn(
    'px-4 py-2 rounded-lg',
    variant === 'primary' && 'bg-blue-500',
    className
  )}
/>
```

### Responsive Design

Tailwind's mobile-first breakpoints:
- `sm:` 640px (Small tablets)
- `md:` 768px (Tablets)
- `lg:` 1024px (Laptops)
- `xl:` 1280px (Desktops)
- `2xl:` 1536px (Large desktops)

---

## Testing Requirements

### Testing Stack

- **Vitest** - Fast, Vite-native test runner
- **React Testing Library** - User-centric component testing
- **MSW (Mock Service Worker)** - API mocking
- **@testing-library/user-event** - User interaction simulation

### Component Test Template

See detailed test examples in the full document including:
- Component rendering tests
- User interaction tests
- API service tests
- Hook tests

### Testing Best Practices

1. **Unit Tests**: Test individual components in isolation
2. **Integration Tests**: Test component interactions
3. **E2E Tests**: Test critical user flows (Phase 2)
4. **Coverage Goals**: 80% code coverage (Phase 2)
5. **Test Structure**: Arrange-Act-Assert pattern
6. **Mock Dependencies**: API calls, routing, state

---

## Environment Configuration

### Environment Files

- `.env.example` - Template (committed to git)
- `.env.local` - Local overrides (git-ignored)
- `.env.development` - Development (git-ignored)
- `.env.production` - Production (git-ignored)

### Required Environment Variables

```bash
# API Configuration
VITE_API_URL=http://localhost:3001/api/v1

# Application Metadata
VITE_APP_NAME=Hisham Traders ERP
VITE_APP_VERSION=1.0.0

# Feature Flags
VITE_ENABLE_AUDIT_LOGS=true
VITE_ENABLE_DARK_MODE=false

# Environment
VITE_ENV=development
```

### Type-Safe Environment Access

```typescript
// utils/env.ts
export const config = {
  apiUrl: getEnv('VITE_API_URL'),
  appName: getEnv('VITE_APP_NAME'),
  features: {
    auditLogs: getBooleanEnv('VITE_ENABLE_AUDIT_LOGS', true),
    darkMode: getBooleanEnv('VITE_ENABLE_DARK_MODE', false),
  },
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
} as const;
```

**Security Note:** Never store sensitive data (API keys, secrets) in frontend environment variables. All sensitive data belongs in backend configuration only.

---

## Frontend Developer Standards

### Critical Coding Rules

**✅ DO:**
- Use named exports for components
- Define explicit props interfaces
- Use TanStack Query for server data
- Use Zustand for client state
- Use React Hook Form + Zod for forms
- Sanitize user input
- Use role-based guards
- Lazy load routes
- Add TypeScript types for everything

**❌ DON'T:**
- Use default exports
- Use `any` type
- Store server data in Zustand
- Fetch data manually in useEffect
- Use uncontrolled forms without validation
- Store passwords in localStorage
- Use `eval()` or `dangerouslySetInnerHTML` with user input
- Create functions inside render
- Ignore TypeScript errors with `@ts-ignore`

### Quick Reference

**Common Commands:**
```bash
pnpm dev              # Start development server
pnpm type-check       # Run type checking
pnpm lint             # Run linting
pnpm test             # Run tests
pnpm build            # Build for production
```

**Key Import Patterns:**
```typescript
// Components
import { Button } from '@/components/ui/Button';

// Hooks
import { useProducts } from '@/features/products/hooks/useProducts';

// Services
import { productService } from '@/features/products/services/productService';

// Utils
import { cn } from '@/utils/cn';
import { config } from '@/utils/env';

// Types
import { Product } from '@/features/products/types/product.types';
```

**File Naming:**
- `ProductCard.tsx` (Component - PascalCase)
- `useProducts.ts` (Hook - camelCase with 'use')
- `productService.ts` (Service - camelCase with 'Service')
- `product.types.ts` (Types - camelCase with '.types')

---

**Document Version:** 1.0
**Last Updated:** 2025-01-15
**Status:** Approved for Development
