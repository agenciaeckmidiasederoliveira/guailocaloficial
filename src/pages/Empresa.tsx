import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { BadgePremium } from "@/components/ui/badge-premium";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAnalytics } from "@/hooks/useAnalytics";
import { isValidUrl, isEmpresaAberta } from "@/lib/utils";
import { formatHorarioDisplay } from "@/components/HorarioFuncionamento";
import { MapPin, Phone, Globe, Clock, ChevronLeft, ChevronRight, Loader2, Share2, Check } from "lucide-react";
import { AvaliacoesSection } from "@/components/empresas/AvaliacoesSection";
import { useToast } from "@/hooks/use-toast";
import { useSEO } from "@/hooks/useSEO";
import { SocialLinksDisplay } from "@/components/SocialLinksDisplay";
import type { SocialLink } from "@/lib/social-utils";
import { NIVEIS_PARCEIRO, type NivelParceiro } from "@/lib/constants";

interface Empresa {
  id: string;
  nome: string;
  endereco: string;
  cidade: string;
  estado: string;
  telefone: string;
  whatsapp: string;
  foto_principal: string | null;
  fotos_adicionais: string[];
  videos: string[];
  site: string | null;
  nicho: string | null;
  horario: string | null;
  descricao: string | null;
  plano: "free" | "premium";
  redes_sociais: SocialLink[] | null;
  link_type?: "dofollow" | "nofollow" | null;
  schema_type?: string | null;
  meta_description?: string | null;
  slug?: string | null;
  faq?: { pergunta: string; resposta: string }[] | null;
  verificada?: boolean | null;
}

interface RatingAgg {
  total: number;
  media: number;
}

interface ParceiroBadgeInfo {
  nome: string;
  nivel: NivelParceiro;
}

