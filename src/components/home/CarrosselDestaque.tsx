import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Destaque {
  id: string;
  empresa_id: string;
  tipo: "carrossel_top" | "avaliacao_destaque";
  texto_destaque: string;
  nota?: number;
  autor?: string;
  empresa: {
    nome: string;
    slug: string | null;
    foto_principal: string | null;
    cidade: string;
    estado: string;
  };
}

export function CarrosselDestaque() {
  const [destaques, setDestaques] = useState<Destaque[]>([]);

  useEffect(() => {
    fetchDestaques();
  }, []);

  const fetchDestaques = async () => {
    // Busca destaques oficiais
    const { data } = await supabase
      .from("empresa_destaques")
      .select(`
        id, empresa_id, tipo, texto_destaque, nota, autor,
        empresa:empresas (nome, slug, foto_principal, cidade, estado)
      `)
      .eq("ativo", true)
      .limit(5);

    if (data && data.length > 0) {
      setDestaques(data as unknown as Destaque[]);
    } else {
      // Fallback para avaliações reais
      const { data: avaliacoes } = await supabase
        .from("avaliacoes")
        .select(`
          id, empresa_id, nota, comentario, nome_avaliador,
          empresa:empresas (nome, slug, foto_principal, cidade, estado)
        `)
        .eq("aprovado", true)
        .gte("nota", 4)
        .limit(5);

      if (avaliacoes) {
        const fallbacks = avaliacoes.map((a: any) => ({
          id: a.id,
          empresa_id: a.empresa_id,
          tipo: "avaliacao_destaque",
          texto_destaque: a.comentario || "Excelente empresa!",
          nota: a.nota,
          autor: a.nome_avaliador,
          empresa: Array.isArray(a.empresa) ? a.empresa[0] : a.empresa,
        }));
        setDestaques(fallbacks as Destaque[]);
      }
    }
  };

  if (destaques.length === 0) return null;

  return (
    <section className="bg-primary/5 py-12">
      <div className="container">
        <h2 className="mb-8 text-center font-display text-2xl font-bold md:text-3xl">
          Destaques e <span className="text-primary">Avaliações</span>
        </h2>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {destaques.map((d) => (
            <div key={d.id} className="relative flex flex-col justify-between rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md">
              <div>
                <div className="mb-4 flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < (d.nota || 5)
                          ? "fill-amber-400 text-amber-400"
                          : "fill-muted text-muted"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm italic text-muted-foreground">"{d.texto_destaque}"</p>
                {d.autor && <p className="mt-2 text-xs font-semibold text-foreground">— {d.autor}</p>}
              </div>
              
              <div className="mt-6 flex items-center gap-4 border-t pt-4">
                <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-muted">
                  {d.empresa?.foto_principal ? (
                    <img src={d.empresa.foto_principal} alt={d.empresa.nome} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-primary/10 text-primary font-bold">
                      {d.empresa?.nome?.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-semibold text-sm">{d.empresa?.nome}</p>
                  <p className="truncate text-xs text-muted-foreground">{d.empresa?.cidade}, {d.empresa?.estado}</p>
                </div>
                <Button variant="ghost" size="icon" asChild className="h-8 w-8 rounded-full">
                  <Link to={`/empresa/${d.empresa?.slug || d.empresa_id}`}>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
