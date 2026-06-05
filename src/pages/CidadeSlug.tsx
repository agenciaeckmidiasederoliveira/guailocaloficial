import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { EmpresaCard } from "@/components/empresas/EmpresaCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useSEO } from "@/hooks/useSEO";
import { useAnalytics } from "@/hooks/useAnalytics";
import { toSlug, unslug } from "@/lib/slugify";
import { Building2, Loader2, ArrowRight, Star, ChevronLeft, ChevronRight, MapPin } from "lucide-react";

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
  destaque_rotacao: boolean | null;
  destaque_banner: boolean | null;
}

const PAGE_SIZE = 20;

export default function CidadeSlug() {
  const { cidade } = useParams<{ cidade: string }>();
  const cidadeSlug = cidade ? toSlug(cidade) : "";
  const cidadeLabel = cidade ? unslug(cidade) : "";

  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const { trackPageView } = useAnalytics();

  const canonical = `https://www.guialocalbr.com.br/cidades/${cidadeSlug}`;

  useSEO({
    title: `Empresas em ${cidadeLabel} — Guia Local BR`,
    description: `Diretório completo de empresas e serviços em ${cidadeLabel}. Encontre telefone, WhatsApp e endereço dos melhores negócios locais.`,
    canonical,
  });

  useEffect(() => {
    setPage(1);
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("empresas")
        .select(
          "id, slug, nome, endereco, cidade, estado, telefone, whatsapp, foto_principal, plano, nicho, site, horario, destaque_rotacao, destaque_banner",
        )
        .eq("status", "aprovado")
        .order("plano", { ascending: false })
        .limit(1000);

      if (cancelled) return;
      const filtered = (data ?? []).filter((e: any) => toSlug(e.cidade) === cidadeSlug) as Empresa[];
      filtered.sort((a, b) => {
        const da = (a.destaque_banner || a.destaque_rotacao) ? 1 : 0;
        const db = (b.destaque_banner || b.destaque_rotacao) ? 1 : 0;
        if (da !== db) return db - da;
        return a.plano === "premium" ? -1 : 1;
      });
      setEmpresas(filtered);
      setLoading(false);
      trackPageView(canonical);
    })();
    return () => {
      cancelled = true;
    };
  }, [cidadeSlug, canonical, trackPageView]);

  const total = empresas.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageItems = useMemo(
    () => empresas.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [empresas, page],
  );

  const nichos = useMemo(() => {
    const set = new Map<string, string>();
    for (const e of empresas) {
      if (e.nicho) set.set(toSlug(e.nicho), e.nicho);
    }
    return Array.from(set.entries());
  }, [empresas]);

  return (
    <Layout>
      <section className="bg-gradient-hero py-10 text-primary-foreground">
        <div className="container">
          <nav className="mb-3 flex items-center gap-2 text-sm text-primary-foreground/70">
            <Link to="/" className="hover:text-primary-foreground">Início</Link>
            <span>/</span>
            <Link to="/cidades" className="hover:text-primary-foreground">Cidades</Link>
            <span>/</span>
            <span className="text-primary-foreground">{cidadeLabel}</span>
          </nav>
          <div className="flex items-center gap-3">
            <MapPin className="h-8 w-8 text-secondary" />
            <div>
              <h1 className="font-display text-3xl font-bold md:text-4xl">
                {total} Empresas em {cidadeLabel}
              </h1>
              <p className="mt-1 text-primary-foreground/80">
                Guia comercial de {cidadeLabel} — todos os contatos em um só lugar.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="container py-8">
        {nichos.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Categorias em {cidadeLabel}
            </h2>
            <div className="flex flex-wrap gap-2">
              {nichos.map(([slug, nome]) => (
                <Link
                  key={slug}
                  to={`/empresas/${slug}/${cidadeSlug}`}
                  rel="dofollow"
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-sm hover:border-primary hover:bg-primary/5"
                >
                  {nome}
                </Link>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : total === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-16 text-center">
            <Building2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <h2 className="text-xl font-semibold">
              Nenhuma empresa encontrada em {cidadeLabel}
            </h2>
            <p className="mt-2 text-muted-foreground">
              Seja o primeiro a cadastrar seu negócio nesta cidade!
            </p>
            <Button asChild className="mt-4">
              <Link to="/cadastro">
                Cadastrar empresa grátis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 sm:gap-6">
              {pageItems.map((e) => (
                <div key={e.id} className="relative">
                  {(e.destaque_banner || e.destaque_rotacao) && (
                    <Badge className="absolute -top-2 left-2 z-10 bg-yellow-500 text-yellow-950 shadow">
                      <Star className="mr-1 h-3 w-3 fill-current" /> Destaque
                    </Badge>
                  )}
                  <EmpresaCard empresa={e} />
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" /> Anterior
                </Button>
                <span className="text-sm text-muted-foreground">
                  Página {page} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Próxima <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
