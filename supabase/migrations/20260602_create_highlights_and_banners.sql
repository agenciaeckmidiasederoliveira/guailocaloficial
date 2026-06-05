create table if not exists public.empresa_destaques (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  cidade text not null,
  uf text not null,
  tipo text not null check (tipo in ('carrossel', 'banner_topo')),
  posicao int null,
  valor_mensal numeric not null default 0,
  ativo boolean not null default true,
  data_inicio date not null,
  data_fim date not null,
  created_at timestamptz not null default now()
);

create table if not exists public.banners_cidade (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid null references public.empresas(id) on delete cascade,
  tenant_id uuid null references public.tenants(id) on delete set null,
  cidade text not null,
  uf text not null,
  categoria text null,
  titulo text not null,
  subtitulo text null,
  url_imagem text null,
  url_destino text null,
  cor_fundo text not null default '#1E5BA8',
  ativo boolean not null default true,
  data_inicio date not null,
  data_fim date not null,
  criado_por_parceiro_id uuid null references public.parceiros(id) on delete set null
);

alter table public.empresa_destaques enable row level security;
alter table public.banners_cidade enable row level security;

drop policy if exists "empresa_destaques_public_read" on public.empresa_destaques;
create policy "empresa_destaques_public_read"
on public.empresa_destaques
for select
to anon, authenticated
using (ativo = true);

drop policy if exists "empresa_destaques_admin_all" on public.empresa_destaques;
create policy "empresa_destaques_admin_all"
on public.empresa_destaques
for all
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
);

drop policy if exists "banners_cidade_public_read" on public.banners_cidade;
create policy "banners_cidade_public_read"
on public.banners_cidade
for select
to anon, authenticated
using (ativo = true);

drop policy if exists "banners_cidade_admin_all" on public.banners_cidade;
create policy "banners_cidade_admin_all"
on public.banners_cidade
for all
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
);

create index if not exists empresa_destaques_lookup_idx
  on public.empresa_destaques (cidade, uf, tipo, ativo, data_fim);

create index if not exists banners_cidade_lookup_idx
  on public.banners_cidade (cidade, uf, categoria, tenant_id, ativo, data_fim);
