import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { PenTool, Sparkles, Eye, CheckCircle, Clock, Plus, Loader2 } from 'lucide-react'

export default function BlogParceiro() {
  const { parceiro } = useOutletContext<any>()
  const [artigos, setArtigos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [gerando, setGerando] = useState(false)
  const [empresaSelecionada, setEmpresaSelecionada] = useState('')
  const [empresas, setEmpresas] = useState<any[]>([])
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (!parceiro?.id) return
    Promise.all([
      supabase.from('artigos_blog')
        .select('id,titulo,resumo,status,publicado_em,categorias(nome)')
        .eq('parceiro_id', parceiro.id)
        .order('created_at', { ascending: false }),
      supabase.from('empresas')
        .select('id,nome')
        .eq('parceiro_id', parceiro.id)
        .eq('plano', 'premium')
        .order('nome')
    ]).then(([artRes, empRes]) => {
      setArtigos(artRes.data || [])
      setEmpresas(empRes.data || [])
      setLoading(false)
    })
  }, [parceiro?.id])

  const gerarArtigo = async () => {
    if (!empresaSelecionada) { setMsg('Selecione uma empresa premium primeiro.'); return }
    setGerando(true); setMsg('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await supabase.functions.invoke('gerar-artigo-ia', {
        body: { empresa_id: empresaSelecionada, tipo: 'sobre_empresa' }
      })
      if (res.error) throw res.error
      setMsg('✅ Artigo gerado com sucesso! Revise e publique na listagem abaixo.')
      const { data } = await supabase.from('artigos_blog')
        .select('id,titulo,resumo,status,publicado_em')
        .eq('parceiro_id', parceiro.id)
        .order('created_at', { ascending: false })
      setArtigos(data || [])
    } catch (e: any) {
      setMsg(`❌ Erro ao gerar: ${e.message || 'Tente novamente'}`)
    } finally { setGerando(false) }
  }

  const toggleStatus = async (id: string, status: string) => {
    const novoStatus = status === 'publicado' ? 'rascunho' : 'publicado'
    await supabase.from('artigos_blog').update({ status: novoStatus }).eq('id', id)
    setArtigos(prev => prev.map(a => a.id === id ? { ...a, status: novoStatus } : a))
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Blog & Artigos IA</h1>
        <p className="text-gray-500 text-sm mt-1">Gere artigos automáticos para suas empresas premium</p>
      </div>

      {/* GERADOR DE ARTIGOS */}
      <div className="bg-gradient-to-br from-[#1a365d] to-[#0d9488] rounded-2xl p-6 mb-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-lg">Gerador de Artigos com IA</h2>
            <p className="text-white/70 text-sm">Gere artigos SEO otimizados automaticamente</p>
          </div>
        </div>
        {empresas.length === 0 ? (
          <div className="bg-white/10 rounded-xl p-4 text-center">
            <p className="text-white/80 text-sm">Você ainda não tem empresas premium cadastradas.</p>
            <p className="text-white/60 text-xs mt-1">Faça upgrade de uma empresa para gerar artigos.</p>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
              value={empresaSelecionada} onChange={e => setEmpresaSelecionada(e.target.value)}
            >
              <option value="" className="text-gray-900 bg-white">Selecione uma empresa premium...</option>
              {empresas.map(e => <option key={e.id} value={e.id} className="text-gray-900 bg-white">{e.nome}</option>)}
            </select>
            <button onClick={gerarArtigo} disabled={gerando}
              className="bg-white text-[#1a365d] font-bold px-6 py-3 rounded-xl hover:bg-white/90 transition-colors flex items-center gap-2 disabled:opacity-70">
              {gerando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {gerando ? 'Gerando...' : 'Gerar Artigo'}
            </button>
          </div>
        )}
        {msg && <p className="mt-3 text-sm text-white/90 bg-white/10 rounded-lg px-4 py-2">{msg}</p>}
      </div>

      {/* LISTA DE ARTIGOS */}
      <h2 className="text-lg font-bold text-gray-900 mb-4">Seus Artigos ({artigos.length})</h2>
      {loading ? (
        <div className="space-y-3">{Array.from({length:3}).map((_,i)=>(
          <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"/><div className="h-3 bg-gray-100 rounded w-1/3"/>
          </div>
        ))}</div>
      ) : artigos.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <PenTool className="w-10 h-10 text-gray-300 mx-auto mb-3"/>
          <p className="text-gray-500">Nenhum artigo gerado ainda</p>
          <p className="text-gray-400 text-sm">Use o gerador acima para criar seu primeiro artigo</p>
        </div>
      ) : (
        <div className="space-y-3">
          {artigos.map(art => (
            <div key={art.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-start gap-4">
              <div className={`w-2 h-full min-h-[2rem] rounded-full flex-shrink-0 mt-1 ${art.status==='publicado'?'bg-emerald-400':'bg-gray-300'}`}/>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 line-clamp-1">{art.titulo}</h3>
                {art.resumo && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{art.resumo}</p>}
                <div className="flex items-center gap-3 mt-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${art.status==='publicado'?'bg-emerald-100 text-emerald-700':'bg-gray-100 text-gray-600'}`}>
                    {art.status==='publicado'?'Publicado':'Rascunho'}
                  </span>
                  {art.publicado_em && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3"/>
                      {new Date(art.publicado_em).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => toggleStatus(art.id, art.status)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  art.status==='publicado'?'bg-gray-100 text-gray-600 hover:bg-gray-200':'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                }`}>
                {art.status==='publicado'?'Despublicar':'Publicar'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
