const SITE_URL = 'https://guialocalbr.com.br'
const DEFAULT_OG_IMAGE = `${SITE_URL}/favicon.svg`

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function getEmpresaUrl(slug?: string | null) {
  return `${SITE_URL}/empresa/${slug || ''}`
}

export function getEmpresaTitle(empresa: any) {
  return `${empresa.nome} | ${empresa.categorias?.nome || 'Empresa'} em ${empresa.cidades?.nome}/${empresa.cidades?.estados?.uf} - Guia Local BR`
}

export function getEmpresaDescription(empresa: any) {
  const base = empresa.seo_descricao || empresa.descricao_otimizada || empresa.descricao || `Conheça ${empresa.nome} no Guia Local BR.`
  return String(base).slice(0, 160)
}

export function getEmpresaOgImage(empresa: any) {
  if (empresa.fotos?.length) return empresa.fotos[0]
  return empresa.foto_principal || DEFAULT_OG_IMAGE
}

export function gerarSchemaBusiness(empresa: any): string {
  const imagens = [empresa.foto_principal, ...(empresa.fotos || [])].filter(Boolean).slice(0, 2)

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: empresa.nome,
    description: empresa.descricao_otimizada || empresa.descricao,
    address: {
      '@type': 'PostalAddress',
      addressLocality: empresa.cidades?.nome,
      addressRegion: empresa.cidades?.estados?.uf,
      addressCountry: 'BR',
    },
    telephone: empresa.telefone || empresa.whatsapp || undefined,
    url: getEmpresaUrl(empresa.slug),
    image: imagens,
    aggregateRating:
      empresa.nota_media && empresa.total_avaliacoes
        ? {
            '@type': 'AggregateRating',
            ratingValue: String(empresa.nota_media),
            reviewCount: String(empresa.total_avaliacoes),
          }
        : undefined,
  }

  return JSON.stringify(schema, null, 2)
}

export function gerarSitemapXml(params: {
  empresas: any[]
  cidades: any[]
  categoriasCidade: Array<{ estadoUf?: string | null; cidadeSlug?: string | null; categoriaSlug?: string | null }>
  artigos?: any[]
}) {
  const { empresas, cidades, categoriasCidade, artigos = [] } = params
  const linhas: string[] = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']

  linhas.push(`<url><loc>${SITE_URL}/</loc><priority>1.0</priority></url>`)

  cidades.forEach((cidade) => {
    const loc = `${SITE_URL}/${cidade.estados?.uf?.toLowerCase()}/${cidade.slug}`
    linhas.push(`<url><loc>${escapeXml(loc)}</loc><priority>0.8</priority></url>`)
  })

  categoriasCidade.forEach((item) => {
    if (!item.estadoUf || !item.cidadeSlug || !item.categoriaSlug) return
    const loc = `${SITE_URL}/${item.estadoUf.toLowerCase()}/${item.cidadeSlug}?categoria=${item.categoriaSlug}`
    linhas.push(`<url><loc>${escapeXml(loc)}</loc><priority>0.6</priority></url>`)
  })

  empresas.forEach((empresa) => {
    const loc = getEmpresaUrl(empresa.slug)
    const priority = empresa.plano === 'premium' ? '0.8' : '0.5'
    const lastmod = empresa.atualizado_em || empresa.criado_em
    linhas.push(
      `<url><loc>${escapeXml(loc)}</loc><priority>${priority}</priority>${lastmod ? `<lastmod>${new Date(lastmod).toISOString()}</lastmod>` : ''}</url>`
    )
  })

  artigos.forEach((artigo) => {
    const loc = `${SITE_URL}/blog/${artigo.slug}`
    linhas.push(`<url><loc>${escapeXml(loc)}</loc><priority>0.6</priority></url>`)
  })

  linhas.push('</urlset>')
  return linhas.join('\n')
}

export function gerarRobotsTxt() {
  return `User-agent: *
Allow: /
Disallow: /admin
Disallow: /parceiro
Disallow: /area-parceiro

Sitemap: ${SITE_URL}/sitemap.xml`
}
