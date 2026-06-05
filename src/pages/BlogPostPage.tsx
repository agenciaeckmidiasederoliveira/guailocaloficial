import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Calendar, MapPin, Phone, Globe, MessageCircle, ChevronRight } from "lucide-react";
import { useBlogPostBySlug } from "@/hooks/useBlog";
import { BlogPlaceholder } from "@/components/blog/BlogPlaceholder";
import { EmpresasRelacionadas } from "@/components/blog/EmpresasRelacionadas";
import { useSEO } from "@/hooks/useSEO";

export default function BlogPostPage({ tipo }: { tipo: "empresa" | "artigo" }) {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading } = useBlogPostBySlug(slug);

  useSEO({
    title: post?.seo_title || post?.titulo,
    description: post?.seo_description || post?.resumo || undefined,
    canonical: `https://www.guialocalbr.com.br/blog/${tipo === "empresa" ? "empresas" : "artigos"}/${slug}`,
  });

  // Inject JSON-LD
  useEffect(() => {
    if (!post?.schema_json) return;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(post.schema_json);
    script.id = "blog-post-jsonld";
    document.head.appendChild(script);
    return () => {
      const ex = document.getElementById("blog-post-jsonld");
      if (ex) ex.remove();
    };
  }, [post?.schema_json]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="container flex-1 py-10">
          <div className="h-96 animate-pulse rounded-lg bg-muted" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="container flex flex-1 flex-col items-center justify-center py-20 text-center">
          <h1 className="font-display text-3xl font-bold">Artigo não encontrado</h1>
          <Button asChild className="mt-4">
            <Link to="/blog">Voltar ao Blog</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const whatsappLink = post.empresa_whatsapp
    ? `https://wa.me/55${post.empresa_whatsapp.replace(/\D/g, "")}`
    : null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="border-b border-border bg-muted/30">
          <nav className="container flex items-center gap-1 py-3 text-sm text-muted-foreground">
            <Link to="/blog" className="hover:text-primary">Blog</Link>
            <ChevronRight className="h-3 w-3" />
            <Link to="/blog" className="hover:text-primary">
              {post.tipo === "empresa" ? "Empresas" : "Artigos"}
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="line-clamp-1 text-foreground">{post.titulo}</span>
          </nav>
        </div>

        {/* Hero */}
        <header className="container max-w-5xl py-8 md:py-12">
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <Badge variant={post.tipo === "empresa" ? "default" : "secondary"}>
              {post.tipo === "empresa" ? "Empresa" : "Artigo"}
            </Badge>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {post.tempo_leitura} min</span>
            {post.publicado_em && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(post.publicado_em).toLocaleDateString("pt-BR")}
              </span>
            )}
          </div>
          <h1 className="mt-4 font-display text-3xl font-bold leading-tight text-foreground md:text-5xl">
            {post.titulo}
          </h1>
          {post.subtitulo && (
            <p className="mt-3 text-lg text-muted-foreground md:text-xl">{post.subtitulo}</p>
          )}
          {(post.tags || []).length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {post.tags.map((t, i) => (
                <span key={i} className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">{t}</span>
              ))}
            </div>
          )}
        </header>

        {/* Conteúdo + sidebar */}
        <section className="container grid max-w-6xl gap-8 pb-12 md:grid-cols-3">
          <article className="md:col-span-2">
            <div
              className="prose-blog"
              dangerouslySetInnerHTML={{ __html: post.conteudo }}
            />

            {/* Empresas relacionadas — links internos dofollow para SEO */}
            <EmpresasRelacionadas
              categoria={post.empresa_categoria}
              cidade={post.empresa_cidade}
              excluirEmpresaId={post.empresa_id}
            />
          </article>

          <aside className="md:col-span-1">
            <div className="sticky top-20 space-y-4">
              {post.tipo === "empresa" && post.empresa_nome ? (
                <div className="overflow-hidden rounded-lg border border-border bg-card">
                  <BlogPlaceholder
                    categoria={post.empresa_categoria}
                    nome={post.empresa_nome}
                    fotoUrl={post.empresa_foto_url}
                    altura="h-40"
                  />
                  <div className="space-y-3 p-4">
                    <h3 className="font-display text-lg font-bold">{post.empresa_nome}</h3>
                    {post.empresa_categoria && (
                      <Badge variant="outline">{post.empresa_categoria}</Badge>
                    )}
                    {post.empresa_endereco && (
                      <p className="flex items-start gap-2 text-sm text-muted-foreground">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{post.empresa_endereco}{post.empresa_cidade ? `, ${post.empresa_cidade}` : ""}</span>
                      </p>
                    )}
                    {post.empresa_telefone && (
                      <a href={`tel:${post.empresa_telefone}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
                        <Phone className="h-4 w-4" /> {post.empresa_telefone}
                      </a>
                    )}
                    {whatsappLink && (
                      <Button asChild variant="default" className="w-full bg-green-600 hover:bg-green-700">
                        <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                          <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
                        </a>
                      </Button>
                    )}
                    {post.empresa_site && (
                      <Button asChild variant="outline" className="w-full">
                        <a href={post.empresa_site} target="_blank" rel="noopener noreferrer">
                          <Globe className="mr-2 h-4 w-4" /> Site
                        </a>
                      </Button>
                    )}
                    {post.empresa_id && (
                      <Button asChild className="w-full">
                        <Link to={`/empresa/${post.empresa_id}`}>Ver perfil no Guia Local</Link>
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-border bg-card p-5">
                  <h3 className="font-display text-lg font-bold">Sobre o Guia Local BR</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Diretório de empresas locais que ajuda negócios a aparecerem no Google e a atraírem mais clientes.
                  </p>
                  <Button asChild className="mt-4 w-full">
                    <Link to="/cadastro">Cadastrar minha empresa</Link>
                  </Button>
                </div>
              )}
            </div>
          </aside>
        </section>

        {/* CTA final */}
        <section className="border-t border-border bg-muted/30 py-10">
          <div className="container text-center">
            <p className="text-lg">Gostou deste conteúdo? Conheça todas as empresas do Guia Local BR</p>
            <Button asChild size="lg" className="mt-4">
              <Link to="/">Explorar empresas</Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
