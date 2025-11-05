# Hisham Traders ERP - Coding Standards

**Version:** 1.0
**Last Updated:** 2025-01-15
**Status:** Approved

---

## Table of Contents

1. [General Principles](#general-principles)
2. [TypeScript Standards](#typescript-standards)
3. [React Standards](#react-standards)
4. [Node.js/Express Backend Standards](#nodejsexpress-backend-standards)
5. [Naming Conventions](#naming-conventions)
6. [File Structure & Organization](#file-structure--organization)
7. [Code Formatting](#code-formatting)
8. [Testing Standards](#testing-standards)
9. [Git Commit Standards](#git-commit-standards)
10. [Code Review Checklist](#code-review-checklist)

---

## General Principles

### Core Values

1. **Readability > Cleverness** - Code is read 10x more than written
2. **Type Safety First** - Leverage TypeScript to catch errors at compile time
3. **DRY (Don't Repeat Yourself)** - Extract reusable logic
4. **KISS (Keep It Simple, Stupid)** - Simple solutions over complex ones
5. **YAGNI (You Aren't Gonna Need It)** - Don't build features you don't need yet
6. **Fail Fast** - Validate early, throw errors early
7. **Consistency** - Follow established patterns in the codebase

### Code Quality Standards

- **No `any` types** - Use `unknown` or specific types
- **No `console.log`** - Use Winston logger
- **No magic numbers** - Use named constants
- **No dead code** - Remove unused imports/variables/functions
- **No commented code** - Delete it (git history preserves it)
- **Max function length: 50 lines** - Extract smaller functions
- **Max file length: 300 lines** - Split into multiple files
- **Max cyclomatic complexity: 10** - Simplify complex logic

---

## TypeScript Standards

### Type Definitions

**DO:**
```typescript
// Use interfaces for object shapes
interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

// Use type aliases for unions/intersections
type UserRole = 'admin' | 'warehouse_manager' | 'sales_officer' | 'accountant' | 'recovery_agent';

// Use enums for fixed sets of constants
enum InvoiceStatus {
  DRAFT = 'draft',
  ISSUED = 'issued',
  PAID = 'paid',
  VOID = 'void'
}

// Export types from dedicated files
export type { User, UserRole };
export { InvoiceStatus };
```

**DON'T:**
```typescript
// ❌ Don't use any
function processData(data: any) { }

// ❌ Don't use implicit any
function processData(data) { }  // data: any inferred

// ❌ Don't use object
function processData(data: object) { }  // Too generic

// ✅ DO use specific types or unknown
function processData(data: User) { }
function processData(data: unknown) {
  if (isUser(data)) {
    // Type guard
  }
}
```

### Null Safety

```typescript
// Use optional chaining
const userName = user?.profile?.name;

// Use nullish coalescing
const displayName = user?.name ?? 'Anonymous';

// Avoid loose equality
if (value === null || value === undefined) { }  // ✅
if (value == null) { }  // ❌ Don't use ==

// Type guard for null checks
function isNotNull<T>(value: T | null): value is T {
  return value !== null;
}

const validUsers = users.filter(isNotNull);
```

### Function Types

```typescript
// Use explicit return types for public APIs
function calculateTotal(items: InvoiceItem[]): number {
  return items.reduce((sum, item) => sum + item.total, 0);
}

// Use async/await for promises
async function fetchUser(id: string): Promise<User> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new Error('User not found');
  return user;
}

// Use arrow functions for callbacks
items.map(item => item.total);
items.filter(item => item.quantity > 0);
```

### Generics

```typescript
// Use generics for reusable functions
function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

// Use constraints for type safety
function findById<T extends { id: string }>(items: T[], id: string): T | undefined {
  return items.find(item => item.id === id);
}
```

---

## React Standards

### Component Structure

**Functional Components Only:**
```typescript
// ✅ Use function declarations for named components
function ProductList({ products }: ProductListProps) {
  return (
    <div>
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

// ✅ Define props interface above component
interface ProductListProps {
  products: Product[];
  onSelectProduct?: (product: Product) => void;
}

// ❌ Don't use default exports for components
export default ProductList;  // ❌

// ✅ Use named exports
export { ProductList };  // ✅
```

### Hooks Best Practices

```typescript
function ProductForm({ productId }: ProductFormProps) {
  // 1. Hooks at top level (no conditionals)
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 2. useEffect with dependencies
  useEffect(() => {
    if (productId) {
      fetchProduct(productId);
    }
  }, [productId]);  // ✅ Include all dependencies

  // 3. Custom hooks for reusable logic
  const { data, isLoading } = useProducts();

  // 4. useMemo for expensive calculations
  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.price, 0),
    [items]
  );

  // 5. useCallback for event handlers passed to children
  const handleSubmit = useCallback((data: ProductFormData) => {
    saveProduct(data);
  }, [saveProduct]);

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Component Naming

```typescript
// ✅ PascalCase for components
export function ProductList() { }
export function UserDashboard() { }

// ✅ Prefix boolean props with is/has/should
interface ProductCardProps {
  isSelected: boolean;
  hasDiscount: boolean;
  shouldShowPrice: boolean;
}

// ✅ Use "handle" prefix for event handlers
function ProductForm() {
  const handleSubmit = () => { };
  const handleCancel = () => { };
  const handleChange = () => { };
}

// ✅ Use "on" prefix for callback props
interface ProductCardProps {
  onSelect: (product: Product) => void;
  onDelete: (id: string) => void;
}
```

### State Management

```typescript
// ✅ Use TanStack Query for server state
const { data: products, isLoading } = useQuery({
  queryKey: ['products', filters],
  queryFn: () => fetchProducts(filters),
});

// ✅ Use Zustand for client state
const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  login: (user, token) => set({ user, token }),
  logout: () => set({ user: null, token: null }),
}));

// ❌ Don't use useState for server data
const [products, setProducts] = useState([]);  // ❌
useEffect(() => {
  fetch('/api/products').then(res => setProducts(res.data));
}, []);
```

### Conditional Rendering

```typescript
// ✅ Use && for simple conditionals
{isLoading && <Spinner />}

// ✅ Use ternary for if-else
{isLoading ? <Spinner /> : <ProductList products={products} />}

// ✅ Use early returns for complex logic
function ProductCard({ product }: ProductCardProps) {
  if (!product) return null;
  if (product.isDeleted) return <DeletedProductMessage />;

  return <div>...</div>;
}

// ❌ Don't use if statements in JSX
{if (isLoading) { return <Spinner />; }}  // ❌
```

---

## Node.js/Express Backend Standards

### Project Structure (Modules)

```typescript
// apps/api/src/modules/products/

// 1. products.routes.ts - Define routes
import { Router } from 'express';
import { ProductController } from './products.controller';

const router = Router();
const controller = new ProductController();

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

export { router as productRoutes };

// 2. products.controller.ts - Handle HTTP requests/responses
export class ProductController {
  constructor(private service = new ProductService()) {}

  getAll = async (req: Request, res: Response) => {
    try {
      const products = await this.service.getAll();
      res.json({ data: products });
    } catch (error) {
      next(error);  // Pass to error middleware
    }
  };
}

// 3. products.service.ts - Business logic
export class ProductService {
  constructor(private repository = new ProductRepository()) {}

  async getAll(): Promise<Product[]> {
    return this.repository.findAll();
  }

  async create(data: CreateProductDto): Promise<Product> {
    // Validate business rules
    if (data.price <= 0) {
      throw new BadRequestError('Price must be positive');
    }
    return this.repository.create(data);
  }
}

// 4. products.repository.ts - Database access
export class ProductRepository {
  async findAll(): Promise<Product[]> {
    return prisma.product.findMany();
  }

  async create(data: CreateProductData): Promise<Product> {
    return prisma.product.create({ data });
  }
}
```

### Error Handling

```typescript
// Define custom error classes
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404);
  }
}

// Throw specific errors in services
async function getProductById(id: string): Promise<Product> {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    throw new NotFoundError(`Product ${id} not found`);
  }
  return product;
}

// Global error middleware catches all
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
  }

  // Log unexpected errors
  logger.error('Unexpected error', { error: err });

  return res.status(500).json({
    status: 'error',
    message: 'Internal server error',
  });
});
```

### Validation with Zod

```typescript
// dto/create-product.dto.ts
import { z } from 'zod';

export const createProductSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(3, 'Name must be at least 3 characters'),
  price: z.number().positive('Price must be positive'),
  stock: z.number().int().nonnegative('Stock cannot be negative'),
  categoryId: z.string().uuid('Invalid category ID'),
});

