import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useSEO } from "@/hooks/useSEO";
import { NICHOS } from "@/lib/constants";
import { Search } from "lucide-react";

export default function Categorias() {
  useSEO({
    title: "Categorias de empresas — Guia Local BR",
    description:
      "Explore todas as categorias de empresas do Guia Local BR. Encontre serviços e negócios locais por segmento em todo o Brasil.",
    canonical: "https://www.guialocalbr.com.br/categorias",
  });

  // Agrupa por inicial para facilitar leitura
  const grupos = NICHOS.reduce<Record<string, string[]>>((acc, n) => {
    const letra = n[0].toUpperCase();
    (acc[letra] ||= []).push(n);
    return acc;
  }, {});
  const letras = Object.keys(grupos).sort();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="border-b border-border bg-muted/30 py-12">
          <div className="container">
            <nav aria-label="breadcrumb" className="mb-3 text-xs text-muted-foreground">
              <Link to="/" className="hover:text-primary">Início</Link>
              <span className="mx-1.5">/</span>
              <span className="text-foreground">Categorias</span>
            </nav>
            <h1 className="font-display text-3xl font-bold md:text-4xl">
              Todas as categorias de empresas
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Encontre empresas e profissionais locais navegando por segmento. {NICHOS.length} categorias disponíveis.
            </p>
          </div>
        </section>

        <section className="container py-10">
          <div className="space-y-8">
            {letras.map((l) => (
              <div key={l}>
                <h2 className="mb-3 font-display text-xl font-bold text-primary">{l}</h2>
                <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {grupos[l].map((n) => (
                    <li key={n}>
                      <Link
                        to={`/busca?categoria=${encodeURIComponent(n)}`}
                        rel="dofollow"
                        className="group flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm transition-colors hover:border-primary hover:bg-primary/5"
                      >
                        <Search className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
                        <span className="text-foreground group-hover:text-primary">{n}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
