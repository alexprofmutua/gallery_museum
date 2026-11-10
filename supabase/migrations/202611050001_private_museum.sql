begin;

create table public.ofm_visitors (
  museum text not null check (museum ~ '^[a-z0-9-]{1,64}$'),
  user_id uuid not null references auth.users(id) on delete cascade,
  seat smallint not null check (seat in (1, 2)),
  expires_at timestamptz not null default 'infinity',
  primary key (museum, user_id),
  unique (museum, seat)
);

create table public.ofm_access_limits (
  museum text not null,
  user_id uuid not null,
  window_start timestamptz not null,
  requests integer not null check (requests between 1 and 12),
  primary key (museum, user_id),
  foreign key (museum, user_id) references public.ofm_visitors(museum, user_id)
    on delete cascade
);

alter table public.ofm_visitors enable row level security;
alter table public.ofm_access_limits enable row level security;
revoke all on public.ofm_visitors, public.ofm_access_limits from public, anon, authenticated;

-- Called under the visitor JWT by the Edge Function. An atomic upsert caps
-- concurrent grants. Storage itself remains accessible only to server roles.
create function public.ofm_grant_access(museum_id text)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  visitor uuid := auth.uid();
  granted_at timestamptz := pg_catalog.statement_timestamp();
  membership_end timestamptz;
begin
  select expires_at into membership_end
  from public.ofm_visitors
  where museum = museum_id and user_id = visitor and expires_at > granted_at
  for share;
  if not found then return 'denied'; end if;

  insert into public.ofm_access_limits as limits (museum, user_id, window_start, requests)
  values (museum_id, visitor, granted_at, 1)
  on conflict (museum, user_id) do update
    set requests = case when limits.window_start <= granted_at - interval '1 minute'
      then 1 else limits.requests + 1 end,
    window_start = case when limits.window_start <= granted_at - interval '1 minute'
      then granted_at else limits.window_start end
    where limits.requests < 12 or limits.window_start <= granted_at - interval '1 minute';
  if not found then return 'limited'; end if;

  -- The grant never extends past the end of a temporary membership.
  if membership_end = 'infinity'::timestamptz then return '1800'; end if;
  return least(1800, floor(extract(epoch from (membership_end - granted_at))))::integer::text;
end;
$$;
revoke all on function public.ofm_grant_access(text) from public, anon;
grant execute on function public.ofm_grant_access(text) to authenticated;

create function public.ofm_can_join(topic text)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.ofm_visitors
    where user_id = (select auth.uid())
      and 'ofm:' || museum = topic
      and expires_at > pg_catalog.statement_timestamp()
  );
$$;
revoke all on function public.ofm_can_join(text) from public, anon;
grant execute on function public.ofm_can_join(text) to authenticated;

create policy "Museum members read visit messages" on realtime.messages
  for select to authenticated using (
    extension in ('broadcast', 'presence')
    and (select public.ofm_can_join(realtime.topic()))
  );
create policy "Museum members send visit messages" on realtime.messages
  for insert to authenticated with check (
    extension in ('broadcast', 'presence')
    and (select public.ofm_can_join(realtime.topic()))
  );

-- Require membership even if another permissive policy already exists.
create policy "Museum topics require membership" on realtime.messages as restrictive
  for all to authenticated
  using (coalesce((select realtime.topic()), '') not like 'ofm:%'
    or (select public.ofm_can_join(realtime.topic())))
  with check (coalesce((select realtime.topic()), '') not like 'ofm:%'
    or (select public.ofm_can_join(realtime.topic())));
create policy "Anonymous users cannot join museum topics" on realtime.messages as restrictive
  for all to anon
  using (coalesce((select realtime.topic()), '') not like 'ofm:%')
  with check (coalesce((select realtime.topic()), '') not like 'ofm:%');

insert into storage.buckets (id, name, public) values ('museum-private', 'museum-private', false);
create policy "Museum files are delivered by the access function" on storage.objects as restrictive
  for all to anon, authenticated
  using (bucket_id <> 'museum-private')
  with check (bucket_id <> 'museum-private');

commit;
