-- =====================================================================
-- Syasya&Realis — hardening after the 22 Nov 2026 audit
-- Run AFTER 20261119000001_studio_core.sql and 20261122000001_content_cms.sql.
-- Nothing here changes what the website or the admin board can do today;
-- it removes rights nobody uses and switches on the scheduled clean-up.
-- =====================================================================

-- ---------------------------------------------------------------------
-- K7 · least privilege on the content tables
-- (RLS already blocks the rows; these grants were simply never needed)
-- ---------------------------------------------------------------------
revoke all on public.site_content, public.content_versions, public.media_assets from anon, authenticated;
grant select on public.site_content to authenticated;
grant update (draft, updated_at, updated_by) on public.site_content to authenticated;
grant select on public.content_versions to authenticated;
grant select, insert, update, delete on public.media_assets to authenticated;

-- ---------------------------------------------------------------------
-- K10 · internal functions are not part of the public API
-- Postgres grants EXECUTE to PUBLIC by default, so revoke from PUBLIC first.
-- ---------------------------------------------------------------------
-- trigger functions: EXECUTE is only checked when a trigger is created
revoke execute on function public.audit_briefs(), public.audit_campaigns(), public.audit_enquiries(),
  public.audit_settings(), public.audit_team(), public.touch_updated_at() from public, anon, authenticated;
-- used only inside other SECURITY DEFINER functions
revoke execute on function public.actor_name() from public, anon, authenticated;
-- used by RLS policies, which are evaluated as the signed-in role: keep for authenticated only
revoke execute on function public.is_admin(), public.is_owner(), public.can_send_popups() from public, anon;
grant execute on function public.is_admin(), public.is_owner(), public.can_send_popups() to authenticated;
-- need a signed-in user (admin, or an anonymous visitor for pop-ups)
revoke execute on function public.record_sign_in(text) from public, anon;
grant execute on function public.record_sign_in(text) to authenticated;
revoke execute on function public.get_delivery_campaign(uuid) from public, anon;
grant execute on function public.get_delivery_campaign(uuid) to authenticated;
revoke execute on function public.popup_event(uuid, public.delivery_status, uuid) from public, anon;
grant execute on function public.popup_event(uuid, public.delivery_status, uuid) to authenticated;
-- helper used by get_live_campaign / get_delivery_campaign (they run as owner)
revoke execute on function public.campaign_public(public.campaigns) from public, anon, authenticated;
-- project helper created outside our migrations (event trigger); never called by clients
do $$ begin
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'rls_auto_enable') then
    execute 'revoke execute on function public.rls_auto_enable() from public, anon, authenticated';
  end if;
end $$;
-- still public on purpose: submit_enquiry, get_live_campaign, get_published_content

-- ---------------------------------------------------------------------
-- K11 · fixed search_path on every function
-- ---------------------------------------------------------------------
alter function public.campaign_public(public.campaigns) set search_path = public;
alter function public.touch_updated_at() set search_path = public;

-- ---------------------------------------------------------------------
-- P5 · indexes on foreign keys, and RLS that evaluates auth.uid() once per query
-- ---------------------------------------------------------------------
create index if not exists briefs_enquiry_idx        on public.briefs (enquiry_id);
create index if not exists briefs_created_by_idx     on public.briefs (created_by);
create index if not exists campaigns_created_by_idx  on public.campaigns (created_by);
create index if not exists enquiries_campaign_idx    on public.enquiries (campaign_id);
create index if not exists enquiries_created_by_idx  on public.enquiries (created_by);
create index if not exists content_versions_by_idx   on public.content_versions (published_by);
create index if not exists media_assets_by_idx       on public.media_assets (created_by);
create index if not exists settings_updated_by_idx   on public.settings (updated_by);
create index if not exists site_content_by_idx       on public.site_content (updated_by);

alter policy team_delete on public.team_members using (public.is_owner() and user_id <> (select auth.uid()));
alter policy deliv_read_visitor on public.popup_deliveries using (visitor_id = (select auth.uid()));
alter policy media_insert on public.media_assets with check (public.is_admin() and created_by = (select auth.uid()));

-- form_throttle had no primary key
alter table public.form_throttle add column if not exists id bigint generated always as identity primary key;

-- ---------------------------------------------------------------------
-- K9 · scheduled clean-up: delete "Lost" enquiries after the retention
-- period set in the admin board, and activity log entries after 12 months.
-- Daily at 02:15 Asia/Jakarta (= 19:15 UTC).
-- ---------------------------------------------------------------------
create extension if not exists pg_cron with schema pg_catalog;
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;
select cron.schedule('purge-lost-enquiries', '15 19 * * *', $$select public.purge_lost_enquiries()$$);
