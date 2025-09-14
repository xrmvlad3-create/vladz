# Production Dockerfile for Next.js App Router + Prisma
# Multi-stage for smaller final image

FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY --from=deps /app/node_modules ./node_modules
# Copy project files
COPY . .
# Ensure Prisma client is generated and build the app
RUN npx prisma generate
# Optionally allow schema push/seed controlled by build script envs
# Build Next.js (this runs scripts/build.mjs which handles prisma generate + next build)
RUN node scripts/build.mjs

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Next.js standalone output
# Copy the minimal standalone files produced by Next.js
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static

# Prisma engine files (if needed at runtime)
# Copy Prisma schema for migration/diagnostics (optional)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

# Next.js standalone outputs a server.js entry
CMD ["node", "server.js"]