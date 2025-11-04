# 🚀 QUICK START GUIDE - Start Building NOW!

**Get your ERP MVP running in 30 minutes**

---

## ⚡ Prerequisites

Install these tools first:

1. **Node.js 20 LTS** - [Download](https://nodejs.org/)
   ```bash
   node --version  # Should be v20.x.x
   ```

2. **pnpm** (Fast package manager)
   ```bash
   npm install -g pnpm
   pnpm --version
   ```

3. **Git** - [Download](https://git-scm.com/)
   ```bash
   git --version
   ```

4. **VS Code** (Recommended) - [Download](https://code.visualstudio.com/)

5. **Docker Desktop** (for PostgreSQL) - [Download](https://www.docker.com/products/docker-desktop/)
   ```bash
   docker --version
   ```

---

## 📁 Step 1: Create Project Structure (5 minutes)

```bash
# Navigate to your project folder
cd e:\pProjects\hishamtraders

# Create main app folder
mkdir erp-system
cd erp-system

# Initialize monorepo
pnpm init

# Create folder structure
mkdir -p apps/web apps/api packages/shared prisma

# Initialize Git
git init
echo "node_modules" > .gitignore
echo ".env" >> .gitignore
echo "dist" >> .gitignore
echo ".DS_Store" >> .gitignore
```

---

## 🔧 Step 2: Set Up Workspace (3 minutes)

Create `pnpm-workspace.yaml` in root:

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

Create root `package.json`:

```json
{
  "name": "hisham-erp-monorepo",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "pnpm run --parallel dev",
    "build": "pnpm run --recursive build",
    "db:studio": "cd prisma && pnpx prisma studio",
    "db:migrate": "cd prisma && pnpx prisma migrate dev",
    "db:generate": "cd prisma && pnpx prisma generate"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/node": "^20.10.6"
  }
}
```

---

## 🗄️ Step 3: Set Up Database (5 minutes)

### Create `docker-compose.yml` in root:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: hisham-erp-db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: hisham_erp
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Start PostgreSQL:

```bash
docker-compose up -d
```

### Create `.env` in root:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hisham_erp"
JWT_SECRET="change-this-in-production-to-a-random-string"
JWT_EXPIRES_IN="24h"
API_PORT=3001
NODE_ENV="development"
```

---

## 📦 Step 4: Set Up Backend (10 minutes)

### Navigate to API folder:

```bash
cd apps/api
pnpm init
```

### Create `apps/api/package.json`:

```json
{
  "name": "@hisham-erp/api",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "jsonwebtoken": "^9.0.2",
    "bcrypt": "^5.1.1",
    "@prisma/client": "^5.7.1",
    "express-validator": "^7.0.1",
    "winston": "^3.11.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/bcrypt": "^5.0.2",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3"
  }
}
```

### Install dependencies:

```bash
pnpm install
```

### Create `apps/api/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Create basic Express server `apps/api/src/index.ts`:

```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

const app = express();
const PORT = process.env.API_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Hello from Hisham ERP API!' });
});

app.listen(PORT, () => {
  console.log(`✅ API server running on http://localhost:${PORT}`);
});
```

### Test backend:

```bash
pnpm dev
```

Visit: http://localhost:3001/health (should see `{"status":"ok"}`)

---

## 🎨 Step 5: Set Up Frontend (10 minutes)

### Navigate to web folder and create React app:

```bash
cd ../web
pnpm create vite . --template react-ts
```

### Update `apps/web/package.json` to add dependencies:

```json
{
  "name": "@hisham-erp/web",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.1",
    "@tanstack/react-query": "^5.12.2",
    "axios": "^1.6.2",
    "zustand": "^4.4.7",
    "lucide-react": "^0.294.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.45",
    "@types/react-dom": "^18.2.18",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.8",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.32",
    "autoprefixer": "^10.4.16"
  }
}
```

### Install dependencies:

```bash
pnpm install
```

### Set up Tailwind CSS:

```bash
pnpm tailwindcss init -p
```

### Update `apps/web/tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### Create `apps/web/src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Update `apps/web/src/main.tsx`:

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

