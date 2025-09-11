# IzaManagement — Next.js Fullstack (Vercel-ready)

This app replaces the Laravel preview with a fullstack Next.js (App Router) project that deploys natively on Vercel.

## Stack

- Next.js 14 (App Router, server components)
- NextAuth (Credentials) + Prisma Adapter
- Postgres (Neon, Supabase or Vercel Postgres)
- Prisma ORM
- Upstash Redis (cron/queues)
- TypeScript

## Local development

```bash
cd apps/web
cp .env.example .env
# set DATABASE_URL, NEXTAUTH_SECRET, (optional) UPSTASH_REDIS_* and ADMIN_PASSWORD

npm install
npx prisma generate
npx prisma migrate dev --name init
npm run seed
npm run dev
```

- Dashboard: http://localhost:3000
- Login: http://localhost:3000/login
- Admin area (requires admin role): http://localhost:3000/admin

Default seed admin:
- Email: `admin@izamanagement.ro`
- Password: `ADMIN_PASSWORD` from `.env` (default `admin1234`)

## Vercel deployment (free)

- Import the repository in Vercel.
- In Settings → General, set "Root Directory" to `apps/web`.
- Build command: `npm run build`
- Output: automatically handled by Next.js
- Environment Variables (Project → Settings → Environment Variables):
  - `DATABASE_URL` → your Postgres connection string (Neon/Supabase/Vercel Postgres)
  - `NEXTAUTH_URL` → `https://<your-app>.vercel.app`
  - `NEXTAUTH_SECRET` → a random 32+ char string
  - `SEED_SECRET` → random string (protects POST /api/seed)
  - (optional) `ADMIN_PASSWORD` → initial admin password
  - (optional) `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` → for cron/queues
  - (optional) `CRON_SECRET` → if you also set it in GitHub Actions (see below)

Seed after first deploy (optional, idempotent):

```bash
curl -X POST https://<your-app>.vercel.app/api/seed -H "x-seed-secret: <SEED_SECRET>"
```

## Health & Cron (no paid add‑ons)

- Health: `GET /api/health` → `healthy`
- Cron: Use the included GitHub Actions workflow instead of Vercel-paid cron.
  1. Go to your repo → Settings → Secrets and variables → Actions.
  2. Add repository secrets:
     - `CRON_URL` = `https://<your-app>.vercel.app/api/cron/every-15m`
     - `CRON_SECRET` = (optional) the same value as `CRON_SECRET` in Vercel envs
  3. The workflow `.github/workflows/cron.yml` runs every 15 minutes and calls the endpoint.
  - If `UPSTASH_*` vars are set, the cron writes a timestamp to key `last_cron_run`. If not, it no‑ops safely.

## Notes

- Extend the data model in `prisma/schema.prisma`, then run a migration and adjust API routes under `src/app/api/*`.
- To secure routes, check session/role in server components or add middleware based on `next-auth` session.