export type CreateProductDto = z.infer<typeof createProductSchema>;

// Validation middleware
export function validate(schema: z.ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          status: 'error',
          errors: error.errors,
        });
      }
      next(error);
    }
  };
}

// Use in routes
router.post('/', validate(createProductSchema), controller.create);
```

### Async/Await

```typescript
// ✅ Always use async/await (no callbacks)
async function getUser(id: string): Promise<User> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundError('User not found');
  return user;
}

// ✅ Use Promise.all for parallel operations
async function getInvoiceWithDetails(id: string) {
  const [invoice, items, client] = await Promise.all([
    prisma.invoice.findUnique({ where: { id } }),
    prisma.invoiceItem.findMany({ where: { invoiceId: id } }),
    prisma.client.findUnique({ where: { id } }),
  ]);

  return { invoice, items, client };
}

// ❌ Don't use callbacks
fs.readFile('file.txt', (err, data) => { });  // ❌

// ✅ Use fs.promises
import { readFile } from 'fs/promises';
const data = await readFile('file.txt', 'utf-8');
```

---

## Naming Conventions

### Variables & Functions

```typescript
// camelCase for variables and functions
const userName = 'John';
const productCount = 10;
function calculateTotal() { }
function getUserById() { }

// UPPER_SNAKE_CASE for constants
const MAX_ITEMS_PER_PAGE = 50;
const API_BASE_URL = 'https://api.example.com';
const DEFAULT_TIMEOUT = 5000;

