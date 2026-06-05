import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Search, Calendar, User, ChevronRight } from 'lucide-react'

export default function BlogList() {
  const [artigos, setArtigos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    carregarArtigos()
  }, [])

  const carregarArtigos = async () => {
    const { data } = await supabase
      .from('artigos')
      .select('*, categorias(nome), cidades(nome)')
      .eq('publicado', true)
      .order('publicado_em', { ascending: false })
      .limit(12)
    setArtigos(data || [])
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-emerald-600 py-16 text-center text-white">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Blog Guia Local BR</h1>
          <p className="text-lg text-blue-100 max-w-2xl mx-auto mb-8">
            Dicas, tendências e novidades do comércio local em todo o Brasil.
          </p>
          <div className="max-w-xl mx-auto relative">
            <input 
              type="text" 
              placeholder="Buscar artigos..." 
              className="w-full pl-5 pr-12 py-3 rounded-xl border-none focus:ring-4 focus:ring-blue-400 text-gray-900 shadow-lg"
            />
            <button className="absolute right-3 top-3 text-gray-400 hover:text-emerald-600">
              <Search className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 flex flex-col md:flex-row gap-8">
        {/* Main Content */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3,4,5,6].map(i => <div key={i} className="h-64 bg-gray-200 rounded-xl animate-pulse"></div>)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {artigos.map(a => (
                <Link key={a.id} to={`/blog/${a.slug}`} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all group flex flex-col">
                  <div className="h-48 bg-gray-200 relative overflow-hidden">
                    {a.imagem_capa ? (
                      <img src={a.imagem_capa} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full bg-blue-100 flex items-center justify-center text-blue-300">Sem imagem</div>
                    )}
                    {a.categorias?.nome && (
                      <span className="absolute top-3 left-3 bg-emerald-600 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
                        {a.categorias.nome}
                      </span>
                    )}
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <h2 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-emerald-600">{a.titulo}</h2>
                    <p className="text-gray-600 text-sm line-clamp-3 mb-4 flex-1">{a.resumo}</p>
                    <div className="flex items-center text-xs text-gray-500 pt-4 border-t border-gray-50">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(a.publicado_em || a.criado_em).toLocaleDateString('pt-BR')}
                      <span className="mx-2">•</span>
                      <User className="w-4 h-4 mr-1" />
                      {a.autor_tipo === 'ia_geral' ? 'Equipe Guia' : 'Parceiro'}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-full md:w-80 space-y-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4">Mais Lidos</h3>
            <div className="space-y-4">
               {artigos.slice(0,3).map((a, i) => (
                 <Link key={i} to={`/blog/${a.slug}`} className="flex gap-3 group">
                   <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      {a.imagem_capa && <img src={a.imagem_capa} className="w-full h-full object-cover" />}
                   </div>
                   <div>
                     <h4 className="font-semibold text-sm text-gray-900 group-hover:text-emerald-600 line-clamp-2">{a.titulo}</h4>
                     <p className="text-xs text-gray-500 mt-1">{new Date(a.publicado_em || a.criado_em).toLocaleDateString('pt-BR')}</p>
                   </div>
                 </Link>
               ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4">Categorias</h3>
            <ul className="space-y-2">
              {['Alimentação', 'Saúde e Beleza', 'Tecnologia', 'Turismo e Lazer'].map((cat, i) => (
                <li key={i}>
                  <Link to="#" className="text-gray-600 hover:text-emerald-600 flex items-center justify-between text-sm py-1">
                    {cat} <ChevronRight className="w-4 h-4" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
