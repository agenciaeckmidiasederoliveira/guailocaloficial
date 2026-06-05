import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { trackEvent } from '../../lib/analytics'

type Props = {
  cidade: string
  uf: string
  categoria?: string | null
  tenantId?: string | null
}

export default function BannerCidade({ cidade, uf, categoria, tenantId }: Props) {
  const [banner, setBanner] = useState<any>(null)

  useEffect(() => {
    void carregar()
  }, [cidade, uf, categoria, tenantId])

  async function carregar() {
    const hoje = new Date().toISOString().slice(0, 10)

    let query = supabase
      .from('banners_cidade')
      .select('*')
      .eq('cidade', cidade)
      .eq('uf', uf)
      .eq('ativo', true)
      .gte('data_fim', hoje)
      .order('categoria', { ascending: false })
      .limit(5)

    if (tenantId) {
      query = query.eq('tenant_id', tenantId)
    }

    const { data } = await query

    const escolhido =
      (data || []).find((item: any) => item.categoria && categoria && item.categoria === categoria) ||
      (data || []).find((item: any) => !item.categoria) ||
      null

    setBanner(escolhido)
  }

  if (!banner) return null

  return (
    <a
      href={banner.url_destino || '#'}
      target="_blank"
      rel="noreferrer"
      onClick={() => void trackEvent('banner_click', banner.empresa_id, { cidade, categoria, origem: 'banner_cidade' })}
      className="block overflow-hidden rounded-3xl border border-white/10 shadow-xl"
      style={{ background: banner.cor_fundo || '#1E5BA8' }}
    >
      <div className="grid grid-cols-1 items-center gap-5 p-6 md:grid-cols-[1fr_auto]">
        <div className="flex items-center gap-4">
          {banner.url_imagem ? (
            <img src={banner.url_imagem} alt={banner.titulo} className="h-20 w-28 rounded-2xl object-cover" />
          ) : null}
          <div className="text-white">
            <p className="text-xl font-black">{banner.titulo}</p>
            {banner.subtitulo && <p className="mt-1 text-sm text-white/80">{banner.subtitulo}</p>}
          </div>
        </div>
        <div className="inline-flex items-center rounded-xl bg-white px-4 py-2 text-sm font-black text-slate-950">
          Saiba mais
          <ArrowRight className="ml-2 h-4 w-4" />
        </div>
      </div>
    </a>
  )
}
