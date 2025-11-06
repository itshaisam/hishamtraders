# Story 1.1: Project Setup and Development Environment

**Epic:** Epic 1 - Foundation, Authentication & Audit Infrastructure
**Story ID:** STORY-1.1
**Priority:** Critical
**Estimated Effort:** 4-6 hours
**Dependencies:** None
**Status:** Completed

---

## User Story

**As a** developer,
**I want** the project repository, monorepo structure, and development tools configured,
**So that** the team can begin feature development with proper tooling and conventions.

---

## Acceptance Criteria

### Repository & Structure
- [x] 1. Monorepo created with apps/ (web, api) and packages/ (shared) structure
- [x] 2. Node.js 20 LTS, pnpm configured with workspaces
- [x] 3. Git repository initialized with .gitignore and README
- [x] 4. VS Code workspace settings recommended

### TypeScript & Code Quality
- [x] 5. TypeScript configured for both frontend and backend with strict mode
- [x] 6. ESLint and Prettier configured with shared config
- [x] 7. Husky and lint-staged set up for pre-commit hooks

### Frontend Setup (React)
- [x] 8. Vite configured for frontend with React, TypeScript, Tailwind CSS
- [x] 9. Environment variable templates (.env.example) created for web app

### Backend Setup (Express)
- [x] 10. Express.js with TypeScript configured for backend
- [x] 11. Environment variable templates (.env.example) created for api app

### Scripts & Build
- [x] 12. Development scripts added to package.json (dev, build, test, lint)
- [x] 13. All dependencies installed and project builds successfully

---

## Technical Implementation

### Folder Structure

```
hishamtraders/
├── apps/
│   ├── web/                    # React frontend
│   │   ├── src/
│   │   │   ├── components/     # React components
│   │   │   ├── features/       # Feature modules
│   │   │   ├── pages/          # Page components
│   │   │   ├── hooks/          # Custom React hooks
│   │   │   ├── lib/            # Utilities
│   │   │   ├── types/          # TypeScript types
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── public/
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.js
│   │   └── .env.example
│   │
│   └── api/                    # Express backend
│       ├── src/
│       │   ├── routes/         # API routes
│       │   ├── controllers/    # Request handlers
│       │   ├── services/       # Business logic
│       │   ├── repositories/   # Data access
│       │   ├── middleware/     # Express middleware
│       │   ├── types/          # TypeScript types
│       │   ├── utils/          # Utilities
│       │   └── index.ts        # Entry point
│       ├── package.json
│       ├── tsconfig.json
│       └── .env.example
│
├── packages/
│   └── shared/                 # Shared types/utils
│       ├── src/
│       │   ├── types/          # Shared TypeScript types
│       │   └── utils/          # Shared utilities
│       ├── package.json
│       └── tsconfig.json
│
├── prisma/                     # Database schema (added in Story 1.2)
├── docs/                       # Documentation
├── .husky/                     # Git hooks
├── pnpm-workspace.yaml
├── package.json                # Root package.json
├── .gitignore
├── .prettierrc
├── .eslintrc.js
└── README.md
```

---

## Configuration Files

### Root `package.json`

```json
{
  "name": "hishamtraders",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "pnpm --parallel -r dev",
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "lint": "pnpm -r lint",
    "format": "prettier --write \"**/*.{ts,tsx,js,json,md}\"",
    "prepare": "husky install"
  },
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.50.0",
    "eslint-config-prettier": "^9.0.0",
    "husky": "^8.0.3",
    "lint-staged": "^15.0.0",
    "prettier": "^3.0.3",
    "typescript": "^5.3.0"
  }
}
```

### `pnpm-workspace.yaml`

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### TypeScript Config (Root `tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  }
}
```

### Frontend `apps/web/package.json`

```json
{
  "name": "@hishamtraders/web",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@tanstack/react-query": "^5.0.0",
    "zustand": "^4.4.0",
    "axios": "^1.6.0",
    "react-hook-form": "^7.48.0",
    "@hookform/resolvers": "^3.3.0",
    "zod": "^3.22.0",
    "lucide-react": "^0.292.0",
    "react-hot-toast": "^2.4.1",
    "date-fns": "^2.30.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  }
}
```

### Backend `apps/api/package.json`

```json
{
  "name": "@hishamtraders/api",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "lint": "eslint . --ext ts"
  },
  "dependencies": {
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "dotenv": "^16.3.0",
    "zod": "^3.22.0",
    "jsonwebtoken": "^9.0.2",
    "bcrypt": "^5.1.1",
    "winston": "^3.11.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.0",
    "@types/cors": "^2.8.0",
    "@types/jsonwebtoken": "^9.0.0",
    "@types/bcrypt": "^5.0.0",
    "@types/node": "^20.10.0",
    "tsx": "^4.7.0"
  }
}
```

### Vite Config `apps/web/vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
```

### Tailwind Config `apps/web/tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
      },
    },
  },
  plugins: [],
}
```

### Environment Files

**`apps/web/.env.example`**
```bash
VITE_API_URL=http://localhost:3001/api/v1
```

**`apps/api/.env.example`**
```bash
NODE_ENV=development
PORT=3001
DATABASE_URL="mysql://root:password@localhost:3306/hisham_erp"
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h
```

### Git Ignore

```
# Dependencies
node_modules/
pnpm-lock.yaml

# Build output
dist/
build/
.next/

# Environment variables
.env
.env.local
.env.*.local

# Logs
logs/
*.log

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db
```

---

## Testing Checklist

- [x] Run `pnpm install` - all dependencies install successfully
- [x] Run `pnpm dev` - both frontend and backend start
- [x] Frontend accessible at http://localhost:5173
- [x] Backend accessible at http://localhost:3001
- [x] Run `pnpm lint` - no linting errors
- [x] Run `pnpm build` - both apps build successfully
- [x] Git commit triggers pre-commit hook (lint-staged)
- [x] TypeScript strict mode catches type errors

---

## Definition of Done

- [x] All acceptance criteria met
- [x] All configuration files created and working
- [x] Dependencies installed with no errors
- [x] Both apps (web + api) start in development mode
- [x] Linting and formatting work correctly
- [x] Pre-commit hooks configured and functional
- [x] README.md includes setup instructions
- [x] Code reviewed and approved
- [x] Changes committed to main branch

---

## Notes

- Uses pnpm for faster installs and disk efficiency
- Monorepo structure allows shared types between frontend/backend
- Strict TypeScript mode catches errors early
- Tailwind CSS for rapid UI development
- Vite for fast HMR (Hot Module Replacement)

---

**Related Documents:**
- [Tech Stack](../architecture/tech-stack.md)
- [Frontend Architecture](../architecture/front-end-architecture.md)
- [Backend Architecture](../architecture/backend-architecture.md)
