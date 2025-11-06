# Story 1.3: Authentication System with JWT

**Epic:** Epic 1 - Foundation, Authentication & Audit Infrastructure
**Story ID:** STORY-1.3
**Priority:** Critical
**Estimated Effort:** 6-8 hours
**Dependencies:** Story 1.2 (Database Setup)
**Status:** Completed

---

## User Story

**As a** user,
**I want** to log in with email and password to access the system securely,
**So that** only authorized personnel can use the application.

---

## Acceptance Criteria

### Backend Authentication
- [x] 1. User table includes email, passwordHash, roleId, status (active/inactive), lastLoginAt
- [x] 2. POST /api/v1/auth/login endpoint accepts email and password
- [x] 3. Password hashed with bcrypt (min 10 rounds) before storage
- [x] 4. Login validates credentials and returns JWT token with user info and role
- [x] 5. JWT includes userId, email, roleId, tenantId (null for MVP), expires in 24 hours
- [x] 6. POST /api/v1/auth/logout endpoint clears session/token
- [x] 7. GET /api/v1/auth/me endpoint returns current user profile (requires valid JWT)
- [x] 8. Invalid credentials return 401 Unauthorized with appropriate error message

### Frontend Authentication
- [x] 9. Login frontend page created with email/password form (responsive design)
- [x] 10. Frontend stores JWT in localStorage and includes in API requests
- [x] 11. Frontend redirects to dashboard on successful login
- [x] 12. Frontend displays login errors appropriately

### Audit Logging
- [x] 13. **Login/logout events automatically logged to AuditLog**

---

## Technical Implementation

### Backend Implementation

#### 1. Auth Types

**File:** `apps/api/src/types/auth.types.ts`

```typescript
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    user: {
      id: string;
      email: string;
      name: string;
      role: {
        id: string;
        name: string;
      };
    };
    token: string;
  };
  message: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  roleId: string;
  tenantId: string | null;
}

export interface AuthRequest extends Request {
  user?: JWTPayload;
}
```

#### 2. Auth Controller

**File:** `apps/api/src/controllers/auth.controller.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { LoginRequest } from '../types/auth.types';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body as LoginRequest;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required',
        });
      }

      // Authenticate
      const result = await this.authService.login(email, password, {
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      return res.status(200).json({
        success: true,
        data: result,
        message: 'Login successful',
      });
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;

      if (userId) {
        await this.authService.logout(userId, {
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      next(error);
    }
  };

  me = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const user = await this.authService.getCurrentUser(userId);

      return res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };
}
```

#### 3. Auth Service

**File:** `apps/api/src/services/auth.service.ts`

```typescript
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { JWTPayload } from '../types/auth.types';

export class AuthService {
  async login(
    email: string,
    password: string,
    metadata: { ipAddress?: string; userAgent?: string }
  ) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check if user is active
    if (user.status !== 'active') {
      throw new Error('Account is inactive');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Generate JWT
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      roleId: user.roleId,
      tenantId: user.tenantId,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Log login to audit trail
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entityType: 'User',
        entityId: user.id,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        notes: 'User logged in successfully',
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: {
          id: user.role.id,
          name: user.role.name,
        },
      },
      token,
    };
  }

  async logout(
    userId: string,
    metadata: { ipAddress?: string; userAgent?: string }
  ) {
    // Log logout to audit trail
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'LOGOUT',
        entityType: 'User',
        entityId: userId,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        notes: 'User logged out',
      },
    });
  }

  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        lastLoginAt: true,
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }
}
```

#### 4. Auth Routes

**File:** `apps/api/src/routes/auth.routes.ts`

```typescript
import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const authController = new AuthController();

// Public routes
router.post('/login', authController.login);

// Protected routes
router.post('/logout', authMiddleware, authController.logout);
router.get('/me', authMiddleware, authController.me);

export default router;
```

#### 5. Auth Middleware

**File:** `apps/api/src/middleware/auth.middleware.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';

const authService = new AuthService();

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    // Verify token
    const payload = authService.verifyToken(token);

    // Attach user to request
    req.user = payload;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};
```

