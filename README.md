This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

1. Create env file:

```bash
cp .env.example .env
```

2. Fill the required Clerk, Supabase, and Razorpay keys in `.env`.
   Optional: `RESEND_API_KEY`, `INTEREST_NOTIFY_EMAIL`, `INTEREST_FROM_EMAIL`, and `ADMIN_CLERK_USER_IDS` (comma-separated Clerk IDs allowed to access `/admin`).

3. Run the development server:

```bash
npm install
npm run dev
```

Or use yarn / pnpm / bun equivalents.

## Quality Checks

```bash
npm run lint
npm test
npm run build
```

## GitHub Automation

- `CI` workflow runs on every push/PR to `main`.
- `Uptime Checks` workflow runs every 30 minutes and checks:
  - `/`
  - `/browse`
  - `/beta`
  - `/api/cron/admin/daily-payout-summary` (when `CRON_SECRET` secret is set)
  - `/api/cron/admin/payout-reconciliation` (when `CRON_SECRET` secret is set)
- `Uptime Alerts` workflow opens an incident issue automatically if uptime fails on `main`, and auto-closes it after recovery.
- `Nightly Production Smoke` workflow runs Playwright against production every day and validates:
  - `/`, `/browse`, `/beta`, `/how-it-works`, `/terms`, `/privacy`, `/refund`
  - signed-out redirects on `/dashboard` and `/connects`
  - `/robots.txt`, `/sitemap.xml`, and Google verification file reachability

Recommended GitHub repo secrets:
- `APP_BASE_URL` (optional, defaults to `https://sideflip.vercel.app`)
- `CRON_SECRET` (required for authenticated cron health checks)

## E2E Smoke Tests (Playwright)

```bash
npm run test:e2e
```

Notes:
- By default Playwright starts `npm run dev` at `http://127.0.0.1:3000`.
- Set `PLAYWRIGHT_BASE_URL=https://sideflip.vercel.app` to run against deployed production.

## Sentry (Optional)

Sentry is integrated for client/server/edge error capture.

Set these env vars to enable it:
- `SENTRY_DSN` or `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` (optional; used for source map upload)

If DSN is missing, Sentry stays disabled automatically.

Weekly Sentry review:

```bash
npm run ops:sentry-weekly
```

## Admin Cron Jobs

Configured in [`vercel.json`](./vercel.json):
- `/api/cron/admin/daily-payout-summary` (daily)
- `/api/cron/admin/payout-reconciliation` (daily)

Secure these with `CRON_SECRET` in Vercel env.

## Ops Runbook

- Backup/restore: [`docs/ops/backup-restore-runbook.md`](./docs/ops/backup-restore-runbook.md)
- Weekly observability: [`docs/ops/weekly-observability-checklist.md`](./docs/ops/weekly-observability-checklist.md)

---

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
