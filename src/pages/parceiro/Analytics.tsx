import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { BarChart3, Building2, Eye, Globe, MessageCircle, Phone } from 'lucide-react'
import { supabase } from '../../lib/supabase'

type EmpresaBase = {
  id: string
  nome: string
  plano: string | null
  slug: string | null
  cidades?: { nome?: string | null; estados?: { uf?: string | null } | null } | null
}

type EventoRow = {
  empresa_id: string | null
  tipo: string
  created_at: string
}

type EmpresaStats = EmpresaBase & {
  views: number
  whatsapp: number
  site: number
  phone: number
}

type DashboardData = {
  resumo: {
    views: number
    whatsapp: number
    site: number
    phone: number
  }
  empresas: EmpresaStats[]
  timeline: { dia: string; views: number }[]
}

function skeletonRows(total: number) {
  return Array.from({ length: total }).map((_, index) => index)
}

function formatDayLabel(date: Date) {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export default function AnalyticsParceiro() {
  const [loading, setLoading] = useState(true)
  const [hasCompanies, setHasCompanies] = useState(false)
  const [data, setData] = useState<DashboardData>({
    resumo: { views: 0, whatsapp: 0, site: 0, phone: 0 },
    empresas: [],
    timeline: [],
  })

  useEffect(() => {
    void carregarAnalytics()
  }, [])

  async function carregarAnalytics() {
    setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setData({
          resumo: { views: 0, whatsapp: 0, site: 0, phone: 0 },
          empresas: [],
          timeline: [],
        })
        setHasCompanies(false)
        return
      }

      const { data: parceiro } = await supabase
        .from('parceiros')
        .select('id')
        .eq('profile_id', user.id)
        .maybeSingle()

      if (!parceiro?.id) {
        setData({
          resumo: { views: 0, whatsapp: 0, site: 0, phone: 0 },
          empresas: [],
          timeline: [],
        })
        setHasCompanies(false)
        return
      }

      const { data: empresas } = await supabase
        .from('empresas')
        .select('id,nome,plano,slug,cidades(nome,estados(uf))')
        .eq('parceiro_id', parceiro.id)
        .order('nome')

      const empresasUsuario = (empresas || []) as EmpresaBase[]
      const empresaIds = empresasUsuario.map((empresa) => empresa.id)

      if (empresaIds.length === 0) {
        setData({
          resumo: { views: 0, whatsapp: 0, site: 0, phone: 0 },
          empresas: [],
          timeline: [],
        })
        setHasCompanies(false)
        return
      }

      setHasCompanies(true)

      const since = new Date()
      since.setDate(since.getDate() - 29)
      since.setHours(0, 0, 0, 0)

      const { data: eventos } = await supabase
        .from('analytics_events')
        .select('empresa_id,tipo,created_at')
        .in('empresa_id', empresaIds)
        .in('tipo', ['page_view', 'whatsapp_click', 'site_click', 'phone_click'])
        .order('created_at', { ascending: false })

      const eventosLista = (eventos || []) as EventoRow[]
      const statsByEmpresa = new Map<string, EmpresaStats>()

      empresasUsuario.forEach((empresa) => {
        statsByEmpresa.set(empresa.id, {
          ...empresa,
          views: 0,
          whatsapp: 0,
          site: 0,
          phone: 0,
        })
      })

      const timelineMap = new Map<string, number>()
      for (let i = 0; i < 30; i += 1) {
        const day = new Date(since)
        day.setDate(since.getDate() + i)
        timelineMap.set(formatDayLabel(day), 0)
      }

      const resumo = { views: 0, whatsapp: 0, site: 0, phone: 0 }

      eventosLista.forEach((evento) => {
        if (!evento.empresa_id) return

        const empresa = statsByEmpresa.get(evento.empresa_id)
        if (!empresa) return

        if (evento.tipo === 'page_view') {
          empresa.views += 1
          resumo.views += 1

          const createdAt = new Date(evento.created_at)
          if (createdAt >= since) {
            const key = formatDayLabel(createdAt)
            timelineMap.set(key, (timelineMap.get(key) || 0) + 1)
          }
        }

        if (evento.tipo === 'whatsapp_click') {
          empresa.whatsapp += 1
          resumo.whatsapp += 1
        }

        if (evento.tipo === 'site_click') {
          empresa.site += 1
          resumo.site += 1
        }

        if (evento.tipo === 'phone_click') {
          empresa.phone += 1
          resumo.phone += 1
        }
      })

      const timeline = Array.from(timelineMap.entries()).map(([dia, views]) => ({ dia, views }))
      const empresasStats = Array.from(statsByEmpresa.values()).sort((a, b) => b.views - a.views)

      setData({ resumo, empresas: empresasStats, timeline })
    } catch (error) {
      console.error('Erro ao carregar analytics do parceiro:', error)
      setData({
        resumo: { views: 0, whatsapp: 0, site: 0, phone: 0 },
        empresas: [],
        timeline: [],
      })
      setHasCompanies(false)
    } finally {
      setLoading(false)
    }
  }

  const cards = useMemo(
    () => [
      {
        label: 'Views totais',
        value: data.resumo.views,
        icon: Eye,
        tone: 'bg-blue-50 text-blue-700',
      },
      {
        label: 'Cliques WhatsApp',
        value: data.resumo.whatsapp,
        icon: MessageCircle,
        tone: 'bg-emerald-50 text-emerald-700',
      },
      {
        label: 'Cliques no site',
        value: data.resumo.site,
        icon: Globe,
        tone: 'bg-amber-50 text-amber-700',
      },
    ],
    [data.resumo]
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Minhas Estatisticas</h1>
          <p className="text-sm text-gray-500">
            Dados reais das empresas vinculadas ao usuario autenticado.
          </p>
        </div>
        {hasCompanies ? (
          <Link
            to="/parceiro/empresas/nova"
            className="inline-flex items-center gap-2 rounded-xl bg-[#1a365d] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#153054]"
          >
            <Building2 className="h-4 w-4" />
            Cadastrar empresa
          </Link>
        ) : null}
      </div>

      {loading ? (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {skeletonRows(3).map((item) => (
              <div key={item} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 w-24 rounded bg-gray-200" />
                  <div className="h-8 w-20 rounded bg-gray-300" />
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="animate-pulse space-y-4">
              <div className="h-5 w-48 rounded bg-gray-200" />
              <div className="h-72 rounded-2xl bg-gray-100" />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="animate-pulse space-y-3">
              <div className="h-5 w-40 rounded bg-gray-200" />
              {skeletonRows(4).map((item) => (
                <div key={item} className="h-16 rounded-xl bg-gray-100" />
              ))}
            </div>
          </div>
        </>
      ) : !hasCompanies ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center shadow-sm">
          <BarChart3 className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <h2 className="text-lg font-semibold text-gray-900">Nenhuma empresa cadastrada</h2>
          <p className="mt-2 text-sm text-gray-500">
            Cadastre sua primeira empresa para acompanhar views e cliques.
          </p>
          <Link
            to="/parceiro/empresas/nova"
            className="mt-5 inline-flex rounded-xl bg-[#1a365d] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#153054]"
          >
            Cadastrar empresa
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {cards.map((card) => {
              const Icon = card.icon
              return (
                <div key={card.label} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">{card.label}</p>
                      <h3 className="mt-2 text-3xl font-bold text-gray-900">
                        {card.value.toLocaleString('pt-BR')}
                      </h3>
                    </div>
                    <div className={`rounded-full p-3 ${card.tone}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Views nos ultimos 30 dias</h2>
                <p className="text-sm text-gray-500">Evolucao diaria consolidada das suas empresas.</p>
              </div>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.timeline}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="dia" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="views" stroke="#1A9B6A" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Empresas e stats individuais</h2>
            <div className="space-y-3">
              {data.empresas.map((empresa) => (
                <div
                  key={empresa.id}
                  className="flex flex-col gap-4 rounded-2xl border border-gray-100 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{empresa.nome}</h3>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                        {empresa.plano || 'sem plano'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {empresa.cidades?.nome}
                      {empresa.cidades?.estados?.uf ? `, ${empresa.cidades.estados.uf}` : ''}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    <div className="rounded-xl bg-blue-50 px-3 py-2 text-sm">
                      <p className="text-gray-500">Views</p>
                      <p className="font-semibold text-gray-900">{empresa.views}</p>
                    </div>
                    <div className="rounded-xl bg-emerald-50 px-3 py-2 text-sm">
                      <p className="text-gray-500">WhatsApp</p>
                      <p className="font-semibold text-gray-900">{empresa.whatsapp}</p>
                    </div>
                    <div className="rounded-xl bg-amber-50 px-3 py-2 text-sm">
                      <p className="text-gray-500">Site</p>
                      <p className="font-semibold text-gray-900">{empresa.site}</p>
                    </div>
                    <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm">
                      <p className="text-gray-500">Telefone</p>
                      <p className="font-semibold text-gray-900">{empresa.phone}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
