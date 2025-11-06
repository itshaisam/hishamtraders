import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service.js';
import { AuthRequest, LoginRequest } from '../types/auth.types.js';

export class AuthController {
  /**
   * POST /api/v1/auth/login
   * Authenticate user and return JWT token
   */
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body as LoginRequest;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required',
        });
      }

      // Get IP and user agent for audit logging
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      // Authenticate user
      const result = await AuthService.login({ email, password }, ipAddress, userAgent);

      return res.status(200).json({
        success: true,
        data: result,
        message: 'Login successful',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      return res.status(401).json({
        success: false,
        message: errorMessage,
      });
    }
  }

  /**
   * POST /api/v1/auth/logout
   * Log user logout event (requires authentication)
   */
  static async logout(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      await AuthService.logout(req.user.userId, ipAddress, userAgent);

      return res.status(200).json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Logout failed';
      return res.status(500).json({
        success: false,
        message: errorMessage,
      });
    }
  }

  /**
   * GET /api/v1/auth/me
   * Get current authenticated user (requires authentication)
   */
  static async me(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const user = await AuthService.getCurrentUser(req.user.userId);

      return res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get user';
      return res.status(500).json({
        success: false,
        message: errorMessage,
      });
    }
  }
}
