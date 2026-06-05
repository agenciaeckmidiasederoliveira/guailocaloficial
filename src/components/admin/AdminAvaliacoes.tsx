import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Star, Loader2, Check, X, Trash2, MessageSquare, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface AvaliacaoAdmin {
  id: string;
  empresa_id: string;
  nota: number;
  comentario: string | null;
  nome_avaliador: string | null;
  aprovado: boolean;
  created_at: string;
  empresa?: { nome: string; slug: string | null } | null;
}

export function AdminAvaliacoes() {
  const { toast } = useToast();
  const [filtro, setFiltro] = useState<"todas" | "pendentes" | "reprovadas">("todas");
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoAdmin[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    setLoading(true);
    let q = supabase
      .from("avaliacoes")
      .select("id, empresa_id, nota, comentario, nome_avaliador, aprovado, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (filtro === "pendentes") q = q.eq("aprovado", true).is("nome_avaliador", null);
    if (filtro === "reprovadas") q = q.eq("aprovado", false);
    const { data } = await q;
    const rows = (data ?? []) as AvaliacaoAdmin[];

    // Junta nome das empresas (sem FK formal)
    const ids = [...new Set(rows.map((r) => r.empresa_id))];
    if (ids.length) {
      const { data: emps } = await supabase
        .from("empresas")
        .select("id, nome, slug")
        .in("id", ids);
      const map = new Map((emps ?? []).map((e: any) => [e.id, { nome: e.nome, slug: e.slug }]));
      for (const r of rows) r.empresa = map.get(r.empresa_id) ?? null;
    }
    setAvaliacoes(rows);
    setLoading(false);
  };

  useEffect(() => {
    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtro]);

  const setAprovado = async (id: string, aprovado: boolean) => {
    const { error } = await supabase.from("avaliacoes").update({ aprovado }).eq("id", id);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    setAvaliacoes((p) => p.map((a) => (a.id === id ? { ...a, aprovado } : a)));
    toast({ title: aprovado ? "Avaliação aprovada" : "Avaliação reprovada" });
  };

  const excluir = async (id: string) => {
    if (!confirm("Excluir esta avaliação permanentemente?")) return;
    const { error } = await supabase.from("avaliacoes").delete().eq("id", id);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    setAvaliacoes((p) => p.filter((a) => a.id !== id));
    toast({ title: "Avaliação excluída" });
  };

  const totalReprovadas = avaliacoes.filter((a) => !a.aprovado).length;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Moderação de avaliações</h1>
          <p className="text-sm text-muted-foreground">
            Aprove ou reprove avaliações enviadas pelos visitantes.
          </p>
        </div>
        <div className="flex gap-2">
          {(["todas", "reprovadas"] as const).map((f) => (
            <Button
              key={f}
              variant={filtro === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFiltro(f)}
            >
              {f === "todas" ? "Todas" : `Reprovadas (${totalReprovadas})`}
            </Button>
          ))}
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : avaliacoes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhuma avaliação encontrada.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {avaliacoes.map((a) => (
            <Card
              key={a.id}
              className={cn(!a.aprovado && "border-destructive/40 bg-destructive/5")}
            >
              <CardContent className="p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">
                        {a.nome_avaliador || "Anônimo"}
                      </span>
                      <Badge variant={a.aprovado ? "default" : "destructive"}>
                        {a.aprovado ? "Aprovada" : "Reprovada"}
                      </Badge>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={cn(
                              "h-3.5 w-3.5",
                              s <= a.nota
                                ? "fill-amber-400 text-amber-400"
                                : "text-muted-foreground/30",
                            )}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <MessageSquare className="h-3 w-3" />
                      {a.empresa ? (
                        <Link
                          to={`/empresa/${a.empresa.slug || a.empresa_id}`}
                          className="inline-flex items-center gap-1 hover:text-primary"
                          target="_blank"
                        >
                          {a.empresa.nome} <ExternalLink className="h-3 w-3" />
                        </Link>
                      ) : (
                        <span>empresa removida</span>
                      )}
                      <span>·</span>
                      <span>
                        {format(new Date(a.created_at), "d MMM yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    {a.comentario && (
                      <p className="mt-2 rounded-md bg-muted/30 p-2 text-sm text-foreground/80">
                        {a.comentario}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 md:flex-col">
                    {a.aprovado ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setAprovado(a.id, false)}
                      >
                        <X className="mr-1 h-4 w-4" /> Reprovar
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => setAprovado(a.id, true)}>
                        <Check className="mr-1 h-4 w-4" /> Aprovar
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => excluir(a.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
