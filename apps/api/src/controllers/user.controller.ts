import { Response, NextFunction } from 'express';
import { UserService } from '../services/user.service.js';
import { AuthRequest } from '../types/auth.types.js';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  getAll = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { page = '1', limit = '10', role, status, search } = req.query;

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

  getById = async (req: AuthRequest, res: Response, next: NextFunction) => {
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

  getMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
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

  create = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { email, name, roleId, password } = req.body;

      // Validate required fields
      if (!email || !name || !roleId || !password) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: email, name, roleId, password',
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format',
        });
      }

      // Validate password strength (minimum 6 characters)
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long',
        });
      }

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
      if (error instanceof Error && error.message === 'Email already exists') {
        return res.status(409).json({
          success: false,
          message: 'Email already exists',
        });
      }
      if (error instanceof Error && error.message === 'Invalid role') {
        return res.status(400).json({
          success: false,
          message: 'Invalid role',
        });
      }
      next(error);
    }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction) => {
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

      // Validate email format if provided
      if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid email format',
          });
        }
      }

      // Validate status if provided
      if (status && !['active', 'inactive'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Status must be either active or inactive',
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
      if (error instanceof Error && error.message === 'User not found') {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }
      if (error instanceof Error && error.message === 'Email already exists') {
        return res.status(409).json({
          success: false,
          message: 'Email already exists',
        });
      }
      if (error instanceof Error && error.message === 'Invalid role') {
        return res.status(400).json({
          success: false,
          message: 'Invalid role',
        });
      }
      next(error);
    }
  };

  delete = async (req: AuthRequest, res: Response, next: NextFunction) => {
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
        message: 'User deactivated successfully',
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'User not found') {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }
      next(error);
    }
  };
}
