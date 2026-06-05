import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { 
  Key, Plus, ShieldCheck, Calendar, DollarSign, Search, CheckCircle, 
  AlertTriangle, MapPin, X, Loader2, Award, Users, Trash2, ArrowUpRight, Check
} from 'lucide-react'

export default function AdminLicenciamentos() {
  const [licenciados, setLicenciados] = useState<any[]>([])
  const [licencas, setLicencas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [msgNotif, setMsgNotif] = useState('')

  // Modais / Drawers
  const [showLicenciadoModal, setShowLicenciadoModal] = useState(false)
  const [showLicencaModal, setShowLicencaModal] = useState(false)
  const [salvando, setSalvando] = useState(false)

  // Formulário Licenciado
  const [formLicenciado, setFormLicenciado] = useState({
    nome: '',
    email: '',
    whatsapp: '',
    nivel: 'cidade',
    observacoes: ''
  })

  // Formulário Licença
  const [formLicenca, setFormLicenca] = useState({
    licenciado_id: '',
    cidade_busca: '',
    cidade_selecionada: null as any,
    vigencia_fim: '',
    valor_anual: '',
    pago: false,
    forma_pagamento: 'pix',
    limite_premium: '0',
    limite_gratis: '200',
    status: 'ativo'
  })

  // Cidade busca autocomplete
  const [cidadeSugestoes, setCidadeSugestoes] = useState<any[]>([])
  const [loadingCidades, setLoadingCidades] = useState(false)

  useEffect(() => {
    carregarDados()
  }, [])

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (formLicenca.cidade_busca.length >= 2) {
        buscarCidadesIbge(formLicenca.cidade_busca)
      } else {
        setCidadeSugestoes([])
      }
    }, 300)
    return () => clearTimeout(delayDebounce)
  }, [formLicenca.cidade_busca])

  const carregarDados = async () => {
    try {
      setLoading(true)
      const [
        { data: licd, error: err1 },
        { data: lics, error: err2 }
      ] = await Promise.all([
        supabase.from('licenciados').select('*').order('nome'),
        supabase.from('licencas').select('*, licenciados(nome, email, whatsapp)').order('criado_em', { ascending: false })
      ])

      if (err1) throw err1
      if (err2) throw err2

      setLicenciados(licd || [])
      setLicencas(lics || [])
    } catch (err: any) {
      console.error('Erro carregando licenciamentos:', err.message)
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

  const handleSalvarLicenciado = async () => {
    if (!formLicenciado.nome || !formLicenciado.email || !formLicenciado.whatsapp) {
      alert("Por favor, preencha todos os campos obrigatórios.")
      return
    }

    setSalvando(true)
    try {
      const slug = formLicenciado.nome.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') + '-' + Math.floor(Math.random() * 1000)

      const { error } = await supabase
        .from('licenciados')
        .insert({
          ...formLicenciado,
          slug
        })

      if (error) throw error

      triggerNotification('Licenciado registrado com sucesso!')
      setShowLicenciadoModal(false)
      setFormLicenciado({ nome: '', email: '', whatsapp: '', nivel: 'cidade', observacoes: '' })
      carregarDados()
    } catch (err: any) {
      alert("Erro ao registrar licenciado: " + err.message)
    } finally {
      setSalvando(false)
    }
  }

  const handleSalvarLicenca = async () => {
    if (!formLicenca.licenciado_id || !formLicenca.cidade_selecionada || !formLicenca.vigencia_fim) {
      alert("Por favor, selecione o Licenciado, a Cidade territorial e a Data de Vencimento.")
      return
    }

    setSalvando(true)
    try {
      const payload = {
        licenciado_id: formLicenca.licenciado_id,
        cidade_nome: formLicenca.cidade_selecionada.nome,
        estado_sigla: formLicenca.cidade_selecionada.estados?.uf || 'BR',
        cidade_slug: formLicenca.cidade_selecionada.slug,
        vigencia_fim: formLicenca.vigencia_fim,
        valor_anual: formLicenca.valor_anual ? parseFloat(formLicenca.valor_anual) : null,
        pago: formLicenca.pago,
        forma_pagamento: formLicenca.forma_pagamento,
        data_pagamento: formLicenca.pago ? new Date().toISOString().split('T')[0] : null,
        limite_premium: 0,
        limite_gratis: parseInt(formLicenca.limite_gratis),
        status: formLicenca.status
      }

      const { error } = await supabase
        .from('licencas')
        .insert(payload)

      if (error) {
        if (error.code === '23505') {
          throw new Error("Conflito Territorial! Já existe uma licença ativa registrada para esta cidade.")
        }
        throw error
      }

      triggerNotification('Licença territorial concedida com sucesso!')
      setShowLicencaModal(false)
      setFormLicenca({
        licenciado_id: '',
        cidade_busca: '',
        cidade_selecionada: null,
        vigencia_fim: '',
        valor_anual: '',
        pago: false,
        forma_pagamento: 'pix',
        limite_premium: '0',
        limite_gratis: '200',
        status: 'ativo'
      })
      carregarDados()
    } catch (err: any) {
      alert("Erro ao emitir licença: " + err.message)
    } finally {
      setSalvando(false)
    }
  }

  const excluirLicenca = async (id: string, cidade: string) => {
    const confirm = window.confirm(`Deseja revogar permanentemente a licença territorial da cidade "${cidade}"?`)
    if (!confirm) return

    const { error } = await supabase
      .from('licencas')
      .delete()
      .eq('id', id)

    if (error) {
      alert("Erro ao revogar: " + error.message)
    } else {
      triggerNotification('Licença territorial revogada!')
      carregarDados()
    }
  }

  const triggerNotification = (msg: string) => {
    setMsgNotif(msg)
    setTimeout(() => setMsgNotif(''), 4000)
  }

  // Estatísticas Rápidas
  const totalValorAnual = licencas.reduce((acc, curr) => acc + (Number(curr.valor_anual) || 0), 0)
  const totalRecebido = licencas.filter(l => l.pago).reduce((acc, curr) => acc + (Number(curr.valor_anual) || 0), 0)
  const totalPendente = totalValorAnual - totalRecebido

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
            <Key className="w-8 h-8 text-[#1A9B6A]" /> Licenciados & Franquias
          </h1>
          <p className="text-[#5A6A7E] text-sm mt-1 font-medium">
            Gestão de bloqueio territorial por cidade, faturamento anual e consultores exclusivos.
          </p>
        </div>
        <div className="flex gap-2.5">
          <button 
            onClick={() => setShowLicenciadoModal(true)}
            className="inline-flex items-center justify-center gap-2 bg-white hover:bg-[#F8FAFC] text-[#0A1628] border border-[#EEF3F8] font-bold px-5 py-3 rounded-xl transition-all duration-200 shadow-sm cursor-pointer"
          >
            <Users className="w-4.5 h-4.5 text-[#1A9B6A]" /> Novo Licenciado
          </button>
          <button 
            onClick={() => setShowLicencaModal(true)}
            className="inline-flex items-center justify-center gap-2 bg-[#1A9B6A] hover:bg-[#147A53] text-white font-extrabold px-6 py-3 rounded-xl transition-all duration-200 shadow-sm cursor-pointer"
          >
            <Plus className="w-5 h-5" /> Conceder Licença
          </button>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Cidades Licenciadas', value: licencas.length, sub: 'Exclusividade territorial', icon: '📍', color: 'text-[#1A9B6A]', bg: 'bg-[#EFF6FF]/40 border-[#BFDBFE]' },
          { label: 'Faturamento Anual', value: `R$ ${totalValorAnual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, sub: 'Contratos vigentes', icon: '💰', color: 'text-[#16A34A]', bg: 'bg-[#ECFDF5]/40 border-[#A7F3D0]' },
          { label: 'Valores Recebidos', value: `R$ ${totalRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, sub: 'Taxas pagas', icon: '💳', color: 'text-[#0D9488]', bg: 'bg-[#F0FDFA]/40 border-[#99F6E4]' },
          { label: 'Contas a Receber', value: `R$ ${totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, sub: 'Pagamentos pendentes', icon: '⏱️', color: 'text-[#D97706]', bg: 'bg-[#FEF3C7]/40 border-[#FDE68A]' },
        ].map((k, i) => (
          <div key={i} className={`bg-white border rounded-2xl p-5 shadow-sm relative overflow-hidden group ${k.bg}`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{k.icon}</span>
              <div>
                <p className="text-[10px] text-[#5A6A7E] font-black uppercase tracking-wider">{k.label}</p>
                <p className={`text-xl font-black ${k.color} mt-0.5`}>{k.value}</p>
                <p className="text-[9px] text-[#5A6A7E] mt-0.5 font-bold">{k.sub}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabela de Licenças Ativas */}
      <div className="bg-white border border-[#EEF3F8] rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-[#EEF3F8]">
          <h3 className="font-extrabold text-[#0A1628] text-base">Territórios e Licenças Emitidas</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#0A1628]">
            <thead className="bg-[#F8FAFC] border-b border-[#EEF3F8] text-[#5A6A7E] font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4 px-6">Cidade / UF</th>
                <th className="p-4">Licenciado Titular</th>
                <th className="p-4 text-center">Vigência Limite</th>
                <th className="p-4 text-right">Faturamento Anual</th>
                <th className="p-4 text-center">Financeiro</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right px-6">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF3F8]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-[#5A6A7E] font-bold">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-[#1A9B6A]" />
                    Carregando registros de licenciamento...
                  </td>
                </tr>
              ) : null}

              {!loading && licencas.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-[#5A6A7E] font-bold">
                    Nenhuma licença territorial concedida no sistema.
                  </td>
                </tr>
              )}

              {licencas.map(lic => (
                <tr key={lic.id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="p-4 px-6">
                    <span className="font-extrabold text-[#0A1628] block">📍 {lic.cidade_nome}</span>
                    <span className="bg-[#EFF6FF] border border-[#BFDBFE] text-[#1A9B6A] text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-widest mt-1 inline-block">{lic.estado_sigla}</span>
                  </td>
                  <td className="p-4">
                    <span className="font-extrabold text-[#0A1628] block">{lic.licenciados?.nome}</span>
                    <span className="text-xs text-[#5A6A7E] font-bold block">{lic.licenciados?.email}</span>
                  </td>
                  <td className="p-4 text-center text-xs font-bold text-[#5A6A7E]">
                    {new Date(lic.vigencia_fim).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="p-4 text-right font-bold text-[#0A1628]">
                    R$ {(Number(lic.valor_anual) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-4 text-center">
                    {lic.pago ? (
                      <span className="bg-[#ECFDF5] border border-[#A7F3D0] text-[#15803D] text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">PAGO</span>
                    ) : (
                      <span className="bg-[#FEF3C7] border border-[#FDE68A] text-[#D97706] text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">PENDENTE</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black ${
                      lic.status === 'ativo' ? 'bg-[#ECFDF5] text-[#16A34A]' : 'bg-[#FEF2F2] text-[#DC2626]'
                    }`}>
                      {lic.status?.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 text-right px-6">
                    <button 
                      onClick={() => excluirLicenca(lic.id, lic.cidade_nome)}
                      className="p-2 text-[#5A6A7E] hover:text-[#DC2626] bg-[#F8FAFC] hover:bg-red-50 border border-[#EEF3F8] hover:border-[#FCA5A5] rounded-xl transition-all cursor-pointer inline-flex items-center justify-center"
                      title="Revogar Licença"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL / DRAWER CADASTRO LICENCIADO */}
      {showLicenciadoModal && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowLicenciadoModal(false)}></div>
          <div className="relative w-full max-w-md bg-white border-l border-[#EEF3F8] h-full flex flex-col justify-between shadow-2xl z-10 animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-[#EEF3F8] flex items-center justify-between bg-[#F8FAFC]">
              <div>
                <h2 className="text-lg font-black text-[#0A1628] flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#1A9B6A]" /> Novo Licenciado
                </h2>
                <p className="text-[#5A6A7E] text-xs font-semibold mt-1">Registre um novo franqueado ou consultor regional.</p>
              </div>
              <button onClick={() => setShowLicenciadoModal(false)} className="p-2 hover:bg-[#F1F5F9] rounded-xl text-[#5A6A7E] transition-all cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5A6A7E] mb-1">Nome Completo *</label>
                <input 
                  type="text" 
                  className="w-full bg-white border border-[#EEF3F8] rounded-xl px-4 py-2.5 text-[#0A1628] focus:outline-none focus:border-[#1A9B6A] font-bold"
                  placeholder="Ex: João Silva da Rocha"
                  value={formLicenciado.nome}
                  onChange={e => setFormLicenciado({...formLicenciado, nome: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5A6A7E] mb-1">Email de Contato *</label>
                <input 
                  type="email" 
                  className="w-full bg-white border border-[#EEF3F8] rounded-xl px-4 py-2.5 text-[#0A1628] focus:outline-none focus:border-[#1A9B6A] font-bold"
                  placeholder="Ex: joao@gmail.com"
                  value={formLicenciado.email}
                  onChange={e => setFormLicenciado({...formLicenciado, email: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5A6A7E] mb-1">WhatsApp de Vendas *</label>
                <input 
                  type="text" 
                  className="w-full bg-white border border-[#EEF3F8] rounded-xl px-4 py-2.5 text-[#0A1628] focus:outline-none focus:border-[#1A9B6A] font-bold"
                  placeholder="Ex: 5544999999999"
                  value={formLicenciado.whatsapp}
                  onChange={e => setFormLicenciado({...formLicenciado, whatsapp: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5A6A7E] mb-1">Nível de Território</label>
                <select 
                  className="w-full bg-white border border-[#EEF3F8] rounded-xl px-4 py-2.5 text-[#0A1628] focus:outline-none focus:border-[#1A9B6A] font-bold cursor-pointer"
                  value={formLicenciado.nivel}
                  onChange={e => setFormLicenciado({...formLicenciado, nivel: e.target.value})}
                >
                  <option value="cidade">Cidade (Individual)</option>
                  <option value="regional">Regional (Microrregião)</option>
                  <option value="estadual">Estadual (Estado Inteiro)</option>
                  <option value="master">Master Geral</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5A6A7E] mb-1">Observações</label>
                <textarea 
                  rows={3} 
                  className="w-full bg-white border border-[#EEF3F8] rounded-xl px-4 py-2.5 text-[#0A1628] focus:outline-none focus:border-[#1A9B6A] font-bold"
                  placeholder="Anotações internas sobre a parceria..."
                  value={formLicenciado.observacoes}
                  onChange={e => setFormLicenciado({...formLicenciado, observacoes: e.target.value})}
                />
              </div>
            </div>

            <div className="p-6 border-t border-[#EEF3F8] bg-[#F8FAFC] flex gap-3">
              <button 
                onClick={() => setShowLicenciadoModal(false)}
                className="flex-1 border border-[#EEF3F8] text-[#5A6A7E] py-3 rounded-xl font-bold hover:bg-[#F1F5F9] cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSalvarLicenciado}
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

      {/* MODAL / DRAWER CONCEDER LICENÇA */}
      {showLicencaModal && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowLicencaModal(false)}></div>
          <div className="relative w-full max-w-md bg-white border-l border-[#EEF3F8] h-full flex flex-col justify-between shadow-2xl z-10 animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-[#EEF3F8] flex items-center justify-between bg-[#F8FAFC]">
              <div>
                <h2 className="text-lg font-black text-[#0A1628] flex items-center gap-2">
                  <Key className="w-5 h-5 text-[#1A9B6A]" /> Conceder Licença
                </h2>
                <p className="text-[#5A6A7E] text-xs font-semibold mt-1">Bloqueie a exclusividade de uma cidade para um licenciado.</p>
              </div>
              <button onClick={() => setShowLicencaModal(false)} className="p-2 hover:bg-[#F1F5F9] rounded-xl text-[#5A6A7E] transition-all cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5A6A7E] mb-1">Selecionar Licenciado *</label>
                <select 
                  className="w-full bg-white border border-[#EEF3F8] rounded-xl px-4 py-2.5 text-[#0A1628] focus:outline-none focus:border-[#1A9B6A] font-bold cursor-pointer"
                  value={formLicenca.licenciado_id}
                  onChange={e => setFormLicenca({...formLicenca, licenciado_id: e.target.value})}
                >
                  <option value="">Selecione...</option>
                  {licenciados.map(l => <option key={l.id} value={l.id}>{l.nome} ({l.nivel})</option>)}
                </select>
              </div>

              {/* Autocomplete de Cidade */}
              <div className="relative">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5A6A7E] mb-1">Cidade para Concessão Exclusiva *</label>
                <input 
                  type="text" 
                  className="w-full bg-white border border-[#EEF3F8] rounded-xl pl-4 pr-10 py-2.5 text-[#0A1628] focus:outline-none focus:border-[#1A9B6A] font-bold"
                  placeholder="Ex: Londrina"
                  value={formLicenca.cidade_busca}
                  onChange={e => setFormLicenca({...formLicenca, cidade_busca: e.target.value})}
                />
                {loadingCidades && <Loader2 className="w-4 h-4 animate-spin text-[#1A9B6A] absolute right-3 top-3.5" />}

                {cidadeSugestoes.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-[#EEF3F8] rounded-xl overflow-hidden shadow-2xl z-50 divide-y divide-[#EEF3F8]">
                    {cidadeSugestoes.map(c => (
                      <div 
                        key={c.id}
                        onClick={() => {
                          setFormLicenca({
                            ...formLicenca,
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

                {formLicenca.cidade_selecionada && (
                  <p className="text-[10px] text-[#16A34A] font-black mt-1 flex items-center gap-1">
                    ✓ Cidade vinculada: {formLicenca.cidade_selecionada.nome} - {formLicenca.cidade_selecionada.estados?.uf || ''}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5A6A7E] mb-1">Vencimento da Licença *</label>
                <input 
                  type="date" 
                  className="w-full bg-white border border-[#EEF3F8] rounded-xl px-4 py-2.5 text-[#0A1628] focus:outline-none focus:border-[#1A9B6A] font-bold cursor-pointer"
                  value={formLicenca.vigencia_fim}
                  onChange={e => setFormLicenca({...formLicenca, vigencia_fim: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5A6A7E] mb-1">Taxa Anual (R$)</label>
                <input 
                  type="number" 
                  className="w-full bg-white border border-[#EEF3F8] rounded-xl px-4 py-2.5 text-[#0A1628] focus:outline-none focus:border-[#1A9B6A] font-bold"
                  placeholder="Ex: 1500.00"
                  value={formLicenca.valor_anual}
                  onChange={e => setFormLicenca({...formLicenca, valor_anual: e.target.value})}
                />
              </div>

              <div className="flex gap-4 items-center bg-[#F8FAFC] border border-[#EEF3F8] p-4 rounded-2xl">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-extrabold text-[#0A1628]">
                  <input 
                    type="checkbox"
                    className="w-4 h-4 accent-[#1A9B6A]"
                    checked={formLicenca.pago}
                    onChange={e => setFormLicenca({...formLicenca, pago: e.target.checked})}
                  />
                  A Taxa Anual está Paga
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-[#EEF3F8] bg-[#F8FAFC] flex gap-3">
              <button 
                onClick={() => setShowLicencaModal(false)}
                className="flex-1 border border-[#EEF3F8] text-[#5A6A7E] py-3 rounded-xl font-bold hover:bg-[#F1F5F9] cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSalvarLicenca}
                disabled={salvando}
                className="flex-1 bg-[#1A9B6A] hover:bg-[#147A53] text-white py-3 rounded-xl font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {salvando ? 'Salvando...' : 'Conceder Exclusividade'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
