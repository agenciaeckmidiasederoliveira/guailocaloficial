import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { 
  Globe, Plus, CheckCircle, Search, Trash2, X, Loader2, ArrowLeft, 
  Settings, Check, Layout, Palette, Sparkles, MapPin
} from 'lucide-react'

export default function AdminDominios() {
  const [dominios, setDominios] = useState<any[]>([])
  const [licenciados, setLicenciados] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [msgNotif, setMsgNotif] = useState('')

  // Modais / Drawers
  const [showDomainModal, setShowDomainModal] = useState(false)
  const [salvando, setSalvando] = useState(false)

  // Formulário Domínio
  const [formDomain, setFormDomain] = useState({
    dominio: '',
    label: '',
    cidade_busca: '',
    cidade_selecionada: null as any,
    licenciado_id: '',
    cor_primaria: '#1A9B6A',
    logo_url: '',
    ativo: true
  })

  // Cidade busca autocomplete
  const [cidadeSugestoes, setCidadeSugestoes] = useState<any[]>([])
  const [loadingCidades, setLoadingCidades] = useState(false)

  useEffect(() => {
    carregarDados()
  }, [])

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (formDomain.cidade_busca.length >= 2) {
        buscarCidadesIbge(formDomain.cidade_busca)
      } else {
        setCidadeSugestoes([])
      }
    }, 300)
    return () => clearTimeout(delayDebounce)
  }, [formDomain.cidade_busca])

  const carregarDados = async () => {
    try {
      setLoading(true)
      const [
        { data: doms, error: err1 },
        { data: lics, error: err2 }
      ] = await Promise.all([
        supabase.from('dominios_regionais').select('*, licenciados(nome)').order('dominio'),
        supabase.from('licenciados').select('*').order('nome')
      ])

      if (err1) throw err1
      if (err2) throw err2

      setDominios(doms || [])
      setLicenciados(lics || [])
    } catch (err: any) {
      console.error('Erro carregando domínios:', err.message)
    } finally {
      setLoading(false)
    }
  }

  const buscarCidadesIbge = async (termo: string) => {
    setLoadingCidades(true)
    try {
      const { data, error } = await supabase
        .from('cidades')
        .select('id, nome, slug, estados(uf)')
        .ilike('nome', `%${termo}%`)
        .limit(8)

      if (!error && data) {
        setCidadeSugestoes(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingCidades(false)
    }
  }

  const handleSalvarDominio = async () => {
    if (!formDomain.dominio || !formDomain.label) {
      alert("Por favor, preencha todos os campos obrigatórios.")
      return
    }

    setSalvando(true)
    try {
      const payload = {
        dominio: formDomain.dominio,
        label: formDomain.label,
        cidade_slug: formDomain.cidade_selecionada?.slug || null,
        estado_sigla: formDomain.cidade_selecionada?.estados?.uf || null,
        licenciado_id: formDomain.licenciado_id || null,
        cor_primaria: formDomain.cor_primaria,
        logo_url: formDomain.logo_url || null,
        ativo: formDomain.ativo
      }

      const { error } = await supabase
        .from('dominios_regionais')
        .insert(payload)

      if (error) {
        if (error.code === '23505') {
          throw new Error("Este domínio já está cadastrado no sistema.")
        }
        throw error
      }

      triggerNotification('Domínio regional registrado com sucesso!')
      setShowDomainModal(false)
      setFormDomain({
        dominio: '',
        label: '',
        cidade_busca: '',
        cidade_selecionada: null,
        licenciado_id: '',
        cor_primaria: '#1A9B6A',
        logo_url: '',
        ativo: true
      })
      carregarDados()
    } catch (err: any) {
      alert("Erro ao registrar domínio: " + err.message)
    } finally {
      setSalvando(false)
    }
  }

  const excluirDominio = async (id: string, dominio: string) => {
    const confirm = window.confirm(`Deseja realmente excluir o mapeamento do domínio regional "${dominio}"?`)
    if (!confirm) return

    const { error } = await supabase
      .from('dominios_regionais')
      .delete()
      .eq('id', id)

    if (error) {
      alert("Erro ao excluir: " + error.message)
    } else {
      triggerNotification('Mapeamento de domínio excluído!')
      carregarDados()
    }
  }

  const triggerNotification = (msg: string) => {
    setMsgNotif(msg)
    setTimeout(() => setMsgNotif(''), 4000)
  }

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {msgNotif && (
        <div className="fixed bottom-5 right-5 z-[999] bg-[#ECFDF5] border border-[#A7F3D0] text-[#15803D] font-bold px-5 py-3 rounded-2xl flex items-center gap-2 shadow-lg animate-in fade-in slide-in-from-bottom-5 duration-300">
          <CheckCircle className="w-5 h-5 text-[#16A34A]" />
          {msgNotif}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#0A1628] flex items-center gap-2">
            <Globe className="w-8 h-8 text-[#1A9B6A]" /> Domínios Regionais
          </h1>
          <p className="text-[#5A6A7E] text-sm mt-1 font-medium">
            Mapeamento multi-domínio para franquias locais com identidade visual customizada.
          </p>
        </div>
        <button 
          onClick={() => setShowDomainModal(true)}
          className="inline-flex items-center justify-center gap-2 bg-[#1A9B6A] hover:bg-[#147A53] text-white font-extrabold px-6 py-3 rounded-xl transition-all duration-200 shadow-sm cursor-pointer"
        >
          <Plus className="w-5 h-5" /> Adicionar Domínio
        </button>
      </div>

      {/* Grid de Domínios Ativos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          <div className="md:col-span-3 p-12 text-center text-[#5A6A7E] font-bold">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-[#1A9B6A]" />
            Carregando domínios regionais ativos...
          </div>
        ) : null}

        {!loading && dominios.length === 0 ? (
          <div className="md:col-span-3 p-12 text-center text-[#5A6A7E] font-bold bg-white border border-[#EEF3F8] rounded-2xl">
            Nenhum domínio regional configurado no momento.
          </div>
        ) : null}

        {dominios.map(dom => (
          <div key={dom.id} className="bg-white border border-[#EEF3F8] rounded-2xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden group">
            {/* Color Accent bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: dom.cor_primaria || '#1A9B6A' }}></div>

            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-extrabold text-[#0A1628] text-lg truncate max-w-[200px]">{dom.label}</h3>
                  <p className="text-[#1A9B6A] text-xs font-black font-mono tracking-tight mt-1">{dom.dominio}</p>
                </div>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                  dom.ativo ? 'bg-[#ECFDF5] text-[#16A34A]' : 'bg-[#FEF2F2] text-[#DC2626]'
                }`}>
                  {dom.ativo ? 'ATIVO' : 'INATIVO'}
                </span>
              </div>

              {/* Detalhes do Escopo */}
              <div className="bg-[#F8FAFC] rounded-xl p-3 border border-[#EEF3F8] space-y-2">
                <div className="flex justify-between text-xs font-bold text-[#5A6A7E]">
                  <span>Filtro de Cidade:</span>
                  <span className="text-[#0A1628]">
                    {dom.cidade_slug ? `📍 ${dom.cidade_slug.toUpperCase()}` : '🌐 Brasil Inteiro'}
                  </span>
                </div>
                <div className="flex justify-between text-xs font-bold text-[#5A6A7E]">
                  <span>Licenciado Responsável:</span>
                  <span className="text-[#0A1628] truncate max-w-[120px]">
                    {dom.licenciados?.nome || '—'}
                  </span>
                </div>
              </div>

              {/* Customizer Preview */}
              <div className="space-y-1.5">
                <p className="text-[10px] text-[#5A6A7E] font-black uppercase tracking-wider">Amostra da Cor Primária</p>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg border border-[#EEF3F8]" style={{ backgroundColor: dom.cor_primaria || '#1A9B6A' }}></div>
                  <span className="text-xs font-mono font-bold text-[#0A1628]">{dom.cor_primaria || '#1A9B6A'}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#EEF3F8] flex justify-end">
              <button 
                onClick={() => excluirDominio(dom.id, dom.dominio)}
                className="p-2 text-[#5A6A7E] hover:text-[#DC2626] bg-[#F8FAFC] hover:bg-red-50 border border-[#EEF3F8] hover:border-[#FCA5A5] rounded-xl transition-all cursor-pointer inline-flex items-center justify-center"
                title="Remover Mapeamento"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL / DRAWER REGISTRO DOMÍNIO */}
      {showDomainModal && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDomainModal(false)}></div>
          <div className="relative w-full max-w-md bg-white border-l border-[#EEF3F8] h-full flex flex-col justify-between shadow-2xl z-10 animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-[#EEF3F8] flex items-center justify-between bg-[#F8FAFC]">
              <div>
                <h2 className="text-lg font-black text-[#0A1628] flex items-center gap-2">
                  <Globe className="w-5 h-5 text-[#1A9B6A]" /> Adicionar Domínio Regional
                </h2>
                <p className="text-[#5A6A7E] text-xs font-semibold mt-1">Conecte um domínio customizado a um território exclusivo.</p>
              </div>
              <button onClick={() => setShowDomainModal(false)} className="p-2 hover:bg-[#F1F5F9] rounded-xl text-[#5A6A7E] transition-all cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5A6A7E] mb-1">Domínio Comercial (Hostname) *</label>
                <input 
                  type="text" 
                  className="w-full bg-white border border-[#EEF3F8] rounded-xl px-4 py-2.5 text-[#0A1628] focus:outline-none focus:border-[#1A9B6A] font-bold"
                  placeholder="Ex: maringa.guialocalbr.com.br"
                  value={formDomain.dominio}
                  onChange={e => setFormDomain({...formDomain, dominio: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5A6A7E] mb-1">Label Comercial / Título do Site *</label>
                <input 
                  type="text" 
                  className="w-full bg-white border border-[#EEF3F8] rounded-xl px-4 py-2.5 text-[#0A1628] focus:outline-none focus:border-[#1A9B6A] font-bold"
                  placeholder="Ex: Guia Local Maringá"
                  value={formDomain.label}
                  onChange={e => setFormDomain({...formDomain, label: e.target.value})}
                />
              </div>

              {/* Autocomplete de Cidade */}
              <div className="relative">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5A6A7E] mb-1">Cidade para Filtragem Automática (Opcional)</label>
                <input 
                  type="text" 
                  className="w-full bg-white border border-[#EEF3F8] rounded-xl pl-4 pr-10 py-2.5 text-[#0A1628] focus:outline-none focus:border-[#1A9B6A] font-bold"
                  placeholder="Ex: Maringá"
                  value={formDomain.cidade_busca}
                  onChange={e => setFormDomain({...formDomain, cidade_busca: e.target.value})}
                />
                {loadingCidades && <Loader2 className="w-4 h-4 animate-spin text-[#1A9B6A] absolute right-3 top-3.5" />}

                {cidadeSugestoes.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-[#EEF3F8] rounded-xl overflow-hidden shadow-2xl z-50 divide-y divide-[#EEF3F8]">
                    {cidadeSugestoes.map(c => (
                      <div 
                        key={c.id}
                        onClick={() => {
                          setFormDomain({
                            ...formDomain,
                            cidade_selecionada: c,
                            cidade_busca: `${c.nome} - ${c.estados?.uf || ''}`
                          })
                          setCidadeSugestoes([])
                        }}
                        className="px-4 py-2 text-xs font-bold text-[#0A1628] hover:bg-[#EFF6FF] hover:text-[#1A9B6A] cursor-pointer transition-colors"
                      >
                        📍 {c.nome} - {c.estados?.uf || ''}
                      </div>
                    ))}
                  </div>
                )}

                {formDomain.cidade_selecionada && (
                  <p className="text-[10px] text-[#16A34A] font-black mt-1 flex items-center gap-1">
                    ✓ Cidade vinculada: {formDomain.cidade_selecionada.nome} - {formDomain.cidade_selecionada.estados?.uf || ''}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5A6A7E] mb-1">Vincular com Licenciado</label>
                <select 
                  className="w-full bg-white border border-[#EEF3F8] rounded-xl px-4 py-2.5 text-[#0A1628] focus:outline-none focus:border-[#1A9B6A] font-bold cursor-pointer"
                  value={formDomain.licenciado_id}
                  onChange={e => setFormDomain({...formDomain, licenciado_id: e.target.value})}
                >
                  <option value="">Nenhum...</option>
                  {licenciados.map(l => <option key={l.id} value={l.id}>{l.nome} ({l.nivel})</option>)}
                </select>
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5A6A7E] mb-1">Cor de Destaque da Marca</label>
                <div className="flex gap-2">
                  <input 
                    type="color" 
                    className="w-12 h-11 bg-white border border-[#EEF3F8] rounded-xl p-1 cursor-pointer"
                    value={formDomain.cor_primaria}
                    onChange={e => setFormDomain({...formDomain, cor_primaria: e.target.value})}
                  />
                  <input 
                    type="text" 
                    className="flex-1 bg-white border border-[#EEF3F8] rounded-xl px-4 py-2.5 text-[#0A1628] focus:outline-none focus:border-[#1A9B6A] font-bold text-xs font-mono uppercase"
                    value={formDomain.cor_primaria}
                    onChange={e => setFormDomain({...formDomain, cor_primaria: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5A6A7E] mb-1">Logo URL (Opcional)</label>
                <input 
                  type="text" 
                  className="w-full bg-white border border-[#EEF3F8] rounded-xl px-4 py-2.5 text-[#0A1628] focus:outline-none focus:border-[#1A9B6A] font-bold"
                  placeholder="https://sua-logo.png"
                  value={formDomain.logo_url}
                  onChange={e => setFormDomain({...formDomain, logo_url: e.target.value})}
                />
              </div>
            </div>

            <div className="p-6 border-t border-[#EEF3F8] bg-[#F8FAFC] flex gap-3">
              <button 
                onClick={() => setShowDomainModal(false)}
                className="flex-1 border border-[#EEF3F8] text-[#5A6A7E] py-3 rounded-xl font-bold hover:bg-[#F1F5F9] cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSalvarDominio}
                disabled={salvando}
                className="flex-1 bg-[#1A9B6A] hover:bg-[#147A53] text-white py-3 rounded-xl font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {salvando ? 'Salvando...' : 'Salvar Registro'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
