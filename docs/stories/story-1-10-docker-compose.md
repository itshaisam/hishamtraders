# Story 1.10: Docker Compose for Development

**Epic:** Epic 1 - Foundation, Authentication & Audit Infrastructure
**Story ID:** STORY-1.10
**Priority:** Medium
**Estimated Effort:** 2-3 hours
**Dependencies:** Story 1.1 (Project Setup), Story 1.2 (Database Setup)
**Status:** Ready for Development

---

## User Story

**As a** developer,
**I want** Docker Compose setup for running the full stack locally,
**So that** environment setup is fast and consistent across team members.

---

## Acceptance Criteria

### Docker Configuration
- [ ] 1. docker-compose.yml created with services: mysql, api, web
- [ ] 2. MySQL service configured with persistent volume and environment variables
- [ ] 3. API service mounts source code for hot reload
- [ ] 4. Web service runs Vite dev server with hot module replacement
- [ ] 5. Services networked together (web can call api, api can reach mysql)
- [ ] 6. Ports exposed: 5173 (web), 3001 (api), 3306 (mysql)

### Operations
- [ ] 7. docker-compose up starts all services
- [ ] 8. docker-compose down stops and removes containers
- [ ] 9. Environment variables passed via .env files
- [ ] 10. README includes Docker setup instructions

### Database Initialization
- [ ] 11. Database initialization (migrations, seeds) runs automatically on first startup
- [ ] 12. Logs from all services visible in terminal

---

## Technical Implementation

### 1. Docker Compose Configuration

**File:** `docker-compose.yml` (in project root)

```yaml
version: '3.8'

services:
  # MySQL Database
  mysql:
    image: mysql:8
    container_name: hisham-mysql
    restart: unless-stopped
    ports:
      - '3306:3306'
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD:-password}
      MYSQL_DATABASE: ${MYSQL_DATABASE:-hisham_erp}
      MYSQL_USER: ${MYSQL_USER:-hisham}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD:-password}
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - hisham-network
    healthcheck:
      test: ['CMD', 'mysqladmin', 'ping', '-h', 'localhost']
      interval: 10s
      timeout: 5s
      retries: 5

  # Backend API
  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile.dev
    container_name: hisham-api
    restart: unless-stopped
    ports:
      - '3001:3001'
    environment:
      NODE_ENV: development
      PORT: 3001
      DATABASE_URL: mysql://${MYSQL_USER:-hisham}:${MYSQL_PASSWORD:-password}@mysql:3306/${MYSQL_DATABASE:-hisham_erp}
      JWT_SECRET: ${JWT_SECRET:-your-super-secret-jwt-key-change-in-production}
      JWT_EXPIRES_IN: ${JWT_EXPIRES_IN:-24h}
    volumes:
      - ./apps/api:/app
      - /app/node_modules
      - ./prisma:/prisma
    depends_on:
      mysql:
        condition: service_healthy
    networks:
      - hisham-network
    command: sh -c "npx prisma generate && npx prisma migrate deploy && npx prisma db seed && npm run dev"

  # Frontend Web
  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile.dev
    container_name: hisham-web
    restart: unless-stopped
    ports:
      - '5173:5173'
    environment:
      VITE_API_URL: http://localhost:3001/api/v1
    volumes:
      - ./apps/web:/app
      - /app/node_modules
    depends_on:
      - api
    networks:
      - hisham-network
    command: npm run dev -- --host

networks:
  hisham-network:
    driver: bridge

volumes:
  mysql_data:
    driver: local
```

---

### 2. Backend Dockerfile (Development)

**File:** `apps/api/Dockerfile.dev`

```dockerfile
FROM node:20-alpine

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY apps/api/package*.json ./
COPY pnpm-workspace.yaml ../../../
COPY package*.json ../../../

# Install dependencies
RUN pnpm install

# Copy source code
COPY apps/api .
COPY prisma ../../../prisma

# Expose port
EXPOSE 3001

# Start development server
CMD ["pnpm", "dev"]
```

---

### 3. Frontend Dockerfile (Development)

**File:** `apps/web/Dockerfile.dev`

```dockerfile
FROM node:20-alpine

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY apps/web/package*.json ./
COPY pnpm-workspace.yaml ../../../
COPY package*.json ../../../

# Install dependencies
RUN pnpm install

# Copy source code
COPY apps/web .

# Expose port
EXPOSE 5173

# Start development server with host binding
CMD ["pnpm", "dev", "--", "--host"]
```

---

### 4. Environment Variables File

**File:** `.env.example`

```bash
# MySQL Configuration
MYSQL_ROOT_PASSWORD=password
MYSQL_DATABASE=hisham_erp
MYSQL_USER=hisham
MYSQL_PASSWORD=password

# API Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h

# Frontend Configuration
VITE_API_URL=http://localhost:3001/api/v1
```

**File:** `.env` (create from .env.example)

```bash
# Copy .env.example to .env and customize values
```

---

### 5. Docker Ignore File

**File:** `.dockerignore`

```
node_modules
npm-debug.log
.env
.env.local
.git
.gitignore
*.md
.vscode
.idea
dist
build
coverage
.next
logs
*.log
```

---

### 6. Makefile (Optional - for easy commands)

**File:** `Makefile`

