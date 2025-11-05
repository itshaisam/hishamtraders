# Story 1.6: User Management Module

**Epic:** Epic 1 - Foundation, Authentication & Audit Infrastructure
**Story ID:** STORY-1.6
**Priority:** High
**Estimated Effort:** 6-8 hours
**Dependencies:** Story 1.3 (Authentication), Story 1.5 (Authorization)
**Status:** Ready for Development

---

## User Story

**As an** admin,
**I want** to create, edit, and deactivate user accounts with role assignment,
**So that** I can control who has access to the system and what they can do.

---

## Acceptance Criteria

### Backend API
- [ ] 1. GET /api/v1/users returns paginated list of users with role info
- [ ] 2. POST /api/v1/users creates new user with email, name, roleId, password
- [ ] 3. PUT /api/v1/users/:id updates user details (email, name, roleId, status)
- [ ] 4. DELETE /api/v1/users/:id soft-deletes user (sets status=inactive)
- [ ] 5. User table includes: id, email (unique), name, passwordHash, roleId, status, createdAt, lastLoginAt
- [ ] 6. Email validation ensures valid format and uniqueness
- [ ] 7. Default password sent to new user (or requires password reset on first login)
- [ ] 8. Admin cannot delete/deactivate their own account

### Audit Logging
- [ ] 9. **Role changes logged in audit trail**

### Frontend UI
- [ ] 10. Frontend User Management page lists users with filters (role, status)
- [ ] 11. Frontend includes Add/Edit User modals with form validation
- [ ] 12. Frontend displays user status (active/inactive) with visual indicator
- [ ] 13. Only Admin role can access user management features

---

## Technical Implementation

### Backend Implementation

#### 1. User Controller

**File:** `apps/api/src/controllers/user.controller.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page = 1, limit = 10, role, status, search } = req.query;

      const result = await this.userService.getAll({
        page: Number(page),
        limit: Number(limit),
        role: role as string,
        status: status as string,
        search: search as string,
      });

      return res.status(200).json({
        success: true,
        data: result.users,
        meta: {
          pagination: result.pagination,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const user = await this.userService.getById(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      return res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };

  getMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;

      const user = await this.userService.getById(userId);

      return res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, name, roleId, password } = req.body;

      const user = await this.userService.create({
        email,
        name,
        roleId,
        password,
        createdBy: req.user!.userId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      return res.status(201).json({
        success: true,
        data: user,
        message: 'User created successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { email, name, roleId, status } = req.body;
      const currentUserId = req.user!.userId;

      // Prevent admin from deactivating themselves
      if (id === currentUserId && status === 'inactive') {
        return res.status(400).json({
          success: false,
          message: 'Cannot deactivate your own account',
        });
      }

      const user = await this.userService.update(id, {
        email,
        name,
        roleId,
        status,
        updatedBy: currentUserId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      return res.status(200).json({
        success: true,
        data: user,
        message: 'User updated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const currentUserId = req.user!.userId;

      // Prevent admin from deleting themselves
      if (id === currentUserId) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete your own account',
        });
      }

      await this.userService.delete(id, {
        deletedBy: currentUserId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      return res.status(200).json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}
```

---

#### 2. User Service

**File:** `apps/api/src/services/user.service.ts`

