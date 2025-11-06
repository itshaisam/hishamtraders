import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import { authenticate } from './middleware/auth.middleware.js';
import { auditMiddleware } from './middleware/audit.middleware.js';

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

// Auth routes
app.use('/api/v1/auth', authRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📍 API v1: http://localhost:${PORT}/api/v1`);
  console.log(`✅ Audit logging enabled`);
});
