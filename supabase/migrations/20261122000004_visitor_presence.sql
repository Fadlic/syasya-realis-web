-- =====================================================================
-- Syasya&Realis — private visitor list (audit finding K6)
-- Run AFTER 20261122000003_hardening.sql.
--
-- Before: website visitors announced themselves on the PUBLIC Realtime
-- presence channel "site-visitors". Anyone with the publishable key could
-- join it, read every visitor's ID, page and device, and add fake visitors
-- to the admin's list.
--
-- After: each visitor sends a small heartbeat (RPC visitor_ping) every 30 s.
-- It can only write ITS OWN row; nobody but signed-in team members (is_admin:
-- team member + 2FA) can read the table. The admin board lists visitors whose
-- last heartbeat is under 90 seconds old (a closed tab drops off after that).
-- Old rows are removed every hour.
-- =====================================================================

create table if not exists public.visitor_presence (
  visitor_id uuid primary key references auth.users(id) on delete cascade,
  page       text not null default 'Hero' check (char_length(page) <= 60),
  device     text check (char_length(device) <= 60),
  visit      text not null default 'New' check (visit in ('New', 'Returning')),
  since      timestamptz not null default now(),
  seen_at    timestamptz not null default now()
);
create index if not exists visitor_presence_seen_at_idx on public.visitor_presence (seen_at);

alter table public.visitor_presence enable row level security;
revoke all on public.visitor_presence from public, anon, authenticated;
grant select on public.visitor_presence to authenticated;
drop policy if exists visitor_presence_read on public.visitor_presence;
create policy visitor_presence_read on public.visitor_presence for select to authenticated
  using ((select public.is_admin()));

-- Heartbeat: insert or refresh the caller's own row. Inputs are trimmed to the
-- column limits so a tampered client cannot make the call fail on purpose.
create or replace function public.visitor_ping(p_page text default null, p_device text default null, p_visit text default null)
returns void
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not signed in' using errcode = '42501'; end if;
  insert into public.visitor_presence as vp (visitor_id, page, device, visit)
  values (v_uid,
          coalesce(nullif(left(btrim(coalesce(p_page, '')), 60), ''), 'Hero'),
          nullif(left(btrim(coalesce(p_device, '')), 60), ''),
          case when p_visit = 'Returning' then 'Returning' else 'New' end)
  on conflict (visitor_id) do update
    set page    = excluded.page,
        device  = excluded.device,
        visit   = excluded.visit,
        -- a visitor who was away for more than 10 minutes starts a new visit
        since   = case when vp.seen_at < now() - interval '10 minutes' then now() else vp.since end,
        seen_at = now()
    -- refreshing more than once every 5 seconds is ignored (no write)
    where vp.seen_at < now() - interval '5 seconds' or vp.page is distinct from excluded.page;
end $$;

revoke execute on function public.visitor_ping(text, text, text) from public, anon;
grant execute on function public.visitor_ping(text, text, text) to authenticated;

-- Clean-up: rows with no heartbeat for an hour are deleted (minute 7 of every hour)
create or replace function public.purge_visitor_presence()
returns void
language sql security definer set search_path = '' as $$
  delete from public.visitor_presence where seen_at < now() - interval '1 hour';
$$;
revoke execute on function public.purge_visitor_presence() from public, anon, authenticated;
select cron.schedule('purge-visitor-presence', '7 * * * *', $$select public.purge_visitor_presence()$$);
