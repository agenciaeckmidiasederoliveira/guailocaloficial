import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  Check,
  CheckCircle2,
  Eye,
  MessageCircle,
  Search,
  ShieldAlert,
  Sparkles,
  Store,
  TrendingUp,
  Users,
} from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { supabase } from '../../lib/supabase'

type FiltroPeriodo = 'today' | '7d' | '30d'

type EmpresaRow = {
  id: string
  nome: string
  plano?: string | null
  verificada?: boolean | null
  banner_grande_ativo?: boolean | null
  ativa?: boolean | null
  score_completude?: number | null
  foto_principal?: string | null
  criado_em?: string | null
  cidades?: { nome?: string | null } | null
  categorias?: { nome?: string | null } | null
}

type EventoRow = {
  empresa_id: string | null
  tipo: string
  session_id: string | null
  termo_busca: string | null
  created_at: string
}

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

export default function DashboardAdmin() {
  const [periodo, setPeriodo] = useState<FiltroPeriodo>('30d')
  const [loading, setLoading] = useState(true)
  const [updateStatus, setUpdateStatus] = useState('')
  const [empresas, setEmpresas] = useState<EmpresaRow[]>([])
  const [selectedPreviewEmpresa, setSelectedPreviewEmpresa] = useState<EmpresaRow | null>(null)
  const [cards, setCards] = useState({
    empresasAtivas: 0,
    premium: 0,
    verificadas: 0,
    visitantesAtivos: 0,
    views: 0,
    whatsapp: 0,
    buscas: 0,
    conversao: 0,
  })
  const [timeline, setTimeline] = useState<Array<{ dia: string; views: number; cliques: number }>>([])
  const [topCidades, setTopCidades] = useState<Array<{ name: string; value: number }>>([])

  useEffect(() => {
    void carregarDados()
  }, [periodo])

  async function carregarDados() {
    setLoading(true)

    try {
      const inicio = getPeriodoInicio(periodo)
      const inicioIso = inicio.toISOString()
      const agoraMenosCinco = new Date(Date.now() - 5 * 60 * 1000).toISOString()

      let empresasData: any[] = []
      try {
        const { data } = await supabase
          .from('empresas')
          .select('id,nome,plano,verificada,banner_grande_ativo,ativa,score_completude,foto_principal,criado_em,cidades(nome),categorias(nome)')
          .order('criado_em', { ascending: false })
        empresasData = data || []
      } catch (e) {
        console.error('Erro ao carregar empresas:', e)
      }

      let eventosPeriodo: any[] = []
      let eventosAtivos: any[] = []
      try {
        const [{ data: e1 }, { data: e2 }] = await Promise.all([
          supabase
            .from('analytics_events')
            .select('empresa_id,tipo,session_id,termo_busca,created_at')
            .gte('created_at', inicioIso),
          supabase.from('analytics_events').select('session_id,created_at').gt('created_at', agoraMenosCinco),
        ])
        eventosPeriodo = e1 || []
        eventosAtivos = e2 || []
      } catch (e) {
        console.warn('analytics_events table might not exist yet', e)
      }

      const empresasLista = (empresasData || []) as EmpresaRow[]
      const eventos = (eventosPeriodo || []) as EventoRow[]
      const visitantesAtivos = new Set((eventosAtivos || []).map((item: any) => item.session_id).filter(Boolean)).size
      const empresasAtivas = empresasLista.filter((empresa: any) => empresa.ativa === true || empresa.status === 'aprovado').length
      const premium = empresasLista.filter((empresa) => empresa.plano === 'premium' || empresa.plano === 'turbo').length
      const verificadas = empresasLista.filter((empresa) => empresa.verificada).length
      const views = eventos.filter((evento) => evento.tipo === 'page_view').length
      const whatsapp = eventos.filter((evento) => evento.tipo === 'whatsapp_click').length
      const buscas = eventos.filter((evento) => evento.tipo === 'busca').length
      const conversao = views > 0 ? Number(((whatsapp / views) * 100).toFixed(1)) : 0

      setEmpresas(empresasLista)
      setSelectedPreviewEmpresa((current) => {
        if (!empresasLista.length) return null
        if (!current) return empresasLista[0]
        return empresasLista.find((empresa) => empresa.id === current.id) || empresasLista[0]
      })
      setCards({
        empresasAtivas,
        premium,
        verificadas,
        visitantesAtivos,
        views,
        whatsapp,
        buscas,
        conversao,
      })

      const cidadeMap = new Map<string, number>()
      empresasLista.forEach((empresa) => {
        const cidade = empresa.cidades?.nome || 'Sem cidade'
        cidadeMap.set(cidade, (cidadeMap.get(cidade) || 0) + 1)
      })
      setTopCidades(
        Array.from(cidadeMap.entries())
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5)
      )

      const totalDias = periodo === 'today' ? 1 : periodo === '7d' ? 7 : 30
      const diaMap = new Map<string, { dia: string; views: number; cliques: number }>()

      for (let index = 0; index < totalDias; index += 1) {
        const dia = new Date(inicio)
        dia.setDate(inicio.getDate() + index)
        diaMap.set(formatLabel(dia), {
          dia: formatLabel(dia),
          views: 0,
          cliques: 0,
        })
      }

      eventos.forEach((evento) => {
        const chave = formatLabel(new Date(evento.created_at))
        const atual = diaMap.get(chave)
        if (!atual) return
        if (evento.tipo === 'page_view') atual.views += 1
        if (evento.tipo === 'whatsapp_click') atual.cliques += 1
      })

      setTimeline(Array.from(diaMap.values()))
    } catch (error) {
      console.error('Erro carregando dashboard admin:', error)
    } finally {
      setLoading(false)
    }
  }

  function triggerNotificacao(message: string) {
    setUpdateStatus(message)
    window.setTimeout(() => setUpdateStatus(''), 4000)
  }

  async function toggleVerificada(empresaId: string, valorAtual: boolean) {
    try {
      const { error } = await supabase.from('empresas').update({ verificada: !valorAtual }).eq('id', empresaId)
      if (error) throw error

      setEmpresas((prev) => prev.map((empresa) => (empresa.id === empresaId ? { ...empresa, verificada: !valorAtual } : empresa)))
      setSelectedPreviewEmpresa((prev) => (prev?.id === empresaId ? { ...prev, verificada: !valorAtual } : prev))
      setCards((prev) => ({
        ...prev,
        verificadas: prev.verificadas + (valorAtual ? -1 : 1),
      }))
      triggerNotificacao('Selo de verificacao atualizado.')
    } catch (error: any) {
      alert(`Erro ao salvar status: ${error.message}`)
    }
  }

  async function toggleBannerHome(empresaId: string, valorAtual: boolean) {
    try {
      const { error } = await supabase
        .from('empresas')
        .update({ banner_grande_ativo: !valorAtual })
        .eq('id', empresaId)

      if (error) throw error

      setEmpresas((prev) =>
        prev.map((empresa) => (empresa.id === empresaId ? { ...empresa, banner_grande_ativo: !valorAtual } : empresa))
      )
      setSelectedPreviewEmpresa((prev) => (prev?.id === empresaId ? { ...prev, banner_grande_ativo: !valorAtual } : prev))
      triggerNotificacao('Status de banner da home atualizado.')
    } catch (error: any) {
      alert(`Erro ao salvar status de banner: ${error.message}`)
    }
  }

  async function alterarPlano(empresaId: string, novoPlano: string) {
    try {
      const { error } = await supabase.from('empresas').update({ plano: novoPlano }).eq('id', empresaId)
      if (error) throw error

      setEmpresas((prev) => prev.map((empresa) => (empresa.id === empresaId ? { ...empresa, plano: novoPlano } : empresa)))
      setSelectedPreviewEmpresa((prev) => (prev?.id === empresaId ? { ...prev, plano: novoPlano } : prev))
      setCards((prev) => {
        const proximoPremium = empresas.filter((empresa) => {
          if (empresa.id === empresaId) {
            return novoPlano === 'premium' || novoPlano === 'turbo'
          }

          return empresa.plano === 'premium' || empresa.plano === 'turbo'
        }).length

        return {
          ...prev,
          premium: proximoPremium,
        }
      })
      triggerNotificacao(`Plano alterado para ${novoPlano}.`)
    } catch (error: any) {
      alert(`Erro ao alterar plano: ${error.message}`)
    }
  }

  const metricCards = useMemo(
    () => [
      { label: 'Empresas ativas', value: cards.empresasAtivas, icon: Store, color: 'text-emerald-400' },
      { label: 'Empresas premium', value: cards.premium, icon: Sparkles, color: 'text-amber-400' },
      { label: 'Empresas verificadas', value: cards.verificadas, icon: CheckCircle2, color: 'text-blue-400' },
      { label: 'Visitantes ativos agora', value: cards.visitantesAtivos, icon: Users, color: 'text-cyan-400' },
      { label: 'Views do periodo', value: cards.views, icon: Eye, color: 'text-sky-400' },
      { label: 'Cliques no WhatsApp', value: cards.whatsapp, icon: MessageCircle, color: 'text-emerald-400' },
      { label: 'Buscas realizadas', value: cards.buscas, icon: Search, color: 'text-violet-400' },
      { label: 'Taxa de conversao', value: `${cards.conversao}%`, icon: Activity, color: 'text-orange-400' },
    ],
    [cards]
  )

  return (
    <div className="space-y-6">
      {updateStatus ? (
        <div className="fixed bottom-5 right-5 z-[999] flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 font-bold text-emerald-700 shadow-lg">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          {updateStatus}
        </div>
      ) : null}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[#0A1628]">Dashboard Admin</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Entrada principal com metricas reais de trafego e gestao rapida das empresas.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            value={periodo}
            onChange={(event) => setPeriodo(event.target.value as FiltroPeriodo)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700"
          >
            <option value="today">Hoje</option>
            <option value="7d">Ultimos 7 dias</option>
            <option value="30d">Ultimos 30 dias</option>
          </select>

          <button
            onClick={() => void carregarDados()}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-blue-300 hover:text-emerald-600"
          >
            Sincronizar Supabase
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Sistema</p>
          <p className="mt-2 text-xl font-black text-emerald-600">Online</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">Leitura em tempo real de empresas e analytics.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Painel rapido</p>
          <p className="mt-2 text-xl font-black text-slate-900">Curadoria e analytics</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">Ajuste plano, selo e banner sem sair do dashboard.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Atalho</p>
          <Link to="/admin/analytics" className="mt-2 inline-flex items-center gap-2 text-xl font-black text-emerald-600">
            Ver analytics completo
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-1 text-xs font-semibold text-slate-500">Tabela top 10, buscas e graficos detalhados.</p>
        </div>
      </div>

      {loading ? (
        <>
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            {skeleton(8).map((item) => (
              <div key={item} className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-white xl:col-span-2" />
            <div className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-white" />
          </div>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="h-[520px] animate-pulse rounded-2xl border border-slate-200 bg-white xl:col-span-2" />
            <div className="h-[520px] animate-pulse rounded-2xl border border-slate-200 bg-white" />
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            {metricCards.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
                      <p className="mt-3 text-3xl font-black text-slate-900">{item.value}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-2.5">
                      <Icon className={`h-4.5 w-4.5 ${item.color}`} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-black text-slate-900">Evolucao de trafego</h2>
                  <p className="text-xs font-semibold text-slate-500">Views e cliques de WhatsApp no periodo selecionado.</p>
                </div>
                <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600">
                  Dados reais
                </span>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeline}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF3F8" />
                    <XAxis dataKey="dia" axisLine={false} tickLine={false} tick={{ fill: '#5A6A7E', fontSize: 11 }} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#5A6A7E', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #EEF3F8',
                        borderRadius: 12,
                      }}
                    />
                    <Line type="monotone" dataKey="views" stroke="#1A9B6A" strokeWidth={3} dot={false} name="Views" />
                    <Line
                      type="monotone"
                      dataKey="cliques"
                      stroke="#16A34A"
                      strokeWidth={3}
                      dot={false}
                      name="Cliques WhatsApp"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-black text-slate-900">Cidades com mais empresas</h2>
              <p className="mt-1 text-xs font-semibold text-slate-500">Distribuicao atual do cadastro por cidade.</p>
              <div className="mt-6 space-y-4">
                {topCidades.length === 0 ? (
                  <p className="text-sm text-slate-500">Nenhuma cidade cadastrada ainda.</p>
                ) : (
                  topCidades.map((cidade) => {
                    const percent = cards.empresasAtivas > 0 ? Math.round((cidade.value / cards.empresasAtivas) * 100) : 0
                    return (
                      <div key={cidade.name} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                          <span className="text-slate-900">{cidade.name}</span>
                          <span>{cidade.value} empresas</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-black text-slate-900">Curadoria rapida de empresas</h2>
                  <p className="text-xs font-semibold text-slate-500">
                    Ajuste selo, plano e banner da home sem sair do painel.
                  </p>
                </div>
                <Link to="/admin/empresas" className="text-sm font-black text-emerald-600 hover:underline">
                  Gerenciar todas
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] uppercase tracking-[0.18em] text-slate-500">
                      <th className="py-3 pr-3">Empresa</th>
                      <th className="py-3 pr-3">Selo</th>
                      <th className="py-3 pr-3">Plano</th>
                      <th className="py-3 pr-3">Banner home</th>
                      <th className="py-3 text-right">Acao</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {empresas.slice(0, 15).map((empresa) => (
                      <tr
                        key={empresa.id}
                        className={`cursor-pointer transition hover:bg-slate-50 ${
                          selectedPreviewEmpresa?.id === empresa.id ? 'bg-blue-50/60' : ''
                        }`}
                        onClick={() => setSelectedPreviewEmpresa(empresa)}
                      >
                        <td className="py-3 pr-3">
                          <p className="max-w-[180px] truncate font-bold text-slate-900">{empresa.nome}</p>
                          <p className="text-[11px] font-semibold text-slate-500">{empresa.cidades?.nome || 'Sem cidade'}</p>
                        </td>
                        <td className="py-3 pr-3">
                          <button
                            onClick={(event) => {
                              event.stopPropagation()
                              void toggleVerificada(empresa.id, Boolean(empresa.verificada))
                            }}
                            className={`relative h-6 w-11 rounded-full border transition ${
                              empresa.verificada ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300 bg-slate-200'
                            }`}
                          >
                            <div
                              className={`absolute top-0.5 h-4.5 w-4.5 rounded-full bg-white transition-transform ${
                                empresa.verificada ? 'translate-x-5' : 'translate-x-0.5'
                              }`}
                            />
                          </button>
                        </td>
                        <td className="py-3 pr-3">
                          <select
                            value={empresa.plano || 'gratis'}
                            onClick={(event) => event.stopPropagation()}
                            onChange={(event) => void alterarPlano(empresa.id, event.target.value)}
                            className="rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700"
                          >
                            <option value="gratis">Gratis</option>
                            <option value="premium">Premium</option>
                            <option value="turbo">Turbo</option>
                          </select>
                        </td>
                        <td className="py-3 pr-3">
                          <button
                            onClick={(event) => {
                              event.stopPropagation()
                              void toggleBannerHome(empresa.id, Boolean(empresa.banner_grande_ativo))
                            }}
                            className={`relative h-6 w-11 rounded-full border transition ${
                              empresa.banner_grande_ativo ? 'border-amber-500 bg-amber-500' : 'border-slate-300 bg-slate-200'
                            }`}
                          >
                            <div
                              className={`absolute top-0.5 h-4.5 w-4.5 rounded-full bg-white transition-transform ${
                                empresa.banner_grande_ativo ? 'translate-x-5' : 'translate-x-0.5'
                              }`}
                            />
                          </button>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => setSelectedPreviewEmpresa(empresa)}
                            className="text-xs font-black text-emerald-600 hover:underline"
                          >
                            Visualizar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-base font-black text-slate-900">
                <Eye className="h-4 w-4 text-emerald-600" />
                Preview da home
              </h2>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Simulacao rapida de como o card aparece para o publico.
              </p>

              {selectedPreviewEmpresa ? (
                <div className="mt-6 space-y-4">
                  <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                    <div className="relative flex h-28 items-center justify-center overflow-hidden border-b border-slate-200 bg-slate-50">
                      {selectedPreviewEmpresa.foto_principal ? (
                        <img
                          src={selectedPreviewEmpresa.foto_principal}
                          alt={selectedPreviewEmpresa.nome}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Store className="h-8 w-8 text-slate-300" />
                      )}

                      {selectedPreviewEmpresa.banner_grande_ativo ? (
                        <span className="absolute left-2 top-2 rounded-full bg-amber-500 px-2 py-1 text-[9px] font-black uppercase tracking-[0.15em] text-white">
                          Banner home
                        </span>
                      ) : null}

                      {selectedPreviewEmpresa.plano === 'turbo' ? (
                        <span className="absolute right-2 top-2 rounded-full bg-emerald-600 px-2 py-1 text-[9px] font-black uppercase tracking-[0.15em] text-white">
                          Turbo
                        </span>
                      ) : null}
                    </div>

                    <div className="space-y-2 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="max-w-[180px] truncate text-sm font-black text-slate-900">
                          {selectedPreviewEmpresa.nome}
                        </h3>
                        {selectedPreviewEmpresa.verificada ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.15em] text-emerald-600">
                            <Check className="h-2.5 w-2.5" />
                            Verificado
                          </span>
                        ) : null}
                        {selectedPreviewEmpresa.plano === 'premium' ? (
                          <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.15em] text-amber-600">
                            Premium
                          </span>
                        ) : null}
                      </div>

                      <p className="text-[11px] font-semibold text-slate-500">
                        Cidade: {selectedPreviewEmpresa.cidades?.nome || 'Sem cidade'}
                      </p>
                      <p className="text-[11px] font-semibold text-slate-500">
                        Categoria: {selectedPreviewEmpresa.categorias?.nome || 'Sem categoria'}
                      </p>
                      <div className="flex items-center justify-between pt-1 text-[11px] font-black text-slate-600">
                        <span className="inline-flex items-center gap-1">
                          <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                          Score: {selectedPreviewEmpresa.score_completude || 0}
                        </span>
                        <span className="text-emerald-600">Ver perfil</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    {selectedPreviewEmpresa.verificada ? (
                      <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 p-2 text-xs font-bold text-blue-700">
                        <CheckCircle2 className="h-4 w-4" />
                        Selo de verificacao ativo
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold text-slate-500">
                        <ShieldAlert className="h-4 w-4 opacity-50" />
                        Sem selo de verificacao
                      </div>
                    )}

                    {selectedPreviewEmpresa.banner_grande_ativo ? (
                      <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-2 text-xs font-bold text-amber-700">
                        <Sparkles className="h-4 w-4" />
                        Destaque ativo no banner principal
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold text-slate-500">
                        <Sparkles className="h-4 w-4 opacity-50" />
                        Sem destaque de banner no momento
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-10 text-sm font-semibold text-slate-500">Selecione uma empresa para visualizar o preview.</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
