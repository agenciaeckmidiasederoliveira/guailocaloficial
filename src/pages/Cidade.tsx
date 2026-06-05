import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { EmpresaCard } from "@/components/empresas/EmpresaCard";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSEO } from "@/hooks/useSEO";
import { useAnalytics } from "@/hooks/useAnalytics";
import { ESTADOS_BR, NICHOS } from "@/lib/constants";
import { MapPin, ArrowRight, Loader2, Building2 } from "lucide-react";

interface Empresa {
  id: string;
  nome: string;
  endereco: string;
  cidade: string;
  estado: string;
  telefone: string;
  whatsapp: string;
  foto_principal: string | null;
  plano: "free" | "premium";
  nicho: string | null;
  site: string | null;
  horario: string | null;
}

export default function CidadePage() {
  const { estado, cidade } = useParams<{ estado: string; cidade: string }>();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [nichos, setNichos] = useState<string[]>([]);
  const [parceiroLocal, setParceiroLocal] = useState<{ nome: string; slug: string; whatsapp: string | null; avatar_url: string | null } | null>(null);
  const { trackPageView } = useAnalytics();

  const estadoNome = ESTADOS_BR.find((e) => e.sigla === estado?.toUpperCase())?.nome || estado || "";
  const cidadeFormatada = cidade
    ? decodeURIComponent(cidade).replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "";

  useSEO({
    title: `Empresas em ${cidadeFormatada}, ${estado?.toUpperCase()} - Guia Comercial`,
    description: `Encontre os melhores negócios e empresas em ${cidadeFormatada}, ${estadoNome}. Guia comercial completo com telefone, WhatsApp e endereço. Cadastre sua empresa grátis!`,
    canonical: `https://guialocalbr.com.br/cidade/${estado}/${cidade}`,
  });

  useEffect(() => {
    if (estado && cidade) {
      trackPageView(`/cidade/${estado}/${cidade}`);
      fetchEmpresas();
      const cidadeBusca = decodeURIComponent(cidade).replace(/-/g, " ");
      (supabase.rpc as any)("get_parceiro_local_por_cidade", {
        p_estado: estado.toUpperCase(),
        p_cidade: cidadeBusca,
      }).then(({ data }: { data: any[] | null }) => {
        if (data && data.length > 0) setParceiroLocal(data[0]);
      });
    }
  }, [estado, cidade]);

  const fetchEmpresas = async () => {
    setLoading(true);
    const cidadeSearch = decodeURIComponent(cidade || "").replace(/-/g, " ");

    const { data } = await supabase
      .from("empresas")
      .select("id, slug, nome, endereco, cidade, estado, telefone, whatsapp, foto_principal, plano, nicho, site, horario")
      .eq("status", "aprovado")
      .eq("estado", estado?.toUpperCase() || "")
      .ilike("cidade", cidadeSearch)
      .order("plano", { ascending: false })
      .order("criado_em", { ascending: false });

    if (data) {
      setEmpresas(data as Empresa[]);
      const uniqueNichos = [...new Set(data.filter((e) => e.nicho).map((e) => e.nicho as string))];
      setNichos(uniqueNichos);
    }
    setLoading(false);
  };

  // JSON-LD structured data
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "cidade-jsonld";
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `Empresas em ${cidadeFormatada}, ${estado?.toUpperCase()}`,
      description: `Guia comercial de ${cidadeFormatada}, ${estadoNome}`,
      numberOfItems: empresas.length,
      itemListElement: empresas.slice(0, 10).map((e, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "LocalBusiness",
          name: e.nome,
          address: {
            "@type": "PostalAddress",
            streetAddress: e.endereco,
            addressLocality: e.cidade,
            addressRegion: e.estado,
            addressCountry: "BR",
          },
        },
      })),
    });
    document.head.appendChild(script);
    return () => {
      document.getElementById("cidade-jsonld")?.remove();
    };
  }, [empresas, cidadeFormatada, estadoNome]);

  return (
    <Layout>
      {/* Hero */}
      <section className="bg-gradient-hero py-12 text-primary-foreground lg:py-16">
        <div className="container">
          <div className="flex items-center gap-2 text-sm text-primary-foreground/70 mb-4">
            <Link to="/" className="hover:text-primary-foreground">Início</Link>
            <span>/</span>
            <Link to={`/busca?estado=${estado?.toUpperCase()}`} className="hover:text-primary-foreground">{estadoNome}</Link>
            <span>/</span>
            <span className="text-primary-foreground">{cidadeFormatada}</span>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="h-8 w-8 text-secondary" />
            <div>
              <h1 className="font-display text-3xl font-bold md:text-4xl">
                Empresas em {cidadeFormatada}
              </h1>
              <p className="mt-1 text-primary-foreground/80">
                {estadoNome} — {empresas.length} empresa{empresas.length !== 1 ? "s" : ""} cadastrada{empresas.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>
      </section>

      {parceiroLocal && (
        <section className="border-b bg-gradient-to-r from-primary/5 to-secondary/5">
          <div className="container py-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-card p-4 shadow-sm border">
              <div className="flex items-center gap-3 min-w-0">
                {parceiroLocal.avatar_url ? (
                  <img src={parceiroLocal.avatar_url} alt={parceiroLocal.nome} className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                    {parceiroLocal.nome.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Parceiro local em {cidadeFormatada}</p>
                  <Link to={`/parceiro-local/${parceiroLocal.slug}`} className="font-semibold text-foreground hover:text-primary">
                    {parceiroLocal.nome}
                  </Link>
                </div>
              </div>
              {parceiroLocal.whatsapp && (
                <Button asChild size="sm" className="bg-green-600 hover:bg-green-700">
                  <a
                    href={`https://wa.me/${parceiroLocal.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá ${parceiroLocal.nome}, quero cadastrar minha empresa em ${cidadeFormatada}.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Falar no WhatsApp
                  </a>
                </Button>
              )}
            </div>
          </div>
        </section>
      )}

      <div className="container py-8">

        {/* Categories quick links */}
        {nichos.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Categorias em {cidadeFormatada}
            </h2>
            <div className="flex flex-wrap gap-2">
              {nichos.map((n) => (
                <Link
                  key={n}
                  to={`/busca?estado=${estado?.toUpperCase()}&cidade=${encodeURIComponent(cidadeFormatada)}&nicho=${encodeURIComponent(n)}`}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-sm text-foreground hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  {n}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : empresas.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-16 text-center">
            <Building2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <h2 className="text-xl font-semibold text-foreground">
              Nenhuma empresa encontrada em {cidadeFormatada}
            </h2>
            <p className="mt-2 text-muted-foreground">
              Seja o primeiro a cadastrar seu negócio nesta cidade!
            </p>
            <Button asChild className="mt-4">
              <Link to="/cadastro">
                Cadastrar Empresa Grátis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {empresas.map((empresa) => (
              <EmpresaCard key={empresa.id} empresa={empresa} />
            ))}
          </div>
        )}

        {/* SEO Text */}
        <div className="mt-12 rounded-xl border border-border bg-muted/30 p-6">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Guia Comercial de {cidadeFormatada}, {estadoNome}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            O Guia Local BR é a plataforma mais completa para encontrar empresas e negócios em {cidadeFormatada}, {estadoNome}. 
            Aqui você encontra restaurantes, lojas, prestadores de serviço, profissionais da saúde e muito mais — tudo com 
            telefone, WhatsApp e endereço atualizados. Se você é empresário em {cidadeFormatada}, cadastre seu negócio 
            gratuitamente e aumente sua visibilidade online.
          </p>
        </div>
      </div>
    </Layout>
  );
}
