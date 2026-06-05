import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { MapPin, ChevronRight, CheckCircle, MessageCircle } from 'lucide-react'

export default function PaginaBairro() {
  const { estado, cidade: cidadeSlug, bairro: bairroSlug } = useParams()
  const [bairro, setBairro] = useState<any>(null)
  const [empresas, setEmpresas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    carregarBairro()
  }, [bairroSlug])

  const carregarBairro = async () => {
    try {
      const { data: bData } = await supabase
        .from('bairros')
        .select('*, cidades(id, nome, slug, estados(uf, nome))')
        .eq('slug', bairroSlug)
        .single()
      
      if (bData) {
        setBairro(bData)
        document.title = `Empresas no bairro ${bData.nome}, ${bData.cidades?.nome} - ${bData.cidades?.estados?.uf} | Guia Local BR`

        const { data: emps } = await supabase
          .from('empresas')
          .select('*, categorias(nome)')
          .eq('bairro_id', bData.id)
          .eq('ativa', true)
          .order('score_completude', { ascending: false })
          .limit(20)
        
        setEmpresas(emps || [])
      }
    } catch(err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-10 text-center">Carregando bairro...</div>
  if (!bairro) return <div className="p-10 text-center">Bairro não encontrado</div>

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-200 py-6">
        <div className="container mx-auto px-4">
          <div className="text-sm text-gray-500 mb-4 flex items-center">
            <Link to="/" className="hover:text-emerald-600">Guia Local BR</Link> <ChevronRight className="w-4 h-4 mx-1" />
            <Link to={`/${estado}/${cidadeSlug}`} className="hover:text-emerald-600">{bairro.cidades?.nome}</Link> <ChevronRight className="w-4 h-4 mx-1" />
            <span className="text-gray-900 font-medium">{bairro.nome}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
             <MapPin className="w-6 h-6 mr-2 text-emerald-600"/> Empresas no bairro {bairro.nome} em {bairro.cidades?.nome}
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
        <div className="flex-1 space-y-8">
           
           {bairro.seo_conteudo && (
             <div 
               className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 prose prose-blue max-w-none text-gray-700"
               dangerouslySetInnerHTML={{ __html: bairro.seo_conteudo }}
             />
           )}

           <div>
             <h2 className="text-xl font-bold text-gray-900 mb-6">Comércios Locais Encontrados ({empresas.length})</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {empresas.map(emp => (
                 <div key={emp.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition">
                    <div className="h-32 bg-gray-200 w-full relative">
                       {emp.foto_principal && <img src={emp.foto_principal} className="w-full h-full object-cover" />}
                       {emp.plano === 'premium' && <div className="absolute top-2 right-2 bg-emerald-600 text-white text-xs font-bold px-2 py-1 rounded">Premium</div>}
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                       <h3 className="font-bold text-lg text-gray-900 leading-tight mb-1">
                         {emp.nome}
                         {emp.verificada && <CheckCircle className="w-4 h-4 inline ml-1 text-green-500" />}
                       </h3>
                       <p className="text-sm text-gray-500 mb-4">{emp.categorias?.nome}</p>
                       <div className="mt-auto pt-4 flex gap-2 border-t border-gray-50">
                          <Link to={`/empresa/${emp.slug}`} className="flex-1 text-center bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium py-2 rounded-lg text-sm transition">Ver perfil</Link>
                          <a href={`https://wa.me/${emp.whatsapp}`} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center bg-green-500 hover:bg-green-600 text-white font-medium py-2 rounded-lg text-sm transition">
                            <MessageCircle className="w-4 h-4 mr-1" /> WhatsApp
                          </a>
                       </div>
                    </div>
                 </div>
               ))}
             </div>
           </div>

        </div>

        <div className="w-full md:w-80">
           <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-6">
              <h3 className="font-bold text-gray-900 mb-4">Outros Bairros em {bairro.cidades?.nome}</h3>
              <p className="text-sm text-gray-500 mb-4">Em breve lista interativa...</p>
              <Link to={`/${estado}/${cidadeSlug}`} className="text-emerald-600 font-medium hover:underline text-sm">
                Ver todas empresas da cidade
              </Link>
           </div>
        </div>
      </div>
    </div>
  )
}
