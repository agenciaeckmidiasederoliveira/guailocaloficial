import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useSEO } from "@/hooks/useSEO";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Eye,
  MousePointer,
  Phone,
  Globe,
  Percent,
  TrendingUp,
  Loader2,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";

interface Empresa {
  id: string;
  nome: string;
  slug: string | null;
  cidade: string;
  estado: string;
  plano: string | null;
  status: string | null;
}

interface DailyPoint {
  date: string;
  views: number;
  whatsapp: number;
  telefone: number;
  site: number;
}

interface EmpresaStats {
  views: number;
  whatsapp: number;
  telefone: number;
  site: number;
  total_cliques: number;
  taxa_conversao: number;
  chart: DailyPoint[];
}

const PERIODS = [
  { value: "7", label: "Últimos 7 dias" },
  { value: "30", label: "Últimos 30 dias" },
  { value: "90", label: "Últimos 90 dias" },
];

export default function MinhasEstatisticas() {
  const { user, loading: authLoading } = useAuth();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [period, setPeriod] = useState<string>("30");
  const [stats, setStats] = useState<EmpresaStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const [resumoGeral, setResumoGeral] = useState<{
    views: number;
    whatsapp: number;
    telefone: number;
    site: number;
  } | null>(null);


  useSEO({
    title: "Minhas Estatísticas — Guia Local BR",
    description: "Acompanhe o desempenho das suas empresas: visualizações, cliques no WhatsApp, telefone e site.",
  });

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("empresas")
        .select(`
          id, 
          nome, 
          slug, 
          plano, 
          ativa,
          cidades!inner(nome, estado_uf)
        `)
        .eq("profile_id", user.id)
        .order("criado_em", { ascending: false });

      // Transform data to match UI expectations
      const list = (data || []).map((e: any) => ({
        id: e.id,
        nome: e.nome,
        slug: e.slug,
        cidade: e.cidades?.nome || "Cidade Desconhecida",
        estado: e.cidades?.estado_uf || "UF",
        plano: e.plano,
        status: e.ativa ? "aprovado" : "pendente"
      }));

      setEmpresas(list);
      if (list.length > 0) setSelectedId(list[0].id);

      // Resumo geral agregando TODAS as empresas do usuário
      if (list.length > 0) {
        const ids = list.map((e) => e.id);
        const { data: evts } = await supabase
          .from("analytics_events")
          .select("tipo")
          .in("empresa_id", ids);
        const ev = evts || [];
        setResumoGeral({
          views: ev.filter((e) => e.tipo === "page_view").length,
          whatsapp: ev.filter((e) => e.tipo === "whatsapp_click").length,
          telefone: ev.filter((e) => e.tipo === "phone_click").length,
          site: ev.filter((e) => e.tipo === "site_click").length,
        });
      } else {
        setResumoGeral({ views: 0, whatsapp: 0, telefone: 0, site: 0 });
      }

      setLoading(false);
    })();
  }, [user]);

  useEffect(() => {
    if (!selectedId) return;
    fetchStats(selectedId, parseInt(period));
  }, [selectedId, period]);

  const fetchStats = async (empresaId: string, days: number) => {
    setLoadingStats(true);
    const startDate = format(subDays(new Date(), days - 1), "yyyy-MM-dd");
    const { data } = await supabase
      .from("analytics_events")
      .select("tipo, created_at")
      .eq("empresa_id", empresaId)
      .gte("created_at", `${startDate}T00:00:00`);

    const events = data || [];
    const daysArr = Array.from({ length: days }, (_, i) =>
      format(subDays(new Date(), days - 1 - i), "yyyy-MM-dd")
    );

    const chart: DailyPoint[] = daysArr.map((d) => {
      const day = events.filter((e) => e.created_at?.startsWith(d));
      return {
        date: format(new Date(d), "dd/MM", { locale: ptBR }),
        views: day.filter((e) => e.tipo === "page_view").length,
        whatsapp: day.filter((e) => e.tipo === "whatsapp_click").length,
        telefone: day.filter((e) => e.tipo === "phone_click").length,
        site: day.filter((e) => e.tipo === "site_click").length,
      };
    });


    const totals = chart.reduce(
      (acc, p) => ({
        views: acc.views + p.views,
        whatsapp: acc.whatsapp + p.whatsapp,
        telefone: acc.telefone + p.telefone,
        site: acc.site + p.site,
      }),
      { views: 0, whatsapp: 0, telefone: 0, site: 0 }
    );

    const totalCliques = totals.whatsapp + totals.telefone + totals.site;
    const conv = totals.views > 0 ? (totalCliques / totals.views) * 100 : 0;

    setStats({
      ...totals,
      total_cliques: totalCliques,
      taxa_conversao: conv,
      chart,
    });
    setLoadingStats(false);
  };

  const empresaSelecionada = useMemo(
    () => empresas.find((e) => e.id === selectedId),
    [empresas, selectedId]
  );

  if (authLoading) {
    return (
      <Layout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  return (
    <Layout>
      <div className="container max-w-6xl py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/" aria-label="Voltar">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
                Minhas Estatísticas
              </h1>
              <p className="text-sm text-muted-foreground">
                Desempenho das suas empresas no Guia Local BR
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : empresas.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <p className="text-muted-foreground">Você ainda não cadastrou nenhuma empresa.</p>
              <Button asChild>
                <Link to="/cadastro">Cadastrar empresa</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Resumo geral: TODAS as empresas do usuário */}
            {resumoGeral && (
              <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-secondary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    Resumo geral · {empresas.length} {empresas.length === 1 ? "empresa" : "empresas"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <StatCard icon={Eye} label="Views totais" value={resumoGeral.views} color="text-blue-500" />
                  <StatCard icon={WhatsappIcon} label="WhatsApp" value={resumoGeral.whatsapp} color="text-green-600" />
                  <StatCard icon={Phone} label="Telefone" value={resumoGeral.telefone} color="text-amber-500" />
                  <StatCard icon={Globe} label="Site" value={resumoGeral.site} color="text-purple-500" />
                </CardContent>
              </Card>
            )}

            {/* Selector */}

            <Card>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <div className="flex-1">
                  <label className="mb-1 block text-xs text-muted-foreground">Empresa</label>
                  <Select value={selectedId} onValueChange={setSelectedId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {empresas.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.nome} — {e.cidade}/{e.estado}
                          {e.status !== "aprovado" ? " (aguardando)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:w-48">
                  <label className="mb-1 block text-xs text-muted-foreground">Período</label>
                  <Select value={period} onValueChange={setPeriod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PERIODS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {empresaSelecionada && (
                  <Button asChild variant="outline" className="sm:self-end">
                    <Link
                      to={`/empresa/${empresaSelecionada.slug || empresaSelecionada.id}`}
                      target="_blank"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Ver página
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Stats cards */}
            {loadingStats || !stats ? (
              <div className="flex min-h-[200px] items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
                  <StatCard icon={Eye} label="Visualizações" value={stats.views} color="text-blue-500" />
                  <StatCard
                    icon={WhatsappIcon}
                    label="WhatsApp"
                    value={stats.whatsapp}
                    color="text-green-600"
                  />
                  <StatCard icon={Phone} label="Telefone" value={stats.telefone} color="text-amber-500" />
                  <StatCard icon={Globe} label="Site" value={stats.site} color="text-purple-500" />
                  <StatCard
                    icon={MousePointer}
                    label="Total Cliques"
                    value={stats.total_cliques}
                    color="text-secondary"
                  />
                  <StatCard
                    icon={Percent}
                    label="Conversão"
                    value={`${stats.taxa_conversao.toFixed(1)}%`}
                    color="text-primary"
                  />
                </div>

                {/* Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <TrendingUp className="h-5 w-5" />
                      Evolução nos últimos {period} dias
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.chart}>
                          <defs>
                            <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#1e3a5f" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#1e3a5f" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="gw" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" fontSize={11} />
                          <YAxis fontSize={11} allowDecimals={false} />
                          <Tooltip />
                          <Legend />
                          <Area
                            type="monotone"
                            dataKey="views"
                            stroke="#1e3a5f"
                            fill="url(#gv)"
                            strokeWidth={2}
                            name="Visualizações"
                          />
                          <Area
                            type="monotone"
                            dataKey="whatsapp"
                            stroke="#22c55e"
                            fill="url(#gw)"
                            strokeWidth={2}
                            name="WhatsApp"
                          />
                          <Area
                            type="monotone"
                            dataKey="telefone"
                            stroke="#f59e0b"
                            fillOpacity={0}
                            strokeWidth={2}
                            name="Telefone"
                          />
                          <Area
                            type="monotone"
                            dataKey="site"
                            stroke="#8b5cf6"
                            fillOpacity={0}
                            strokeWidth={2}
                            name="Site"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {empresaSelecionada?.plano !== "premium" && (
                  <Card className="border-amber-300 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
                    <CardContent className="flex flex-col items-start gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <Badge className="mb-2 bg-amber-500 text-white">Upgrade Premium</Badge>
                        <p className="text-sm font-medium">
                          Quer mais visibilidade? Empresas Premium recebem em média 3× mais cliques.
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Premium vitalício — 10 fotos, vídeos, postagem no blog e SEO por bairros. Consulte no WhatsApp.
                        </p>
                      </div>
                      <Button asChild>
                        <Link to="/planos">Conhecer Premium</Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground truncate">{label}</p>
            <p className="mt-0.5 text-lg font-bold">{value}</p>
          </div>
          <Icon className={`h-5 w-5 flex-shrink-0 ${color}`} />
        </div>
      </CardContent>
    </Card>
  );
}

function WhatsappIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
    </svg>
  );
}
