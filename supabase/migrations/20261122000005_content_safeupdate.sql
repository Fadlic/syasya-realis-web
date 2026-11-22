-- =====================================================================
-- Syasya&Realis — Publish / Discard / Restore work through the API
-- Run AFTER 20261122000004_visitor_presence.sql.
--
-- Supabase loads the "safeupdate" extension for API sessions
-- (role authenticator: session_preload_libraries = supautils, safeupdate).
-- It refuses any UPDATE without a WHERE clause, so the three content
-- functions failed from the admin panel with
--   "UPDATE requires a WHERE clause".
-- They update every row of site_content on purpose (one row per area), so
-- the fix is an explicit WHERE that matches all rows. Behaviour is unchanged.
-- =====================================================================

create or replace function public.publish_content(p_note text default null) returns bigint
language plpgsql security definer set search_path = public, extensions as $$
declare v_id bigint; v_snap jsonb;
begin
  if not public.is_admin() then raise exception 'not allowed' using errcode = '42501'; end if;
  update public.site_content set published = draft, published_at = now(), updated_by = auth.uid()
    where key is not null;   -- every area (safeupdate needs a WHERE)
  select jsonb_object_agg(key, published) into v_snap from public.site_content;
  insert into public.content_versions (snapshot, note, published_by, published_name)
    values (v_snap, left(p_note, 200), auth.uid(), public.actor_name()) returning id into v_id;
  insert into public.activity_log (actor, actor_name, category, action) values (auth.uid(), public.actor_name(), 'Content', 'Published website content (v' || v_id || ')');
  return v_id;
end $$;

create or replace function public.restore_version(p_id bigint) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare v_snap jsonb;
begin
  if not public.is_admin() then raise exception 'not allowed' using errcode = '42501'; end if;
  select snapshot into v_snap from public.content_versions where id = p_id;
  if v_snap is null then raise exception 'version not found'; end if;
  update public.site_content c set draft = coalesce(v_snap -> c.key, '{}'::jsonb), updated_by = auth.uid()
    where c.key is not null;   -- every area (safeupdate needs a WHERE)
  insert into public.activity_log (actor, actor_name, category, action) values (auth.uid(), public.actor_name(), 'Content', 'Restored v' || p_id || ' as draft');
end $$;

create or replace function public.discard_drafts() returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public.is_admin() then raise exception 'not allowed' using errcode = '42501'; end if;
  update public.site_content set draft = published, updated_by = auth.uid()
    where key is not null;   -- every area (safeupdate needs a WHERE)
end $$;

-- "create or replace" keeps the existing grants (authenticated only); restated for clarity
revoke all on function public.publish_content(text), public.restore_version(bigint), public.discard_drafts() from public, anon;
grant execute on function public.publish_content(text), public.restore_version(bigint), public.discard_drafts() to authenticated;
