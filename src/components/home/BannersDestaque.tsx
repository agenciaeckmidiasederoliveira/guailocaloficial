import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BadgePremium } from "@/components/ui/badge-premium";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";

interface BannerEmpresa {
  id: string;
  slug: string | null;
  nome: string;
  descricao: string | null;
  foto_principal: string | null;
  cidade: string;
  estado: string;
  nicho: string | null;
}

export function BannersDestaque() {
  const [empresas, setEmpresas] = useState<BannerEmpresa[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { trackBannerClick } = useAnalytics();

  useEffect(() => {
    fetchBannerEmpresas();
  }, []);

  const fetchBannerEmpresas = async () => {
    // 1. Tentar buscar da nova tabela banners_cidade
    const { data: banners } = await supabase
      .from("banners_cidade")
      .select("id, imagem_url, link_destino, empresa_id, empresa:empresas(nome, slug, descricao, cidade, estado, nicho)")
      .eq("ativo", true)
      .limit(3);

    if (banners && banners.length > 0) {
      // Mapeia para o formato esperado
      const mapped = banners.map((b: any) => ({
        id: b.empresa_id || b.id,
        slug: b.empresa?.slug || null,
        nome: b.empresa?.nome || "Empresa Parceira",
        descricao: b.empresa?.descricao || "Visite nossa página e conheça nossos serviços e produtos locais.",
        foto_principal: b.imagem_url, // Usa a URL customizada do banner
        cidade: b.empresa?.cidade || b.cidade || "Sua Região",
        estado: b.empresa?.estado || b.estado || "BR",
        nicho: b.empresa?.nicho || null,
        link_destino: b.link_destino,
      }));
      setEmpresas(mapped);
      return;
    }

    // 2. Fallback para empresas com destaque_banner = true
    const { data } = await supabase
      .from("empresas")
      .select("id, slug, nome, descricao, foto_principal, cidade, estado, nicho")
      .eq("status", "aprovado")
      .eq("destaque_banner", true)
      .limit(2);

    if (data && data.length > 0) {
      setEmpresas(data);
    }
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % empresas.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + empresas.length) % empresas.length);
  };

  if (empresas.length === 0) return null;

  const empresa = empresas[currentIndex];

  return (
    <section className="relative overflow-hidden bg-muted py-6 md:py-8">
      <div className="container">
        <h2 className="mb-4 text-center font-display text-xl font-bold md:mb-6 md:text-2xl">
          <span className="text-gradient">Empresas em Destaque</span>
        </h2>

        <div className="relative">
          <div className="overflow-hidden rounded-xl bg-card shadow-lg md:rounded-2xl">
            <div className="grid md:grid-cols-2">
              {/* Image */}
              <div className="relative aspect-[4/3] max-h-[280px] md:max-h-[320px] bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
                {empresa.foto_principal ? (
                  <img
                    src={empresa.foto_principal}
                    alt={empresa.nome}
                    loading="eager"
                    decoding="async"
                    {...({ fetchpriority: "high" } as any)}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="flex h-full min-h-[180px] items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                    <span className="text-5xl font-bold text-primary/30">
                      {empresa.nome.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="absolute left-3 top-3">
                  <BadgePremium />
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-col justify-center p-4 md:p-6">
                {empresa.nicho && (
                  <span className="mb-2 inline-block w-fit rounded-full bg-secondary/10 px-2.5 py-0.5 text-xs font-medium text-secondary md:text-sm">
                    {empresa.nicho}
                  </span>
                )}
                <h3 className="font-display text-lg font-bold text-foreground md:text-xl lg:text-2xl">
                  {empresa.nome}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {empresa.cidade}, {empresa.estado}
                </p>
                {empresa.descricao && (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2 md:mt-3 md:line-clamp-3">
                    {empresa.descricao}
                  </p>
                )}
                <Button asChild className="mt-4 w-fit h-10 touch-target md:mt-5" onClick={() => trackBannerClick(empresa.id)}>
                  {(empresa as any).link_destino ? (
                    <a href={(empresa as any).link_destino} target="_blank" rel="noopener noreferrer">
                      Saiba Mais
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  ) : (
                    <Link to={`/empresa/${empresa.slug || empresa.id}`}>
                      Saiba Mais
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Navigation */}
          {empresas.length > 1 && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-1 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 shadow-md backdrop-blur hover:bg-background touch-target md:left-2 md:p-3"
                aria-label="Anterior"
              >
                <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 shadow-md backdrop-blur hover:bg-background touch-target md:right-2 md:p-3"
                aria-label="Próximo"
              >
                <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
              </button>

              <div className="mt-4 flex justify-center gap-2">
                {empresas.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`h-2 rounded-full transition-all ${
                      index === currentIndex
                        ? "w-6 bg-primary"
                        : "w-2 bg-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
