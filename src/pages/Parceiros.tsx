import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { NIVEIS_PARCEIRO, type NivelParceiro, WHATSAPP_SUPPORT_LINK } from "@/lib/constants";
import { useSEO } from "@/hooks/useSEO";
import { Trophy, Crown, Loader2, Award, MessageCircle } from "lucide-react";

interface RankingItem {
  id: string;
  nome: string;
  nivel: NivelParceiro;
  total_empresas: number;
  total_premium: number;
}

export default function Parceiros() {
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useSEO({
    title: "Parceiros — Ranking de quem mais cadastra empresas",
    description:
      "Conheça os parceiros do Guia Local BR. Ranking dos profissionais que mais conectam negócios locais à nossa plataforma. Junte-se ao programa.",
    canonical: "https://guialocalbr.com.br/parceiros",
  });

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

  return (
    <Layout>
      <div className="bg-gradient-hero py-12 text-primary-foreground">
        <div className="container">
          <div className="flex items-center gap-3">
            <Trophy className="h-9 w-9 text-amber-300" />
            <div>
              <h1 className="font-display text-3xl font-bold md:text-4xl">
                Ranking de Parceiros
              </h1>
              <p className="mt-1 text-primary-foreground/80">
                Profissionais que conectam empresas locais ao Guia Local BR
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8 space-y-8">
        {/* Levels explanation */}
        <Card>
          <CardContent className="p-5">
            <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold">
              <Award className="h-5 w-5 text-primary" />
              Níveis do Programa
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {(Object.keys(NIVEIS_PARCEIRO) as NivelParceiro[]).map((key) => {
                const n = NIVEIS_PARCEIRO[key];
                return (
                  <div
                    key={key}
                    className={`flex items-center gap-3 rounded-lg border p-3 ${n.bg} ${n.border}`}
                  >
                    <span className="text-2xl">{n.emoji}</span>
                    <div>
                      <p className={`font-semibold ${n.color}`}>{n.label}</p>
                      <p className="text-xs text-muted-foreground">
                        Cota: {n.cotaPremium} Premium
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Ranking */}
        <Card>
          <CardContent className="p-5">
            <h2 className="mb-4 font-display text-lg font-semibold">
              Top Parceiros
            </h2>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : ranking.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Nenhum parceiro com empresas aprovadas ainda. Seja o primeiro!
              </p>
            ) : (
              <div className="space-y-2">
                {ranking.map((p, idx) => {
                  const nivelInfo = NIVEIS_PARCEIRO[p.nivel] || NIVEIS_PARCEIRO.bronze;
                  const medalha =
                    idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`;
                  return (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center text-lg font-bold">
                        {medalha}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{p.nome}</p>
                        <span
                          className={`mt-0.5 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${nivelInfo.bg} ${nivelInfo.color} ${nivelInfo.border}`}
                        >
                          {nivelInfo.emoji} {nivelInfo.label}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold leading-none">{p.total_empresas}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          empresas
                        </p>
                        {p.total_premium > 0 && (
                          <p className="mt-1 inline-flex items-center gap-0.5 text-[11px] text-amber-600">
                            <Crown className="h-3 w-3" />
                            {p.total_premium} premium
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* CTA */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-6 text-center">
            <h2 className="font-display text-xl font-bold">
              Quer ser um Parceiro?
            </h2>
            <p className="mt-2 text-muted-foreground">
              Cadastre empresas, ganhe reputação e suba de nível.
              Solicite seu convite pelo WhatsApp.
            </p>
            <Button asChild className="mt-4">
              <a href={WHATSAPP_SUPPORT_LINK} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-4 w-4" />
                Quero ser parceiro
              </a>
            </Button>
            <p className="mt-3 text-xs text-muted-foreground">
              <Link to="/sobre" className="hover:underline">
                Conheça mais sobre o Guia Local BR
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