### Create simple `apps/web/src/App.tsx`:

```typescript
import React from 'react'

function App() {
  const [message, setMessage] = React.useState<string>('');

  React.useEffect(() => {
    fetch('http://localhost:3001/api/test')
      .then(res => res.json())
      .then(data => setMessage(data.message))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-2xl">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Hisham Traders ERP
        </h1>
        <p className="text-gray-600 mb-4">
          {message || 'Connecting to API...'}
        </p>
        <div className="flex gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-green-600 font-semibold">System Online</span>
        </div>
      </div>
    </div>
  )
}

export default App
```

### Test frontend:

```bash
pnpm dev
```

Visit: http://localhost:5173 (should see your app connecting to API)

---

## 🗄️ Step 6: Set Up Prisma (5 minutes)

### Navigate to root and initialize Prisma:

```bash
cd ../..
pnpm add -D prisma @prisma/client -w
pnpx prisma init --datasource-provider postgresql
```

### This creates `prisma/schema.prisma`. Update it:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// User model
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String
  role      UserRole
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum UserRole {
  ADMIN
  WAREHOUSE_MANAGER
  SALES_OFFICER
  ACCOUNTANT
  RECOVERY_AGENT
}

// Product model (starter)
model Product {
  id           String   @id @default(cuid())
  sku          String   @unique
  name         String
  brand        String?
  category     String
  costPrice    Decimal
  sellingPrice Decimal
  active       Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

### Run first migration:

```bash
pnpx prisma migrate dev --name init
```

### Generate Prisma Client:

```bash
pnpx prisma generate
```

### Open Prisma Studio to see your database:

```bash
pnpx prisma studio
```

---

## ✅ Step 7: Verify Everything Works

### Check all services are running:

1. **Database:** `docker ps` (should see postgres container)
2. **Backend:** http://localhost:3001/health (should return JSON)
3. **Frontend:** http://localhost:5173 (should see UI)
4. **Prisma Studio:** http://localhost:5555 (should see database GUI)

### Project structure should look like:

```
erp-system/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── web/
│       ├── src/
│       │   ├── App.tsx
│       │   └── main.tsx
│       ├── index.html
│       └── package.json
├── prisma/
│   └── schema.prisma
├── docker-compose.yml
├── pnpm-workspace.yaml
├── package.json
└── .env
```

---

## 🎯 Next Steps: Start Building Features!

You now have a fully functional development environment. Here's what to build next:

### Week 1 Tasks:
1. **Auth System** (Days 1-2)
   - User registration/login
   - JWT middleware
   - Role-based access control

2. **Container/Import Module** (Days 3-5)
   - Supplier CRUD
   - Purchase Order CRUD
   - Landed cost calculator

### Commands You'll Use Daily:

```bash
# Start all services
pnpm dev

# Generate Prisma client after schema changes
pnpx prisma generate

# Create database migration
pnpx prisma migrate dev --name your_migration_name

# Open database GUI
pnpx prisma studio

# Install new package to specific workspace
cd apps/api
pnpm add package-name

# Install to root workspace
pnpm add -w package-name
```

---

## 🚀 You're Ready to Build!

Your environment is set up. Now follow the **MVP_ROADMAP.md** week by week to build your features.

**Happy coding! 🎉**

---

## 📚 Quick Reference Links

- [Prisma Docs](https://www.prisma.io/docs)
- [Express.js Guide](https://expressjs.com/)
- [React Query Docs](https://tanstack.com/query/latest/docs/framework/react/overview)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

---

## 🆘 Troubleshooting

### Database connection error?
```bash
# Make sure Docker is running
docker ps

# Restart database
docker-compose restart
```

### Port already in use?
```bash
# Kill process on port 3001
npx kill-port 3001

# Or change port in .env
API_PORT=3002
```

### Prisma Client not found?
```bash
# Regenerate client
pnpx prisma generate
```

---

**Now go build that ERP! 🚀**