export default function Empresa() {
  const { slugOrId } = useParams<{ slugOrId: string }>();
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [parceiroBadge, setParceiroBadge] = useState<ParceiroBadgeInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { trackPageView, trackWhatsAppClick, trackTelefoneClick, trackSiteClick } = useAnalytics();
  const { toast } = useToast();

  const [rating, setRating] = useState<RatingAgg | null>(null);

  const canonicalUrl = empresa
    ? `https://guialocalbr.com.br/empresa/${empresa.slug || empresa.id}`
    : undefined;

  const seoTitle = empresa ? `${empresa.nome} em ${empresa.cidade}` : undefined;
  const seoDescription = empresa
    ? empresa.meta_description ||
      `${empresa.descricao ? empresa.descricao.slice(0, 140) + " " : ""}Encontre telefone, endereço e avaliações de ${empresa.nome} em ${empresa.cidade}, ${empresa.estado}.`
    : undefined;

  useSEO({
    title: seoTitle,
    description: seoDescription,
    canonical: canonicalUrl,
    ogImage: empresa?.foto_principal || undefined,
  });

  // Structured Data JSON-LD: LocalBusiness + BreadcrumbList
  useEffect(() => {
    if (!empresa) return;
    const localBusiness: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": empresa.schema_type || "LocalBusiness",
      "@id": canonicalUrl,
      name: empresa.nome,
      description: seoDescription,
      url: canonicalUrl,
      address: {
        "@type": "PostalAddress",
        streetAddress: empresa.endereco,
        addressLocality: empresa.cidade,
        addressRegion: empresa.estado,
        addressCountry: "BR",
      },
      telephone: empresa.telefone,
      ...(empresa.foto_principal ? { image: empresa.foto_principal } : {}),
      ...((empresa.site || (empresa.redes_sociais && empresa.redes_sociais.length))
        ? {
            sameAs: [
              ...(empresa.site ? [empresa.site] : []),
              ...((empresa.redes_sociais ?? [])
                .map((s) => s.url)
                .filter((u): u is string => !!u)),
            ],
          }
        : {}),
      ...(rating && rating.total > 0
        ? {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: rating.media.toFixed(1),
              reviewCount: rating.total,
              bestRating: "5",
              worstRating: "1",
            },
          }
        : {}),
    };

    const breadcrumb = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Início", item: "https://guialocalbr.com.br/" },
        ...(empresa.nicho
          ? [{
              "@type": "ListItem",
              position: 2,
              name: empresa.nicho,
              item: `https://guialocalbr.com.br/busca?categoria=${encodeURIComponent(empresa.nicho)}`,
            }]
          : []),
        {
          "@type": "ListItem",
          position: empresa.nicho ? 3 : 2,
          name: empresa.nome,
          item: canonicalUrl,
        },
      ],
    };

    const s1 = document.createElement("script");
    s1.type = "application/ld+json";
    s1.id = "empresa-jsonld";
    s1.textContent = JSON.stringify(localBusiness);
    const s2 = document.createElement("script");
    s2.type = "application/ld+json";
    s2.id = "empresa-breadcrumb-jsonld";
    s2.textContent = JSON.stringify(breadcrumb);
    document.head.appendChild(s1);
    document.head.appendChild(s2);

    // FAQPage schema — só se houver pelo menos 1 par pergunta/resposta válido
    let s3: HTMLScriptElement | null = null;
    const faqItems = (empresa.faq ?? []).filter(
      (f) => f && f.pergunta?.trim() && f.resposta?.trim()
    );
    if (faqItems.length > 0) {
      const faqPage = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqItems.map((f) => ({
          "@type": "Question",
          name: f.pergunta,
          acceptedAnswer: { "@type": "Answer", text: f.resposta },
        })),
      };
      s3 = document.createElement("script");
      s3.type = "application/ld+json";
      s3.id = "empresa-faq-jsonld";
      s3.textContent = JSON.stringify(faqPage);
      document.head.appendChild(s3);
    }

    return () => {
      document.getElementById("empresa-jsonld")?.remove();
      document.getElementById("empresa-breadcrumb-jsonld")?.remove();
      document.getElementById("empresa-faq-jsonld")?.remove();
    };
  }, [empresa, rating, canonicalUrl, seoDescription]);

  useEffect(() => {
    if (slugOrId) {
      trackPageView(`/empresa/${slugOrId}`);
      fetchEmpresa();
    }
  }, [slugOrId]);

  const fetchEmpresa = async () => {
    if (!slugOrId) return;
    
    // Try by slug first, then by id
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
    
    let query = supabase
      .from("empresas")
      .select("*")
      .eq("status", "aprovado");
    
    if (isUuid) {
      query = query.eq("id", slugOrId);
    } else {
      query = query.eq("slug", slugOrId);
    }

    const { data, error } = await query.single();

    if (!error && data) {
      setEmpresa({
        ...data,
        redes_sociais: Array.isArray(data.redes_sociais) ? (data.redes_sociais as unknown as SocialLink[]) : [],
        faq: Array.isArray((data as any).faq) ? ((data as any).faq as { pergunta: string; resposta: string }[]) : [],
      } as unknown as Empresa);

      // Fetch partner badge (non-blocking)
      (supabase.rpc as any)("get_empresa_parceiro", { p_empresa_id: data.id }).then(
        ({ data: pData }: { data: ParceiroBadgeInfo[] | null }) => {
          if (pData && pData.length > 0) {
            setParceiroBadge(pData[0]);
          }
        }
      );

      // Fetch ratings aggregate (non-blocking) for aggregateRating JSON-LD
      supabase
        .from("avaliacoes")
        .select("nota")
        .eq("empresa_id", data.id)
        .eq("aprovado", true)
        .then(({ data: aData }) => {
          if (aData && aData.length > 0) {
            const total = aData.length;
            const media = aData.reduce((s, r) => s + (r.nota || 0), 0) / total;
            setRating({ total, media });
          }
        });
    }
    setLoading(false);
  };

  const allImages = empresa
    ? [empresa.foto_principal, ...(empresa.fotos_adicionais || [])].filter(Boolean) as string[]
    : [];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const whatsappHref = empresa
    ? `https://wa.me/55${empresa.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent("Olá! Vi sua empresa no Guia Local BR.")}`
    : "#";
  const telefoneHref = empresa ? `tel:${empresa.telefone}` : "#";
  const siteHref = empresa?.site && isValidUrl(empresa.site) ? empresa.site : null;
  // Premium: dofollow (transfere autoridade SEO). Free/basico: nofollow ugc.
  const siteRel = empresa?.link_type === "dofollow"
    ? "noopener noreferrer external"
    : "noopener noreferrer nofollow ugc";

  const handleWhatsAppClick = () => {
    if (empresa) trackWhatsAppClick(empresa.id);
  };
  const handleTelefoneClick = () => {
    if (empresa) trackTelefoneClick(empresa.id);
  };
  const handleSiteClick = (e: React.MouseEvent) => {
    if (!empresa) return;
    if (!siteHref) {
      e.preventDefault();
      toast({ title: "Erro", description: "URL do site é inválida.", variant: "destructive" });
      return;
    }
    trackSiteClick(empresa.id);
  };

  const abertaAgora = empresa ? isEmpresaAberta(empresa.horario) : false;

  if (loading) {
    return (
      <Layout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!empresa) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold">Empresa não encontrada</h1>
          <Button asChild className="mt-4">
            <Link to="/busca">Voltar para Busca</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <Link
          to="/busca"
          className="mb-3 inline-flex items-center text-sm text-muted-foreground hover:text-primary"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Voltar para Busca
        </Link>

        {/* Breadcrumb SEO visível */}
        <nav aria-label="breadcrumb" className="mb-6 text-xs text-muted-foreground">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link to="/" className="hover:text-primary">Início</Link>
            </li>
            <li aria-hidden="true">›</li>
            {empresa.nicho && (
              <>
                <li>
                  <Link
                    to={`/busca?categoria=${encodeURIComponent(empresa.nicho)}`}
                    className="hover:text-primary"
                  >
                    {empresa.nicho}
                  </Link>
                </li>
                <li aria-hidden="true">›</li>
              </>
            )}
            <li className="font-medium text-foreground line-clamp-1" aria-current="page">
              {empresa.nome}
            </li>
          </ol>
        </nav>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            {allImages.length > 0 && (
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
                <img
                  src={allImages[currentImageIndex]}
                  alt={empresa.nome}
                  className="aspect-[16/10] w-full object-contain"
                  width={800}
                  height={450}
                />
                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 touch-target"
                      aria-label="Imagem anterior"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 touch-target"
                      aria-label="Próxima imagem"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                    <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                      {allImages.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`h-2 w-2 rounded-full transition-all ${
                            index === currentImageIndex ? "bg-white w-4" : "bg-white/50"
                          }`}
                          aria-label={`Ver imagem ${index + 1}`}
                        />
                      ))}
                    </div>
                  </>
                )}
                <div className="absolute left-4 top-4 flex flex-col gap-2">
                  {empresa.plano === "premium" && <BadgePremium />}
                  {abertaAgora && (
                    <Badge className="bg-green-500 hover:bg-green-600 text-white w-fit">
                      Aberto agora
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Info */}
            <div>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <h1 className="font-display text-3xl font-bold">{empresa.nome}</h1>
                  {empresa.verificada && (
                    <div 
                      className="flex items-center justify-center rounded-full bg-green-500 p-1 mt-1" 
                      title="Empresa Verificada"
                    >
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}
                  {abertaAgora && !allImages.length && (
                    <Badge className="bg-green-500 hover:bg-green-600 text-white mt-1">
                      Aberto
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {empresa.nicho && (
                    <span className="rounded-full bg-muted px-3 py-1 text-sm">
                      {empresa.nicho}
                    </span>
                  )}
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => {
                      const url = window.location.href;
                      if (navigator.share) {
                        navigator.share({ title: empresa.nome, url });
                      } else {
                        navigator.clipboard.writeText(url);
                        toast({ title: "Link copiado!", description: url });
                      }
                    }}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {empresa.descricao && (
                <p className="mt-4 text-muted-foreground">{empresa.descricao}</p>
              )}

              {parceiroBadge && (() => {
                const n = NIVEIS_PARCEIRO[parceiroBadge.nivel] || NIVEIS_PARCEIRO.bronze;
                return (
                  <Link
                    to="/parceiros"
                    className={`mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-80 ${n.bg} ${n.color} ${n.border}`}
                    title="Ver ranking de parceiros"
                  >
                    <span className="text-base leading-none">{n.emoji}</span>
                    Cadastrada por Parceiro {n.label}{" "}
                    <strong className="ml-0.5">{parceiroBadge.nome}</strong>
                  </Link>
                );
              })()}

              <div className="mt-6 space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-muted-foreground" />
                  <div>
                    <span>
                      {empresa.endereco}, {empresa.cidade} - {empresa.estado}
                    </span>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${empresa.endereco}, ${empresa.cidade} - ${empresa.estado}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-sm text-primary hover:underline"
                    >
                      Ver no mapa →
                    </a>
                  </div>
                </div>
                {empresa.horario && (
                  <div className="flex items-start gap-3">
                    <Clock className="mt-0.5 h-5 w-5 flex-shrink-0 text-muted-foreground" />
                    <div className="flex flex-col gap-0.5">
                      {formatHorarioDisplay(empresa.horario).split(" | ").map((item, idx) => (
                        <span key={idx} className="text-sm">{item}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Videos */}
            {empresa.plano === "premium" && empresa.videos && empresa.videos.length > 0 && (
              <div>
                <h2 className="mb-4 font-display text-xl font-semibold">Vídeos</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {empresa.videos.map((video, index) => (
                    <div key={index} className="aspect-video overflow-hidden rounded-lg">
                      <iframe
                        src={video}
                        title={`Vídeo ${index + 1}`}
                        className="h-full w-full"
                        allowFullScreen
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Avaliações */}
            <AvaliacoesSection empresaId={empresa.id} />
          </div>

          {/* Sidebar - hidden on mobile, shown on desktop */}
          <div className="hidden lg:block">
            <Card className="sticky top-24">
              <CardContent className="p-6 space-y-4">
                <h2 className="font-display text-lg font-semibold">Contato</h2>
                
                <Button
                  asChild
                  className="w-full bg-[#25D366] hover:bg-[#20BD5C] min-h-[44px]"
                >
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleWhatsAppClick}
                  >
                    <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    Chamar no WhatsApp
                  </a>
                </Button>

                <Button asChild variant="outline" className="w-full min-h-[44px]">
                  <a href={telefoneHref} onClick={handleTelefoneClick}>
                    <Phone className="mr-2 h-5 w-5" />
                    {empresa.telefone}
                  </a>
                </Button>

                {empresa.plano === "premium" && empresa.site && (
                  <Button asChild variant="outline" className="w-full min-h-[44px]">
                    <a
                      href={siteHref || "#"}
                      target="_blank"
                      rel={siteRel}
                      onClick={handleSiteClick}
                    >
                      <Globe className="mr-2 h-5 w-5" />
                      Visitar Site
                    </a>
                  </Button>
                )}

                {empresa.redes_sociais && empresa.redes_sociais.length > 0 && (
                  <SocialLinksDisplay links={empresa.redes_sociais} />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Mobile contact section - inline at bottom */}
          <div className="lg:hidden space-y-4">
            <h2 className="font-display text-lg font-semibold">Contato</h2>
            <Button asChild variant="outline" className="w-full min-h-[44px]">
              <a href={telefoneHref} onClick={handleTelefoneClick}>
                <Phone className="mr-2 h-5 w-5" />
                {empresa.telefone}
              </a>
            </Button>
            {empresa.plano === "premium" && empresa.site && (
              <Button asChild variant="outline" className="w-full min-h-[44px]">
                <a
                  href={siteHref || "#"}
                  target="_blank"
                  rel={siteRel}
                  onClick={handleSiteClick}
                >
                  <Globe className="mr-2 h-5 w-5" />
                  Visitar Site
                </a>
              </Button>
            )}
            {empresa.redes_sociais && empresa.redes_sociais.length > 0 && (
              <SocialLinksDisplay links={empresa.redes_sociais} />
            )}
          </div>
        </div>

        {/* Fixed WhatsApp button on mobile */}
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background p-3 lg:hidden">
          <Button
            asChild
            className="w-full bg-[#25D366] hover:bg-[#20BD5C] min-h-[48px] text-base font-semibold"
          >
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleWhatsAppClick}
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Chamar no WhatsApp
            </a>
          </Button>
        </div>
        {/* Spacer for fixed button on mobile */}
        <div className="h-16 lg:hidden" />
      </div>
    </Layout>
  );
}
