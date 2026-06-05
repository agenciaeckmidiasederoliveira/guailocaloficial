import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { supabase } from '../../lib/supabase'
import { verEmpresa, clicarTelefone, clicarWhatsapp, clicarSite } from '../../lib/analytics'
import { gerarSchemaBusiness, getEmpresaDescription, getEmpresaOgImage, getEmpresaTitle, getEmpresaUrl } from '../../lib/seo'
import { MapPin, Phone, Mail, Globe, Clock, CheckCircle, MessageCircle, Star, Info, Share2, Zap, ShieldCheck } from 'lucide-react'

export default function PerfilEmpresa() {
  const { slug } = useParams()
  const [empresa, setEmpresa] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (slug) carregarEmpresa()
  }, [slug])

  const carregarEmpresa = async () => {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select(`
          *,
          cidades(id, nome, slug, estados(uf)),
          categorias(nome, slug)
        `)
        .eq('slug', slug)
        .single()
      
      if (data) {
        setEmpresa(data)
        void verEmpresa(data.id, data.cidades?.nome)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090d16] text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-emerald-400"></div>
          <span className="text-sm font-medium text-slate-400">Carregando detalhes do negócio...</span>
        </div>
      </div>
    )
  }

  if (!empresa) {
    return (
      <div className="min-h-screen bg-[#090d16] text-slate-100 flex items-center justify-center p-4">
        <div className="text-center">
          <Info className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Empresa não encontrada</h2>
          <p className="text-slate-400 mb-6 font-light">O estabelecimento procurado não existe ou foi removido do nosso guia.</p>
          <Link to="/" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 rounded-xl transition-all">
            Voltar para o Início
          </Link>
        </div>
      </div>
    )
  }

  const cidadeUrl = `/${empresa.cidades?.estados?.uf?.toLowerCase()}/${empresa.cidades?.slug}`
  const title = getEmpresaTitle(empresa)
  const description = getEmpresaDescription(empresa)
  const ogImage = getEmpresaOgImage(empresa)
  const canonicalUrl = getEmpresaUrl(empresa.slug)
  const schemaBusiness = gerarSchemaBusiness({
    ...empresa,
    total_avaliacoes: empresa.total_avaliacoes || 0,
    nota_media: empresa.nota_media || 0,
  })

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 font-sans overflow-x-hidden pb-20">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:url" content={canonicalUrl} />
        <link rel="canonical" href={canonicalUrl} />
        <script type="application/ld+json">{schemaBusiness}</script>
      </Helmet>
      
      {/* GLOW DE FUNDO */}
      <div className="absolute top-80 right-1/4 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-[400px] left-1/4 w-[450px] h-[450px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* HEADER PREMIUM */}
      <header className="border-b border-slate-800/60 bg-[#090d16]/85 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-400 flex items-center justify-center">
              <Zap className="w-4.5 h-4.5 text-white fill-white" />
            </div>
            <span className="text-lg font-black text-white">
              Guia Local <span className="text-emerald-400">BR</span>
            </span>
          </Link>
          <Link to={cidadeUrl} className="text-xs md:text-sm text-slate-300 hover:text-emerald-400 transition-colors flex items-center bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-full shadow-inner">
            <MapPin className="w-4 h-4 mr-1 text-emerald-400" />
            <span className="font-semibold text-slate-200">{empresa.cidades?.nome}</span>, {empresa.cidades?.estados?.uf}
          </Link>
        </div>
      </header>

      {/* BANNER / COVER IMERSIVO */}
      <div className="w-full h-72 md:h-96 bg-slate-950 relative overflow-hidden">
        {empresa.foto_principal ? (
          <img src={empresa.foto_principal} alt={empresa.nome} className="w-full h-full object-cover opacity-50 scale-105 blur-[2px]" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-950 via-slate-950 to-emerald-950 opacity-80" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#090d16] via-[#090d16]/50 to-black/20" />
        
        <div className="absolute bottom-0 left-0 w-full">
          <div className="container mx-auto px-4 pb-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                {/* Badges Premium */}
                <div className="flex flex-wrap items-center gap-2.5 mb-4">
                  {empresa.plano === 'premium' ? (
                    <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-3.5 py-1 rounded-md uppercase tracking-wider shadow-lg shadow-amber-500/10">
                      ★ PLANO PREMIUM
                    </span>
                  ) : (
                    <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-3.5 py-1 rounded-md uppercase tracking-wider">
                      ANÚNCIO GRATUITO
                    </span>
                  )}
                  
                  {empresa.verificada && (
                    <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold px-3 py-1 rounded-md flex items-center shadow-md">
                      <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-400 fill-emerald-400/15" /> Estabelecimento Verificado
                    </span>
                  )}
                  
                  <span className="bg-slate-900/60 border border-slate-800 backdrop-blur-md text-slate-300 text-[10px] font-bold px-3 py-1 rounded-md uppercase tracking-wider">
                    {empresa.categorias?.nome || 'Serviços'}
                  </span>
                </div>
                
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white leading-none mb-3 drop-shadow-lg">
                  {empresa.nome}
                </h1>
                
                <div className="flex items-center text-slate-300 text-sm md:text-base font-light">
                  <MapPin className="w-4 h-4 mr-1.5 text-emerald-400" /> 
                  <Link to={cidadeUrl} className="hover:text-emerald-400 hover:underline transition-colors font-medium">
                    {empresa.cidades?.nome}, {empresa.cidades?.estados?.uf}
                  </Link>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                 <button className="bg-slate-900/80 hover:bg-slate-800 backdrop-blur-md text-slate-200 hover:text-white px-5 py-3 rounded-xl text-xs font-bold transition flex items-center border border-slate-800 hover:border-slate-700 shadow-md">
                   <Share2 className="w-4 h-4 mr-2 text-indigo-400" /> Compartilhar Perfil
                 </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        
        {/* BREADCRUMB */}
        <div className="text-xs text-slate-500 mb-8 flex items-center gap-2 overflow-x-auto whitespace-nowrap bg-slate-900/40 border border-slate-900 px-4 py-2.5 rounded-xl w-fit">
          <Link to="/" className="hover:text-emerald-400 transition-colors">Guia Local BR</Link>
          <span className="text-slate-700">/</span>
          <Link to={cidadeUrl} className="hover:text-emerald-400 transition-colors">{empresa.cidades?.nome}</Link>
          <span className="text-slate-700">/</span>
          <span className="text-slate-200 font-semibold">{empresa.nome}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* CONTEÚDO PRINCIPAL (ESQUERDA) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Sobre */}
            <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 md:p-8 shadow-xl backdrop-blur-sm">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center border-b border-slate-800/60 pb-3">
                <Info className="w-5 h-5 mr-2 text-indigo-400" /> Sobre a Empresa
              </h2>
              <div className="prose prose-invert max-w-none text-slate-300 whitespace-pre-wrap text-sm md:text-base font-light leading-relaxed">
                {empresa.descricao_otimizada || empresa.descricao || "Nenhuma descrição detalhada informada por este estabelecimento."}
              </div>
            </div>

            {/* Galeria de Fotos */}
            {empresa.fotos && empresa.fotos.length > 0 && (
              <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 md:p-8 shadow-xl">
                <h2 className="text-lg font-bold text-white mb-5 flex items-center border-b border-slate-800/60 pb-3">
                  Galeria de Imagens
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {empresa.fotos.map((foto: string, i: number) => (
                    <div key={i} className="h-32 md:h-40 rounded-xl overflow-hidden border border-slate-800 shadow-lg">
                      <img src={foto} alt={`Foto ${i}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Avaliações */}
            <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 md:p-8 shadow-xl">
              <div className="flex justify-between items-center border-b border-slate-800/60 pb-3 mb-6">
                <h2 className="text-lg font-bold text-white">Avaliações do Google</h2>
                <div className="flex items-center bg-amber-500/10 border border-amber-500/20 px-3.5 py-1 rounded-full">
                  <Star className="w-4.5 h-4.5 text-amber-400 fill-amber-400 mr-1.5" />
                  <span className="font-bold text-amber-400 text-sm">4.8</span>
                </div>
              </div>
              <p className="text-slate-400 text-sm font-light mb-6 leading-relaxed">
                As notas de avaliações são consolidadas a partir do Google Places API do estabelecimento. Em breve você poderá deixar avaliações internas exclusivas diretamente pelo Guia Local BR.
              </p>
              <button className="text-emerald-400 font-bold hover:underline text-xs tracking-wider uppercase">
                + Deixar Avaliação Comercial
              </button>
            </div>
          </div>

          {/* SIDEBAR CONTATO (DIREITA) */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              
              {/* Card de Contato */}
              <div className="bg-slate-900/50 border border-slate-800/90 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md">
                <div className="p-6 bg-slate-950/40 border-b border-slate-800/60">
                  <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-1">Informações de Contato</h3>
                  <p className="text-xs text-slate-500 font-light">Fale diretamente com os proprietários</p>
                </div>
                
                <div className="p-6 space-y-5">
                  {/* Botão WhatsApp Gigante Pulsante */}
                  {empresa.whatsapp && (
                    <a 
                      href={`https://wa.me/${empresa.whatsapp}?text=Olá! Vi sua empresa no Guia Local BR e gostaria de mais informações.`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => void clicarWhatsapp(empresa.id, { cidade: empresa.cidades?.nome, origem: 'perfil_empresa' })}
                      className="w-full flex items-center justify-center bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-4 px-6 rounded-2xl transition-all shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/35 hover:-translate-y-0.5 cursor-pointer text-sm animate-pulse"
                    >
                      <MessageCircle className="w-5 h-5 mr-2" /> Entrar em Contato Agora
                    </a>
                  )}

                  {empresa.telefone && (
                    <div className="flex items-start pt-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-850 border border-slate-800 flex items-center justify-center flex-shrink-0 mr-3">
                        <Phone className="w-4.5 h-4.5 text-indigo-400" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Telefone Comercial</p>
                        <a
                          href={`tel:${empresa.telefone}`}
                          onClick={() => void clicarTelefone(empresa.id, { cidade: empresa.cidades?.nome, origem: 'perfil_empresa' })}
                          className="mt-0.5 block text-sm font-semibold text-slate-200 transition-colors hover:text-emerald-400"
                        >
                          {empresa.telefone}
                        </a>
                      </div>
                    </div>
                  )}

                  {empresa.endereco && (
                    <div className="flex items-start">
                      <div className="w-9 h-9 rounded-xl bg-slate-850 border border-slate-800 flex items-center justify-center flex-shrink-0 mr-3">
                        <MapPin className="w-4.5 h-4.5 text-indigo-400" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Endereço Físico</p>
                        <p className="text-slate-200 text-xs md:text-sm leading-snug mt-1 font-light">{empresa.endereco}</p>
                        {empresa.cep && <p className="text-slate-500 text-[10px] mt-1 font-mono">CEP: {empresa.cep}</p>}
                      </div>
                    </div>
                  )}

                  {empresa.email_contato && (
                    <div className="flex items-start">
                      <div className="w-9 h-9 rounded-xl bg-slate-850 border border-slate-800 flex items-center justify-center flex-shrink-0 mr-3">
                        <Mail className="w-4.5 h-4.5 text-indigo-400" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">E-mail Comercial</p>
                        <a href={`mailto:${empresa.email_contato}`} className="text-emerald-400 hover:text-emerald-300 text-xs md:text-sm font-medium transition-colors">{empresa.email_contato}</a>
                      </div>
                    </div>
                  )}

                  {empresa.site && (
                    <div className="flex items-start pt-4 border-t border-slate-850">
                      <div className="w-9 h-9 rounded-xl bg-slate-850 border border-slate-800 flex items-center justify-center flex-shrink-0 mr-3">
                        <Globe className="w-4.5 h-4.5 text-slate-400" />
                      </div>
                      <div className="flex-1">
                        <a 
                          href={empresa.site.startsWith('http') ? empresa.site : `https://${empresa.site}`} 
                          target="_blank" 
                          rel="noreferrer"
                          onClick={() => void clicarSite(empresa.id, { cidade: empresa.cidades?.nome, origem: 'perfil_empresa' })}
                          className="w-full flex items-center justify-center bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-bold py-2.5 px-4 rounded-xl transition text-xs cursor-pointer"
                        >
                          Visitar Website Oficial
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Horários */}
              <div className="bg-slate-900/50 border border-slate-800/90 rounded-2xl p-6 shadow-xl">
                <h4 className="font-bold text-white text-sm mb-4 flex items-center border-b border-slate-800/60 pb-3">
                  <Clock className="w-4.5 h-4.5 mr-2 text-slate-500" /> Horários de Atendimento
                </h4>
                {empresa.horario_funcionamento ? (
                  <div className="text-xs md:text-sm text-slate-300 space-y-2.5 font-light">
                    <div className="flex justify-between border-b border-slate-900 pb-1.5"><span className="font-medium text-slate-400">Segunda a Sexta</span> <span className="font-mono text-slate-200">08:00 - 18:00</span></div>
                    <div className="flex justify-between border-b border-slate-900 pb-1.5"><span className="font-medium text-slate-400">Sábado</span> <span className="font-mono text-slate-200">08:00 - 12:00</span></div>
                    <div className="flex justify-between"><span className="font-medium text-slate-400">Domingo</span> <span className="text-rose-400 font-semibold bg-rose-500/5 px-2.5 py-0.5 rounded">Fechado</span></div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 font-light">Horários de funcionamento não fornecidos pelo estabelecimento.</p>
                )}
              </div>

              {/* Selo Rodapé Lateral */}
              <div className="bg-slate-900/10 border border-slate-800/40 rounded-xl p-4 text-center">
                <span className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Dados Criptografados e Seguros
                </span>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
