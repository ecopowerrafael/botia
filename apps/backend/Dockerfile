# Build stage - Multi-stage build for optimization
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY apps/backend/tsconfig.json ./apps/backend/
COPY apps/backend/tsconfig.build.json ./apps/backend/
COPY apps/backend/nest-cli.json ./apps/backend/

# Install all dependencies (including dev for build)
RUN npm ci

# Copy source code
COPY apps/backend/src ./apps/backend/src
COPY prisma ./prisma

# Build application
RUN npm run build

# Production stage - Minimal runtime image
FROM node:22-alpine

WORKDIR /app

# Install dumb-init for proper signal handling (PID 1 problem fix)
RUN apk add --no-cache dumb-init curl

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy prisma schema and migrations
COPY prisma ./prisma

# Change ownership to nodejs user (security best practice)
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Expose port
EXPOSE 3000

# Use dumb-init to properly handle signals and prevent zombie processes
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/main"]
