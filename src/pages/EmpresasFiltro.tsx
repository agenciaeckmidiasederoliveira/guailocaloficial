import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { EmpresaCard } from "@/components/empresas/EmpresaCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useSEO } from "@/hooks/useSEO";
import { useAnalytics } from "@/hooks/useAnalytics";
import { toSlug, unslug } from "@/lib/slugify";
import {
  Building2,
  Loader2,
  ArrowRight,
  Star,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  _media?: number;
  _total?: number;
}

const PAGE_SIZE = 20;
type Ordem = "relevancia" | "melhor_avaliados" | "mais_avaliados" | "destaques";

export default function EmpresasFiltro() {
  const { categoria, cidade } = useParams<{ categoria?: string; cidade?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const { trackPageView } = useAnalytics();

  const categoriaSlug = categoria ? toSlug(categoria) : "";
  const cidadeSlug = cidade ? toSlug(cidade) : "";
  const categoriaLabel = categoria ? unslug(categoria) : "";
  const cidadeLabelRoute = cidade ? unslug(cidade) : "";

  // Filtros (lidos da URL)
  const cidadeFiltro = searchParams.get("cidade") || "";
  const notaMin = Number(searchParams.get("nota") || 0);
  const ordem = (searchParams.get("ordem") || "relevancia") as Ordem;
  const soWhats = searchParams.get("whats") === "1";
  const soSite = searchParams.get("site") === "1";

  const tituloBase = cidade
    ? `${categoriaLabel} em ${cidadeLabelRoute}`
    : `${categoriaLabel} no Brasil`;

  const canonical = cidade
    ? `https://www.guialocalbr.com.br/empresas/${categoriaSlug}/${cidadeSlug}`
    : `https://www.guialocalbr.com.br/empresas/${categoriaSlug}`;

  useSEO({
    title: `${tituloBase} — Guia Local BR`,
    description: `Veja ${categoriaLabel.toLowerCase()} ${cidade ? `em ${cidadeLabelRoute}` : "no Brasil"} com telefone, WhatsApp e endereço. Cadastre seu negócio gratuitamente no Guia Local BR.`,
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
      const base = (data ?? []).filter((e: any) => {
        const okCat = !categoriaSlug || toSlug(e.nicho) === categoriaSlug;
        const okCid = !cidadeSlug || toSlug(e.cidade) === cidadeSlug;
        return okCat && okCid;
      }) as Empresa[];

      // Busca médias de avaliação de uma vez
      if (base.length) {
        const ids = base.map((e) => e.id);
        const { data: avs } = await supabase
          .from("avaliacoes")
          .select("empresa_id, nota")
          .in("empresa_id", ids)
          .eq("aprovado", true);
        const map = new Map<string, { soma: number; total: number }>();
        for (const a of avs ?? []) {
          const prev = map.get((a as any).empresa_id) ?? { soma: 0, total: 0 };
          prev.soma += (a as any).nota;
          prev.total += 1;
          map.set((a as any).empresa_id, prev);
        }
        for (const e of base) {
          const v = map.get(e.id);
          e._media = v && v.total ? v.soma / v.total : 0;
          e._total = v?.total ?? 0;
        }
      }

      setEmpresas(base);
      setLoading(false);
      trackPageView(canonical);
    })();
    return () => {
      cancelled = true;
    };
  }, [categoriaSlug, cidadeSlug, canonical, trackPageView]);

  // Cidades disponíveis dentro do resultado bruto (para o select)
  const cidadesDisponiveis = useMemo(() => {
    const set = new Map<string, string>();
    for (const e of empresas) {
      if (e.cidade) set.set(toSlug(e.cidade), e.cidade);
    }
    return Array.from(set.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [empresas]);

  // Aplica filtros + ordem
  const filtradas = useMemo(() => {
    let arr = empresas.slice();
    if (cidadeFiltro) arr = arr.filter((e) => toSlug(e.cidade) === cidadeFiltro);
    if (notaMin > 0) arr = arr.filter((e) => (e._media ?? 0) >= notaMin);
    if (soWhats) arr = arr.filter((e) => !!e.whatsapp);
    if (soSite) arr = arr.filter((e) => !!e.site);

    arr.sort((a, b) => {
      if (ordem === "melhor_avaliados") return (b._media ?? 0) - (a._media ?? 0);
      if (ordem === "mais_avaliados") return (b._total ?? 0) - (a._total ?? 0);
      if (ordem === "destaques") {
        const da = (a.destaque_banner || a.destaque_rotacao) ? 1 : 0;
        const db = (b.destaque_banner || b.destaque_rotacao) ? 1 : 0;
        return db - da;
      }
      // relevancia: destaques > premium > resto, mantém ordem do DB
      const da = (a.destaque_banner || a.destaque_rotacao) ? 1 : 0;
      const db = (b.destaque_banner || b.destaque_rotacao) ? 1 : 0;
      if (da !== db) return db - da;
      const pa = a.plano === "premium" ? 1 : 0;
      const pb = b.plano === "premium" ? 1 : 0;
      return pb - pa;
    });
    return arr;
  }, [empresas, cidadeFiltro, notaMin, soWhats, soSite, ordem]);

  const total = filtradas.length;
  const totalGeral = empresas.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageItems = useMemo(
    () => filtradas.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtradas, page],
  );

  const updateParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (value === null || value === "" || value === "0") next.delete(key);
    else next.set(key, value);
    setSearchParams(next, { replace: true });
    setPage(1);
  };

  const limparFiltros = () => {
    setSearchParams({}, { replace: true });
    setPage(1);
  };

  const filtrosAtivos =
    !!cidadeFiltro || notaMin > 0 || soWhats || soSite || ordem !== "relevancia";

  const FiltrosBody = (
    <div className="space-y-5">
      {!cidade && (
        <div>
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Cidade</Label>
          <Select
            value={cidadeFiltro || "todas"}
            onValueChange={(v) => updateParam("cidade", v === "todas" ? null : v)}
          >
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Todas as cidades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as cidades</SelectItem>
              {cidadesDisponiveis.map(([slug, nome]) => (
                <SelectItem key={slug} value={slug}>{nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div>
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Nota mínima</Label>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {[
            { v: 0, l: "Qualquer" },
            { v: 3, l: "3+" },
            { v: 4, l: "4+" },
            { v: 4.5, l: "4.5+" },
          ].map((opt) => (
            <Button
              key={opt.v}
              size="sm"
              variant={notaMin === opt.v ? "default" : "outline"}
              onClick={() => updateParam("nota", opt.v ? String(opt.v) : null)}
            >
              {opt.v > 0 && <Star className="mr-1 h-3 w-3 fill-current" />}
              {opt.l}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Ordenar por</Label>
        <Select value={ordem} onValueChange={(v) => updateParam("ordem", v === "relevancia" ? null : v)}>
          <SelectTrigger className="mt-1.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relevancia">Relevância</SelectItem>
            <SelectItem value="melhor_avaliados">Melhor avaliados</SelectItem>
            <SelectItem value="mais_avaliados">Mais avaliados</SelectItem>
            <SelectItem value="destaques">Destaques primeiro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between rounded-md border border-border p-3">
        <Label htmlFor="f-whats" className="text-sm">Só com WhatsApp</Label>
        <Switch
          id="f-whats"
          checked={soWhats}
          onCheckedChange={(v) => updateParam("whats", v ? "1" : null)}
        />
      </div>
      <div className="flex items-center justify-between rounded-md border border-border p-3">
        <Label htmlFor="f-site" className="text-sm">Só com site</Label>
        <Switch
          id="f-site"
          checked={soSite}
          onCheckedChange={(v) => updateParam("site", v ? "1" : null)}
        />
      </div>

      {filtrosAtivos && (
        <Button variant="outline" size="sm" className="w-full" onClick={limparFiltros}>
          <X className="mr-1 h-4 w-4" /> Limpar filtros
        </Button>
      )}
    </div>
  );

  // BreadcrumbList JSON-LD
  useEffect(() => {
    const items: any[] = [
      { "@type": "ListItem", position: 1, name: "Início", item: "https://www.guialocalbr.com.br/" },
      { "@type": "ListItem", position: 2, name: "Categorias", item: "https://www.guialocalbr.com.br/categorias" },
      {
        "@type": "ListItem",
        position: 3,
        name: categoriaLabel,
        item: `https://www.guialocalbr.com.br/empresas/${categoriaSlug}`,
      },
    ];
    if (cidade) {
      items.push({ "@type": "ListItem", position: 4, name: cidadeLabelRoute, item: canonical });
    }
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "filtro-breadcrumb-jsonld";
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: items,
    });
    document.head.appendChild(script);
    return () => {
      document.getElementById("filtro-breadcrumb-jsonld")?.remove();
    };
  }, [categoriaSlug, cidadeSlug, canonical, categoriaLabel, cidadeLabelRoute, cidade]);

  return (
    <Layout>
      <section className="bg-gradient-hero py-10 text-primary-foreground">
        <div className="container">
          <nav className="mb-3 flex items-center gap-2 text-sm text-primary-foreground/70">
            <Link to="/" className="hover:text-primary-foreground">Início</Link>
            <span>/</span>
            <Link to="/categorias" className="hover:text-primary-foreground">Categorias</Link>
            <span>/</span>
            <Link to={`/empresas/${categoriaSlug}`} className="hover:text-primary-foreground">
              {categoriaLabel}
            </Link>
            {cidade && (
              <>
                <span>/</span>
                <span className="text-primary-foreground">{cidadeLabelRoute}</span>
              </>
            )}
          </nav>
          <h1 className="font-display text-3xl font-bold md:text-4xl">
            {totalGeral} {tituloBase}
          </h1>
          <p className="mt-1 text-primary-foreground/80">
            Negócios verificados com contato direto via WhatsApp.
          </p>
        </div>
      </section>

      <div className="container py-8">
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          {/* Sidebar desktop */}
          <aside className="hidden lg:block">
            <div className="sticky top-20 rounded-lg border border-border bg-card p-4">
              <h3 className="mb-4 flex items-center gap-2 font-semibold">
                <SlidersHorizontal className="h-4 w-4" /> Filtros
              </h3>
              {FiltrosBody}
            </div>
          </aside>

          <div>
            {/* Barra mobile */}
            <div className="mb-4 flex items-center justify-between gap-2 lg:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    <SlidersHorizontal className="mr-1 h-4 w-4" />
                    Filtros{filtrosAtivos ? " •" : ""}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[85vw] max-w-sm overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Filtros</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">{FiltrosBody}</div>
                </SheetContent>
              </Sheet>
              {filtrosAtivos && (
                <Button variant="ghost" size="sm" onClick={limparFiltros}>
                  Limpar
                </Button>
              )}
            </div>

            {/* Contador */}
            <div className="mb-4 flex items-center justify-between gap-3 text-sm text-muted-foreground">
              <span>
                Mostrando <strong className="text-foreground">{Math.min(total, PAGE_SIZE)}</strong> de{" "}
                <strong className="text-foreground">{total}</strong>
                {total !== totalGeral && (
                  <span className="ml-1">(de {totalGeral} no total)</span>
                )}
              </span>
              {filtrosAtivos && (
                <button
                  onClick={limparFiltros}
                  className="hidden text-primary hover:underline sm:inline"
                >
                  Limpar filtros
                </button>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : total === 0 ? (
              <div className="rounded-xl border border-dashed border-border py-16 text-center">
                <Building2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                <h2 className="text-xl font-semibold text-foreground">
                  Nenhuma empresa encontrada
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Tente ajustar os filtros ou cadastrar a primeira nesta lista.
                </p>
                <div className="mt-4 flex justify-center gap-2">
                  {filtrosAtivos && (
                    <Button variant="outline" onClick={limparFiltros}>Limpar filtros</Button>
                  )}
                  <Button asChild>
                    <Link to="/cadastro">
                      Cadastrar empresa grátis
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
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
        </div>
      </div>
    </Layout>
  );
}
