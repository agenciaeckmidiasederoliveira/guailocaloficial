import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Settings, User, Phone, Save, CheckCircle, AlertCircle, Loader2, Lock, Eye, EyeOff } from 'lucide-react'

export default function ConfiguracoesParceiro() {
  const { parceiro } = useOutletContext<any>()
  const [form, setForm] = useState({ nome_comercial:'', whatsapp_contato:'', whatsapp_vendas:'', email_contato:'', site:'' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{type:'success'|'error', text:string}|null>(null)
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [showSenha, setShowSenha] = useState(false)
  const [salvandoSenha, setSalvandoSenha] = useState(false)

  useEffect(() => {
    if (!parceiro?.id) return
    supabase.from('parceiros').select('*').eq('id', parceiro.id).single().then(({ data }) => {
      if (data) setForm({
        nome_comercial: data.nome_comercial || '',
        whatsapp_contato: data.whatsapp_contato || '',
        whatsapp_vendas: data.whatsapp_vendas || '',
        email_contato: data.email_contato || '',
        site: data.site || '',
      })
      setLoading(false)
    })
  }, [parceiro?.id])

  const salvar = async () => {
    setSaving(true); setMsg(null)
    const { error } = await supabase.from('parceiros').update(form).eq('id', parceiro.id)
    if (error) setMsg({ type: 'error', text: 'Erro ao salvar. Tente novamente.' })
    else setMsg({ type: 'success', text: 'Dados atualizados com sucesso!' })
    setSaving(false)
    setTimeout(() => setMsg(null), 3000)
  }

  const alterarSenha = async () => {
    if (novaSenha !== confirmarSenha) { setMsg({ type:'error', text:'As senhas não coincidem.' }); return }
    if (novaSenha.length < 6) { setMsg({ type:'error', text:'Senha deve ter no mínimo 6 caracteres.' }); return }
    setSalvandoSenha(true)
    const { error } = await supabase.auth.updateUser({ password: novaSenha })
    if (error) setMsg({ type:'error', text:`Erro: ${error.message}` })
    else { setMsg({ type:'success', text:'Senha alterada com sucesso!' }); setNovaSenha(''); setConfirmarSenha('') }
    setSalvandoSenha(false)
    setTimeout(() => setMsg(null), 4000)
  }

  if (loading) return (
    <div className="p-6 flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
    </div>
  )

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-500 text-sm mt-1">Gerencie seus dados de contato e senha</p>
      </div>

      {msg && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl mb-5 text-sm font-medium ${msg.type==='success'?'bg-emerald-50 text-emerald-700 border border-emerald-200':'bg-red-50 text-red-700 border border-red-200'}`}>
          {msg.type==='success'?<CheckCircle className="w-4 h-4"/>:<AlertCircle className="w-4 h-4"/>}
          {msg.text}
        </div>
      )}

      {/* DADOS DO PERFIL */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-5 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
            <User className="w-5 h-5 text-emerald-600"/>
          </div>
          <h2 className="font-bold text-gray-900">Dados do Perfil</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nome comercial</label>
            <input type="text" placeholder="Seu nome de consultor/empresa"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={form.nome_comercial} onChange={e => setForm(f=>({...f,nome_comercial:e.target.value}))} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">WhatsApp de contato</label>
              <input type="text" placeholder="5544988436180"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={form.whatsapp_contato} onChange={e => setForm(f=>({...f,whatsapp_contato:e.target.value}))} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">WhatsApp de vendas</label>
              <input type="text" placeholder="5544988436180"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={form.whatsapp_vendas} onChange={e => setForm(f=>({...f,whatsapp_vendas:e.target.value}))} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">E-mail de contato</label>
              <input type="email" placeholder="voce@email.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={form.email_contato} onChange={e => setForm(f=>({...f,email_contato:e.target.value}))} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Site (opcional)</label>
              <input type="url" placeholder="https://seusite.com.br"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={form.site} onChange={e => setForm(f=>({...f,site:e.target.value}))} />
            </div>
          </div>
        </div>
        <button onClick={salvar} disabled={saving}
          className="mt-5 w-full bg-[#1a365d] hover:bg-[#153054] text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-70">
          {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
          {saving ? 'Salvando...' : 'Salvar Dados'}
        </button>
      </div>

      {/* ALTERAR SENHA */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
            <Lock className="w-5 h-5 text-amber-600"/>
          </div>
          <h2 className="font-bold text-gray-900">Alterar Senha</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nova senha</label>
            <div className="relative">
              <input type={showSenha?'text':'password'} placeholder="Mínimo 6 caracteres"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 pr-10"
                value={novaSenha} onChange={e => setNovaSenha(e.target.value)} />
              <button type="button" onClick={() => setShowSenha(!showSenha)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showSenha ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirmar nova senha</label>
            <input type={showSenha?'text':'password'} placeholder="Digite a senha novamente"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)} />
          </div>
        </div>
        <button onClick={alterarSenha} disabled={salvandoSenha || !novaSenha}
          className="mt-5 w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
          {salvandoSenha ? <Loader2 className="w-4 h-4 animate-spin"/> : <Lock className="w-4 h-4"/>}
          {salvandoSenha ? 'Alterando...' : 'Alterar Senha'}
        </button>
      </div>
    </div>
  )
}
