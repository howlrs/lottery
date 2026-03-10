FROM node:20-alpine AS base

# Build stage
FROM base AS builder
RUN apk add --no-cache openssl
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate

# Create seed database during build (prisma resolves file: relative to prisma/)
RUN DATABASE_URL="file:./seed.db" npx prisma db push --skip-generate --accept-data-loss \
    && DATABASE_URL="file:./seed.db" node scripts/seed.js \
    && ls -la prisma/seed.db

RUN npm run build

# Production stage
FROM base AS runner
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone build
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Prisma client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Template database (stored outside volume mount path)
COPY --from=builder /app/prisma/seed.db /opt/seed.db

# Data directory for volume mount
RUN mkdir -p ./data && chown nextjs:nodejs ./data

# Entrypoint
COPY docker-entrypoint.sh ./
USER root
RUN chmod +x docker-entrypoint.sh
RUN chown -R nextjs:nodejs /app /opt/seed.db

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
