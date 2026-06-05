import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { MapPin, Search, Plus } from 'lucide-react'

export default function AdminCidades() {
  const [cidades, setCidades] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [estados, setEstados] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [tenants, setTenants] = useState<any[]>([])
  const [parceiros, setParceiros] = useState<any[]>([])
  const [salvandoTenant, setSalvandoTenant] = useState(false)
  const [tenantForm, setTenantForm] = useState({
    slug: '',
    nome_cidade: '',
    uf: '',
    parceiro_id: '',
    dominio_customizado: '',
    subdominio: '',
  })
  const PER = 30

  useEffect(() => {
    supabase.from('estados').select('id,nome,uf').order('nome').then(({ data }) => setEstados(data || []))
    supabase.from('tenants').select('*, parceiros(nome_comercial)').order('created_at', { ascending: false }).then(({ data }) => setTenants(data || []))
    supabase.from('parceiros').select('id,nome_comercial').order('nome_comercial').then(({ data }) => setParceiros(data || []))
  }, [])

  useEffect(() => {
    setLoading(true)
    let query = supabase.from('cidades')
      .select(`id,nome,slug,destaque,foto_url,estados(nome,uf),parceiro_cidades(count),empresas(count)`, { count: 'exact' })
      .order('nome')
    if (filtroEstado) query = query.eq('estado_id', filtroEstado)
    if (busca) query = query.ilike('nome', `%${busca}%`)
    query = query.range((page-1)*PER, page*PER-1)
    query.then(({ data, count }) => { setCidades(data || []); setTotal(count||0); setLoading(false) })
  }, [busca, filtroEstado, page])

  const totalPages = Math.ceil(total / PER)

  const toggleDestaque = async (id: string, destaque: boolean) => {
    await supabase.from('cidades').update({ destaque: !destaque }).eq('id', id)
    setCidades(prev => prev.map(c => c.id === id ? { ...c, destaque: !destaque } : c))
  }

  const criarTenant = async () => {
    if (!tenantForm.slug || !tenantForm.nome_cidade || !tenantForm.uf) {
      alert('Preencha slug, cidade e UF.')
      return
    }

    setSalvandoTenant(true)
    const payload = {
      slug: tenantForm.slug,
      nome_cidade: tenantForm.nome_cidade,
      uf: tenantForm.uf,
      parceiro_id: tenantForm.parceiro_id || null,
      dominio_customizado: tenantForm.dominio_customizado || null,
      subdominio: tenantForm.subdominio || null,
    }

    const { data, error } = await supabase.from('tenants').insert(payload).select('*, parceiros(nome_comercial)').single()
    setSalvandoTenant(false)

    if (error) {
      alert(`Erro ao criar tenant: ${error.message}`)
      return
    }

    setTenants(prev => [data, ...prev])
    setTenantForm({
      slug: '',
      nome_cidade: '',
      uf: '',
      parceiro_id: '',
      dominio_customizado: '',
      subdominio: '',
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[#0A1628] flex items-center gap-2">
            <MapPin className="w-8 h-8 text-[#1A9B6A]" /> Cidades & Territórios
          </h1>
          <p className="text-[#5A6A7E] text-sm mt-1 font-medium">{total.toLocaleString('pt-BR')} cidades no território nacional.</p>
        </div>
      </div>

      <div className="bg-white border border-[#EEF3F8] rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A6A7E] w-4 h-4"/>
          <input type="text" placeholder="Buscar cidade pelo nome..."
            className="w-full pl-9 pr-4 py-2.5 border border-[#EEF3F8] rounded-xl text-sm focus:outline-none focus:border-[#1A9B6A] focus:ring-1 focus:ring-[#1A9B6A] bg-white text-[#0A1628] font-medium"
            value={busca} onChange={e => { setBusca(e.target.value); setPage(1) }} />
        </div>
        <select value={filtroEstado} onChange={e => { setFiltroEstado(e.target.value); setPage(1) }}
          className="border border-[#EEF3F8] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1A9B6A] bg-white text-[#0A1628] font-bold cursor-pointer">
          <option value="">Todos os estados</option>
          {estados.map(e => <option key={e.id} value={e.id}>{e.nome} ({e.uf})</option>)}
        </select>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-[#EEF3F8] shadow-sm overflow-hidden divide-y divide-[#EEF3F8]">
          {Array.from({length:5}).map((_,i)=>(
            <div key={i} className="p-5 animate-pulse flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-100 rounded-lg"/><div className="h-4 bg-slate-100 rounded w-1/4"/>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-[#EEF3F8] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F8FAFC] border-b border-[#EEF3F8] text-[#5A6A7E] font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-4">Cidade</th>
                    <th className="px-6 py-4 hidden sm:table-cell">Estado</th>
                    <th className="px-6 py-4 text-center">Empresas</th>
                    <th className="px-6 py-4 text-center">Parceiro</th>
                    <th className="px-6 py-4 text-right">Destaque</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF3F8] text-[#0A1628]">
                  {cidades.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-[#5A6A7E] font-bold">
                        Nenhuma cidade encontrada para a busca atual.
                      </td>
                    </tr>
                  )}
                  {cidades.map(c => (
                    <tr key={c.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-[#94A3B8] flex-shrink-0"/>
                          <span className="font-bold text-[#0A1628]">{c.nome}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#5A6A7E] hidden sm:table-cell">
                        <span className="bg-[#EFF6FF] border border-[#BFDBFE] text-[#1A9B6A] text-xs px-2.5 py-0.5 rounded font-black uppercase tracking-wider">{c.estados?.uf}</span>
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-bold text-[#5A6A7E]">{(c.empresas as any)?.count || 0}</td>
                      <td className="px-6 py-4 text-center">
                        {(c.parceiro_cidades as any)?.count > 0
                          ? <span className="text-xs bg-[#ECFDF5] border border-[#A7F3D0] text-[#15803D] px-2.5 py-0.5 rounded-full font-bold">✓ Vinculada</span>
                          : <span className="text-xs bg-[#F1F5F9] border border-[#EEF3F8] text-[#5A6A7E] px-2.5 py-0.5 rounded-full font-bold">Livre</span>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => toggleDestaque(c.id, c.destaque)}
                          className={`text-xs px-3 py-1 rounded-xl font-bold transition-all cursor-pointer border ${
                            c.destaque 
                              ? 'bg-[#FEF3C7] border-[#FDE68A] text-[#D97706] hover:bg-[#FDE68A]' 
                              : 'bg-white border-[#EEF3F8] text-[#5A6A7E] hover:bg-[#EFF6FF] hover:border-[#BFDBFE] hover:text-[#1A9B6A]'
                          }`}>
                          {c.destaque ? '⭐ Destaque' : '+ Destacar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex justify-center items-center gap-4">
              {page > 1 && (
                <button onClick={() => setPage(p=>p-1)} className="px-4 py-2 bg-white border border-[#EEF3F8] text-[#5A6A7E] hover:text-[#1A9B6A] hover:bg-[#EFF6FF] rounded-xl text-sm font-bold shadow-sm transition-all cursor-pointer">
                  ← Anterior
                </button>
              )}
              <span className="text-sm font-black text-[#5A6A7E]">Página {page} de {totalPages}</span>
              {page < totalPages && (
                <button onClick={() => setPage(p=>p+1)} className="px-4 py-2 bg-white border border-[#EEF3F8] text-[#5A6A7E] hover:text-[#1A9B6A] hover:bg-[#EFF6FF] rounded-xl text-sm font-bold shadow-sm transition-all cursor-pointer">
                  Próxima →
                </button>
              )}
            </div>
          )}
        </>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#EEF3F8] bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-[#0A1628]">Gerenciar Cidades/Tenants</h2>
          <p className="mt-1 text-sm font-medium text-[#5A6A7E]">Crie tenants para subdominios ou dominios customizados.</p>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <input className="rounded-xl border border-[#EEF3F8] px-4 py-2.5 text-sm" placeholder="slug" value={tenantForm.slug} onChange={e => setTenantForm(prev => ({ ...prev, slug: e.target.value }))} />
            <input className="rounded-xl border border-[#EEF3F8] px-4 py-2.5 text-sm" placeholder="nome_cidade" value={tenantForm.nome_cidade} onChange={e => setTenantForm(prev => ({ ...prev, nome_cidade: e.target.value }))} />
            <input className="rounded-xl border border-[#EEF3F8] px-4 py-2.5 text-sm" placeholder="UF" value={tenantForm.uf} onChange={e => setTenantForm(prev => ({ ...prev, uf: e.target.value.toUpperCase() }))} />
            <input className="rounded-xl border border-[#EEF3F8] px-4 py-2.5 text-sm" placeholder="dominio_customizado" value={tenantForm.dominio_customizado} onChange={e => setTenantForm(prev => ({ ...prev, dominio_customizado: e.target.value }))} />
            <input className="rounded-xl border border-[#EEF3F8] px-4 py-2.5 text-sm" placeholder="subdominio" value={tenantForm.subdominio} onChange={e => setTenantForm(prev => ({ ...prev, subdominio: e.target.value }))} />
            <select className="rounded-xl border border-[#EEF3F8] px-4 py-2.5 text-sm" value={tenantForm.parceiro_id} onChange={e => setTenantForm(prev => ({ ...prev, parceiro_id: e.target.value }))}>
              <option value="">Sem parceiro</option>
              {parceiros.map(p => <option key={p.id} value={p.id}>{p.nome_comercial}</option>)}
            </select>
          </div>

          <button onClick={criarTenant} disabled={salvandoTenant} className="mt-5 rounded-xl bg-[#1A9B6A] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">
            {salvandoTenant ? 'Salvando...' : 'Criar tenant'}
          </button>
        </div>

        <div className="rounded-2xl border border-[#EEF3F8] bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-[#0A1628]">Tenants cadastrados</h2>
          <div className="mt-5 space-y-3">
            {tenants.length === 0 && <p className="text-sm text-[#5A6A7E]">Nenhum tenant cadastrado.</p>}
            {tenants.map((tenant) => (
              <div key={tenant.id} className="rounded-xl border border-[#EEF3F8] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-black text-[#0A1628]">{tenant.nome_cidade} - {tenant.uf}</p>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#1A9B6A]">{tenant.slug}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${tenant.ativo ? 'bg-[#ECFDF5] text-[#15803D]' : 'bg-[#F1F5F9] text-[#5A6A7E]'}`}>
                    {tenant.ativo ? 'ativo' : 'inativo'}
                  </span>
                </div>
                <p className="mt-2 text-xs text-[#5A6A7E]">Parceiro: {tenant.parceiros?.nome_comercial || 'sem parceiro'}</p>
                <p className="text-xs text-[#5A6A7E]">Dominio: {tenant.dominio_customizado || '-'}</p>
                <p className="text-xs text-[#5A6A7E]">Subdominio: {tenant.subdominio || '-'}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