// Boolean variables: is/has/should prefix
const isActive = true;
const hasPermission = false;
const shouldValidate = true;

// Arrays: plural nouns
const products = [];
const users = [];
const invoiceItems = [];

// Functions: verb + noun
function createInvoice() { }
function updateProduct() { }
function deleteUser() { }
function fetchProducts() { }
function calculateTotal() { }
```

### Classes & Interfaces

```typescript
// PascalCase for classes and interfaces
class ProductService { }
interface UserRepository { }
type ProductStatus = 'active' | 'inactive';

// Interface naming (no "I" prefix)
interface Product { }  // ✅
interface IProduct { }  // ❌

// DTO naming
interface CreateProductDto { }
interface UpdateUserDto { }

// Props naming (React)
interface ProductCardProps { }
interface UserDashboardProps { }
```

### Files & Folders

```typescript
// kebab-case for files
product-service.ts
user-repository.ts
create-invoice.dto.ts

// Match file name to main export
// product-service.ts
export class ProductService { }

// PascalCase for React components
ProductCard.tsx
UserDashboard.tsx
InvoiceForm.tsx

// Folders: lowercase, plural
products/
users/
invoices/
components/
utils/
```

---

## File Structure & Organization

### Frontend (React)

```
apps/web/src/
├── components/           # Shared components
│   ├── ui/              # Base UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── Table.tsx
│   ├── layout/          # Layout components
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── Footer.tsx
│   └── common/          # Common components
│       ├── ErrorBoundary.tsx
│       ├── LoadingSpinner.tsx
│       └── NotFound.tsx
├── features/            # Feature modules
│   ├── products/
│   │   ├── components/
│   │   │   ├── ProductList.tsx
│   │   │   ├── ProductCard.tsx
│   │   │   └── ProductForm.tsx
│   │   ├── hooks/
│   │   │   ├── useProducts.ts
│   │   │   └── useProductMutations.ts
│   │   ├── api/
│   │   │   └── products-api.ts
│   │   └── types/
│   │       └── product.types.ts
│   ├── invoices/
│   └── users/
├── lib/                 # Third-party integrations
│   ├── api-client.ts   # Axios configuration
│   ├── query-client.ts # TanStack Query config
│   └── auth.ts         # Auth utilities
├── hooks/              # Shared hooks
│   ├── useAuth.ts
│   ├── useDebounce.ts
│   └── useLocalStorage.ts
├── store/              # Zustand stores
│   ├── auth-store.ts
│   └── ui-store.ts
├── utils/              # Utility functions
│   ├── format.ts
│   ├── validation.ts
│   └── date.ts
├── types/              # Shared types
│   ├── api.types.ts
│   └── common.types.ts
├── App.tsx
└── main.tsx
```

### Backend (Express)

```
apps/api/src/
├── config/              # Configuration
│   ├── database.ts
│   ├── auth.ts
│   ├── logger.ts
│   └── env.ts
├── middleware/          # Express middleware
│   ├── auth.middleware.ts
│   ├── authorization.middleware.ts
│   ├── audit.middleware.ts
│   ├── validation.middleware.ts
│   └── error.middleware.ts
├── modules/             # Feature modules
│   ├── products/
│   │   ├── products.controller.ts
│   │   ├── products.service.ts
│   │   ├── products.repository.ts
│   │   ├── products.routes.ts
│   │   ├── dto/
│   │   │   ├── create-product.dto.ts
│   │   │   └── update-product.dto.ts
│   │   └── products.test.ts
│   ├── invoices/
│   └── users/
├── shared/              # Shared utilities
│   ├── errors/
│   │   ├── app-error.ts
│   │   ├── bad-request.error.ts
│   │   └── not-found.error.ts
│   ├── types/
│   │   └── express.types.ts
│   └── utils/
│       ├── pagination.ts
│       └── date.ts
├── app.ts              # Express app setup
└── server.ts           # Server entry point
```

---

## Code Formatting

### Prettier Configuration

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

### ESLint Configuration

```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off"
  }
}
```

### Line Length & Formatting

```typescript
// ✅ Max line length: 100 characters
const longVariableName = 'This is a reasonably long string that fits within 100 characters';

