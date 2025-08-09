# ============================================================================
# DOCKERFILE FOR PRIME SMS - WHATSAPP BUSINESS API
# Multi-stage build: Build client + server, then run production
# ============================================================================

# Stage 1: Build the client (React/Vite)
FROM node:18-alpine AS client-builder

WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci --only=production

COPY client/ ./
RUN npm run build

# Stage 2: Build the server (Node.js/TypeScript)
FROM node:18-alpine AS server-builder

WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --only=production && npm ci --only=development

COPY server/ ./
RUN npm run build

# Stage 3: Production runtime
FROM node:18-alpine AS production

WORKDIR /app

# Install only production dependencies
COPY server/package*.json ./
RUN npm ci --only=production

# Copy built server
COPY --from=server-builder /app/server/dist ./dist
COPY --from=server-builder /app/server/ecosystem.config.js ./

# Copy built client into server's static directory
COPY --from=client-builder /app/client/dist ./dist/client-static

# Create uploads directory
RUN mkdir -p uploads

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S prime -u 1001 -G nodejs

# Change ownership
RUN chown -R prime:nodejs /app

USER prime

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:'+process.env.PORT+'/api/health', (res) => { \
    if (res.statusCode === 200) process.exit(0); \
    else process.exit(1); \
  }).on('error', () => process.exit(1))"

# Expose port
EXPOSE 5050

# Start the application
CMD ["node", "dist/index.js"]