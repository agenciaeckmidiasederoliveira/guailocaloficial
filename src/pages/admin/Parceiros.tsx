import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Users, Search, CheckCircle, MapPin, Phone, Plus, Edit, Trash2, Loader2, X, Shield, ShieldCheck, Mail, UserPlus } from 'lucide-react'

export default function AdminParceiros() {
  const [parceiros, setParceiros] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ email:'', nome_comercial:'', whatsapp_contato:'', whatsapp_vendas:'', nivel:1 })
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState('')

  const carregar = () => {
    setLoading(true)
    // Corrigido de created_at para criado_em para evitar o crash 42703 do Postgres
    supabase.from('parceiros')
      .select(`id,nome_comercial,whatsapp_contato,whatsapp_vendas,nivel,ativo,criado_em,
        profiles(email,nome),
        parceiro_cidades(count),
        empresas(count)`)
      .order('criado_em', { ascending: false })
      .then(({ data, error }) => { 
        if (error) {
          console.error("Erro ao buscar parceiros:", error.message)
        }
        setParceiros(data || [])
        setLoading(false) 
      })
  }

  useEffect(() => { carregar() }, [])

  const filtrados = parceiros.filter(p =>
    !busca ||
    (p.nome_comercial||'').toLowerCase().includes(busca.toLowerCase()) ||
    (p.profiles?.email||'').toLowerCase().includes(busca.toLowerCase())
  )

  const criarParceiro = async () => {
    if (!form.email || !form.nome_comercial) { setMsg('Preencha e-mail e nome.'); return }
    setSalvando(true); setMsg('')
    try {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: form.email, password: '123456789', email_confirm: true
      })
      if (authError) throw authError
      const userId = authData.user?.id
      
      // Inserir perfil
      await supabase.from('profiles').insert({
        id: userId, email: form.email, nome: form.nome_comercial, role: 'parceiro_master'
      })
      
      // Inserir consultor parceiro
      await supabase.from('parceiros').insert({
        profile_id: userId,
        nome_comercial: form.nome_comercial,
        whatsapp_contato: form.whatsapp_contato,
        whatsapp_vendas: form.whatsapp_vendas,
        nivel: form.nivel,
        ativo: true,
        slug: form.nome_comercial.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'')
      })
      
      setShowModal(false)
      setForm({ email:'', nome_comercial:'', whatsapp_contato:'', whatsapp_vendas:'', nivel:1 })
      carregar()
    } catch (e: any) {
      setMsg(`Erro: ${e.message}`)
    } finally { setSalvando(false) }
  }

  const toggleAtivo = async (id: string, ativo: boolean) => {
    await supabase.from('parceiros').update({ ativo: !ativo }).eq('id', id)
    setParceiros(prev => prev.map(p => p.id === id ? { ...p, ativo: !ativo } : p))
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-2">
            <Users className="w-8 h-8 text-emerald-400" /> Consultores / Parceiros
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Gestão territorial e de franquias dos {parceiros.length} consultores autorizados.
          </p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-400 to-teal-600 hover:from-emerald-500 hover:to-teal-700 text-slate-950 font-black px-5 py-3 rounded-xl transition-all duration-300 shadow-lg shadow-emerald-500/10 hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4"/> Novo Consultor
        </button>
      </div>

      {/* Busca e Resumo */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-center">
        
        {/* Input */}
        <div className="lg:col-span-3 relative group">
          <input 
            type="text" 
            placeholder="Buscar consultor por nome ou e-mail..."
            className="w-full bg-[#0b0f19]/80 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-slate-200 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 placeholder-slate-500 transition-all font-medium text-sm"
            value={busca} 
            onChange={e => setBusca(e.target.value)} 
          />
          <Search className="absolute left-4 top-3.5 text-slate-500 group-hover:text-slate-400 w-5 h-5 transition-colors"/>
        </div>

        {/* Estatística rápida */}
        <div className="bg-[#0b0f19]/80 border border-white/5 p-4 rounded-xl text-center backdrop-blur-md">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Consultores Ativos</p>
          <p className="text-xl font-black text-emerald-400 mt-1">
            {parceiros.filter(p => p.ativo).length} / {parceiros.length}
          </p>
        </div>

      </div>

      {/* Lista */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({length:3}).map((_,i)=>(
            <div key={i} className="bg-[#0b0f19]/80 border border-white/5 rounded-2xl p-5 animate-pulse flex items-center gap-4">
              <div className="w-12 h-12 bg-white/5 rounded-xl"/>
              <div className="flex-1">
                <div className="h-4 bg-white/10 rounded w-1/4 mb-2"/>
                <div className="h-3 bg-white/5 rounded w-1/2"/>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtrados.map(p => (
            <div key={p.id} className="bg-[#0b0f19]/80 border border-white/5 rounded-2xl p-5 flex flex-col justify-between hover:border-emerald-500/20 transition-all backdrop-blur-md relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/[0.01] rounded-bl-3xl group-hover:bg-white/[0.02] transition-all"></div>
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/5 flex items-center justify-center text-emerald-400 text-lg font-black border border-emerald-500/20 flex-shrink-0">
                  {(p.nome_comercial||'P').charAt(0).toUpperCase()}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-white text-base">{p.nome_comercial || '—'}</h3>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${p.ativo?'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20':'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                      {p.ativo?'Ativo':'Inativo'}
                    </span>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500/10 text-blue-400 border border-emerald-500/20 uppercase">
                      Nível {p.nivel===1?'Master':'Sub'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 mt-1 text-slate-400 text-xs font-semibold">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span>{p.profiles?.email || 'Sem e-mail cadastrado'}</span>
                  </div>

                  {p.whatsapp_contato && (
                    <div className="flex items-center gap-1.5 mt-1.5 text-slate-400 text-xs font-semibold">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span>WhatsApp: {p.whatsapp_contato}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Informações regionais */}
              <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-white/5">
                <div className="bg-[#070a13]/60 p-2.5 rounded-xl border border-white/5 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Territórios</span>
                    <span className="text-xs font-black text-white">{p.parceiro_cidades?.count || 0} cidades</span>
                  </div>
                </div>
                <div className="bg-[#070a13]/60 p-2.5 rounded-xl border border-white/5 flex items-center gap-2">
                  <span className="text-emerald-400 text-base">🏬</span>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Empresas</span>
                    <span className="text-xs font-black text-white">{p.empresas?.count || 0} associadas</span>
                  </div>
                </div>
              </div>

              {/* Ação */}
              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-white/5">
                <button onClick={() => toggleAtivo(p.id, p.ativo)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${p.ativo?'bg-red-500/5 hover:bg-red-500/10 text-red-400 border border-red-500/10':'bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400 border border-emerald-500/10'}`}>
                  {p.ativo?'Desativar Consultor':'Ativar Consultor'}
                </button>
              </div>

            </div>
          ))}
          
          {filtrados.length === 0 && (
            <div className="col-span-2 text-center py-16 bg-[#0b0f19]/80 border border-white/5 rounded-2xl">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-4"/>
              <p className="text-slate-400 font-bold">Nenhum consultor encontrado.</p>
            </div>
          )}
        </div>
      )}

      {/* MODAL CRIAR PARCEIRO */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0f1d] border border-white/5 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-[#080d19]/80">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-400" /> Novo Consultor Parceiro
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white p-1 hover:bg-white/5 rounded-xl transition-all">
                <X className="w-5 h-5"/>
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {msg && <p className="text-xs font-bold text-red-400 bg-red-500/5 border border-red-500/10 px-3 py-2.5 rounded-xl">{msg}</p>}
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">E-mail de Login *</label>
                <input type="email" placeholder="parceiro@email.com"
                  className="w-full bg-[#070a13] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 font-semibold"
                  value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} />
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Nome Comercial *</label>
                <input type="text" placeholder="Nome do consultor"
                  className="w-full bg-[#070a13] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 font-semibold"
                  value={form.nome_comercial} onChange={e => setForm(f=>({...f,nome_comercial:e.target.value}))} />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">WhatsApp Contato</label>
                  <input type="text" placeholder="Ex: 5544999999999"
                    className="w-full bg-[#070a13] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 font-semibold"
                    value={form.whatsapp_contato} onChange={e => setForm(f=>({...f,whatsapp_contato:e.target.value}))} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">WhatsApp Vendas</label>
                  <input type="text" placeholder="Ex: 5544999999999"
                    className="w-full bg-[#070a13] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 font-semibold"
                    value={form.whatsapp_vendas} onChange={e => setForm(f=>({...f,whatsapp_vendas:e.target.value}))} />
                </div>
              </div>
              
              <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                <p className="text-[10px] text-amber-400 font-bold">
                  ℹ️ A senha de login inicial criada para este parceiro será <strong>123456789</strong>. O parceiro poderá alterá-la a qualquer momento em seu próprio painel.
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 p-6 pt-0 bg-[#080d19]/40 border-t border-white/5 mt-4">
              <button onClick={() => setShowModal(false)}
                className="flex-1 border border-white/10 hover:bg-white/5 text-slate-300 py-3 rounded-xl font-bold transition-colors text-xs uppercase tracking-wider">
                Cancelar
              </button>
              <button onClick={criarParceiro} disabled={salvando}
                className="flex-1 bg-gradient-to-r from-emerald-400 to-teal-600 hover:from-emerald-500 hover:to-teal-700 text-slate-950 py-3 rounded-xl font-black transition-colors flex items-center justify-center gap-2 disabled:opacity-70 text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/10">
                {salvando ? <Loader2 className="w-4 h-4 animate-spin text-slate-950"/> : <Plus className="w-4 h-4 text-slate-950"/>}
                {salvando ? 'Criando Conta...' : 'Criar Parceiro'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
