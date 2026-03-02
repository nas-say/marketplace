-- Tighten beta_tests public read policy:
-- - creators can always read their own rows
-- - public can read only funded/usable beta tests (no funding-pending drafts)

drop policy if exists "beta_tests_public_read" on beta_tests;

create policy "beta_tests_public_read" on beta_tests
for select
using (
  creator_id = auth.uid()::text
  or (
    status in ('accepting', 'almost_full', 'closed')
    and (
      coalesce(reward_type, 'cash') <> 'cash'
      or coalesce(reward_pool_total_minor, 0) = 0
      or coalesce(reward_pool_status, 'not_required') = 'funded'
    )
  )
);
