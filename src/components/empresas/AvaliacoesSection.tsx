import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Loader2, MessageSquare, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Avaliacao {
  id: string;
  nota: number;
  comentario: string | null;
  nome_avaliador: string | null;
  user_id: string | null;
  created_at: string;
}

interface AvaliacoesSectionProps {
  empresaId: string;
}

const LS_PREFIX = "guia_aval_";
const COOLDOWN_DAYS = 7;

// Hook leve usado pelo EmpresaCard / outros componentes para média rápida
export function useAvaliacaoMedia(empresaId: string) {
  const [stats, setStats] = useState<{ media: number; total: number }>({ media: 0, total: 0 });
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("avaliacoes")
        .select("nota")
        .eq("empresa_id", empresaId)
        .eq("aprovado", true);
      if (cancelled || !data) return;
      if (data.length === 0) return setStats({ media: 0, total: 0 });
      const soma = data.reduce((acc, a: any) => acc + a.nota, 0);
      setStats({ media: soma / data.length, total: data.length });
    })();
    return () => {
      cancelled = true;
    };
  }, [empresaId]);
  return stats;
}

export function AvaliacoesSection({ empresaId }: AvaliacoesSectionProps) {
  const { toast } = useToast();
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [nome, setNome] = useState("");
  const [nota, setNota] = useState(0);
  const [hoverNota, setHoverNota] = useState(0);
  const [comentario, setComentario] = useState("");
  const [bloqueado, setBloqueado] = useState(false);

  const lsKey = `${LS_PREFIX}${empresaId}`;

  useEffect(() => {
    const ts = localStorage.getItem(lsKey);
    if (ts) {
      const dias = (Date.now() - Number(ts)) / (1000 * 60 * 60 * 24);
      if (dias < COOLDOWN_DAYS) setBloqueado(true);
    }
    fetchAvaliacoes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId]);

  const fetchAvaliacoes = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("avaliacoes")
      .select("id, nota, comentario, nome_avaliador, user_id, created_at")
      .eq("empresa_id", empresaId)
      .eq("aprovado", true)
      .order("created_at", { ascending: false });
    setAvaliacoes((data ?? []) as Avaliacao[]);
    setLoading(false);
  };

  const { media, total, distribuicao } = useMemo(() => {
    const dist = [0, 0, 0, 0, 0];
    let soma = 0;
    for (const a of avaliacoes) {
      dist[a.nota - 1] = (dist[a.nota - 1] ?? 0) + 1;
      soma += a.nota;
    }
    return {
      media: avaliacoes.length ? soma / avaliacoes.length : 0,
      total: avaliacoes.length,
      distribuicao: dist, // index 0 = 1 estrela
    };
  }, [avaliacoes]);

  const handleSubmit = async () => {
    if (bloqueado) {
      toast({ title: "Você já avaliou esta empresa recentemente.", variant: "destructive" });
      return;
    }
    const nomeTrim = nome.trim();
    if (nomeTrim.length < 2) {
      toast({ title: "Informe seu nome", description: "Mínimo de 2 caracteres.", variant: "destructive" });
      return;
    }
    if (nota === 0) {
      toast({ title: "Selecione uma nota", description: "Clique nas estrelas para avaliar.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("avaliacoes").insert({
      empresa_id: empresaId,
      user_id: null,
      nome_avaliador: nomeTrim.slice(0, 80),
      nota,
      comentario: comentario.trim() ? comentario.trim().slice(0, 500) : null,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Erro ao enviar avaliação", description: error.message, variant: "destructive" });
      return;
    }
    localStorage.setItem(lsKey, String(Date.now()));
    setBloqueado(true);
    setNome("");
    setNota(0);
    setComentario("");
    toast({ title: "Avaliação enviada!", description: "Obrigado pelo seu feedback." });
    fetchAvaliacoes();
  };

  const visiveis = showAll ? avaliacoes : avaliacoes.slice(0, 5);

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h2 className="font-display text-2xl font-bold">Avaliações</h2>
      </div>

      {/* Resumo */}
      <Card>
        <CardContent className="p-6">
          {total === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ainda não há avaliações. Seja o primeiro a avaliar!
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-[auto,1fr] sm:items-center">
              <div className="text-center">
                <div className="text-5xl font-bold text-foreground">{media.toFixed(1)}</div>
                <div className="mt-1 flex justify-center">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={cn(
                        "h-4 w-4",
                        s <= Math.round(media)
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground/30",
                      )}
                    />
                  ))}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {total} avaliaç{total === 1 ? "ão" : "ões"}
                </div>
              </div>
              <div className="space-y-1.5">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = distribuicao[star - 1] ?? 0;
                  const pct = total > 0 ? (count / total) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-2 text-xs">
                      <span className="w-6 text-muted-foreground">{star}★</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div className="h-full bg-amber-400" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-6 text-right text-muted-foreground">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form */}
      <Card>
        <CardContent className="p-6">
          {bloqueado ? (
            <div className="flex items-center gap-2 rounded-md border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Você já avaliou esta empresa recentemente. Volte em {COOLDOWN_DAYS} dias.
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-semibold">Deixe sua avaliação</h3>
              <Input
                placeholder="Seu nome"
                value={nome}
                onChange={(e) => setNome(e.target.value.slice(0, 80))}
                maxLength={80}
              />
              <div>
                <p className="mb-1.5 text-sm text-muted-foreground">Sua nota:</p>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => {
                    const active = (hoverNota || nota) >= s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onMouseEnter={() => setHoverNota(s)}
                        onMouseLeave={() => setHoverNota(0)}
                        onClick={() => setNota(s)}
                        aria-label={`Dar ${s} estrela${s > 1 ? "s" : ""}`}
                        className="p-0.5 transition-transform hover:scale-110"
                      >
                        <Star
                          className={cn(
                            "h-8 w-8 transition-colors",
                            active
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground/40",
                          )}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <Textarea
                  placeholder="Conte como foi sua experiência (opcional)"
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value.slice(0, 500))}
                  rows={3}
                  maxLength={500}
                />
                <div className="mt-1 text-right text-xs text-muted-foreground">
                  {comentario.length}/500
                </div>
              </div>
              <Button onClick={handleSubmit} disabled={submitting} className="w-full sm:w-auto">
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...
                  </>
                ) : (
                  "Enviar avaliação"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-3">
          {visiveis.map((a) => (
            <Card key={a.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-foreground">
                      {a.nome_avaliador || "Anônimo"}
                    </div>
                    <div className="mt-0.5 flex">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={cn(
                            "h-3.5 w-3.5",
                            s <= a.nota ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30",
                          )}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(a.created_at), "d 'de' MMM 'de' yyyy", { locale: ptBR })}
                  </span>
                </div>
                {a.comentario && (
                  <p className="mt-2 text-sm text-foreground/80">{a.comentario}</p>
                )}
              </CardContent>
            </Card>
          ))}
          {avaliacoes.length > 5 && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setShowAll((v) => !v)}
            >
              {showAll ? "Mostrar menos" : `Ver todas as ${avaliacoes.length} avaliações`}
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
