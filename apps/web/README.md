# IzaManagement — Next.js Fullstack (Vercel-ready)

This app replaces the Laravel preview with a fullstack Next.js (App Router) project that deploys natively on Vercel.

## Stack

- Next.js 14 (App Router, server components)
- Postgres (Neon, Supabase or Vercel Postgres)
- Prisma ORM
- TypeScript

## Local development

```bash
cd apps/web
cp .env.example .env
# set DATABASE_URL

npm install
npm run prisma:studio # optional, installs Prisma client
npm run dev
```

## Migrations & seed

```bash
# Generate client & apply migrations
npx prisma generate
npx prisma migrate dev --name init

# Seed (idempotent)
npm run seed
```

## Vercel deployment

- Import the repository in Vercel.
- In Settings → General, set "Root Directory" to `apps/web`.
- In Settings → Environment Variables:
  - `DATABASE_URL` → your Postgres connection string
  - `SEED_SECRET` → random string (for POST /api/seed)
- Build command: `npm run build`
- Output: automatically handled by Next.js

(Optional) After the first deploy, call the seed endpoint:

```bash
curl -X POST https://your-app.vercel.app/api/seed -H "x-seed-secret: <SEED_SECRET>"
```

## Health

- GET `/api/health` → `healthy`

## Notes

- If you want to migrate more Laravel domain models, update `prisma/schema.prisma`, run a migration, and extend API routes under `src/app/api/*`.