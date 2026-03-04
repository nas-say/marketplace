# SideFlip Weekly Observability Checklist

Run this every week (recommended: Monday morning IST).

## 1) Pull Sentry health summary

```bash
npm run ops:sentry-weekly
```

Review:
- event volume for last 7 days
- payment failure event count (`payment_failure:*`)
- top event titles
- alert rules still present and active

## 2) Triage open issues in Sentry UI

- mark fixed issues as resolved
- snooze noisy non-actionable issues
- assign ownership for recurring failures

## 3) Verify payout/admin cron endpoints still healthy

- `/api/cron/admin/daily-payout-summary`
- `/api/cron/admin/payout-reconciliation`

Expected:
- unauthenticated request returns `401`
- authenticated request with `CRON_SECRET` returns `200`

## 4) Verify payment pipeline error visibility

- ensure `payment_failure:*` events include route + reason tags
- sample one recent event and check context (`userId`, `orderId`, `paymentId` when available)

## 5) Log follow-ups

Capture actions in a weekly ops note:
- date/time
- key issues found
- fixes shipped
- unresolved risks
