import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, TrendingUp, Link2, Crown, Eye } from "lucide-react";

interface EmpresaSEO {
  id: string;
  nome: string;
  slug: string | null;
  cidade: string;
  estado: string;
  plano: string;
  link_type: string;
  site: string | null;
  views: number;
}

export function AdminSEO() {
  const [empresas, setEmpresas] = useState<EmpresaSEO[]>([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({
    aprovadas: 0,
    premium: 0,
    dofollow: 0,
    comSite: 0,
  });

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);

    // Empresas aprovadas
    const { data: emp } = await supabase
      .from("empresas")
      .select("id, nome, slug, cidade, estado, plano, link_type, site")
      .eq("status", "aprovado")
      .order("criado_em", { ascending: false });

    const list = emp ?? [];

    // Views via analytics (page_view por empresa_id)
    const { data: views } = await supabase
      .from("analytics")
      .select("empresa_id")
      .eq("tipo_evento", "page_view")
      .not("empresa_id", "is", null)
      .limit(10000);

    const viewMap = new Map<string, number>();
    for (const v of views ?? []) {
      const id = (v as any).empresa_id as string;
      viewMap.set(id, (viewMap.get(id) ?? 0) + 1);
    }

    const enriched: EmpresaSEO[] = list.map((e: any) => ({
      ...e,
      views: viewMap.get(e.id) ?? 0,
    }));
    enriched.sort((a, b) => b.views - a.views);

    setEmpresas(enriched);
    setTotals({
      aprovadas: enriched.length,
      premium: enriched.filter((e) => e.plano === "premium").length,
      dofollow: enriched.filter((e) => e.link_type === "dofollow" && e.site).length,
      comSite: enriched.filter((e) => !!e.site).length,
    });
    setLoading(false);
  }

  const top = empresas.slice(0, 25);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Painel SEO</h1>
        <p className="text-sm text-muted-foreground">
          Ranking de empresas, backlinks dofollow ativos e cobertura SEO.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPI icon={Eye} label="Empresas aprovadas" value={totals.aprovadas} color="text-blue-600" />
        <KPI icon={Crown} label="Premium" value={totals.premium} color="text-amber-600" />
        <KPI icon={Link2} label="Backlinks dofollow ativos" value={totals.dofollow} color="text-emerald-600" />
        <KPI icon={ExternalLink} label="Com site externo" value={totals.comSite} color="text-violet-600" />
      </div>

      {/* Ranking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4" /> Top 25 empresas por visualizações
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Carregando…</div>
          ) : top.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Sem dados ainda.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-2">#</th>
                    <th className="py-2 pr-2">Empresa</th>
                    <th className="py-2 pr-2">Cidade</th>
                    <th className="py-2 pr-2">Plano</th>
                    <th className="py-2 pr-2">Link</th>
                    <th className="py-2 pr-2 text-right">Views</th>
                    <th className="py-2 pr-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {top.map((e, i) => (
                    <tr key={e.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-2 pr-2 text-muted-foreground">{i + 1}</td>
                      <td className="py-2 pr-2 font-medium">{e.nome}</td>
                      <td className="py-2 pr-2 text-muted-foreground">
                        {e.cidade}/{e.estado}
                      </td>
                      <td className="py-2 pr-2">
                        <Badge variant={e.plano === "premium" ? "default" : "secondary"}>
                          {e.plano}
                        </Badge>
                      </td>
                      <td className="py-2 pr-2">
                        {e.site ? (
                          <Badge
                            variant={e.link_type === "dofollow" ? "default" : "outline"}
                            className={
                              e.link_type === "dofollow"
                                ? "bg-emerald-600 hover:bg-emerald-700"
                                : ""
                            }
                          >
                            {e.link_type}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-2 pr-2 text-right font-semibold">{e.views}</td>
                      <td className="py-2 pr-2">
                        {e.slug && (
                          <Button asChild size="sm" variant="ghost" className="h-7 px-2">
                            <Link to={`/empresa/${e.slug}`} target="_blank">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function KPI({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`rounded-lg bg-muted p-2 ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-2xl font-bold">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
