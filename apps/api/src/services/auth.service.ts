import { prisma } from '../lib/prisma.js';
import * as bcrypt from 'bcrypt';
import jwt, { Secret } from 'jsonwebtoken';
import { LoginRequest, JWTPayload } from '../types/auth.types.js';

export class AuthService {
  private static readonly JWT_SECRET: Secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
  private static readonly JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '24h';

  /**
   * Authenticate user and generate JWT token
   */
  static async login(data: LoginRequest, ipAddress?: string, userAgent?: string) {
    const { email, password } = data;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check if user is active
    if (user.status !== 'active') {
      throw new Error('Account is inactive. Please contact administrator.');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Generate JWT token
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      roleId: user.roleId,
      tenantId: user.tenantId,
    };

    const token = jwt.sign(payload, this.JWT_SECRET as string, {
      expiresIn: this.JWT_EXPIRES_IN,
    } as jwt.SignOptions);

    // Update lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        action: 'LOGIN',
        entityType: 'User',
        entityId: user.id,
        ipAddress,
        userAgent,
        notes: 'User logged in successfully',
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roleId: user.roleId,
        status: user.status,
        role: {
          id: user.role.id,
          name: user.role.name,
          description: user.role.description,
        },
      },
      token,
    };
  }

  /**
   * Log user logout event
   */
  static async logout(userId: string, ipAddress?: string, userAgent?: string) {
    // Fetch user to get tenantId for audit log
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { tenantId: true } });

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        tenantId: user?.tenantId ?? 'default-tenant',
        userId,
        action: 'LOGOUT',
        entityType: 'User',
        entityId: userId,
        ipAddress,
        userAgent,
        notes: 'User logged out',
      },
    });

    return { success: true };
  }

  /**
   * Get current user by ID
   */
  static async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      roleId: user.roleId,
      role: {
        id: user.role.id,
        name: user.role.name,
        description: user.role.description,
      },
      status: user.status,
      tenantId: user.tenantId,
    };
  }

  /**
   * Verify JWT token and return payload
   */
  static verifyToken(token: string): JWTPayload {
    try {
      const payload = jwt.verify(token, this.JWT_SECRET) as JWTPayload;
      return payload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }
}
