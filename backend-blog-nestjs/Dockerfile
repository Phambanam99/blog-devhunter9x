# ================================
# Dependencies stage - cached layer
# ================================
FROM node:22-alpine AS deps

WORKDIR /app

# Copy package files first (better cache)
COPY package.json ./

# Install ALL dependencies (including dev for build)
RUN npm install

# ================================
# Prisma generate stage
# ================================
FROM deps AS prisma

# Copy prisma schema and config
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Generate Prisma client (needs config file and dummy URL for build)
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN npx prisma generate

# ================================
# Build stage
# ================================
FROM prisma AS builder

# Copy source code (this layer changes most often)
COPY . .

# Build the application
RUN npm run build && ls -la dist/

# ================================
# Production dependencies only
# ================================
FROM node:22-alpine AS prod-deps

WORKDIR /app

COPY package.json ./

# Install only production dependencies
RUN npm install --omit=dev

# ================================
# Production stage - minimal image
# ================================
FROM node:22-alpine AS production

WORKDIR /app

# Install wget for healthcheck
RUN apk add --no-cache wget

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copy production node_modules
COPY --from=prod-deps /app/node_modules ./node_modules

# Copy built application
COPY --from=builder /app/dist ./dist

# Copy prisma files (schema + client + config)
COPY --from=prisma /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=prisma /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./

# Copy package.json for scripts
COPY package.json ./

# Copy entrypoint script
COPY --from=builder /app/docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Create uploads directory
RUN mkdir -p uploads && chown -R nestjs:nodejs uploads

# Switch to non-root user
USER nestjs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget -q --spider http://localhost:3001/api/health || exit 1

# Run entrypoint script
CMD ["./docker-entrypoint.sh"]
