# ================================
# Dependencies stage - cached layer
# ================================
FROM node:22-alpine AS deps

WORKDIR /app

# Copy package files first (better cache)
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# ================================
# Build stage
# ================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy config files first (less likely to change)
COPY next.config.ts tsconfig.json postcss.config.mjs ./
COPY package.json ./

# Copy i18n config
COPY i18n.ts middleware.ts ./

# Copy static assets (changes less often than code)
COPY public ./public
COPY messages ./messages

# Copy source code last (changes most often)
COPY app ./app
COPY components ./components
COPY lib ./lib

# Build arguments for public environment variables
ARG NEXT_PUBLIC_API_URL=/api
ARG NEXT_PUBLIC_SITE_URL=https://devhunter9x.com
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}

# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
RUN npm run build

# ================================
# Production stage - minimal image
# ================================
FROM node:22-alpine AS production

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy only necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

CMD ["node", "server.js"]