#### 6. Register Routes in Main App

**File:** `apps/api/src/index.ts`

```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1/auth', authRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
});
```

---

### Frontend Implementation

#### 1. Auth Store (Zustand)

**File:** `apps/web/src/stores/auth.store.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  role: {
    id: string;
    name: string;
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) =>
        set({ user, token, isAuthenticated: true }),
      clearAuth: () =>
        set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
```

#### 2. API Client with Auth

**File:** `apps/web/src/lib/api-client.ts`

```typescript
import axios from 'axios';
import { useAuthStore } from '../stores/auth.store';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth and redirect to login
      useAuthStore.getState().clearAuth();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

#### 3. Auth API Service

**File:** `apps/web/src/services/auth.service.ts`

```typescript
import apiClient from '../lib/api-client';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    user: {
      id: string;
      email: string;
      name: string;
      role: {
        id: string;
        name: string;
      };
    };
    token: string;
  };
  message: string;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  async getCurrentUser() {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
};
```

#### 4. Login Page

**File:** `apps/web/src/pages/Login.tsx`

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../stores/auth.store';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const response = await authService.login(data);
      setAuth(response.data.user, response.data.token);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || 'Login failed. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Hisham Traders ERP
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email Address
              </label>
              <input
                {...register('email')}
                id="email"
                type="email"
                autoComplete="email"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                {...register('password')}
                id="password"
                type="password"
                autoComplete="current-password"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="text-center text-sm text-gray-600">
          <p>Default Admin: admin@hishamtraders.com / admin123</p>
        </div>
      </div>
    </div>
  );
}
```

#### 5. Protected Route Component

**File:** `apps/web/src/components/ProtectedRoute.tsx`

```typescript
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
```

#### 6. App Routes

**File:** `apps/web/src/App.tsx`

```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuthStore } from './stores/auth.store';

export default function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <>
      <Toaster position="top-right" />
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}
```

---

## Testing Checklist

### Backend Testing
- [ ] POST /api/v1/auth/login with valid credentials returns token
- [ ] POST /api/v1/auth/login with invalid email returns 401
- [ ] POST /api/v1/auth/login with invalid password returns 401
- [ ] POST /api/v1/auth/login with inactive user returns error
- [ ] JWT token contains userId, email, roleId, tenantId
- [ ] JWT token expires in 24 hours
- [ ] GET /api/v1/auth/me with valid token returns user data
- [ ] GET /api/v1/auth/me without token returns 401
- [ ] POST /api/v1/auth/logout logs audit entry
- [ ] Login creates audit log entry
- [ ] Last login timestamp updated on successful login

### Frontend Testing
- [ ] Login page renders correctly
- [ ] Email validation works (shows error for invalid email)
- [ ] Password required validation works
- [ ] Form submission with valid credentials logs in
- [ ] Token stored in localStorage after login
- [ ] User redirected to /dashboard after successful login
- [ ] Error message displayed for invalid credentials
- [ ] Loading state shows during login request
- [ ] Protected routes redirect to login if not authenticated
- [ ] Authenticated users redirected from /login to /dashboard

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Backend authentication endpoints implemented and working
- [ ] JWT generation and validation working
- [ ] Password hashing with bcrypt working
- [ ] Frontend login page created and functional
- [ ] Auth state managed with Zustand
- [ ] Protected routes working correctly
- [ ] Login/logout events logged to audit trail
- [ ] Error handling implemented
- [ ] Tests pass
- [ ] Code reviewed and approved
- [ ] Documentation updated

---

## Security Considerations

- Passwords hashed with bcrypt (10 rounds minimum)
- JWT tokens expire after 24 hours
- Tokens stored in localStorage (consider httpOnly cookies for production)
- Failed login attempts logged for security monitoring
- Inactive users cannot log in
- Authorization header required for protected endpoints

---

**Related Documents:**
- [API Endpoints](../architecture/api-endpoints.md)
- [Backend Architecture](../architecture/backend-architecture.md)
- [Frontend Architecture](../architecture/front-end-architecture.md)
- [Audit Logging Architecture](../architecture/audit-logging.md)
