import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Loader2, Crown } from "lucide-react";
import { NIVEIS_PARCEIRO, type NivelParceiro } from "@/lib/constants";

interface RankingItem {
  id: string;
  nome: string;
  nivel: NivelParceiro;
  total_empresas: number;
  total_premium: number;
}

export function RankingParceiros({ highlightId }: { highlightId?: string }) {
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase.rpc("get_parceiros_ranking" as never);
      if (!error && data) {
        setRanking(data as unknown as RankingItem[]);
      }
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (ranking.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          Ranking de Parceiros
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {ranking.map((p, idx) => {
            const nivelInfo = NIVEIS_PARCEIRO[p.nivel] || NIVEIS_PARCEIRO.bronze;
            const isMe = highlightId === p.id;
            const medalha = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`;
            return (
              <div
                key={p.id}
                className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                  isMe ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center text-base font-bold">
                  {medalha}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">
                      {p.nome}
                      {isMe && <span className="ml-2 text-xs text-primary">(você)</span>}
                    </p>
                  </div>
                  <span
                    className={`mt-0.5 inline-flex items-center gap-1 rounded-full border px-1.5 py-0 text-[10px] font-medium ${nivelInfo.bg} ${nivelInfo.color} ${nivelInfo.border}`}
                  >
                    {nivelInfo.emoji} {nivelInfo.label}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold leading-none">{p.total_empresas}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {p.total_premium > 0 && (
                      <span className="inline-flex items-center gap-0.5">
                        <Crown className="h-2.5 w-2.5 text-amber-500" />
                        {p.total_premium}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