```makefile
.PHONY: help up down restart logs clean db-reset db-seed

help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

up: ## Start all services
	docker-compose up -d
	@echo "Services started! Frontend: http://localhost:5173, API: http://localhost:3001"

up-build: ## Start all services with rebuild
	docker-compose up -d --build

down: ## Stop all services
	docker-compose down

restart: ## Restart all services
	docker-compose restart

logs: ## View logs from all services
	docker-compose logs -f

logs-api: ## View API logs only
	docker-compose logs -f api

logs-web: ## View Web logs only
	docker-compose logs -f web

logs-db: ## View MySQL logs only
	docker-compose logs -f mysql

clean: ## Stop services and remove volumes
	docker-compose down -v
	@echo "All containers and volumes removed"

db-reset: ## Reset database (drop and recreate)
	docker-compose exec api npx prisma migrate reset --force

db-seed: ## Seed database with initial data
	docker-compose exec api npx prisma db seed

db-studio: ## Open Prisma Studio
	docker-compose exec api npx prisma studio

shell-api: ## Open shell in API container
	docker-compose exec api sh

shell-db: ## Open MySQL shell
	docker-compose exec mysql mysql -u hisham -ppassword hisham_erp
```

---

### 7. README Docker Instructions

**File:** `README.md` (add Docker section)

```markdown
# Hisham Traders ERP

## Docker Setup (Recommended for Development)

### Prerequisites

- Docker Desktop installed
- Docker Compose installed (comes with Docker Desktop)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd hishamtraders
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   # Edit .env with your preferences (optional)
   ```

3. **Start all services**
   ```bash
   docker-compose up -d
   ```

   Or using make:
   ```bash
   make up
   ```

4. **Wait for services to initialize**
   - Database will be created automatically
   - Migrations will run automatically
   - Seed data will be inserted automatically

5. **Access the application**
   - Frontend: http://localhost:5173
   - API: http://localhost:3001
   - Default Login: admin@hishamtraders.com / admin123

### Common Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f api
docker-compose logs -f web
docker-compose logs -f mysql

# Restart services
docker-compose restart

# Rebuild and start
docker-compose up -d --build

# Stop and remove volumes (clean slate)
docker-compose down -v

# Access API container shell
docker-compose exec api sh

# Access MySQL shell
docker-compose exec mysql mysql -u hisham -ppassword hisham_erp

# Run Prisma commands
docker-compose exec api npx prisma migrate dev
docker-compose exec api npx prisma db seed
docker-compose exec api npx prisma studio

# Reset database
docker-compose exec api npx prisma migrate reset --force
```

### Using Makefile (if available)

```bash
make help        # Show available commands
make up          # Start all services
make down        # Stop all services
make logs        # View logs
make logs-api    # View API logs only
make db-reset    # Reset database
make db-seed     # Seed database
make clean       # Remove all containers and volumes
```

### Troubleshooting

**Services won't start:**
```bash
# Check service status
docker-compose ps

# View service logs
docker-compose logs

# Rebuild services
docker-compose up -d --build
```

**Database connection issues:**
```bash
# Check MySQL is running
docker-compose ps mysql

# Check MySQL logs
docker-compose logs mysql

# Wait for MySQL to be healthy
docker-compose up -d
docker-compose exec mysql mysqladmin ping -h localhost
```

**Port already in use:**
```bash
# Change ports in docker-compose.yml
# For example, change '3001:3001' to '3002:3001'
```

**Clear everything and start fresh:**
```bash
docker-compose down -v
docker-compose up -d --build
```

## Local Development (Without Docker)

If you prefer not to use Docker, follow these steps:

1. **Install MySQL 8+** locally
2. **Create database** `hisham_erp`
3. **Install dependencies**
   ```bash
   pnpm install
   ```
4. **Run migrations and seed**
   ```bash
   pnpm db:migrate
   pnpm db:seed
   ```
5. **Start services**
   ```bash
   pnpm dev
   ```
```

---

### 8. Update package.json with Docker Commands

**File:** `package.json` (root)

```json
{
  "scripts": {
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down",
    "docker:logs": "docker-compose logs -f",
    "docker:build": "docker-compose up -d --build",
    "docker:clean": "docker-compose down -v"
  }
}
```

---

## Testing Checklist

- [ ] `docker-compose up` starts all services successfully
- [ ] MySQL container is healthy and accessible
- [ ] API container starts and runs migrations automatically
- [ ] Web container starts and Vite dev server running
- [ ] Frontend accessible at http://localhost:5173
- [ ] API accessible at http://localhost:3001
- [ ] Frontend can make API calls successfully
- [ ] Hot reload works for frontend (change code, see update)
- [ ] Hot reload works for backend (change code, server restarts)
- [ ] Database persists after `docker-compose down`
- [ ] `docker-compose down -v` removes database volume
- [ ] Logs visible with `docker-compose logs`
- [ ] Can access MySQL shell
- [ ] Can run Prisma commands in API container

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] docker-compose.yml created and working
- [ ] Dockerfiles created for api and web
- [ ] .env.example created
- [ ] .dockerignore created
- [ ] Makefile created (optional)
- [ ] README updated with Docker instructions
- [ ] All services start successfully
- [ ] Hot reload working for both frontend and backend
- [ ] Database initialization automated
- [ ] Volumes configured for data persistence
- [ ] Documentation clear and complete

---

## Notes

- Docker Compose is for **development only**
- Production deployment uses different configuration
- Volumes ensure database data persists between restarts
- Hot reload enabled for fast development
- Healthchecks ensure services start in correct order
- Environment variables keep configuration flexible

---

**Related Documents:**
- [Tech Stack](../architecture/tech-stack.md)
- [Database Schema](../architecture/database-schema.md)
