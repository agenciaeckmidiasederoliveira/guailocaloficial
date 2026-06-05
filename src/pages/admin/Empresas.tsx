import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Store, UserPlus, CheckCircle, Search, Plus, Edit, Trash2, X, Sparkles, MapPin, Phone, HelpCircle, Loader2, Check, Upload, FileText } from 'lucide-react'

export default function AdminEmpresas() {
  const [empresas, setEmpresas] = useState<any[]>([])
  const [parceiros, setParceiros] = useState<any[]>([])
  const [categorias, setCategorias] = useState<any[]>([])
  
  // Estados de Cidades (Todas as 5625 do IBGE com busca em tempo real)
  const [buscaCidade, setBuscaCidade] = useState('')
  const [cidadesSugeridas, setCidadesSugeridas] = useState<any[]>([])
  const [cidadeSelecionadaObj, setCidadeSelecionadaObj] = useState<any>(null)
  const [loadingCidades, setLoadingCidades] = useState(false)

  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroPlano, setFiltroPlano] = useState('todos')

  // Controle do Drawer de Cadastro/Edição
  const [showDrawer, setShowDrawer] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [form, setForm] = useState<any>({
    nome: '',
    plano: 'gratis',
    categoria_id: '',
    parceiro_id: 'admin', // admin significa sem parceiro_id (gerida diretamente)
    whatsapp: '',
    descricao: '',
    endereco: '',
    cnpj: '',
    telefone: '',
    email_contato: '',
    site: '',
    verificada: false,
    banner_grande_ativo: false
  })
  
  const [salvando, setSalvando] = useState(false)
  const [msgNotif, setMsgNotif] = useState('')
  const [showDestaqueModal, setShowDestaqueModal] = useState(false)
  const [empresaDestaque, setEmpresaDestaque] = useState<any>(null)
  const [destaqueForm, setDestaqueForm] = useState({
    tipo: 'carrossel',
    cidade: '',
    uf: '',
    data_inicio: '',
    data_fim: '',
    valor_mensal: '0',
  })

  // Importação
  const [showImportModal, setShowImportModal] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importTotal, setImportTotal] = useState(0)
  const [importLogs, setImportLogs] = useState<string[]>([])

  useEffect(() => {
    carregarDados()
  }, [])

  // Efeito para busca dinâmica de cidades do IBGE (limita a 10 para performance)
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (buscaCidade.length >= 2) {
        pesquisarCidadesIbge(buscaCidade)
      } else {
        setCidadesSugeridas([])
      }
    }, 300)

    return () => clearTimeout(delayDebounce)
  }, [buscaCidade])

  const carregarDados = async () => {
    try {
      setLoading(true)
      const [
        { data: empData, error: err1 }, 
        { data: parcData, error: err2 },
        { data: catData, error: err3 }
      ] = await Promise.all([
        supabase.from('empresas').select('*, cidades(nome, estado_id, estados(uf)), categorias(nome)').order('criado_em', { ascending: false }),
        supabase.from('parceiros').select('id, nome_comercial, profile_id, profiles(nome, email)'),
        supabase.from('categorias').select('id, nome').order('nome')
      ])

      if (err1) throw err1
      
      setEmpresas(empData || [])
      setParceiros(parcData || [])
      setCategorias(catData || [])
    } catch(err: any) {
      console.error("Erro carregando empresas:", err.message)
    } finally {
      setLoading(false)
    }
  }

  const pesquisarCidadesIbge = async (termo: string) => {
    setLoadingCidades(true)
    try {
      const { data, error } = await supabase
        .from('cidades')
        .select('id, nome, estados(uf)')
        .ilike('nome', `%${termo}%`)
        .limit(10)

      if (!error && data) {
        setCidadesSugeridas(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingCidades(false)
    }
  }

  const transferirEmpresa = async (empresaId: string, parceiroId: string) => {
    const confirm = window.confirm("Deseja transferir esta empresa para este consultor parceiro?")
    if(!confirm) return

    const dbParceiroId = parceiroId === 'admin' ? null : parceiroId
    const { error } = await supabase
      .from('empresas')
      .update({ parceiro_id: dbParceiroId })
      .eq('id', empresaId)

    if(error) {
      alert("Erro ao transferir: " + error.message)
    } else {
      triggerNotification('Empresa transferida com sucesso!')
      carregarDados()
    }
  }

  const excluirEmpresa = async (empresaId: string, nome: string) => {
    const confirm = window.confirm(`Deseja realmente EXCLUIR a empresa "${nome}" permanentemente do sistema?`)
    if(!confirm) return

    const { error } = await supabase
      .from('empresas')
      .delete()
      .eq('id', empresaId)

    if (error) {
      alert("Erro ao excluir: " + error.message)
    } else {
      triggerNotification('Empresa excluída permanentemente!')
      carregarDados()
    }
  }

  const openNewDrawer = () => {
    setForm({
      nome: '',
      plano: 'gratis',
      categoria_id: '',
      parceiro_id: 'admin',
      whatsapp: '',
      descricao: '',
      endereco: '',
      cnpj: '',
      telefone: '',
      email_contato: '',
      site: '',
      verificada: false,
      banner_grande_ativo: false
    })
    setBuscaCidade('')
    setCidadeSelecionadaObj(null)
    setIsEditing(false)
    setEditingId(null)
    setShowDrawer(true)
  }

  const openEditDrawer = (emp: any) => {
    setForm({
      nome: emp.nome,
      plano: emp.plano || 'gratis',
      categoria_id: emp.categoria_id || '',
      parceiro_id: emp.parceiro_id || 'admin',
      whatsapp: emp.whatsapp || '',
      descricao: emp.descricao || '',
      endereco: emp.endereco || '',
      cnpj: emp.cnpj || '',
      telefone: emp.telefone || '',
      email_contato: emp.email_contato || '',
      site: emp.site || '',
      verificada: !!emp.verificada,
      banner_grande_ativo: !!emp.banner_grande_ativo
    })
    
    if (emp.cidades) {
      const uf = emp.cidades.estados?.uf || ''
      setCidadeSelecionadaObj({
        id: emp.cidade_id,
        nome: emp.cidades.nome,
        estados: { uf }
      })
      setBuscaCidade(`${emp.cidades.nome} - ${uf}`)
    } else {
      setCidadeSelecionadaObj(null)
      setBuscaCidade('')
    }
    
    setIsEditing(true)
    setEditingId(emp.id)
    setShowDrawer(true)
  }

  const salvarEmpresa = async () => {
    if (!form.nome || !form.categoria_id || !cidadeSelecionadaObj) {
      alert("Por favor, preencha o Nome, Categoria e selecione uma Cidade válida.")
      return
    }

    setSalvando(true)
    try {
      const slug = form.nome.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') + '-' + Math.floor(Math.random()*1000)

      const payload = {
        nome: form.nome,
        plano: form.plano,
        categoria_id: form.categoria_id,
        cidade_id: cidadeSelecionadaObj.id,
        parceiro_id: form.parceiro_id === 'admin' ? null : form.parceiro_id,
        whatsapp: form.whatsapp,
        descricao: form.descricao,
        endereco: form.endereco,
        cnpj: form.cnpj,
        telefone: form.telefone,
        email_contato: form.email_contato,
        site: form.site,
        verificada: form.verificada,
        banner_grande_ativo: form.banner_grande_ativo,
        ativa: true
      }

      if (isEditing && editingId) {
        const { error } = await supabase
          .from('empresas')
          .update(payload)
          .eq('id', editingId)
        if (error) throw error
        triggerNotification('Empresa atualizada com sucesso!')
      } else {
        const { error } = await supabase
          .from('empresas')
          .insert({ ...payload, slug })
        if (error) throw error
        triggerNotification('Nova empresa cadastrada com sucesso!')
      }

      setShowDrawer(false)
      carregarDados()
    } catch (err: any) {
      alert("Erro ao salvar dados: " + err.message)
    } finally {
      setSalvando(false)
    }
  }

  const triggerNotification = (msg: string) => {
    setMsgNotif(msg)
    setTimeout(() => setMsgNotif(''), 4000)
  }

  const openDestaqueModal = (emp: any) => {
    setEmpresaDestaque(emp)
    setDestaqueForm({
      tipo: 'carrossel',
      cidade: emp.cidades?.nome || '',
      uf: emp.cidades?.estados?.uf || '',
      data_inicio: new Date().toISOString().slice(0, 10),
      data_fim: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      valor_mensal: '0',
    })
    setShowDestaqueModal(true)
  }

  const salvarDestaque = async () => {
    if (!empresaDestaque?.id || !destaqueForm.cidade || !destaqueForm.uf || !destaqueForm.data_inicio || !destaqueForm.data_fim) {
      alert('Preencha cidade, UF e período do destaque.')
      return
    }

    const { error } = await supabase.from('empresa_destaques').insert({
      empresa_id: empresaDestaque.id,
      cidade: destaqueForm.cidade,
      uf: destaqueForm.uf,
      tipo: destaqueForm.tipo,
      valor_mensal: Number(destaqueForm.valor_mensal || 0),
      ativo: true,
      data_inicio: destaqueForm.data_inicio,
      data_fim: destaqueForm.data_fim,
    })

    if (error) {
      alert(`Erro ao salvar destaque: ${error.message}`)
      return
    }

    triggerNotification('Empresa colocada em destaque!')
    setShowDestaqueModal(false)
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if(!file) return
    
    setImporting(true)
    setImportLogs([])
    
    const text = await file.text()
    // Simple CSV parser
    const rows = text.split('\n').map(r => r.split(',').map(c => c.trim().replace(/^"|"$/g, '')))
    const data = rows.slice(1).filter(r => r.length > 1 && r[0])
    
    setImportTotal(data.length)
    setImportProgress(0)

    const { data: allCidades } = await supabase.from('cidades').select('id, nome, estados(uf)')
    const cidadeMap = new Map()
    if (allCidades) {
      allCidades.forEach(c => {
        const estado = Array.isArray(c.estados) ? c.estados[0] : c.estados
        const uf = estado?.uf || ''
        const key = `${c.nome.toLowerCase()}-${uf.toLowerCase()}`
        cidadeMap.set(key, c.id)
      })
    }

    let successCount = 0

    for(let i=0; i<data.length; i++) {
      const row = data[i]
      // Nome, Cidade, Estado, Plano, Status, Data Cadastro, Link
      const nome = row[0]
      const rawCidade = row[1] || ''
      const rawEstado = row[2] || ''
      const planoRaw = row[3] || ''
      const statusRaw = row[4] || ''
      const dataCadastro = row[5] || ''
      const link = row[6] || ''

      const cidadeNorm = rawCidade.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
      const estadoNorm = rawEstado.toUpperCase()
      
      let plano = 'gratis'
      if (planoRaw.toLowerCase().includes('premium')) plano = 'premium'
      
      const ativa = statusRaw.toLowerCase().includes('aprovado') || statusRaw.toLowerCase() === 'true'

      const cidKey = `${cidadeNorm.toLowerCase()}-${estadoNorm.toLowerCase()}`
      let cidade_id = cidadeMap.get(cidKey)
      
      if (!cidade_id) {
         for(const [k, v] of cidadeMap.entries()) {
            if (k.startsWith(cidadeNorm.toLowerCase() + '-')) {
               cidade_id = v
               break
            }
         }
      }

      const slug = nome.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Math.floor(Math.random()*10000)

      let criado_em = new Date().toISOString()
      if (dataCadastro) {
        try {
          const parts = dataCadastro.split('/')
          if(parts.length === 3) criado_em = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T12:00:00Z`).toISOString()
        } catch(e) {}
      }

      const payload = {
        nome,
        slug,
        plano,
        ativa,
        cidade_id,
        site: link,
        parceiro_id: null,
        verificada: false,
        banner_grande_ativo: false,
        whatsapp: '',
        descricao: '',
        endereco: '',
        telefone: '',
        criado_em
      }

      const { error } = await supabase.from('empresas').insert(payload)
      if (error) {
         setImportLogs(prev => [...prev, `Linha ${i+1} (${nome}): ${error.message}`])
      } else {
         successCount++
      }
      
      setImportProgress(i+1)
    }

    setImportLogs(prev => [...prev, `Concluído! ${successCount} importados com sucesso de ${data.length}.`])
    setImporting(false)
    carregarDados()
  }

  // Filtros de listagem
  const empresasFiltradas = empresas.filter(e => {
    const bateBusca = e.nome.toLowerCase().includes(busca.toLowerCase()) || 
                      (e.cidades?.nome || '').toLowerCase().includes(busca.toLowerCase())
    
    if (filtroPlano === 'todos') return bateBusca
    if (filtroPlano === 'premium') return bateBusca && (e.plano === 'premium' || e.plano === 'turbo')
    if (filtroPlano === 'gratis') return bateBusca && e.plano === 'gratis'
    if (filtroPlano === 'verificadas') return bateBusca && e.verificada
    return bateBusca
  })

  return (
    <div className="space-y-6">

      {/* Notificação Toast */}
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
            <Store className="w-8 h-8 text-[#1A9B6A]" /> Gestão de Empresas
          </h1>
          <p className="text-[#5A6A7E] text-sm mt-1 font-medium">
            Total de {empresas.length} empresas cadastradas no território nacional.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowImportModal(true)}
            className="inline-flex items-center justify-center gap-2 bg-white border border-[#EEF3F8] hover:bg-[#F8FAFC] text-[#0A1628] font-extrabold px-6 py-3 rounded-xl transition-all duration-200 shadow-sm cursor-pointer"
          >
            <Upload className="w-5 h-5 text-[#5A6A7E]" /> Importar CSV
          </button>
          <button onClick={openNewDrawer}
            className="inline-flex items-center justify-center gap-2 bg-[#16A34A] hover:bg-[#15803D] text-white font-extrabold px-6 py-3 rounded-xl transition-all duration-200 shadow-sm shadow-green-500/10 cursor-pointer"
          >
            <Plus className="w-5 h-5" /> Cadastrar Nova Empresa
          </button>
        </div>
      </div>

      {/* Controles e Filtros */}
      <div className="bg-white border border-[#EEF3F8] rounded-2xl p-5 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        
        {/* Busca */}
        <div className="relative w-full md:w-96 group">
          <input 
            type="text" 
            placeholder="Buscar por empresa ou cidade..." 
            className="w-full bg-white border border-[#EEF3F8] rounded-xl pl-11 pr-4 py-3 text-[#0A1628] focus:outline-none focus:border-[#1A9B6A] focus:ring-1 focus:ring-[#1A9B6A] placeholder-[#94A3B8] transition-all font-semibold text-sm"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <Search className="w-5 h-5 text-[#5A6A7E] absolute left-4 top-3.5" />
        </div>

        {/* Abas de Filtros */}
        <div className="flex bg-[#F8FAFC] border border-[#EEF3F8] rounded-xl p-1 w-full md:w-auto">
          {[
            { id: 'todos', label: 'Todas' },
            { id: 'premium', label: '👑 Premium/Turbo' },
            { id: 'gratis', label: 'Grátis' },
            { id: 'verificadas', label: '✓ Verificadas' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFiltroPlano(f.id)}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-black transition-all duration-200 cursor-pointer ${
                filtroPlano === f.id 
                  ? 'bg-[#1A9B6A] text-white shadow-sm' 
                  : 'text-[#5A6A7E] hover:text-[#0A1628]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela de Empresas */}
      <div className="bg-white border border-[#EEF3F8] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#0A1628]">
            <thead className="bg-[#F8FAFC] border-b border-[#EEF3F8] text-[#5A6A7E] font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4">Empresa</th>
                <th className="p-4">Cidade / Região</th>
                <th className="p-4">Nível / Plano</th>
                <th className="p-4">Dono Responsável</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF3F8]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-[#5A6A7E] font-bold">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-[#1A9B6A]" />
                    Buscando empresas no Supabase...
                  </td>
                </tr>
              ) : null}
              
              {!loading && empresasFiltradas.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-[#5A6A7E] font-bold">
                    Nenhuma empresa encontrada com os filtros selecionados.
                  </td>
                </tr>
              )}

              {empresasFiltradas.map(emp => (
                <tr key={emp.id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center flex-shrink-0">
                        <Store className="w-5 h-5 text-[#1A9B6A]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-[#0A1628]">{emp.nome}</span>
                          {emp.verificada && (
                            <span className="bg-[#EFF6FF] text-[#1A9B6A] text-[8px] font-black tracking-widest px-1.5 py-0.5 rounded-full border border-[#BFDBFE]" title="Verificada">
                              ✓ SELO
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-[#5A6A7E] font-bold">{emp.categorias?.nome || '—'}</span>
                      </div>
                    </div>
                  </td>
                  
                  <td className="p-4">
                    <span className="text-[#0A1628] font-extrabold">{emp.cidades?.nome || '—'}</span>
                    <span className="text-xs text-[#5A6A7E] font-bold block">{emp.cidades?.estados?.uf || 'Brasil'}</span>
                  </td>
                  
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black border ${
                      emp.plano === 'turbo' 
                        ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#16A34A] shadow-sm' 
                        : emp.plano === 'premium'
                        ? 'bg-[#FEF3C7] border-[#FDE68A] text-[#D97706]' 
                        : 'bg-white border-[#EEF3F8] text-[#5A6A7E]'
                    }`}>
                      {emp.plano?.toUpperCase() || 'GRATUITO'}
                    </span>
                  </td>
                  
                  <td className="p-4">
                    <select 
                      className="bg-white border border-[#EEF3F8] rounded-xl px-3 py-1.5 text-xs text-[#0A1628] outline-none focus:border-[#1A9B6A] w-44 font-bold cursor-pointer"
                      value={emp.parceiro_id || 'admin'}
                      onChange={(e) => transferirEmpresa(emp.id, e.target.value)}
                    >
                      <option value="admin">🟢 Admin (Direto)</option>
                      {parceiros.map(p => (
                        <option key={p.id} value={p.id}>👤 {p.nome_comercial || p.profiles?.nome}</option>
                      ))}
                    </select>
                  </td>
                  
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => openDestaqueModal(emp)}
                        className="p-2 text-[#5A6A7E] hover:text-[#D97706] bg-[#F8FAFC] hover:bg-amber-50 border border-[#EEF3F8] hover:border-[#FDE68A] rounded-xl transition-all cursor-pointer"
                        title="Colocar em Destaque"
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => openEditDrawer(emp)}
                        className="p-2 text-[#5A6A7E] hover:text-[#1A9B6A] bg-[#F8FAFC] hover:bg-[#EFF6FF] border border-[#EEF3F8] hover:border-[#BFDBFE] rounded-xl transition-all cursor-pointer"
                        title="Editar Empresa"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => excluirEmpresa(emp.id, emp.nome)}
                        className="p-2 text-[#5A6A7E] hover:text-[#DC2626] bg-[#F8FAFC] hover:bg-red-50 border border-[#EEF3F8] hover:border-[#FCA5A5] rounded-xl transition-all cursor-pointer"
                        title="Excluir Empresa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DYNAMIC DRAWER - Cadastrar/Editar */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setShowDrawer(false)}></div>
          
          {/* Container do Drawer */}
          <div className="relative w-full max-w-2xl bg-white border-l border-[#EEF3F8] h-full flex flex-col justify-between shadow-2xl z-10 animate-in slide-in-from-right duration-300">
            
            {/* Header */}
            <div className="p-6 border-b border-[#EEF3F8] flex items-center justify-between bg-[#F8FAFC]">
              <div>
                <h2 className="text-xl font-black text-[#0A1628] flex items-center gap-2">
                  {isEditing ? <Edit className="w-5 h-5 text-[#1A9B6A]" /> : <Plus className="w-5 h-5 text-[#1A9B6A]" />}
                  {isEditing ? 'Editar Empresa' : 'Cadastrar Nova Empresa'}
                </h2>
                <p className="text-[#5A6A7E] text-xs mt-1 font-semibold">Preencha os campos para publicar no Guia Comercial.</p>
              </div>
              <button onClick={() => setShowDrawer(false)} className="p-2 hover:bg-[#F1F5F9] rounded-xl text-[#5A6A7E] hover:text-[#0A1628] transition-all cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 p-6 overflow-y-auto space-y-5">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Nome */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#5A6A7E] mb-1.5">Nome da Empresa *</label>
                  <input 
                    type="text" 
                    className="w-full bg-white border border-[#EEF3F8] rounded-xl px-4 py-2.5 text-[#0A1628] focus:outline-none focus:border-[#1A9B6A] font-bold"
                    placeholder="Ex: Padaria Bella Vista"
                    value={form.nome} 
                    onChange={e => setForm({...form, nome: e.target.value})} 
                  />
                </div>

                {/* Categoria */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#5A6A7E] mb-1.5">Categoria de Atividade *</label>
                  <select 
                    className="w-full bg-white border border-[#EEF3F8] rounded-xl px-4 py-2.5 text-[#0A1628] focus:outline-none focus:border-[#1A9B6A] font-bold cursor-pointer"
                    value={form.categoria_id} 
                    onChange={e => setForm({...form, categoria_id: e.target.value})}
                  >
                    <option value="">Selecione...</option>
                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>

                {/* Plano */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#5A6A7E] mb-1.5">Nível do Plano</label>
                  <select 
                    className="w-full bg-white border border-[#EEF3F8] rounded-xl px-4 py-2.5 text-[#0A1628] focus:outline-none focus:border-[#1A9B6A] font-bold cursor-pointer"
                    value={form.plano} 
                    onChange={e => setForm({...form, plano: e.target.value})}
                  >
                    <option value="gratis">Gratuito</option>
                    <option value="premium">Premium</option>
                    <option value="turbo">⚡ Turbo (Super Destaque)</option>
                  </select>
                </div>

                {/* FUZZY SEARCH CIDADES */}
                <div className="md:col-span-2 relative">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#5A6A7E] mb-1.5">
                    Cidade / Região (Busca em tempo real nas 5.625 cidades do IBGE) *
                  </label>
                  <div className="relative group">
                    <input 
                      type="text" 
                      className="w-full bg-white border border-[#EEF3F8] rounded-xl pl-10 pr-4 py-2.5 text-[#0A1628] focus:outline-none focus:border-[#1A9B6A] font-bold"
                      placeholder="Digite o nome da cidade para buscar... (Ex: Maringá)"
                      value={buscaCidade} 
                      onChange={e => setBuscaCidade(e.target.value)} 
                    />
                    <MapPin className="w-5 h-5 text-[#5A6A7E] absolute left-3 top-3" />
                    {loadingCidades && (
                      <Loader2 className="w-5 h-5 text-[#1A9B6A] animate-spin absolute right-3 top-3" />
                    )}
                  </div>

                  {/* Resultados da busca preditiva */}
                  {cidadesSugeridas.length > 0 && (
                    <div className="absolute left-0 right-0 mt-1 bg-white border border-[#EEF3F8] rounded-xl overflow-hidden shadow-2xl z-50 divide-y divide-[#EEF3F8]">
                      {cidadesSugeridas.map(c => (
                        <div 
                          key={c.id} 
                          onClick={() => {
                            setCidadeSelecionadaObj(c)
                            setBuscaCidade(`${c.nome} - ${c.estados?.uf || ''}`)
                            setCidadesSugeridas([])
                          }}
                          className="px-4 py-2.5 text-xs font-bold text-[#0A1628] hover:text-[#1A9B6A] hover:bg-[#EFF6FF] cursor-pointer transition-colors"
                        >
                          📍 {c.nome} - {c.estados?.uf || ''}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Badge de Cidade Selecionada */}
                  {cidadeSelecionadaObj && (
                    <p className="text-[10px] text-[#16A34A] font-black mt-1.5 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" /> Vinculado com sucesso: {cidadeSelecionadaObj.nome} - {cidadeSelecionadaObj.estados?.uf || ''}
                    </p>
                  )}
                </div>

                {/* Dono Responsável */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#5A6A7E] mb-1.5">Dono (Gestor)</label>
                  <select 
                    className="w-full bg-white border border-[#EEF3F8] rounded-xl px-4 py-2.5 text-[#0A1628] focus:outline-none focus:border-[#1A9B6A] font-bold cursor-pointer"
                    value={form.parceiro_id} 
                    onChange={e => setForm({...form, parceiro_id: e.target.value})}
                  >
                    <option value="admin">🟢 Admin (Direto)</option>
                    {parceiros.map(p => (
                      <option key={p.id} value={p.id}>👤 {p.nome_comercial || p.profiles?.nome}</option>
                    ))}
                  </select>
                </div>

                {/* WhatsApp */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#5A6A7E] mb-1.5">WhatsApp contato (com DDD) *</label>
                  <input 
                    type="text" 
                    placeholder="Ex: 5544999999999"
                    className="w-full bg-white border border-[#EEF3F8] rounded-xl px-4 py-2.5 text-[#0A1628] focus:outline-none focus:border-[#1A9B6A] font-bold"
                    value={form.whatsapp} 
                    onChange={e => setForm({...form, whatsapp: e.target.value})} 
                  />
                </div>

                {/* Endereço */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#5A6A7E] mb-1.5">Endereço comercial</label>
                  <input 
                    type="text" 
                    placeholder="Av. Brasil, 1200, Centro"
                    className="w-full bg-white border border-[#EEF3F8] rounded-xl px-4 py-2.5 text-[#0A1628] focus:outline-none focus:border-[#1A9B6A] font-bold"
                    value={form.endereco} 
                    onChange={e => setForm({...form, endereco: e.target.value})} 
                  />
                </div>

                {/* Site */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#5A6A7E] mb-1.5">Website</label>
                  <input 
                    type="text" 
                    placeholder="https://www.padaria.com.br"
                    className="w-full bg-white border border-[#EEF3F8] rounded-xl px-4 py-2.5 text-[#0A1628] focus:outline-none focus:border-[#1A9B6A] font-bold"
                    value={form.site} 
                    onChange={e => setForm({...form, site: e.target.value})} 
                  />
                </div>

                {/* CNPJ */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#5A6A7E] mb-1.5">CNPJ (Opcional)</label>
                  <input 
                    type="text" 
                    placeholder="00.000.000/0001-00"
                    className="w-full bg-white border border-[#EEF3F8] rounded-xl px-4 py-2.5 text-[#0A1628] focus:outline-none focus:border-[#1A9B6A] font-bold"
                    value={form.cnpj} 
                    onChange={e => setForm({...form, cnpj: e.target.value})} 
                  />
                </div>

                {/* Descrição */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#5A6A7E] mb-1.5">Descrição Curta</label>
                  <textarea 
                    rows={3} 
                    placeholder="Resumo das atividades da empresa..."
                    className="w-full bg-white border border-[#EEF3F8] rounded-xl px-4 py-2.5 text-[#0A1628] focus:outline-none focus:border-[#1A9B6A] font-bold"
                    value={form.descricao} 
                    onChange={e => setForm({...form, descricao: e.target.value})}
                  />
                </div>

                {/* Selos em Destaque */}
                <div className="md:col-span-2 bg-[#F8FAFC] border border-[#EEF3F8] rounded-2xl p-4 flex gap-6">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-extrabold text-[#0A1628]">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 accent-[#1A9B6A]"
                      checked={form.verificada} 
                      onChange={e => setForm({...form, verificada: e.target.checked})}
                    />
                    Selo Verificado Ativo
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-extrabold text-[#0A1628]">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 accent-[#D97706]"
                      checked={form.banner_grande_ativo} 
                      onChange={e => setForm({...form, banner_grande_ativo: e.target.checked})}
                    />
                    Destaque Banner Principal (Home)
                  </label>
                </div>

              </div>

            </div>

            {/* Footer */}
            <div className="p-6 border-t border-[#EEF3F8] flex gap-4 bg-[#F8FAFC]">
              <button 
                onClick={() => setShowDrawer(false)}
                className="flex-1 border border-[#EEF3F8] hover:bg-[#F1F5F9] text-[#5A6A7E] py-3 rounded-xl font-bold transition-all text-xs uppercase tracking-wider cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                onClick={salvarEmpresa} 
                disabled={salvando}
                className="flex-1 bg-[#16A34A] hover:bg-[#15803D] disabled:opacity-50 text-white py-3 rounded-xl font-extrabold transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider shadow-sm cursor-pointer"
              >
                {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {salvando ? 'Salvando...' : 'Salvar Registro'}
              </button>
            </div>

          </div>
        </div>
      )}

      {showDestaqueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowDestaqueModal(false)} />
          <div className="relative z-10 w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-black text-[#0A1628]">Colocar em Destaque</h3>
            <p className="mt-1 text-sm text-[#5A6A7E]">{empresaDestaque?.nome}</p>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <select className="rounded-xl border border-[#EEF3F8] px-4 py-2.5 text-sm font-bold" value={destaqueForm.tipo} onChange={e => setDestaqueForm(prev => ({ ...prev, tipo: e.target.value }))}>
                <option value="carrossel">carrossel</option>
                <option value="banner_topo">banner_topo</option>
              </select>
              <input className="rounded-xl border border-[#EEF3F8] px-4 py-2.5 text-sm font-bold" placeholder="Cidade" value={destaqueForm.cidade} onChange={e => setDestaqueForm(prev => ({ ...prev, cidade: e.target.value }))} />
              <input className="rounded-xl border border-[#EEF3F8] px-4 py-2.5 text-sm font-bold" placeholder="UF" value={destaqueForm.uf} onChange={e => setDestaqueForm(prev => ({ ...prev, uf: e.target.value.toUpperCase() }))} />
              <input className="rounded-xl border border-[#EEF3F8] px-4 py-2.5 text-sm font-bold" placeholder="Valor mensal" value={destaqueForm.valor_mensal} onChange={e => setDestaqueForm(prev => ({ ...prev, valor_mensal: e.target.value }))} />
              <input type="date" className="rounded-xl border border-[#EEF3F8] px-4 py-2.5 text-sm font-bold" value={destaqueForm.data_inicio} onChange={e => setDestaqueForm(prev => ({ ...prev, data_inicio: e.target.value }))} />
              <input type="date" className="rounded-xl border border-[#EEF3F8] px-4 py-2.5 text-sm font-bold" value={destaqueForm.data_fim} onChange={e => setDestaqueForm(prev => ({ ...prev, data_fim: e.target.value }))} />
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={() => setShowDestaqueModal(false)} className="flex-1 rounded-xl border border-[#EEF3F8] px-4 py-3 text-sm font-bold text-[#5A6A7E]">
                Cancelar
              </button>
              <button onClick={salvarDestaque} className="flex-1 rounded-xl bg-[#D97706] px-4 py-3 text-sm font-black text-white">
                Salvar destaque
              </button>
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => !importing && setShowImportModal(false)} />
          <div className="relative z-10 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl flex flex-col max-h-[90vh]">
            <h3 className="text-xl font-black text-[#0A1628] flex items-center gap-2"><Upload className="w-6 h-6 text-emerald-600"/> Importar Empresas</h3>
            <p className="mt-1 text-sm text-[#5A6A7E]">Arquivo CSV: <b>Nome, Cidade, Estado, Plano, Status, Data Cadastro, Link</b></p>
            
            <div className="mt-5 border-2 border-dashed border-[#EEF3F8] bg-slate-50 hover:bg-slate-100 transition-colors rounded-xl p-8 text-center relative overflow-hidden">
              <FileText className="w-10 h-10 text-[#94A3B8] mx-auto mb-3" />
              <input type="file" accept=".csv" onChange={handleImport} disabled={importing} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" />
              <p className="font-bold text-[#0A1628] text-sm">Clique ou arraste seu arquivo CSV aqui</p>
              <p className="text-xs text-[#5A6A7E] mt-1">Sincronização automática para o banco atual</p>
            </div>

            {importTotal > 0 && (
              <div className="mt-6 border-t border-[#EEF3F8] pt-4 flex-1 overflow-hidden flex flex-col">
                <div className="flex items-center justify-between text-sm font-bold mb-2 text-[#0A1628]">
                  <span>Progresso da Importação</span>
                  <span>{importProgress} / {importTotal}</span>
                </div>
                <div className="h-2.5 w-full bg-[#EEF3F8] rounded-full overflow-hidden">
                  <div className="h-full bg-[#1A9B6A] transition-all duration-300" style={{width: `${(importProgress / importTotal) * 100}%`}}></div>
                </div>

                <div className="mt-4 bg-[#0A1628] rounded-xl p-3 h-48 overflow-y-auto text-xs font-mono text-green-400">
                  {importLogs.map((log, idx) => (
                    <div key={idx} className={log.includes('Erro') ? 'text-red-400' : ''}>{log}</div>
                  ))}
                  {importing && <div className="animate-pulse flex items-center gap-2 mt-2"><Loader2 className="w-3 h-3 animate-spin" /> Importando linha {importProgress + 1}...</div>}
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button onClick={() => setShowImportModal(false)} disabled={importing} className="rounded-xl bg-[#EEF3F8] hover:bg-[#CBD5E1] text-[#0A1628] font-bold px-6 py-2.5 disabled:opacity-50">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
