-- Secure the remaining RLS-enabled tables with explicit least-privilege policies.
-- daily_compass_content is curated global content: public read only.
-- battery_diagnostics and ai_bedtime_stories are private family data.

begin;

drop policy if exists battery_diagnostics_select_own_family on public.battery_diagnostics;
drop policy if exists battery_diagnostics_insert_own_family on public.battery_diagnostics;
drop policy if exists battery_diagnostics_update_own_family on public.battery_diagnostics;
drop policy if exists battery_diagnostics_delete_own_family on public.battery_diagnostics;

create policy battery_diagnostics_select_own_family
on public.battery_diagnostics
for select to authenticated
using (family_id is not null and family_id = (select private.current_user_family_id()));

create policy battery_diagnostics_insert_own_family
on public.battery_diagnostics
for insert to authenticated
with check (
  family_id is not null
  and family_id = (select private.current_user_family_id())
  and (
    user_id is null
    or exists (
      select 1 from public.users u
      where u.id = battery_diagnostics.user_id
        and u.auth_user_id = (select auth.uid())
        and u.family_id = battery_diagnostics.family_id
    )
  )
);

create policy battery_diagnostics_update_own_family
on public.battery_diagnostics
for update to authenticated
using (family_id is not null and family_id = (select private.current_user_family_id()))
with check (
  family_id is not null
  and family_id = (select private.current_user_family_id())
  and (
    user_id is null
    or exists (
      select 1 from public.users u
      where u.id = battery_diagnostics.user_id
        and u.auth_user_id = (select auth.uid())
        and u.family_id = battery_diagnostics.family_id
    )
  )
);

create policy battery_diagnostics_delete_own_family
on public.battery_diagnostics
for delete to authenticated
using (family_id is not null and family_id = (select private.current_user_family_id()));

drop policy if exists ai_bedtime_stories_select_own_family on public.ai_bedtime_stories;
drop policy if exists ai_bedtime_stories_insert_own_family on public.ai_bedtime_stories;
drop policy if exists ai_bedtime_stories_update_own_family on public.ai_bedtime_stories;
drop policy if exists ai_bedtime_stories_delete_own_family on public.ai_bedtime_stories;

create policy ai_bedtime_stories_select_own_family
on public.ai_bedtime_stories
for select to authenticated
using (family_id is not null and family_id = (select private.current_user_family_id()));

create policy ai_bedtime_stories_insert_own_family
on public.ai_bedtime_stories
for insert to authenticated
with check (family_id is not null and family_id = (select private.current_user_family_id()));

create policy ai_bedtime_stories_update_own_family
on public.ai_bedtime_stories
for update to authenticated
using (family_id is not null and family_id = (select private.current_user_family_id()))
with check (family_id is not null and family_id = (select private.current_user_family_id()));

create policy ai_bedtime_stories_delete_own_family
on public.ai_bedtime_stories
for delete to authenticated
using (family_id is not null and family_id = (select private.current_user_family_id()));

drop policy if exists daily_compass_content_public_read on public.daily_compass_content;
create policy daily_compass_content_public_read
on public.daily_compass_content
for select to anon, authenticated
using (true);

commit;