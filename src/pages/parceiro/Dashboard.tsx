import { useState, useEffect } from 'react'
import { useOutletContext, Link } from 'react-router-dom'
import { Store, PhoneIncoming, AlertCircle, Building2, MapPin } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

export default function DashboardParceiro() {
  const { parceiro } = useOutletContext<any>()
  const [metricas, setMetricas] = useState({ total: 0, premium: 0, leads: 0, cidades: 0 })
  const [recentes, setRecentes] = useState<any[]>([])
  const [baixoScore, setBaixoScore] = useState<any[]>([])
  const [graficoLeads, setGraficoLeads] = useState<any[]>([])
  const [graficoCat, setGraficoCat] = useState<any[]>([])

  useEffect(() => {
    if (parceiro) carregarDashboard()
  }, [parceiro])

  const carregarDashboard = async () => {
    // 1. Total e Premium
    const { data: emps } = await supabase.from('empresas').select('plano').eq('parceiro_id', parceiro.id)
    const total = emps?.length || 0
    const premium = emps?.filter(e => e.plano === 'premium').length || 0

    // 2. Leads do mês
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    const { count: leads } = await supabase.from('leads').select('*', { count: 'exact', head: true })
      .eq('parceiro_id', parceiro.id)
      .gte('criado_em', startOfMonth.toISOString())

    // 3. Cidades
    const { count: cidades } = await supabase.from('parceiro_cidades').select('*', { count: 'exact', head: true })
      .eq('parceiro_id', parceiro.id)

    setMetricas({ total, premium, leads: leads || 0, cidades: cidades || 0 })

    // 4. Baixo Score
    const { data: bs } = await supabase.from('empresas')
      .select('id, nome, score_completude')
      .eq('parceiro_id', parceiro.id)
      .lt('score_completude', 400)
      .limit(5)
    setBaixoScore(bs || [])

    const { data: empsWithCat } = await supabase.from('empresas').select('id, categorias(nome)').eq('parceiro_id', parceiro.id)
    const empresaIds = empsWithCat?.map(e => e.id) || []

    const catCounts = (empsWithCat || []).reduce((acc: any, curr: any) => {
      const nome = curr.categorias?.nome || 'Sem Categoria'
      acc[nome] = (acc[nome] || 0) + 1
      return acc
    }, {})
    setGraficoCat(Object.keys(catCounts).map(name => ({ name, value: catCounts[name] })))

    // 6. Gráfico Leads (real últimos 7 dias)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    let leadsByDay: any = {}
    
    if (empresaIds.length > 0) {
      const { data: leadEvents } = await supabase.from('analytics_events')
        .select('created_at')
        .in('empresa_id', empresaIds)
        .in('tipo', ['whatsapp_click', 'phone_click'])
        .gte('created_at', sevenDaysAgo.toISOString())

      leadsByDay = (leadEvents || []).reduce((acc: any, curr: any) => {
        const d = new Date(curr.created_at)
        const dayStr = `${d.getDate()}/${d.getMonth()+1}`
        acc[dayStr] = (acc[dayStr] || 0) + 1
        return acc
      }, {})
    }

    const dadosLeads = []
    for(let i=6; i>=0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dayStr = `${d.getDate()}/${d.getMonth()+1}`
      dadosLeads.push({ name: dayStr, leads: leadsByDay[dayStr] || 0 })
    }
    setGraficoLeads(dadosLeads)

    // 7. Atividade Recente
    if (empresaIds.length > 0) {
      const { data: acts } = await supabase.from('analytics_events')
        .select('*, empresas(nome)')
        .in('empresa_id', empresaIds)
        .order('created_at', { ascending: false })
        .limit(10)
      setRecentes(acts || [])
    } else {
      setRecentes([])
    }
  }

  const COLORS = ['#1A9B6A', '#3B82F6', '#60A5FA', '#93C5FD']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Visão Geral</h1>
        <Link to="/parceiro/empresas/nova" className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 shadow-sm">
          + Nova Empresa
        </Link>
      </div>

      {/* METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Total de Empresas</h3>
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-emerald-600">
              <Store className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">{metricas.total}</div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Premium Ativas</h3>
            <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-600">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">{metricas.premium}</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Leads (Mês)</h3>
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
              <PhoneIncoming className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">{metricas.leads}</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Cidades Ocupadas</h3>
            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
              <MapPin className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">{metricas.cidades} <span className="text-sm font-normal text-gray-400">/ {parceiro?.limite_cidades || 10}</span></div>
        </div>
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-6">Leads por Dia (Últimos 7 dias)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={graficoLeads}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} />
                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="leads" stroke="#1A9B6A" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-6">Empresas por Categoria</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={graficoCat} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {graficoCat.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* LISTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-red-500" /> Empresas com Baixo Score
          </h3>
          <p className="text-sm text-gray-500 mb-4">Empresas com menos de 400 pontos. Complete o perfil para melhorar o SEO.</p>
          <div className="space-y-3">
            {baixoScore.length === 0 ? <p className="text-sm text-gray-500">Nenhuma empresa com score crítico.</p> : null}
            {baixoScore.map(e => (
              <div key={e.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                <div>
                  <p className="font-bold text-gray-900">{e.nome}</p>
                  <p className="text-xs text-red-600 font-medium">Score: {e.score_completude}</p>
                </div>
                <Link to={`/parceiro/empresas/${e.id}`} className="text-sm bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-3 py-1 rounded">
                  Completar Perfil
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4">Atividade Recente</h3>
          <div className="space-y-4">
             {recentes.length === 0 ? <p className="text-sm text-gray-500">Nenhuma atividade recente.</p> : null}
             {recentes.map(r => (
               <div key={r.id} className="flex items-start">
                 <div className="w-2 h-2 rounded-full bg-emerald-600 mt-2 mr-3"></div>
                 <div>
                   <p className="text-sm font-medium text-gray-900">
                     {r.tipo === 'clique_whatsapp' ? 'Novo lead gerado' : 'Visita recebida'} - {r.empresas?.nome || 'Geral'}
                   </p>
                   <p className="text-xs text-gray-500">{new Date(r.created_at).toLocaleString()}</p>
                 </div>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  )
}
