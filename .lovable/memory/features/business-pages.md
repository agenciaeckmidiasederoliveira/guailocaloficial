---
name: Business Pages (Landing IA por empresa)
description: Landing pages personalizadas + subpáginas de serviço SEO geradas por IA. Rotas /negocio/:slug e /negocio/:slug/:servico, edge functions generate-business-page e generate-service-pages, admin /admin/paginas-clientes, dashboard cliente /minha-pagina
type: feature
---
# Business Pages — Landing personalizada + SEO long-tail

Sistema de mini-sites por empresa com subpáginas longtail de serviço, gerados por IA.

## Tabelas
- `business_pages`: landing principal (1 por empresa). Status pendente|gerando|ativo|pausado|erro. Conteúdo IA (hero/sobre/servicos/diferenciais/faq/blog/depoimentos), SEO, configs (cor_primaria/whatsapp/horario/agendamento), fotos, métricas estimadas + reais.
- `business_service_pages`: subpáginas de serviço (filhas via page_id). Slug único por página principal (page_id, slug_servico). Status ativo|pausado. Conteúdo IA (hero/intro/secoes/faq/schema), métricas próprias.
- RLS: leitura pública apenas se status='ativo' (admin e dono também veem); dono atualiza; admin tudo; service_role insere/atualiza.

## Edge functions
- `generate-business-page` (POST {business_id}): Gemini Flash + tool calling. Cria/atualiza landing principal. Schema LocalBusiness. Trata 429/402.
- `generate-service-pages` (POST {business_id, quantidade?, servicos?}): Gera N subpáginas longtail (serviço × cidade). Pula slugs existentes. Throttle 400ms entre chamadas. Para em 429/402.

## Frontend
- `/negocio/:slug` → `BusinessLanding` (hero, serviços, sobre, diferenciais, galeria, depoimentos, agendamento, blog, FAQ, CTA, footer GuiaLocalBR). Rastreia views e contatos.
- `/negocio/:slug/:servico` → `BusinessServicePage` (breadcrumb, hero, intro, seções, FAQ, CTA WhatsApp pré-preenchido). Métricas próprias.
- `/minha-pagina` → `MinhaPagina` (dashboard do dono): mostra "X URLs indexáveis", botão para gerar landing principal, botões 10/20/40 subpáginas (premium), métricas por página/subpágina. Free vê CTA upgrade.
- Admin `/admin/paginas-clientes`: stats, geração em lote, tabela com ações (regenerar, pausar, excluir, **gerar subpáginas via ícone Layers**).

## App.tsx
- `/minha-pagina`, `/negocio/:slug`, `/negocio/:slug/:servico` adicionadas antes do `*` 404.

## Header
- Item "Minha Página" no dropdown do user (acessível a todo logado).

## Sitemap
`sitemap-xml` lista business_pages ativas (priority 0.9) E business_service_pages ativas (priority 0.8) com slug pai resolvido.
