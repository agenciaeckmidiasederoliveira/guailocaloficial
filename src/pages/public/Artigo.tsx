import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Calendar, User, Clock, ThumbsUp, ThumbsDown } from 'lucide-react'
import DOMPurify from 'dompurify'

export default function Artigo() {
  const { slug } = useParams()
  const [artigo, setArtigo] = useState<any>(null)

  useEffect(() => {
    if(slug) carregarArtigo()
  }, [slug])

  const carregarArtigo = async () => {
    const { data } = await supabase
      .from('artigos')
      .select('*, empresas(id, nome, whatsapp, slug), categorias(nome), cidades(nome)')
      .eq('slug', slug)
      .single()
    if(data) {
       setArtigo(data)
       // Incrementar visualizações dinamicamente seria ideal aqui via RPC ou Edge Func
    }
  }

  if(!artigo) return <div className="p-10 text-center">Carregando...</div>

  // Sanitização segura com DOMPurify
  const renderHtml = () => { return { __html: DOMPurify.sanitize(artigo.conteudo) } }

  return (
    <div className="bg-white pb-20">
      
      {/* HEADER EDITORIAL */}
      <div className="w-full h-80 md:h-[400px] bg-gray-900 relative">
        {artigo.imagem_capa && <img src={artigo.imagem_capa} className="w-full h-full object-cover opacity-60" />}
        <div className="absolute inset-0 flex items-center justify-center text-center">
          <div className="container max-w-4xl px-4">
            {artigo.categorias?.nome && (
              <span className="text-blue-400 font-bold tracking-widest text-sm uppercase mb-4 block">
                {artigo.categorias.nome}
              </span>
            )}
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">{artigo.titulo}</h1>
            <div className="flex items-center justify-center text-gray-300 text-sm font-medium space-x-6">
               <span className="flex items-center"><User className="w-4 h-4 mr-2" /> {artigo.autor_tipo === 'ia_geral' ? 'Equipe Guia' : (artigo.empresas?.nome || 'Parceiro')}</span>
               <span className="flex items-center"><Calendar className="w-4 h-4 mr-2" /> {new Date(artigo.publicado_em || artigo.criado_em).toLocaleDateString('pt-BR')}</span>
               <span className="flex items-center"><Clock className="w-4 h-4 mr-2" /> 5 min de leitura</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 flex flex-col md:flex-row gap-12">
        
        {/* MAIN CONTENT */}
        <div className="flex-1 max-w-[720px] mx-auto md:mx-0">
           
           <div className="text-lg text-gray-600 font-medium mb-8 leading-relaxed italic border-l-4 border-emerald-500 pl-4">
             {artigo.resumo}
           </div>

           <article 
             className="prose prose-lg prose-blue max-w-none text-gray-800"
             dangerouslySetInnerHTML={renderHtml()}
           />

           <div className="mt-12 pt-8 border-t border-gray-100 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Este artigo foi útil?</h4>
                <div className="flex gap-2">
                  <button className="flex items-center justify-center bg-gray-50 hover:bg-green-50 hover:text-green-600 text-gray-600 p-2 rounded border border-gray-200 transition"><ThumbsUp className="w-5 h-5 mr-2"/> Sim</button>
                  <button className="flex items-center justify-center bg-gray-50 hover:bg-red-50 hover:text-red-600 text-gray-600 p-2 rounded border border-gray-200 transition"><ThumbsDown className="w-5 h-5 mr-2"/> Não</button>
                </div>
              </div>
              <div className="flex gap-2">
                 {artigo.tags?.map((t: string) => <span key={t} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">#{t}</span>)}
              </div>
           </div>

        </div>

        {/* SIDEBAR COMPANY CARD */}
        {artigo.empresas && (
          <div className="w-full md:w-80 flex-shrink-0">
             <div className="sticky top-6 bg-white border border-blue-100 shadow-lg rounded-2xl p-6 text-center">
                <div className="w-16 h-16 bg-blue-100 text-emerald-600 rounded-full mx-auto flex items-center justify-center mb-4 text-2xl font-bold">
                  {artigo.empresas.nome.charAt(0)}
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-1">{artigo.empresas.nome}</h3>
                <p className="text-sm text-gray-500 mb-6">Empresa mencionada neste artigo</p>
                <Link to={`/empresa/${artigo.empresas.slug}`} className="block w-full bg-emerald-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg mb-3">
                  Ver Perfil Completo
                </Link>
                <a href={`https://wa.me/${artigo.empresas.whatsapp}`} target="_blank" rel="noreferrer" className="block w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg">
                  Falar no WhatsApp
                </a>
             </div>
          </div>
        )}
      </div>
    </div>
  )
}
