import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  categoria?: string | null;
  cidade?: string | null;
  excluirEmpresaId?: string | null;
}

interface EmpresaRel {
  id: string;
  nome: string;
  cidade: string;
  estado: string;
  slug: string | null;
  foto_principal: string | null;
  nicho: string | null;
  plano: string;
}

export function EmpresasRelacionadas({ categoria, cidade, excluirEmpresaId }: Props) {
  const [empresas, setEmpresas] = useState<EmpresaRel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      const base = () =>
        supabase
          .from("empresas")
          .select("id, nome, cidade, estado, slug, foto_principal, nicho, plano")
          .eq("status", "aprovado")
          .order("plano", { ascending: false })
          .limit(6);

      const exclude = (rows: EmpresaRel[]) =>
        excluirEmpresaId ? rows.filter((r) => r.id !== excluirEmpresaId) : rows;

      let result: EmpresaRel[] = [];

      if (categoria && cidade) {
        const { data } = await base().eq("nicho", categoria).eq("cidade", cidade);
        result = exclude((data || []) as EmpresaRel[]);
      }
      if (result.length < 3 && categoria) {
        const { data } = await base().eq("nicho", categoria);
        const more = exclude((data || []) as EmpresaRel[]);
        result = [...result, ...more.filter((m) => !result.find((r) => r.id === m.id))].slice(0, 6);
      }
      if (result.length < 3 && cidade) {
        const { data } = await base().eq("cidade", cidade);
        const more = exclude((data || []) as EmpresaRel[]);
        result = [...result, ...more.filter((m) => !result.find((r) => r.id === m.id))].slice(0, 6);
      }
      if (!cancelled) {
        setEmpresas(result);
        setLoading(false);
      }
    };
    fetch();
    return () => {
      cancelled = true;
    };
  }, [categoria, cidade, excluirEmpresaId]);

  if (loading) {
    return <div className="my-8 h-40 animate-pulse rounded-lg bg-muted" />;
  }
  if (empresas.length === 0) return null;

  return (
    <section className="my-10 rounded-xl border border-border bg-card p-6">
      <h2 className="font-display text-xl font-bold">Empresas relacionadas</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Conheça outros negócios{categoria ? ` de ${categoria}` : ""}{cidade ? ` em ${cidade}` : ""} no Guia Local BR
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {empresas.map((e) => (
          <Link
            key={e.id}
            to={`/empresa/${e.slug || e.id}`}
            rel="dofollow"
            className="group flex gap-3 rounded-lg border border-border bg-background p-3 transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
              {e.foto_principal ? (
                <img
                  src={e.foto_principal}
                  alt={e.nome}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  width={64}
                  height={64}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs font-bold text-muted-foreground">
                  {e.nome.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <h3 className="line-clamp-1 font-semibold leading-tight group-hover:text-primary">
                  {e.nome}
                </h3>
                {e.plano === "premium" && (
                  <Badge className="shrink-0 bg-amber-500 text-[10px] hover:bg-amber-600">PRO</Badge>
                )}
              </div>
              {e.nicho && <p className="text-xs text-muted-foreground">{e.nicho}</p>}
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" /> {e.cidade} - {e.estado}
              </p>
              <span className="mt-1 inline-block text-xs font-medium text-primary group-hover:underline">
                Ver perfil →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
