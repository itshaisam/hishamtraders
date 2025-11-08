# Development Dockerfile for Hisham Traders Web
# Uses Vite dev server with hot module replacement

FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace files
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./

# Copy web package
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy application code
COPY apps/web/src ./apps/web/src
COPY apps/web/public ./apps/web/public
COPY apps/web/index.html ./apps/web/
COPY apps/web/vite.config.ts ./apps/web/
COPY apps/web/tsconfig.json ./apps/web/
COPY apps/web/tsconfig.node.json ./apps/web/
COPY apps/web/tailwind.config.js ./apps/web/
COPY apps/web/postcss.config.js ./apps/web/

# Expose port
EXPOSE 5173

# Start Vite dev server
CMD ["pnpm", "-F", "@hishamtraders/web", "dev", "--host"]
