# Development Dockerfile for Hisham Traders API
# Uses hot-reload with tsx watch for development

FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace files
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./

# Copy api package
COPY apps/api/package.json ./apps/api/

# Copy prisma schema
COPY prisma ./prisma/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy application code
COPY apps/api/src ./apps/api/src
COPY apps/api/tsconfig.json ./apps/api/

# Expose port
EXPOSE 3001

# Start in development mode with hot reload
CMD ["pnpm", "-F", "@hishamtraders/api", "dev"]
