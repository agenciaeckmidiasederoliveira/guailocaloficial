import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { Activity, Eye, MessageCircle, Search, Store, Users } from 'lucide-react'

type FiltroPeriodo = 'today' | '7d' | '30d'

type Empresa = {
  id: string
  nome: string
  plano?: string | null
  cidades?: { nome?: string | null } | null
}

type Evento = {
  id: string
  empresa_id: string | null
  tipo: string
  termo_busca: string | null
  session_id: string | null
  created_at: string
}

const PIE_COLORS = ['#10B981', '#3B82F6', '#F59E0B']

function formatLabel(date: Date) {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function getPeriodoInicio(periodo: FiltroPeriodo) {
  const now = new Date()
  if (periodo === 'today') {
    now.setHours(0, 0, 0, 0)
    return now
  }

  const days = periodo === '7d' ? 6 : 29
  now.setDate(now.getDate() - days)
  now.setHours(0, 0, 0, 0)
  return now
}

function skeleton(total: number) {
  return Array.from({ length: total }).map((_, index) => index)
}

export default function AnalyticsAdmin() {
  const [periodo, setPeriodo] = useState<FiltroPeriodo>('30d')
  const [loading, setLoading] = useState(true)
  const [empresaTotal, setEmpresaTotal] = useState(0)
  const [usuariosRegistrados, setUsuariosRegistrados] = useState(0)
  const [visitantesAtivos, setVisitantesAtivos] = useState(0)
  const [resumo, setResumo] = useState({
    views: 0,
    whatsapp: 0,
    conversao: 0,
    buscas: 0,
    novosCadastros: 0,
  })
  const [timeline, setTimeline] = useState<Array<{ dia: string; views: number; clicks: number }>>([])
  const [pieData, setPieData] = useState<Array<{ name: string; value: number }>>([])
  const [topEmpresas, setTopEmpresas] = useState<any[]>([])
  const [topBuscas, setTopBuscas] = useState<Array<{ termo: string; total: number }>>([])

  useEffect(() => {
    void carregar()
  }, [periodo])

  async function carregar() {
    setLoading(true)

    try {
      const inicio = getPeriodoInicio(periodo)
      const inicioIso = inicio.toISOString()
      const agoraMenosCinco = new Date(Date.now() - 5 * 60 * 1000).toISOString()

      let empresasLista: Empresa[] = []
      let totalEmpresasAtivas = 0
      try {
        const [{ data: empresas }, { count: total }] = await Promise.all([
          supabase.from('empresas').select('id,nome,plano,criado_em,cidades(nome)'),
          supabase.from('empresas').select('id', { count: 'exact', head: true }).or('ativa.eq.true,status.eq.aprovado')
        ])
        empresasLista = (empresas || []) as Empresa[]
        totalEmpresasAtivas = total || 0
      } catch (e) {
        console.error('Erro carregando empresas', e)
      }

      let eventos: Evento[] = []
      let eventosAtivos: any[] = []
      try {
        const [{ data: eventosPeriodo }, { data: evtsAtivos }] = await Promise.all([
          supabase
            .from('analytics_events')
            .select('id,empresa_id,tipo,termo_busca,session_id,created_at')
            .gte('created_at', inicioIso),
          supabase
            .from('analytics_events')
            .select('session_id,created_at')
            .gt('created_at', agoraMenosCinco),
        ])
        eventos = (eventosPeriodo || []) as Evento[]
        eventosAtivos = evtsAtivos || []
      } catch (e) {
        console.warn('analytics_events table might not exist yet', e)
      }



      setEmpresaTotal(totalEmpresasAtivas || 0)
      setUsuariosRegistrados(empresasLista.length)
      setVisitantesAtivos(new Set((eventosAtivos || []).map((item: any) => item.session_id).filter(Boolean)).size)

      const views = eventos.filter((item) => item.tipo === 'page_view').length
      const whatsapp = eventos.filter((item) => item.tipo === 'whatsapp_click').length
      const buscas = eventos.filter((item) => item.tipo === 'busca').length
      const novosCadastros = empresasLista.filter((item: any) => new Date(item.criado_em) >= inicio).length
      const conversao = views > 0 ? Number(((whatsapp / views) * 100).toFixed(1)) : 0

      setResumo({ views, whatsapp, conversao, buscas, novosCadastros })

      const diaMap = new Map<string, { dia: string; views: number; clicks: number }>()
      const totalDias = periodo === 'today' ? 1 : periodo === '7d' ? 7 : 30

      for (let index = 0; index < totalDias; index += 1) {
        const dia = new Date(inicio)
        dia.setDate(inicio.getDate() + index)
        const label = formatLabel(dia)
        diaMap.set(label, { dia: label, views: 0, clicks: 0 })
      }

      eventos.forEach((evento) => {
        const chave = formatLabel(new Date(evento.created_at))
        const atual = diaMap.get(chave)
        if (!atual) return
        if (evento.tipo === 'page_view') atual.views += 1
        if (evento.tipo === 'whatsapp_click') atual.clicks += 1
      })

      setTimeline(Array.from(diaMap.values()))

      const siteClicks = eventos.filter((item) => item.tipo === 'site_click').length
      const phoneClicks = eventos.filter((item) => item.tipo === 'phone_click').length
      setPieData([
        { name: 'WhatsApp', value: whatsapp },
        { name: 'Site', value: siteClicks },
        { name: 'Telefone', value: phoneClicks },
      ])

      const empresaMap = new Map<string, any>()
      empresasLista.forEach((empresa) => {
        empresaMap.set(empresa.id, {
          id: empresa.id,
          empresa: empresa.nome,
          cidade: empresa.cidades?.nome || '—',
          plano: empresa.plano || 'gratis',
          views: 0,
          whatsapp: 0,
          conversao: 0,
        })
      })

      eventos.forEach((evento) => {
        if (!evento.empresa_id) return
        const atual = empresaMap.get(evento.empresa_id)
        if (!atual) return
        if (evento.tipo === 'page_view') atual.views += 1
        if (evento.tipo === 'whatsapp_click') atual.whatsapp += 1
      })

      const empresasTop = Array.from(empresaMap.values())
        .map((empresa) => ({
          ...empresa,
          conversao: empresa.views > 0 ? Number(((empresa.whatsapp / empresa.views) * 100).toFixed(1)) : 0,
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10)

      setTopEmpresas(empresasTop)

      const buscaMap = new Map<string, number>()
      eventos.forEach((evento) => {
        if (evento.tipo !== 'busca' || !evento.termo_busca) return
        const termo = evento.termo_busca.trim()
        if (!termo) return
        buscaMap.set(termo, (buscaMap.get(termo) || 0) + 1)
      })

      setTopBuscas(
        Array.from(buscaMap.entries())
          .map(([termo, total]) => ({ termo, total }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 10)
      )
    } catch (error) {
      console.error('Erro ao carregar analytics admin:', error)
    } finally {
      setLoading(false)
    }
  }

  const cards = useMemo(
    () => [
      { label: 'Sistema', value: 'Online', icon: Activity },
      { label: 'Usuarios registrados', value: usuariosRegistrados.toLocaleString('pt-BR'), icon: Users },
      { label: 'Visitantes ativos agora', value: visitantesAtivos.toLocaleString('pt-BR'), icon: Eye },
      { label: 'Empresas ativas', value: empresaTotal.toLocaleString('pt-BR'), icon: Store },
      { label: 'Views totais', value: resumo.views.toLocaleString('pt-BR'), icon: Eye },
      { label: 'Cliques WhatsApp', value: resumo.whatsapp.toLocaleString('pt-BR'), icon: MessageCircle },
      { label: 'Taxa de conversao', value: `${resumo.conversao}%`, icon: Activity },
      { label: 'Buscas realizadas', value: resumo.buscas.toLocaleString('pt-BR'), icon: Search },
    ],
    [empresaTotal, resumo, usuariosRegistrados, visitantesAtivos]
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Analytics Master</h1>
          <p className="mt-1 text-sm text-slate-400">Dados reais do Supabase para trafego, conversao e buscas.</p>
        </div>

        <select
          value={periodo}
          onChange={(event) => setPeriodo(event.target.value as FiltroPeriodo)}
          className="rounded-xl border border-white/10 bg-[#0b0f19] px-4 py-2.5 text-sm font-bold text-white"
        >
          <option value="today">Hoje</option>
          <option value="7d">Ultimos 7 dias</option>
          <option value="30d">Ultimos 30 dias</option>
        </select>
      </div>

      {loading ? (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {skeleton(8).map((item) => (
              <div key={item} className="h-28 animate-pulse rounded-2xl border border-white/5 bg-[#0b0f19]/80" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="h-80 animate-pulse rounded-2xl border border-white/5 bg-[#0b0f19]/80 lg:col-span-2" />
            <div className="h-80 animate-pulse rounded-2xl border border-white/5 bg-[#0b0f19]/80" />
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {cards.map((card) => {
              const Icon = card.icon
              return (
                <div key={card.label} className="rounded-2xl border border-white/5 bg-[#0b0f19]/80 p-5 backdrop-blur-md">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{card.label}</p>
                      <p className="mt-3 text-3xl font-black text-white">{card.value}</p>
                    </div>
                    <div className="rounded-xl bg-white/5 p-2.5">
                      <Icon className="h-4.5 w-4.5 text-emerald-400" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-white/5 bg-[#0b0f19]/80 p-6 backdrop-blur-md lg:col-span-2">
              <h2 className="mb-5 text-base font-bold text-white">Evolucao de Trafego</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeline}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="dia" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }} />
                    <Line type="monotone" dataKey="views" stroke="#3B82F6" strokeWidth={3} dot={false} name="Views" />
                    <Line type="monotone" dataKey="clicks" stroke="#10B981" strokeWidth={3} dot={false} name="Cliques" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-[#0b0f19]/80 p-6 backdrop-blur-md">
              <h2 className="mb-5 text-base font-bold text-white">Cliques por Tipo</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" innerRadius={60} outerRadius={90} paddingAngle={4}>
                      {pieData.map((entry, index) => (
                        <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {pieData.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-300">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                      {item.name}
                    </div>
                    <span className="font-black text-white">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-2xl border border-white/5 bg-[#0b0f19]/80 p-6 backdrop-blur-md">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-bold text-white">Top 10 Empresas</h2>
                <span className="text-xs font-bold text-slate-400">Novos cadastros: {resumo.novosCadastros}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-[10px] uppercase tracking-wider text-slate-400">
                      <th className="py-3">Empresa</th>
                      <th className="py-3">Cidade</th>
                      <th className="py-3">Plano</th>
                      <th className="py-3">Views</th>
                      <th className="py-3">WhatsApp</th>
                      <th className="py-3">Conversao</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {topEmpresas.map((item) => (
                      <tr key={item.id}>
                        <td className="py-3 font-bold text-white">{item.empresa}</td>
                        <td className="py-3 text-slate-300">{item.cidade}</td>
                        <td className="py-3 text-slate-300">{item.plano}</td>
                        <td className="py-3 text-slate-300">{item.views}</td>
                        <td className="py-3 text-slate-300">{item.whatsapp}</td>
                        <td className="py-3 text-emerald-400">{item.conversao}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-[#0b0f19]/80 p-6 backdrop-blur-md">
              <h2 className="mb-4 text-base font-bold text-white">Top Buscas</h2>
              <div className="space-y-3">
                {topBuscas.length === 0 ? (
                  <p className="text-sm text-slate-400">Nenhuma busca registrada no periodo.</p>
                ) : (
                  topBuscas.map((item, index) => (
                    <div key={`${item.termo}-${index}`} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
                      <div>
                        <p className="font-bold text-white">{item.termo}</p>
                        <p className="text-xs text-slate-400">termo buscado</p>
                      </div>
                      <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-400">
                        {item.total}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
