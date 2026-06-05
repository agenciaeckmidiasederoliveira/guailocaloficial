import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, ArrowRight, Crown } from "lucide-react";
import { NIVEIS_PARCEIRO, type NivelParceiro } from "@/lib/constants";

interface RankingItem {
  id: string;
  nome: string;
  nivel: NivelParceiro;
  total_empresas: number;
  total_premium: number;
}

export function TopParceirosSection() {
  const [top, setTop] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (supabase.rpc as any)("get_parceiros_ranking").then(({ data }: { data: RankingItem[] | null }) => {
      setTop((data || []).slice(0, 3));
      setLoading(false);
    });
  }, []);

  if (loading || top.length === 0) return null;

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <section className="bg-muted/40 py-16 lg:py-20">
      <div className="container">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
            <Trophy className="h-3.5 w-3.5" /> Programa de Parceiros
          </div>
          <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
            Top 3 <span className="text-gradient">Parceiros</span> do Mês
          </h2>
          <p className="mt-3 text-muted-foreground">
            Os parceiros que mais cadastraram empresas no Guia Local BR. Ganhe sua medalha também!
          </p>
        </div>

        <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-3">
          {top.map((p, idx) => {
            const nivelInfo = NIVEIS_PARCEIRO[p.nivel] || NIVEIS_PARCEIRO.bronze;
            return (
              <Card
                key={p.id}
                className={`relative overflow-hidden transition-all hover-lift ${
                  idx === 0 ? "sm:scale-105 sm:shadow-elegant" : ""
                }`}
              >
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${nivelInfo.gradient}`} />
                <CardContent className="flex flex-col items-center gap-2 p-6 text-center">
                  <div className="text-4xl">{medals[idx]}</div>
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${nivelInfo.gradient} text-2xl shadow-md`}
                  >
                    {nivelInfo.emoji}
                  </div>
                  <p className="mt-1 truncate font-display text-lg font-bold text-foreground">{p.nome}</p>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${nivelInfo.bg} ${nivelInfo.color} ${nivelInfo.border}`}
                  >
                    {nivelInfo.label}
                  </span>
                  <div className="mt-3 flex items-center gap-3 text-sm">
                    <div>
                      <p className="text-2xl font-bold leading-none text-primary">{p.total_empresas}</p>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">empresas</p>
                    </div>
                    {p.total_premium > 0 && (
                      <div className="border-l border-border pl-3">
                        <p className="flex items-center gap-1 text-2xl font-bold leading-none text-amber-500">
                          <Crown className="h-4 w-4" />
                          {p.total_premium}
                        </p>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">premium</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button asChild variant="outline" size="lg">
            <Link to="/parceiros">
              Ver Ranking Completo
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white hover:opacity-90">
            <Link to="/parceiros#programa">
              Quero ser Parceiro
              <Trophy className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