// ✅ Break long function calls
const result = await prisma.product.findMany({
  where: { categoryId },
  include: { category: true },
  orderBy: { createdAt: 'desc' },
  take: 10,
});

// ✅ Break long arrays
const colors = [
  'red',
  'blue',
  'green',
  'yellow',
];
```

---

## Testing Standards

### Unit Tests

```typescript
// products.service.test.ts
describe('ProductService', () => {
  let service: ProductService;
  let repository: jest.Mocked<ProductRepository>;

  beforeEach(() => {
    repository = {
      findAll: jest.fn(),
      create: jest.fn(),
    } as any;
    service = new ProductService(repository);
  });

  describe('getAll', () => {
    it('should return all products', async () => {
      const mockProducts = [{ id: '1', name: 'Test' }];
      repository.findAll.mockResolvedValue(mockProducts);

      const result = await service.getAll();

      expect(result).toEqual(mockProducts);
      expect(repository.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('create', () => {
    it('should throw error for negative price', async () => {
      const invalidProduct = { name: 'Test', price: -10 };

      await expect(service.create(invalidProduct)).rejects.toThrow(
        'Price must be positive'
      );
    });
  });
});
```

### Test Naming

```typescript
// Pattern: should [expected behavior] when [condition]
it('should return 404 when product not found', async () => { });
it('should create product when valid data provided', async () => { });
it('should throw error when price is negative', async () => { });

// Use describe blocks for grouping
describe('ProductService', () => {
  describe('getAll', () => { });
  describe('create', () => { });
  describe('update', () => { });
});
```

---

## Git Commit Standards

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation only
- **style**: Formatting, missing semicolons, etc.
- **refactor**: Code change that neither fixes a bug nor adds a feature
- **perf**: Performance improvement
- **test**: Adding or updating tests
- **chore**: Maintenance tasks, dependencies

### Examples

```bash
feat(products): add product search functionality

- Implement search by SKU and name
- Add debouncing for search input
- Update ProductList component

Closes #123

---

fix(invoices): correct total calculation for discounts

The discount was being applied twice in the calculation.
Now it correctly subtracts discount only once.

Fixes #456

---

refactor(auth): simplify JWT token generation

Extract token creation logic to separate utility function
for better reusability.

---

docs(readme): update installation instructions

Add steps for Docker setup and MySQL configuration.
```

### Commit Best Practices

- **One commit = one logical change**
- **Write in imperative mood** ("add feature" not "added feature")
- **Keep subject line under 72 characters**
- **Reference issues** (Closes #123, Fixes #456)
- **Add body for complex changes**

---

## Code Review Checklist

### General

- [ ] Code follows project structure and naming conventions
- [ ] No TypeScript errors or warnings
- [ ] No ESLint errors or warnings
- [ ] Prettier has formatted the code
- [ ] No commented-out code
- [ ] No console.log statements
- [ ] No `any` types

### TypeScript

- [ ] All functions have return types
- [ ] All interfaces/types are properly defined
- [ ] Null checks are handled
- [ ] Type guards are used where needed

### React

- [ ] Components are functional (no class components)
- [ ] Hooks are used correctly (no conditional hooks)
- [ ] Props are typed with interfaces
- [ ] Event handlers use proper naming (handle/on)
- [ ] No inline functions in JSX (use useCallback)

### Backend

- [ ] Routes → Controllers → Services → Repositories pattern
- [ ] Validation middleware is used
- [ ] Errors are properly handled
- [ ] Logging is implemented
- [ ] Database transactions are used where needed

### Testing

- [ ] Unit tests cover critical logic
- [ ] Tests are descriptive and clear
- [ ] Edge cases are tested
- [ ] Mocks are used appropriately

### Security

- [ ] No sensitive data in code (use env variables)
- [ ] SQL injection prevention (Prisma handles this)
- [ ] XSS prevention (React escapes by default)
- [ ] Authentication/authorization checks

### Performance

- [ ] No N+1 queries (use Prisma includes)
- [ ] Large lists use pagination
- [ ] Images are optimized
- [ ] Unnecessary re-renders are avoided (React.memo, useMemo)

---

## Related Documentation

- [Tech Stack](./tech-stack.md)
- [Source Tree Structure](./source-tree.md)
- [Backend Architecture](./backend-architecture.md)
- [Frontend Architecture](./front-end-architecture.md)

---

**Last Updated:** 2025-01-15
**Maintained By:** Winston (Architect)
**Status:** Living Document - Update as standards evolve
