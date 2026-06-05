import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { PhoneIncoming, MessageCircle, CheckCircle, Clock, Building2, MapPin, Search } from 'lucide-react'

export default function Leads() {
  const { parceiro } = useOutletContext<any>()
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')

  useEffect(() => {
    if (!parceiro?.id) return
    supabase
      .from('eventos_analytics')
      .select(`id,tipo,dados,created_at,empresas(nome,slug,cidades(nome))`)
      .eq('parceiro_id', parceiro.id)
      .in('tipo', ['clique_whatsapp','clique_site','visualizacao_empresa','checkin'])
      .order('created_at', { ascending: false })
      .limit(200)
      .then(({ data }) => { setLeads(data || []); setLoading(false) })
  }, [parceiro?.id])

  const filtrados = leads.filter(l => {
    const buscaOk = !busca || (l.empresas?.nome || '').toLowerCase().includes(busca.toLowerCase())
    const tipoOk = !filtroTipo || l.tipo === filtroTipo
    return buscaOk && tipoOk
  })

  const tipoLabel = (tipo: string) => {
    const map: Record<string, string> = {
      clique_whatsapp: 'WhatsApp', clique_site: 'Site', visualizacao_empresa: 'Visualização', checkin: 'Check-in'
    }
    return map[tipo] || tipo
  }

  const tipoColor = (tipo: string) => {
    const map: Record<string, string> = {
      clique_whatsapp: 'bg-emerald-100 text-emerald-700',
      clique_site: 'bg-blue-100 text-blue-700',
      visualizacao_empresa: 'bg-gray-100 text-gray-600',
      checkin: 'bg-purple-100 text-purple-700',
    }
    return map[tipo] || 'bg-gray-100 text-gray-600'
  }

  const tipoIcon = (tipo: string) => {
    if (tipo === 'clique_whatsapp') return <MessageCircle className="w-4 h-4 text-emerald-500" />
    if (tipo === 'clique_site') return <CheckCircle className="w-4 h-4 text-emerald-500" />
    if (tipo === 'checkin') return <MapPin className="w-4 h-4 text-purple-500" />
    return <PhoneIncoming className="w-4 h-4 text-gray-400" />
  }

  const whatsapps = leads.filter(l => l.tipo === 'clique_whatsapp').length
  const views = leads.filter(l => l.tipo === 'visualizacao_empresa').length

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Leads Recebidos</h1>
        <p className="text-gray-500 text-sm mt-1">Interações dos visitantes com suas empresas</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total', value: leads.length, color: 'bg-blue-50 text-blue-700' },
          { label: 'WhatsApp', value: whatsapps, color: 'bg-emerald-50 text-emerald-700' },
          { label: 'Visualizações', value: views, color: 'bg-gray-50 text-gray-700' },
          { label: 'Check-ins', value: leads.filter(l=>l.tipo==='checkin').length, color: 'bg-purple-50 text-purple-700' },
        ].map(c => (
          <div key={c.label} className={`rounded-xl p-4 ${c.color}`}>
            <p className="text-2xl font-bold">{c.value}</p>
            <p className="text-sm font-medium opacity-80">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input type="text" placeholder="Buscar por empresa..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={busca} onChange={e => setBusca(e.target.value)} />
        </div>
        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none">
          <option value="">Todos os tipos</option>
          <option value="clique_whatsapp">WhatsApp</option>
          <option value="visualizacao_empresa">Visualizações</option>
          <option value="clique_site">Site</option>
          <option value="checkin">Check-in</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 animate-pulse flex items-center gap-4">
              <div className="w-8 h-8 bg-gray-200 rounded-full" />
              <div className="flex-1"><div className="h-4 bg-gray-200 rounded w-1/3 mb-2" /><div className="h-3 bg-gray-100 rounded w-1/4" /></div>
            </div>
          ))}
        </div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <PhoneIncoming className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Nenhum lead encontrado</p>
          <p className="text-gray-400 text-sm mt-1">Os leads aparecerão aqui quando visitantes interagirem com suas empresas</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Tipo</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Empresa</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Cidade</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtrados.map(lead => (
                  <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {tipoIcon(lead.tipo)}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tipoColor(lead.tipo)}`}>{tipoLabel(lead.tipo)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-300" />
                        <span className="text-sm font-medium text-gray-900">{lead.empresas?.nome || '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{lead.empresas?.cidades?.nome || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(lead.created_at).toLocaleDateString('pt-BR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
