create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  nome_cidade text not null,
  uf text not null,
  parceiro_id uuid null references public.parceiros(id) on delete set null,
  dominio_customizado text null,
  subdominio text null,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.tenants enable row level security;

drop policy if exists "tenants_public_read" on public.tenants;
create policy "tenants_public_read"
on public.tenants
for select
to anon, authenticated
using (ativo = true or exists (
  select 1 from public.profiles
  where profiles.id = auth.uid()
    and profiles.role = 'admin'
));

drop policy if exists "tenants_admin_all" on public.tenants;
create policy "tenants_admin_all"
on public.tenants
for all
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

alter table public.empresas
  add column if not exists tenant_id uuid null references public.tenants(id) on delete set null;

create index if not exists empresas_tenant_id_idx on public.empresas (tenant_id);
