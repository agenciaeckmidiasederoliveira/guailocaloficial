import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, Star } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { clicarWhatsapp } from '../../lib/analytics'

type Props = {
  cidade: string
  uf: string
  tenantId?: string | null
}

export default function CarrosselDestaque({ cidade, uf, tenantId }: Props) {
  const [empresas, setEmpresas] = useState<any[]>([])
  const [index, setIndex] = useState(0)

  useEffect(() => {
    void carregar()
  }, [cidade, uf, tenantId])

  useEffect(() => {
    if (empresas.length <= 1) return
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % empresas.length)
    }, 4000)
    return () => window.clearInterval(timer)
  }, [empresas.length])

  async function carregar() {
    const hoje = new Date().toISOString().slice(0, 10)

    const { data: destaques } = await supabase
      .from('empresa_destaques')
      .select('*, empresas(*)')
      .eq('cidade', cidade)
      .eq('uf', uf)
      .eq('tipo', 'carrossel')
      .eq('ativo', true)
      .gte('data_fim', hoje)
      .order('posicao', { ascending: true })
      .limit(5)

    const pagos = (destaques || []).map((item: any) => ({
      ...item.empresas,
      isDestaquePago: true,
    }))

    if (pagos.length >= 5) {
      setEmpresas(pagos)
      return
    }

    let fallbackQuery = supabase
      .from('empresas')
      .select('*')
      .eq('ativa', true)

    if (tenantId) {
      fallbackQuery = fallbackQuery.eq('tenant_id', tenantId)
    }

    const { data: fallback } = await fallbackQuery
      .ilike('descricao', '%')
      .order('score_completude', { ascending: false })
      .limit(10)

    const usados = new Set(pagos.map((empresa: any) => empresa.id))
    const complementares = (fallback || [])
      .filter((empresa: any) => !usados.has(empresa.id))
      .slice(0, 5 - pagos.length)
      .map((empresa: any) => ({ ...empresa, isDestaquePago: false }))

    setEmpresas([...pagos, ...complementares])
  }

  const empresaAtual = useMemo(() => empresas[index] || null, [empresas, index])

  if (!empresaAtual) return null

  return (
    <div className="overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-r from-[#111827] via-[#0f172a] to-[#1f2937] shadow-2xl">
      <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr]">
        <div className="relative min-h-[240px]">
          {empresaAtual.foto_principal ? (
            <img src={empresaAtual.foto_principal} alt={empresaAtual.nome} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full min-h-[240px] items-center justify-center bg-slate-900 text-6xl font-black text-slate-700">
              {empresaAtual.nome?.charAt(0)}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-black/50" />
        </div>

        <div className="flex flex-col justify-between p-6 text-white">
          <div>
            {empresaAtual.isDestaquePago && (
              <span className="mb-3 inline-flex rounded-full bg-amber-400 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-950">
                Destaque
              </span>
            )}
            <h3 className="text-2xl font-black">{empresaAtual.nome}</h3>
            <p className="mt-2 text-sm text-slate-300">{empresaAtual.categoria_nome || empresaAtual.categorias?.nome || 'Empresa local'}</p>
            <div className="mt-4 inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-amber-300">
              <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
              Score {empresaAtual.score_completude || 0}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link to={`/empresa/${empresaAtual.slug}`} className="rounded-xl bg-white px-4 py-2 text-sm font-black text-slate-950">
              Ver perfil
            </Link>
            {empresaAtual.whatsapp && (
              <a
                href={`https://wa.me/${empresaAtual.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                onClick={() => void clicarWhatsapp(empresaAtual.id, { cidade, origem: 'carrossel_destaque' })}
                className="inline-flex items-center rounded-xl bg-emerald-500 px-4 py-2 text-sm font-black text-slate-950"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                WhatsApp
              </a>
            )}
          </div>

          {empresas.length > 1 && (
            <div className="mt-5 flex gap-2">
              {empresas.map((_, bulletIndex) => (
                <button
                  key={bulletIndex}
                  onClick={() => setIndex(bulletIndex)}
                  className={`h-2.5 rounded-full transition-all ${bulletIndex === index ? 'w-8 bg-amber-400' : 'w-2.5 bg-white/30'}`}
                  aria-label={`Ir para destaque ${bulletIndex + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
