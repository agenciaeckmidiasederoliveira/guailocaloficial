import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { gerarSitemapXml } from '../../lib/seo'

export default function SitemapXml() {
  const [xml, setXml] = useState('<?xml version="1.0" encoding="UTF-8"?><urlset></urlset>')

  useEffect(() => {
    void carregar()
  }, [])

  async function carregar() {
    const [{ data: empresas }, { data: cidades }, { data: categoriasCidade }, { data: artigos }] = await Promise.all([
      supabase.from('empresas').select('slug,plano,atualizado_em,criado_em').eq('ativa', true),
      supabase.from('cidades').select('slug,estados(uf)').order('nome'),
      supabase.from('empresas').select('slug,cidades(slug,estados(uf)),categorias(slug)').eq('ativa', true),
      supabase.from('artigos').select('slug').eq('publicado', true),
    ])

    const categoriasUnicas = Array.from(
      new Map(
        (categoriasCidade || []).map((item: any) => [
          `${item.cidades?.estados?.uf}-${item.cidades?.slug}-${item.categorias?.slug}`,
          {
            estadoUf: item.cidades?.estados?.uf,
            cidadeSlug: item.cidades?.slug,
            categoriaSlug: item.categorias?.slug,
          },
        ])
      ).values()
    )

    setXml(
      gerarSitemapXml({
        empresas: empresas || [],
        cidades: cidades || [],
        categoriasCidade: categoriasUnicas,
        artigos: artigos || [],
      })
    )
  }

  return <pre className="whitespace-pre-wrap break-all p-4 text-xs">{xml}</pre>
}
