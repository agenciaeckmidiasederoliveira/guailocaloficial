import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { NIVEIS_PARCEIRO, type NivelParceiro } from "@/lib/constants";
import {
  ArrowLeft,
  Eye,
  MessageCircle,
  Phone,
  Globe,
  Heart,
  Share2,
  TrendingUp,
  MapPin,
  DollarSign,
  Building2,
  Loader2,
  Crown,
  Sparkles,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  RadialBar,
  RadialBarChart,
  PolarAngleAxis,
} from "recharts";

interface Detalhe {
  parceiro: any;
  kpis: any;
  eventos: any;
  timeline_30d: { dia: string; views: number; whatsapp: number }[];
  top_empresas: any[];
  cidades_breakdown: any[];
  vendas: any;
}

export function AdminParceiroDetalhe() {
  const { id } = useParams();
  const [d, setD] = useState<Detalhe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data } = await (supabase.rpc as any)("admin_get_parceiro_detalhe", {
        p_parceiro_id: id,
      });
      setD(data as Detalhe);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!d) {
    return (
      <div className="text-center py-20 text-muted-foreground">Parceiro não encontrado.</div>
    );
  }

  const p = d.parceiro;
  const nivel = NIVEIS_PARCEIRO[(p?.nivel as NivelParceiro) || "bronze"] || NIVEIS_PARCEIRO.bronze;
  const e = d.eventos || {};
  const k = d.kpis || {};
  const v = d.vendas || {};
  const totalEventos =
    (e.views || 0) + (e.whatsapp || 0) + (e.telefone || 0) + (e.site || 0) + (e.favoritos || 0);
  const conversaoGlobal = e.views > 0 ? ((e.whatsapp / e.views) * 100).toFixed(1) : "0";
  const ticketMedio =
    v.count_confirmados > 0 ? (Number(v.total) / v.count_confirmados).toFixed(2) : "0,00";

  // Radial chart: % de cota usada
  const cotaTotal = (p?.cota_premium || 0) + (p?.cota_free || 0);
  const usadoPct = cotaTotal > 0 ? Math.min(100, (k.total_empresas / cotaTotal) * 100) : 0;

  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild size="sm">
        <Link to="/admin/parceiros-analytics">
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Link>
      </Button>

      {/* Hero do parceiro */}
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary via-primary/90 to-secondary text-primary-foreground">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div className="relative">
              {p?.avatar_url ? (
                <img
                  src={p.avatar_url}
                  alt={p.nome}
                  className="h-24 w-24 rounded-full object-cover ring-4 ring-white/30"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold">
                  {(p?.nome || p?.email || "?")[0]?.toUpperCase()}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1.5 shadow-lg">
                <Crown className="h-4 w-4 text-amber-500" />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-display text-3xl font-bold">{p?.nome || p?.email}</h1>
                <Badge className="bg-white/20 text-white border-0 backdrop-blur">
                  {nivel.emoji} {nivel.label}
                </Badge>
              </div>
              <p className="text-primary-foreground/80 mt-1">{p?.email}</p>
              {p?.bio && (
                <p className="text-sm text-primary-foreground/90 mt-3 max-w-2xl">{p.bio}</p>
              )}
              <div className="flex gap-4 mt-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {(p?.cidades_atendidas || []).length} cidades
                </div>
                {p?.whatsapp && (
                  <a
                    href={`https://wa.me/55${p.whatsapp}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 hover:underline"
                  >
                    <MessageCircle className="h-4 w-4" /> {p.whatsapp}
                  </a>
                )}
              </div>
            </div>

            {/* Radial cota */}
            <div className="w-32 h-32 relative">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  innerRadius="70%"
                  outerRadius="100%"
                  data={[{ value: usadoPct, fill: "#ffffff" }]}
                  startAngle={90}
                  endAngle={-270}
                >
                  <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                  <RadialBar background={{ fill: "rgba(255,255,255,0.2)" }} dataKey="value" cornerRadius={20} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-2xl font-bold">{usadoPct.toFixed(0)}%</div>
                <div className="text-[10px] uppercase tracking-wide opacity-80">cota</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs principais — grid bento */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Building2} label="Empresas" value={k.total_empresas} sub={`${k.premium} premium`} accent="from-blue-500 to-cyan-500" />
        <KpiCard icon={Eye} label="Visualizações" value={e.views || 0} sub={`${totalEventos} eventos totais`} accent="from-violet-500 to-purple-500" />
        <KpiCard icon={MessageCircle} label="WhatsApp" value={e.whatsapp || 0} sub={`${conversaoGlobal}% conversão`} accent="from-green-500 to-emerald-500" />
        <KpiCard icon={DollarSign} label="Vendas" value={`R$ ${Number(v.total || 0).toFixed(0)}`} sub={`${v.count_confirmados} pgto. • ticket R$ ${ticketMedio}`} accent="from-amber-500 to-orange-500" />
      </div>

      {/* Timeline 30d */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
            Performance — últimos 30 dias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={d.timeline_30d}>
                <defs>
                  <linearGradient id="gradViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradWpp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="dia"
                  tickFormatter={(v) => v?.slice(5)}
                  tick={{ fontSize: 11 }}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                  }}
                />
                <Area type="monotone" dataKey="views" stroke="hsl(var(--primary))" fill="url(#gradViews)" name="Views" />
                <Area type="monotone" dataKey="whatsapp" stroke="#22c55e" fill="url(#gradWpp)" name="WhatsApp" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Funil de eventos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="h-5 w-5 text-primary" /> Funil de engajamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <FunnelBar icon={Eye} label="Visualizações" value={e.views || 0} max={e.views || 1} color="bg-violet-500" />
            <FunnelBar icon={MessageCircle} label="Cliques WhatsApp" value={e.whatsapp || 0} max={e.views || 1} color="bg-green-500" />
            <FunnelBar icon={Phone} label="Cliques telefone" value={e.telefone || 0} max={e.views || 1} color="bg-blue-500" />
            <FunnelBar icon={Globe} label="Cliques site" value={e.site || 0} max={e.views || 1} color="bg-cyan-500" />
            <FunnelBar icon={Heart} label="Favoritos" value={e.favoritos || 0} max={e.views || 1} color="bg-pink-500" />
            <FunnelBar icon={Share2} label="Compartilhamentos" value={e.shares || 0} max={e.views || 1} color="bg-amber-500" />
          </CardContent>
        </Card>

        {/* Cidades breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5 text-primary" /> Cidades atendidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(d.cidades_breakdown || []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma empresa aprovada ainda.</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {d.cidades_breakdown.map((c, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">
                        {i + 1}
                      </span>
                      <div>
                        <div className="font-medium text-sm">{c.cidade}</div>
                        <div className="text-xs text-muted-foreground">{c.estado}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{c.total}</div>
                      <div className="text-xs text-amber-600">{c.premium} premium</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top empresas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" /> Top 10 empresas do parceiro
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(d.top_empresas || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem dados.</p>
          ) : (
            <div className="space-y-2">
              {d.top_empresas.map((emp, i) => (
                <Link
                  key={emp.id}
                  to={`/empresa/${emp.slug || emp.id}`}
                  target="_blank"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/70 transition-colors border border-border"
                >
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    i === 0 ? "bg-amber-100 text-amber-700" :
                    i === 1 ? "bg-slate-200 text-slate-700" :
                    i === 2 ? "bg-orange-100 text-orange-700" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{emp.nome}</div>
                    <div className="text-xs text-muted-foreground">
                      {emp.cidade}/{emp.estado} • {emp.plano} • {emp.status}
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <div className="font-bold flex items-center gap-1 justify-end"><Eye className="h-3 w-3" />{emp.views}</div>
                    <div className="text-green-600 flex items-center gap-1 justify-end"><MessageCircle className="h-3 w-3" />{emp.whatsapp} • {emp.conversao}%</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vendas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="h-5 w-5 text-primary" /> Últimos pagamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(v.ultimos || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum pagamento ainda.</p>
          ) : (
            <div className="space-y-2">
              {v.ultimos.map((pg: any) => (
                <div key={pg.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 text-sm">
                  <div>
                    <div className="font-medium">R$ {Number(pg.valor).toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">
                      {pg.metodo || "-"} • {new Date(pg.created_at).toLocaleString("pt-BR")}
                    </div>
                  </div>
                  <Badge variant={["CONFIRMED","RECEIVED","pago"].includes(pg.status) ? "default" : "secondary"}>
                    {pg.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, sub, accent }: any) {
  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent}`} />
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className={`p-2 rounded-lg bg-gradient-to-br ${accent} text-white`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FunnelBar({ icon: Icon, label, value, max, color }: any) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="flex items-center gap-2"><Icon className="h-4 w-4 text-muted-foreground" />{label}</span>
        <span className="font-bold">{value}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
