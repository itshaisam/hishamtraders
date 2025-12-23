import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import countriesRoutes from './modules/countries/countries.routes.js';
import paymentTermsRoutes from './modules/payment-terms/payment-terms.routes.js';
import categoriesRoutes from './modules/categories/categories.routes.js';
import brandsRoutes from './modules/brands/brands.routes.js';
import uomsRoutes from './modules/uoms/uoms.routes.js';
import suppliersRoutes from './modules/suppliers/suppliers.routes.js';
import productsRoutes from './modules/products/products.routes.js';
import variantsRoutes from './modules/variants/variants.routes.js';
import purchaseOrdersRoutes from './modules/purchase-orders/purchase-orders.routes.js';
import warehousesRoutes from './modules/warehouses/warehouses.routes.js';
import inventoryRoutes from './modules/inventory/inventory.routes.js';
import stockAdjustmentRoutes from './modules/inventory/stock-adjustment.routes.js';
import { authenticate } from './middleware/auth.middleware.js';
import { auditMiddleware } from './middleware/audit.middleware.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import logger from './lib/logger.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Trust proxy for correct IP addresses (required for audit logs)
app.set('trust proxy', true);

// Health check route
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Hisham Traders API is running' });
});

// API routes
app.get('/api/v1', (_req, res) => {
  res.json({ message: 'Hisham Traders ERP API v1' });
});

// Auth middleware (applies to all routes except /auth/login)
app.use((req, res, next) => {
  if (req.path.startsWith('/api/v1/auth/login') || req.path.startsWith('/health')) {
    return next();
  }
  return authenticate(req, res, next);
});

// Audit middleware (logs all mutating operations)
app.use('/api/v1', auditMiddleware);

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/countries', countriesRoutes);
app.use('/api/v1/payment-terms', paymentTermsRoutes);
app.use('/api/v1/categories', categoriesRoutes);
app.use('/api/v1/brands', brandsRoutes);
app.use('/api/v1/uoms', uomsRoutes);
app.use('/api/v1/suppliers', suppliersRoutes);
app.use('/api/v1/products', productsRoutes);
app.use('/api/v1/variants', variantsRoutes);
app.use('/api/v1/purchase-orders', purchaseOrdersRoutes);
app.use('/api/v1/warehouses', warehousesRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/inventory/adjustments', stockAdjustmentRoutes);
app.use('/api/v1', dashboardRoutes);

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📍 Health check: http://localhost:${PORT}/health`);
  logger.info(`📍 API v1: http://localhost:${PORT}/api/v1`);
  logger.info(`✅ Audit logging enabled`);
  logger.info(`✅ Error handling enabled`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: Error) => {
  logger.error('Unhandled Rejection:', { error: reason.message, stack: reason.stack });
  // Don't exit in production, just log
  if (process.env.NODE_ENV === 'development') {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', { error: error.message, stack: error.stack });
  process.exit(1);
});
