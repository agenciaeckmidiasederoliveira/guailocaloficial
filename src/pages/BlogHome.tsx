import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Calendar, ArrowRight } from "lucide-react";
import { useBlogPostsPublicos } from "@/hooks/useBlog";
import { BlogPlaceholder } from "@/components/blog/BlogPlaceholder";
import { useSEO } from "@/hooks/useSEO";
import { NICHOS } from "@/lib/constants";

const FILTROS = [
  { id: "todos", label: "Todos" },
  { id: "empresa", label: "Empresas" },
  { id: "artigo", label: "Artigos" },
];

export default function BlogHome() {
  useSEO({
    title: "Blog - Conteúdo para negócios locais",
    description: "Dicas, guias e histórias de empresas. SEO local, Google Meu Negócio, marketing digital e empreendedorismo.",
    canonical: "https://www.guialocalbr.com.br/blog",
  });

  const [filtro, setFiltro] = useState<string>("todos");
  const { data: posts = [], isLoading } = useBlogPostsPublicos();

  const filtrados = useMemo(() => {
    if (filtro === "todos") return posts;
    return posts.filter((p) => p.tipo === filtro);
  }, [filtro, posts]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-border bg-muted/30 py-12 md:py-16">
          <div className="container">
            <h1 className="font-display text-3xl font-bold text-foreground md:text-5xl">
              Conteúdo que ajuda negócios locais a crescerem
            </h1>
            <p className="mt-3 max-w-2xl text-base text-muted-foreground md:text-lg">
              Dicas, guias e histórias de empresas da sua região
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {FILTROS.map((f) => (
                <Button
                  key={f.id}
                  variant={filtro === f.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFiltro(f.id)}
                >
                  {f.label}
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* Grid + Sidebar SEO */}
        <section className="container grid gap-8 py-10 lg:grid-cols-[1fr_280px]">
          <div>
            {isLoading && (
              <div className="grid gap-6 sm:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-80 animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
            )}

            {!isLoading && filtrados.length === 0 && (
              <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
                <p className="text-muted-foreground">Nenhum artigo publicado ainda.</p>
              </div>
            )}

            <div className="grid gap-6 sm:grid-cols-2">
              {filtrados.map((p) => (
                <Link
                  key={p.id}
                  to={`/blog/${p.tipo === "empresa" ? "empresas" : "artigos"}/${p.slug}`}
                  className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-all hover:-translate-y-1 hover:shadow-lg"
                >
                  <BlogPlaceholder
                    categoria={p.empresa_categoria}
                    nome={p.empresa_nome || p.titulo}
                    fotoUrl={p.empresa_foto_url}
                    altura="h-44"
                  />
                  <div className="flex flex-1 flex-col gap-3 p-5">
                    <div className="flex items-center gap-2">
                      <Badge variant={p.tipo === "empresa" ? "default" : "secondary"}>
                        {p.tipo === "empresa" ? "Empresa" : "Artigo"}
                      </Badge>
                      {p.empresa_cidade && (
                        <span className="text-xs text-muted-foreground">{p.empresa_cidade}</span>
                      )}
                    </div>
                    <h2 className="font-display text-lg font-semibold leading-tight text-foreground group-hover:text-primary">
                      {p.titulo}
                    </h2>
                    {p.resumo && (
                      <p className="line-clamp-2 text-sm text-muted-foreground">{p.resumo}</p>
                    )}
                    <div className="mt-auto flex flex-wrap gap-1">
                      {(p.tags || []).slice(0, 3).map((t, i) => (
                        <span key={i} className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                          {t}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {p.tempo_leitura} min
                      </span>
                      {p.publicado_em && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(p.publicado_em).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Sidebar — distribui autoridade do blog para o diretório (SEO interno) */}
          <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
            <div className="rounded-lg border border-border bg-card p-5">
              <h3 className="font-display text-base font-bold">Categorias de negócios</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Explore empresas por segmento no diretório
              </p>
              <ul className="mt-4 flex flex-wrap gap-1.5">
                {NICHOS.slice(0, 30).map((n) => (
                  <li key={n}>
                    <Link
                      to={`/busca?categoria=${encodeURIComponent(n)}`}
                      rel="dofollow"
                      className="inline-block rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                    >
                      {n}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                to="/categorias"
                rel="dofollow"
                className="mt-4 inline-block text-xs font-semibold text-primary hover:underline"
              >
                Ver todas as categorias →
              </Link>
            </div>

            <div className="rounded-lg border border-emerald-500/30 bg-emerald-50/50 p-5 dark:bg-emerald-950/20">
              <h3 className="font-display text-base font-bold text-emerald-700 dark:text-emerald-300">
                Apareça aqui
              </h3>
              <p className="mt-2 text-xs text-muted-foreground">
                Cadastre sua empresa e ganhe presença orgânica no Google
              </p>
              <Button asChild size="sm" className="mt-3 w-full">
                <Link to="/cadastro">Cadastrar empresa</Link>
              </Button>
            </div>
          </aside>
        </section>

        {/* CTA */}
        <section className="border-t border-border bg-muted/30 py-12">
          <div className="container text-center">
            <h2 className="font-display text-2xl font-bold">Quer que sua empresa apareça aqui?</h2>
            <p className="mt-2 text-muted-foreground">
              Cadastre seu negócio no Guia Local BR e ganhe visibilidade orgânica
            </p>
            <Button asChild size="lg" className="mt-5">
              <Link to="/cadastro">
                Cadastrar minha empresa <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