```typescript
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';
import { AuditService } from './audit.service';

interface CreateUserData {
  email: string;
  name: string;
  roleId: string;
  password: string;
  createdBy: string;
  ipAddress?: string;
  userAgent?: string;
}

interface UpdateUserData {
  email?: string;
  name?: string;
  roleId?: string;
  status?: string;
  updatedBy: string;
  ipAddress?: string;
  userAgent?: string;
}

interface DeleteUserData {
  deletedBy: string;
  ipAddress?: string;
  userAgent?: string;
}

export class UserService {
  async getAll(filters: {
    page: number;
    limit: number;
    role?: string;
    status?: string;
    search?: string;
  }) {
    const { page, limit, role, status, search } = filters;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (role) {
      where.role = { name: role };
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    // Get users
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          role: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
        select: {
          id: true,
          email: true,
          name: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
          role: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        role: true,
      },
    });
  }

  async create(data: CreateUserData) {
    const { email, name, roleId, password, createdBy, ipAddress, userAgent } = data;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('Email already exists');
    }

    // Verify role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new Error('Invalid role');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        roleId,
        passwordHash,
        status: 'active',
      },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    // Log to audit trail
    await AuditService.log({
      userId: createdBy,
      action: 'CREATE',
      entityType: 'User',
      entityId: user.id,
      ipAddress,
      userAgent,
      notes: `Created user ${email} with role ${role.name}`,
    });

    // Remove passwordHash from response
    const { passwordHash: _, ...userWithoutPassword } = user;

    return userWithoutPassword;
  }

  async update(id: string, data: UpdateUserData) {
    const { email, name, roleId, status, updatedBy, ipAddress, userAgent } = data;

    // Get existing user
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });

    if (!existingUser) {
      throw new Error('User not found');
    }

    // Check email uniqueness if changed
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });

      if (emailExists) {
        throw new Error('Email already exists');
      }
    }

    // Verify new role if changed
    let newRole;
    if (roleId && roleId !== existingUser.roleId) {
      newRole = await prisma.role.findUnique({
        where: { id: roleId },
      });

      if (!newRole) {
        throw new Error('Invalid role');
      }
    }

    // Update user
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(email && { email }),
        ...(name && { name }),
        ...(roleId && { roleId }),
        ...(status && { status }),
      },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    // Build audit log notes
    const changes: string[] = [];
    if (email && email !== existingUser.email) changes.push(`email: ${existingUser.email} → ${email}`);
    if (name && name !== existingUser.name) changes.push(`name: ${existingUser.name} → ${name}`);
    if (roleId && roleId !== existingUser.roleId) {
      changes.push(`role: ${existingUser.role.name} → ${newRole!.name}`);
    }
    if (status && status !== existingUser.status) changes.push(`status: ${existingUser.status} → ${status}`);

    // Log to audit trail
    await AuditService.log({
      userId: updatedBy,
      action: 'UPDATE',
      entityType: 'User',
      entityId: id,
      ipAddress,
      userAgent,
      changedFields: {
        ...(email && { email: { old: existingUser.email, new: email } }),
        ...(name && { name: { old: existingUser.name, new: name } }),
        ...(roleId && { roleId: { old: existingUser.roleId, new: roleId } }),
        ...(status && { status: { old: existingUser.status, new: status } }),
      },
      notes: `Updated user: ${changes.join(', ')}`,
    });

    // Remove passwordHash from response
    const { passwordHash: _, ...userWithoutPassword } = user;

    return userWithoutPassword;
  }

  async delete(id: string, data: DeleteUserData) {
    const { deletedBy, ipAddress, userAgent } = data;

    // Get existing user
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });

    if (!existingUser) {
      throw new Error('User not found');
    }

    // Soft delete (set status to inactive)
    await prisma.user.update({
      where: { id },
      data: {
        status: 'inactive',
      },
    });

    // Log to audit trail
    await AuditService.log({
      userId: deletedBy,
      action: 'DELETE',
      entityType: 'User',
      entityId: id,
      ipAddress,
      userAgent,
      notes: `Deleted user ${existingUser.email} (${existingUser.role.name})`,
    });
  }
}
```

---

#### 3. User Routes

**File:** `apps/api/src/routes/user.routes.ts`

```typescript
import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/role.middleware';

const router = Router();
const userController = new UserController();

// All routes require authentication
router.use(authMiddleware);

// Get current user (any authenticated user)
router.get('/me', userController.getMe);

// Admin-only routes
router.get('/', requireAdmin, userController.getAll);
router.get('/:id', requireAdmin, userController.getById);
router.post('/', requireAdmin, userController.create);
router.put('/:id', requireAdmin, userController.update);
router.delete('/:id', requireAdmin, userController.delete);

export default router;
```

Register in main app:
```typescript
import userRoutes from './routes/user.routes';
app.use('/api/v1/users', userRoutes);
```

---

### Frontend Implementation

#### 1. User API Service

**File:** `apps/web/src/services/user.service.ts`

