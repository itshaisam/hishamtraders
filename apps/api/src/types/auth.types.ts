import { Request } from 'express';

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
      roleId: string;
      status: string;
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
  roleName?: string; // Added by role middleware
  iat?: number;
  exp?: number;
}

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

// Extend Express Request type globally
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}
