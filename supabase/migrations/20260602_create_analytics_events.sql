create extension if not exists pgcrypto;

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  tipo text not null,
  empresa_id uuid null references public.empresas(id) on delete cascade,
  tenant_id uuid null,
  user_id uuid null references auth.users(id) on delete set null,
  session_id text null,
  referrer text null,
  cidade text null,
  termo_busca text null,
  metadata jsonb null,
  ip_hash text null,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_empresa_id_idx on public.analytics_events (empresa_id);
create index if not exists analytics_events_tipo_idx on public.analytics_events (tipo);
create index if not exists analytics_events_created_at_idx on public.analytics_events (created_at desc);
create index if not exists analytics_events_tenant_id_idx on public.analytics_events (tenant_id);

alter table public.analytics_events enable row level security;

drop policy if exists "analytics_events_insert_all" on public.analytics_events;
create policy "analytics_events_insert_all"
on public.analytics_events
for insert
to anon, authenticated
with check (true);

drop policy if exists "analytics_events_admin_select" on public.analytics_events;
create policy "analytics_events_admin_select"
on public.analytics_events
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

drop policy if exists "analytics_events_partner_select" on public.analytics_events;
create policy "analytics_events_partner_select"
on public.analytics_events
for select
to authenticated
using (
  exists (
    select 1
    from public.empresas
    join public.parceiros on parceiros.id = empresas.parceiro_id
    where empresas.id = analytics_events.empresa_id
      and parceiros.profile_id = auth.uid()
  )
);
