import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { prisma, getTenantId } from '../lib/prisma.js';
import { AuditService } from './audit.service.js';

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

interface GetAllFilters {
  page: number;
  limit: number;
  role?: string;
  status?: string;
  search?: string;
}

export class UserService {
  async getAll(filters: GetAllFilters) {
    const { page, limit, role, status, search } = filters;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.UserWhereInput = {};

    if (role) {
      where.roleId = role;
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

    // Get total count
    const total = await prisma.user.count({ where });

    // Get users
    const users = await prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        email: true,
        name: true,
        roleId: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

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
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        roleId: true,
        status: true,
        lastLoginAt: true,
        tenantId: true,
        createdAt: true,
        updatedAt: true,
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    return user;
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

    // Validate role exists
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
        tenantId: getTenantId(),
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

    // Log audit
    await AuditService.log({
      userId: createdBy,
      action: 'CREATE',
      entityType: 'User',
      entityId: user.id,
      ipAddress,
      userAgent,
      notes: `Created user: ${user.email} with role: ${role.name}`,
    });

    // Remove password hash from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

    // Check email uniqueness if email is being updated
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });

      if (emailExists) {
        throw new Error('Email already exists');
      }
    }

    // Validate role if roleId is being updated
    if (roleId && roleId !== existingUser.roleId) {
      const role = await prisma.role.findUnique({
        where: { id: roleId },
      });

      if (!role) {
        throw new Error('Invalid role');
      }
    }

    // Build update data
    const updateData: Prisma.UserUpdateInput = {};
    if (email !== undefined) updateData.email = email;
    if (name !== undefined) updateData.name = name;
    if (roleId !== undefined) {
      updateData.role = {
        connect: { id: roleId },
      };
    }
    if (status !== undefined) updateData.status = status;

    // Update user
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
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

    // Log audit for role change
    if (roleId && roleId !== existingUser.roleId) {
      await AuditService.log({
        userId: updatedBy,
        action: 'UPDATE',
        entityType: 'User',
        entityId: user.id,
        ipAddress,
        userAgent,
        notes: `Changed user role from ${existingUser.role.name} to ${user.role.name}`,
      });
    }

    // Log audit for status change
    if (status && status !== existingUser.status) {
      await AuditService.log({
        userId: updatedBy,
        action: 'UPDATE',
        entityType: 'User',
        entityId: user.id,
        ipAddress,
        userAgent,
        notes: `Changed user status from ${existingUser.status} to ${status}`,
      });
    }

    // Remove password hash from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

    // Soft delete by setting status to inactive
    await prisma.user.update({
      where: { id },
      data: {
        status: 'inactive',
      },
    });

    // Log audit
    await AuditService.log({
      userId: deletedBy,
      action: 'DELETE',
      entityType: 'User',
      entityId: id,
      ipAddress,
      userAgent,
      notes: `Deactivated user: ${existingUser.email}`,
    });

    return { success: true };
  }
}
