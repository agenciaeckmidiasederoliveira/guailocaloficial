import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { MapPin, Search, Lock, Unlock, AlertTriangle, CheckCircle2 } from 'lucide-react'

export default function CidadesTerritorio() {
  const { parceiro } = useOutletContext<any>()
  const [estados, setEstados] = useState<any[]>([])
  const [cidades, setCidades] = useState<any[]>([])
  const [minhasCidades, setMinhasCidades] = useState<any[]>([])
  const [busca, setBusca] = useState('')
  const [estadoSelecionado, setEstadoSelecionado] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (parceiro) carregarDados()
  }, [parceiro])

  const carregarDados = async () => {
    setLoading(true)
    try {
      // 1. Carregar estados
      const { data: ests } = await supabase.from('estados').select('*').order('nome')
      setEstados(ests || [])
      
      if (ests && ests.length > 0) {
        setEstadoSelecionado(ests[0].id)
        await carregarCidades(ests[0].id)
      }

      // 2. Carregar minhas cidades
      const { data: mc } = await supabase
        .from('parceiro_cidades')
        .select('id, cidades(id, nome, estados(uf))')
        .eq('parceiro_id', parceiro.id)
      setMinhasCidades(mc || [])

    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const carregarCidades = async (estado_id: number) => {
    const { data: cids } = await supabase
      .from('cidades')
      .select(`
        id, nome, 
        parceiro_cidades (parceiro_id, parceiros(nome_comercial))
      `)
      .eq('estado_id', estado_id)
      .order('nome')
    
    // Tratamento manual pelo client side (ideal era SQL)
    const mapCidades = cids?.map(c => {
      const p_c = c.parceiro_cidades?.[0]
      return {
        ...c,
        ocupado_por: p_c?.parceiro_id || null,
        nome_parceiro_ocupante: (p_c?.parceiros as any)?.nome_comercial || (p_c?.parceiros as any)?.[0]?.nome_comercial || null,
        e_minha: p_c?.parceiro_id === parceiro.id
      }
    })
    
    setCidades(mapCidades || [])
  }

  const selecionarEstado = (id: number) => {
    setEstadoSelecionado(id)
    carregarCidades(id)
  }

  const marcarCidade = async (cidade_id: string) => {
    if (minhasCidades.length >= (parceiro.limite_cidades || 10)) {
      alert("Você atingiu o limite máximo de cidades no seu plano.")
      return
    }

    const { error } = await supabase.from('parceiro_cidades').insert({
      parceiro_id: parceiro.id,
      cidade_id: cidade_id
    })

    if (error) {
       if (error.code === '23505') { // unique violation
         alert("Esta cidade acabou de ser marcada por outro parceiro.")
       } else {
         alert("Erro ao marcar cidade: " + error.message)
       }
    } else {
       // Refresh
       carregarDados()
    }
  }

  const liberarCidade = async (pc_id: string) => {
    if (!window.confirm("Atenção: ao liberar uma cidade, outro parceiro pode ocupá-la imediatamente. Tem certeza?")) return
    
    await supabase.from('parceiro_cidades').delete().eq('id', pc_id)
    carregarDados()
  }

  const cidadesFiltradas = cidades.filter(c => c.nome.toLowerCase().includes(busca.toLowerCase()))

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-6">
      
      {/* PAINEL ESQUERDO: EXPLORAR */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="font-bold text-gray-900 flex items-center">
            <Search className="w-5 h-5 mr-2 text-emerald-600" /> Explorar Territórios
          </h2>
          <input 
            type="text" 
            placeholder="Buscar cidade..." 
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 w-full md:w-64"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Coluna de Estados */}
          <div className="w-24 md:w-48 bg-gray-50 border-r border-gray-100 overflow-y-auto">
            {estados.map(est => (
              <button 
                key={est.id}
                onClick={() => selecionarEstado(est.id)}
                className={`w-full text-left px-4 py-3 text-sm font-medium border-l-4 transition-colors ${estadoSelecionado === est.id ? 'bg-white border-emerald-600 text-blue-700' : 'border-transparent text-gray-600 hover:bg-gray-100'}`}
              >
                {est.nome}
              </button>
            ))}
          </div>

          {/* Coluna de Cidades */}
          <div className="flex-1 overflow-y-auto p-4 bg-white">
            {loading ? <p className="text-gray-500">Carregando cidades...</p> : (
              <div className="space-y-2">
                {cidadesFiltradas.length === 0 ? <p className="text-gray-500">Nenhuma cidade encontrada.</p> : null}
                {cidadesFiltradas.map(c => (
                  <div key={c.id} className={`flex items-center justify-between p-4 rounded-lg border ${c.e_minha ? 'border-blue-200 bg-blue-50' : (c.ocupado_por ? 'border-red-100 bg-red-50 opacity-75' : 'border-gray-200 hover:border-blue-300')}`}>
                    <div>
                      <p className={`font-bold ${c.e_minha ? 'text-blue-900' : 'text-gray-900'}`}>{c.nome}</p>
                      {c.e_minha && <span className="inline-flex items-center mt-1 text-xs font-semibold text-blue-700"><CheckCircle2 className="w-3 h-3 mr-1"/> Sua cidade</span>}
                      {!c.e_minha && c.ocupado_por && <span className="inline-flex items-center mt-1 text-xs font-semibold text-red-600"><Lock className="w-3 h-3 mr-1"/> Ocupada por {c.nome_parceiro_ocupante}</span>}
                      {!c.e_minha && !c.ocupado_por && <span className="inline-flex items-center mt-1 text-xs font-semibold text-green-600"><Unlock className="w-3 h-3 mr-1"/> Disponível</span>}
                    </div>
                    
                    {!c.e_minha && !c.ocupado_por && (
                      <button 
                        onClick={() => marcarCidade(c.id)}
                        className="bg-white border border-gray-300 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 text-gray-700 font-medium py-1.5 px-4 rounded-lg text-sm transition"
                      >
                        Marcar Cidade
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PAINEL DIREITO: RESUMO */}
      <div className="w-full md:w-80 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-100 bg-emerald-600 rounded-t-xl text-white">
          <h2 className="font-bold flex items-center">
            <MapPin className="w-5 h-5 mr-2" /> Seu Território
          </h2>
          <p className="text-blue-100 text-sm mt-1">{minhasCidades.length} de {parceiro?.limite_cidades || 10} cidades ocupadas</p>
          
          <div className="w-full bg-blue-800 rounded-full h-2 mt-3">
            <div className="bg-white h-2 rounded-full" style={{width: `${(minhasCidades.length / (parceiro?.limite_cidades || 10)) * 100}%`}}></div>
          </div>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          {minhasCidades.length === 0 ? (
            <div className="text-center text-gray-500 py-10">
              <MapPin className="w-10 h-10 mx-auto text-gray-300 mb-2" />
              <p>Você ainda não marcou nenhuma cidade.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {minhasCidades.map(mc => (
                <div key={mc.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="font-bold text-gray-900 text-sm">{mc.cidades?.nome} - {mc.cidades?.estados?.uf}</p>
                  <button 
                    onClick={() => liberarCidade(mc.id)}
                    className="text-red-500 hover:text-red-700 text-xs font-medium mt-2 underline"
                  >
                    Liberar cidade
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-100 bg-yellow-50 rounded-b-xl">
          <div className="flex items-start text-yellow-800 text-xs">
            <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
            <p><strong>Atenção:</strong> Ao liberar uma cidade, outro parceiro pode ocupá-la imediatamente. A ação não pode ser desfeita.</p>
          </div>
        </div>
      </div>

    </div>
  )
}