```typescript
import apiClient from '../lib/api-client';

export interface User {
  id: string;
  email: string;
  name: string;
  status: 'active' | 'inactive';
  lastLoginAt: string | null;
  createdAt: string;
  role: {
    id: string;
    name: string;
    description: string;
  };
}

export interface CreateUserRequest {
  email: string;
  name: string;
  roleId: string;
  password: string;
}

export interface UpdateUserRequest {
  email?: string;
  name?: string;
  roleId?: string;
  status?: 'active' | 'inactive';
}

export const userService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    role?: string;
    status?: string;
    search?: string;
  }) {
    const response = await apiClient.get('/users', { params });
    return response.data;
  },

  async getById(id: string) {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },

  async create(data: CreateUserRequest) {
    const response = await apiClient.post('/users', data);
    return response.data;
  },

  async update(id: string, data: UpdateUserRequest) {
    const response = await apiClient.put(`/users/${id}`, data);
    return response.data;
  },

  async delete(id: string) {
    const response = await apiClient.delete(`/users/${id}`);
    return response.data;
  },
};
```

---

#### 2. User Management Page

**File:** `apps/web/src/pages/UserManagement.tsx`

```typescript
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { userService, User } from '../services/user.service';
import { UserPlus, Edit, Trash2 } from 'lucide-react';
import UserModal from '../components/UserModal';

export default function UserManagement() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Fetch users
  const { data, isLoading } = useQuery({
    queryKey: ['users', page, search, statusFilter, roleFilter],
    queryFn: () =>
      userService.getAll({
        page,
        limit: 10,
        search,
        status: statusFilter,
        role: roleFilter,
      }),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: userService.delete,
    onSuccess: () => {
      toast.success('User deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    },
  });

  const handleDelete = (user: User) => {
    if (confirm(`Are you sure you want to delete ${user.name}?`)) {
      deleteMutation.mutate(user.id);
    }
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-blue-600"
        >
          <UserPlus size={20} />
          Add User
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-4">
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="WAREHOUSE_MANAGER">Warehouse Manager</option>
          <option value="SALES_OFFICER">Sales Officer</option>
          <option value="ACCOUNTANT">Accountant</option>
          <option value="RECOVERY_AGENT">Recovery Agent</option>
        </select>
      </div>

      {/* Users Table */}
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Last Login
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.data?.map((user: User) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{user.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                      {user.role.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        user.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastLoginAt
                      ? new Date(user.lastLoginAt).toLocaleDateString()
                      : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(user)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(user)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="px-6 py-4 flex justify-between items-center border-t">
            <div>
              Showing {data?.data?.length || 0} of {data?.meta?.pagination?.total || 0} users
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= (data?.meta?.pagination?.totalPages || 1)}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Modal */}
      {isModalOpen && (
        <UserModal
          user={selectedUser}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['users'] });
          }}
        />
      )}
    </div>
  );
}
```

---

## Testing Checklist

### Backend Testing
- [ ] GET /api/v1/users returns paginated users
- [ ] POST /api/v1/users creates user with hashed password
- [ ] POST /api/v1/users rejects duplicate email
- [ ] PUT /api/v1/users updates user successfully
- [ ] PUT /api/v1/users prevents admin from deactivating themselves
- [ ] DELETE /api/v1/users soft-deletes user (status=inactive)
- [ ] DELETE /api/v1/users prevents admin from deleting themselves
- [ ] User creation logged to audit trail
- [ ] User updates logged to audit trail with changed fields
- [ ] User deletion logged to audit trail
- [ ] Only admin can access user endpoints

### Frontend Testing
- [ ] User list displays all users
- [ ] Search filters users by name/email
- [ ] Status filter works correctly
- [ ] Role filter works correctly
- [ ] Add user button opens modal
- [ ] Edit user button opens modal with user data
- [ ] Delete user shows confirmation dialog
- [ ] Success/error toasts display correctly
- [ ] Pagination works correctly
- [ ] Non-admin users cannot access page

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Backend CRUD endpoints implemented
- [ ] Password hashing working correctly
- [ ] Email uniqueness enforced
- [ ] Soft delete implemented
- [ ] Self-deletion prevented
- [ ] Audit logging working for all operations
- [ ] Frontend user list page created
- [ ] Add/Edit user modal functional
- [ ] Filters and pagination working
- [ ] Only admins can access
- [ ] Tests pass
- [ ] Code reviewed and approved

---

**Related Documents:**
- [API Endpoints](../architecture/api-endpoints.md)
- [Database Schema](../architecture/database-schema.md)
- [Frontend Architecture](../architecture/front-end-architecture.md)
