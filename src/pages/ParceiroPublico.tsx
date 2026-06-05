import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { EmpresaCard } from "@/components/empresas/EmpresaCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useSEO } from "@/hooks/useSEO";
import { NIVEIS_PARCEIRO, type NivelParceiro, SITE_URL } from "@/lib/constants";
import { MapPin, MessageCircle, Loader2, Building2, ArrowRight } from "lucide-react";

interface ParceiroPublico {
  id: string;
  nome: string;
  nivel: NivelParceiro;
  bio: string | null;
  avatar_url: string | null;
  whatsapp: string | null;
  slug: string;
  cidades_atendidas: { estado: string; cidade: string }[];
  total_empresas: number;
}

interface Empresa {
  id: string;
  slug: string | null;
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

export default function ParceiroPublico() {
  const { slug } = useParams<{ slug: string }>();
  const [parceiro, setParceiro] = useState<ParceiroPublico | null>(null);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);

  useSEO({
    title: parceiro ? `${parceiro.nome} — Parceiro Guia Local BR` : "Parceiro Local",
    description: parceiro
      ? `Conheça as empresas atendidas por ${parceiro.nome} no Guia Local BR. ${parceiro.cidades_atendidas.length} cidades atendidas.`
      : "Parceiro do Guia Local BR",
    canonical: slug ? `${SITE_URL}/parceiro-local/${slug}` : undefined,
  });

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      const { data } = await (supabase.rpc as any)("get_parceiro_por_slug", { p_slug: slug });
      const p = Array.isArray(data) && data.length > 0 ? (data[0] as ParceiroPublico) : null;
      setParceiro(p);

      if (p && p.cidades_atendidas?.length > 0) {
        // OR de pares (estado, cidade) via filtros encadeados
        let q = supabase
          .from("empresas")
          .select(
            "id, slug, nome, endereco, cidade, estado, telefone, whatsapp, foto_principal, plano, nicho, site, horario",
          )
          .eq("status", "aprovado");

        const orFilters = p.cidades_atendidas
          .map(
            (c) =>
              `and(estado.eq.${c.estado.toUpperCase()},cidade.ilike.${c.cidade})`,
          )
          .join(",");
        q = q.or(orFilters);

        const { data: emps } = await q
          .order("plano", { ascending: false })
          .order("criado_em", { ascending: false })
          .limit(200);
        setEmpresas((emps as Empresa[]) || []);
      }
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <Layout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!parceiro) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="font-display text-2xl font-bold">Parceiro não encontrado</h1>
          <p className="mt-2 text-muted-foreground">
            A página que você procura pode ter sido removida.
          </p>
          <Button asChild className="mt-6">
            <Link to="/">Voltar ao início</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const nivelInfo = NIVEIS_PARCEIRO[parceiro.nivel] || NIVEIS_PARCEIRO.bronze;
  const whatsappLink = parceiro.whatsapp
    ? `https://wa.me/${parceiro.whatsapp.replace(/\D/g, "")}?text=Olá ${encodeURIComponent(
        parceiro.nome,
      )}, vim pelo Guia Local BR!`
    : null;

  return (
    <Layout>
      {/* Hero */}
      <section className="bg-gradient-hero py-12 text-primary-foreground lg:py-16">
        <div className="container">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div
              className={`flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br ${nivelInfo.gradient} text-4xl shadow-xl`}
            >
              {parceiro.avatar_url ? (
                <img
                  src={parceiro.avatar_url}
                  alt={parceiro.nome}
                  className="h-full w-full object-cover"
                />
              ) : (
                nivelInfo.emoji
              )}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-3xl font-bold md:text-4xl">{parceiro.nome}</h1>
                <Badge className="bg-white/15 text-primary-foreground backdrop-blur">
                  Parceiro {nivelInfo.label}
                </Badge>
              </div>
              {parceiro.bio && (
                <p className="mt-2 max-w-2xl text-primary-foreground/85">{parceiro.bio}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-2 text-sm text-primary-foreground/80">
                <span className="inline-flex items-center gap-1">
                  <Building2 className="h-4 w-4" /> {parceiro.total_empresas} empresas
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-4 w-4" /> {parceiro.cidades_atendidas.length} cidades atendidas
                </span>
              </div>
            </div>
            {whatsappLink && (
              <Button asChild size="lg" variant="secondary">
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Falar com {parceiro.nome.split(" ")[0]}
                </a>
              </Button>
            )}
          </div>
        </div>
      </section>

      <div className="container py-8 space-y-8">
        {/* Cidades atendidas */}
        {parceiro.cidades_atendidas.length > 0 && (
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Cidades atendidas
            </h2>
            <div className="flex flex-wrap gap-2">
              {parceiro.cidades_atendidas.map((c) => (
                <Link
                  key={`${c.estado}-${c.cidade}`}
                  to={`/cidade/${c.estado.toUpperCase()}/${encodeURIComponent(c.cidade)}`}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-sm hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  {c.cidade} — {c.estado.toUpperCase()}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Vitrine de empresas */}
        <div>
          <h2 className="mb-4 font-display text-xl font-bold text-foreground">
            Empresas das regiões atendidas
          </h2>
          {empresas.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-12 text-center">
              <Building2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                Ainda não há empresas cadastradas nas cidades deste parceiro.
              </p>
              {whatsappLink && (
                <Button asChild className="mt-4">
                  <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                    Cadastre sua empresa com {parceiro.nome.split(" ")[0]}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {empresas.map((e) => (
                <EmpresaCard key={e.id} empresa={e} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
