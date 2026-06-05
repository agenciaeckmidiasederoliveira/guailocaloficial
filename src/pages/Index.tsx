import { Layout } from "@/components/layout/Layout";
import { BannersGrandes } from "@/components/home/BannersGrandes";
import { EmpresasDestaqueCarrossel } from "@/components/home/EmpresasDestaqueCarrossel";
import { CidadesDestaque } from "@/components/home/CidadesDestaque";
import { BlogDestaque } from "@/components/home/BlogDestaque";
import { GrandesEmpresas } from "@/components/home/GrandesEmpresas";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, MapPin, Star, TrendingUp, Building2 } from "lucide-react";
import { SITE_NAME } from "@/lib/constants";
import { useEffect, useRef } from "react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useSEO } from "@/hooks/useSEO";
import { HomeStatsAndMarquee } from "@/components/home/HomeStatsAndMarquee";

export default function Index() {
  const { trackPageView } = useAnalytics();
  const hasTrackedRef = useRef(false);

  useSEO({
    title: "Início",
    description: "O Guia Local BR é a plataforma premium para encontrar e promover negócios locais em todo o Brasil. Cadastre sua empresa e alcance milhares de clientes.",
    canonical: "https://guialocalbr.com.br",
  });

  useEffect(() => {
    if (!hasTrackedRef.current) {
      trackPageView("/");
      hasTrackedRef.current = true;
    }
  }, [trackPageView]);

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero py-20 text-primary-foreground lg:py-32">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_1px_1px,_white_1px,_transparent_0)]" style={{ backgroundSize: "40px 40px" }} />
        
        <div className="container relative">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="animate-fade-in-up font-display text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
              {SITE_NAME}: Conecte-se aos{" "}
              <span className="text-secondary">Melhores Negócios Locais</span> e Impulsione Sua Visibilidade!
            </h1>
            <p className="animation-delay-200 mt-6 animate-fade-in-up text-lg text-primary-foreground/90 md:text-xl">
              O guia definitivo para encontrar e promover negócios locais em todo o Brasil. 
              Cadastre sua empresa e alcance milhares de clientes na sua região.
            </p>
            <div className="animation-delay-300 mt-8 flex animate-fade-in-up flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
              >
                <Link to="/cadastro">
                  Cadastre Sua Empresa Grátis Agora!
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
              >
                <Link to="/busca">Buscar Empresas</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Marquee de Cidades e Estatísticas */}
      <HomeStatsAndMarquee />

      {/* Banners Grandes */}
      <BannersGrandes />

      {/* Carrossel de Destaques */}
      <EmpresasDestaqueCarrossel />

      {/* Cidades em Destaque */}
      <CidadesDestaque />

      {/* Grandes Empresas Já Estão Aqui */}
      <GrandesEmpresas />

      {/* Fique por dentro do Blog */}
      <BlogDestaque />
    </Layout>
  );
}
