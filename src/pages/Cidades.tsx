import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useSEO } from "@/hooks/useSEO";
import { supabase } from "@/integrations/supabase/client";
import { toSlug } from "@/lib/slugify";
import { ESTADOS_BR } from "@/lib/constants";
import { MapPin, Loader2 } from "lucide-react";

interface CidadeAgrupada {
  nome: string;
  slug: string;
  estado: string;
  total: number;
}

export default function Cidades() {
  const [grupos, setGrupos] = useState<Record<string, CidadeAgrupada[]>>({});
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useSEO({
    title: "Cidades atendidas — Guia Local BR",
    description:
      "Encontre empresas em todas as cidades atendidas pelo Guia Local BR. Diretório local de negócios e serviços organizado por cidade e estado.",
    canonical: "https://www.guialocalbr.com.br/cidades",
  });

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("empresas")
        .select("cidade, estado")
        .eq("status", "aprovado")
        .limit(5000);

      const map = new Map<string, CidadeAgrupada>();
      for (const r of data ?? []) {
        const cidade = (r as any).cidade?.trim();
        const estado = (r as any).estado?.trim()?.toUpperCase();
        if (!cidade || !estado) continue;
        const slug = toSlug(cidade);
        const key = `${estado}|${slug}`;
        const prev = map.get(key);
        if (prev) prev.total++;
        else map.set(key, { nome: cidade, slug, estado, total: 1 });
      }
      const lista = Array.from(map.values()).sort((a, b) => b.total - a.total);
      const agrup: Record<string, CidadeAgrupada[]> = {};
      for (const c of lista) {
        (agrup[c.estado] ||= []).push(c);
      }
      setGrupos(agrup);
      setTotal(lista.length);
      setLoading(false);
    })();
  }, []);

  const estados = Object.keys(grupos).sort();
  const nomeEstado = (uf: string) =>
    ESTADOS_BR.find((e) => e.sigla === uf)?.nome ?? uf;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="border-b border-border bg-muted/30 py-12">
          <div className="container">
            <nav aria-label="breadcrumb" className="mb-3 text-xs text-muted-foreground">
              <Link to="/" className="hover:text-primary">Início</Link>
              <span className="mx-1.5">/</span>
              <span className="text-foreground">Cidades</span>
            </nav>
            <h1 className="font-display text-3xl font-bold md:text-4xl">
              Empresas por cidade no Brasil
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              {loading
                ? "Carregando cidades atendidas..."
                : `Navegue por cidade e descubra negócios locais. ${total} cidade${total !== 1 ? "s" : ""} com empresas cadastradas.`}
            </p>
          </div>
        </section>

        <section className="container py-10">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : estados.length === 0 ? (
            <p className="text-center text-muted-foreground">
              Nenhuma cidade com empresas cadastradas ainda.
            </p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {estados.map((uf) => (
                <div key={uf} className="rounded-lg border border-border bg-card p-5">
                  <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold text-primary">
                    <span className="rounded bg-primary/10 px-2 py-0.5 text-xs">{uf}</span>
                    {nomeEstado(uf)}
                  </h2>
                  <ul className="space-y-1.5">
                    {grupos[uf].map((c) => (
                      <li key={c.slug}>
                        <Link
                          to={`/cidades/${c.slug}`}
                          rel="dofollow"
                          className="group flex items-center justify-between gap-2 rounded px-2 py-1 text-sm hover:bg-muted"
                        >
                          <span className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
                            <span className="group-hover:text-primary">{c.nome}</span>
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {c.total} {c.total === 1 ? "empresa" : "empresas"}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
