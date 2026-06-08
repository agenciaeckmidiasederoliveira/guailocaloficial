import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import {
  Building2,
  Eye,
  MousePointer,
  Users,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Percent,
  MapPin,
  Search,
  Smartphone,
  Monitor,
  Tablet,
  Clock,
  Heart,
  Globe,
  Activity,
  CheckCircle2,
  AlertCircle,
  Zap,
  ExternalLink,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
  FunnelChart,
  Funnel,
  LabelList,
} from "recharts";
import { format, subDays, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Stats {
  totalEmpresas: number;
  empresasPremium: number;
  empresasPendentes: number;
  totalVisualizacoes: number;
  totalCliques: number;
  taxaConversao: number;
  previousVisualizacoes: number;
  previousCliques: number;
  sessionsUnicas: number;
  totalBuscas: number;
  totalFavoritos: number;
  totalUsuarios: number;
  totalWhatsapp: number;
  totalCadastros: number;
}

interface ChartData {
  date: string;
  visualizacoes: number;
  cliques: number;
  cadastros: number;
}

interface ClickData {
  tipo: string;
  total: number;
}

interface TopEmpresa {
  id: string;
  nome: string;
  cidade: string;
  visualizacoes: number;
  cliques: number;
  whatsapp: number;
}

interface EstadoData {
  estado: string;
  total: number;
}

interface CidadeData {
  cidade: string;
  total: number;
}

interface CategoriaData {
  categoria: string;
  total: number;
}

interface UltimaEmpresa {
  id: string;
  slug: string | null;
  nome: string;
  cidade: string;
  nicho: string | null;
  plano: string | null;
  criado_em: string | null;
}

interface AvaliacaoRecente {
  id: string;
  nome_avaliador: string | null;
  nota: number;
  comentario: string | null;
  created_at: string;
  aprovado: boolean;
  empresa_id: string;
  empresa_nome?: string;
}

interface DeviceData {
  device: string;
  total: number;
}

interface TopBusca {
  termo: string;
  total: number;
}

interface PaginaData {
  referrer: string;
  total: number;
}

interface HourData {
  hora: string;
  total: number;
}

interface ReferrerData {
  referrer: string;
  total: number;
}

interface RealtimeEvent {
  id: string;
  tipo: string;
  referrer: string | null;
  created_at: string | null;
}

interface SystemHealth {
  dbStatus: "online" | "offline";
  lastActivity: string | null;
  taxaAprovacao: number;
}

const COLORS = ["#1e3a5f", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#14b8a6"];

const DEVICE_ICONS: Record<string, typeof Monitor> = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
};

const EVENT_LABELS: Record<string, string> = {
  page_view: "Visualização",
  foto_view: "Clique empresa",
  whatsapp_click: "WhatsApp",
  phone_click: "Telefone",
  site_click: "Site",
  busca: "Busca",
  favorito_add: "Favorito",
  cadastro: "Cadastro",
  banner_click: "Banner",
  share: "Compartilhamento",
};

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalEmpresas: 0,
    empresasPremium: 0,
    empresasPendentes: 0,
    totalVisualizacoes: 0,
    totalCliques: 0,
    taxaConversao: 0,
    previousVisualizacoes: 0,
    previousCliques: 0,
    sessionsUnicas: 0,
    totalBuscas: 0,
    totalFavoritos: 0,
    totalUsuarios: 0,
    totalWhatsapp: 0,
    totalCadastros: 0,
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [clickData, setClickData] = useState<ClickData[]>([]);
  const [topEmpresas, setTopEmpresas] = useState<TopEmpresa[]>([]);
  const [estadosData, setEstadosData] = useState<EstadoData[]>([]);
  const [cidadesData, setCidadesData] = useState<CidadeData[]>([]);
  const [categoriasData, setCategoriasData] = useState<CategoriaData[]>([]);
  const [ultimasEmpresas, setUltimasEmpresas] = useState<UltimaEmpresa[]>([]);
  const [avaliacoesRecentes, setAvaliacoesRecentes] = useState<AvaliacaoRecente[]>([]);
  const [deviceData, setDeviceData] = useState<DeviceData[]>([]);
  const [topBuscas, setTopBuscas] = useState<TopBusca[]>([]);
  const [topPaginas, setTopPaginas] = useState<PaginaData[]>([]);
  const [hourlyData, setHourlyData] = useState<HourData[]>([]);
  const [referrerData, setReferrerData] = useState<ReferrerData[]>([]);
  const [realtimeEvents, setRealtimeEvents] = useState<RealtimeEvent[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    dbStatus: "online",
    lastActivity: null,
    taxaAprovacao: 0,
  });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"1" | "7" | "30" | "90">("7");
  const [activeVisitors, setActiveVisitors] = useState(0);

  useEffect(() => {
    fetchAllData();
  }, [period]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("admin-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "analytics" },
        (payload) => {
          const newEvent = payload.new as RealtimeEvent;
          setRealtimeEvents((prev) => [newEvent, ...prev].slice(0, 15));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getStartDate = () => format(subDays(new Date(), parseInt(period) - 1), "yyyy-MM-dd");

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchStats(),
      fetchChartData(),
      fetchClickData(),
      fetchTopEmpresas(),
      fetchEstadosData(),
      fetchCidadesData(),
      fetchCategoriasData(),
      fetchUltimasEmpresas(),
      fetchAvaliacoesRecentes(),
      fetchDeviceData(),
      fetchTopBuscas(),
      fetchTopPaginas(),
      fetchHourlyData(),
      fetchReferrerData(),
      fetchSystemHealth(),
      fetchActiveVisitors(),
      fetchRecentEvents(),
    ]);
    setLoading(false);
  };

  const fetchStats = async () => {
    const daysAgo = parseInt(period);
    const startDate = format(subDays(new Date(), daysAgo - 1), "yyyy-MM-dd");
    const previousStartDate = format(subDays(new Date(), daysAgo * 2 - 1), "yyyy-MM-dd");
    const previousEndDate = format(subDays(new Date(), daysAgo), "yyyy-MM-dd");

    const [
      { count: totalEmpresas },
      { count: empresasPremium },
      { count: empresasPendentes },
      { count: totalVisualizacoes },
      { count: previousVisualizacoes },
      { count: totalCliques },
      { count: previousCliques },
      { count: totalBuscas },
      { count: totalFavoritos },
      { count: totalUsuarios },
      { count: totalWhatsapp },
      { count: totalCadastros },
      { count: sessionsUnicas },
    ] = await Promise.all([
      supabase.from("empresas").select("*", { count: "exact", head: true }).eq("status", "aprovado"),
      supabase.from("empresas").select("*", { count: "exact", head: true }).eq("plano", "premium"),
      supabase.from("empresas").select("*", { count: "exact", head: true }).eq("status", "pendente"),
      supabase.from("analytics_events").select("*", { count: "exact", head: true }).eq("tipo", "page_view").gte("created_at", `${startDate}T00:00:00`),
      supabase.from("analytics_events").select("*", { count: "exact", head: true }).eq("tipo", "page_view").gte("created_at", `${previousStartDate}T00:00:00`).lte("created_at", `${previousEndDate}T23:59:59`),
      supabase.from("analytics_events").select("*", { count: "exact", head: true }).in("tipo", ["foto_view", "whatsapp_click", "phone_click", "site_click"]).gte("created_at", `${startDate}T00:00:00`),
      supabase.from("analytics_events").select("*", { count: "exact", head: true }).in("tipo", ["foto_view", "whatsapp_click", "phone_click", "site_click"]).gte("created_at", `${previousStartDate}T00:00:00`).lte("created_at", `${previousEndDate}T23:59:59`),
      supabase.from("analytics_events").select("*", { count: "exact", head: true }).eq("tipo", "busca").gte("created_at", `${startDate}T00:00:00`),
      supabase.from("analytics_events").select("*", { count: "exact", head: true }).eq("tipo", "favorito_add").gte("created_at", `${startDate}T00:00:00`),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("analytics_events").select("*", { count: "exact", head: true }).eq("tipo", "whatsapp_click").gte("created_at", `${startDate}T00:00:00`),
      supabase.from("analytics_events").select("*", { count: "exact", head: true }).eq("tipo", "favorito_add").gte("created_at", `${startDate}T00:00:00`),
      // Use distinct count approach - count sessions with head:true
      supabase.from("analytics_events").select("session_id", { count: "exact", head: true }).gte("created_at", `${startDate}T00:00:00`).not("session_id", "is", null),
    ]);

    const views = totalVisualizacoes || 0;
    const clicks = totalCliques || 0;
    const taxaConversao = views > 0 ? (clicks / views) * 100 : 0;

    setStats({
      totalEmpresas: totalEmpresas || 0,
      empresasPremium: empresasPremium || 0,
      empresasPendentes: empresasPendentes || 0,
      totalVisualizacoes: views,
      totalCliques: clicks,
      taxaConversao,
      previousVisualizacoes: previousVisualizacoes || 0,
      previousCliques: previousCliques || 0,
      sessionsUnicas: sessionsUnicas || 0,
      totalBuscas: totalBuscas || 0,
      totalFavoritos: totalFavoritos || 0,
      totalUsuarios: totalUsuarios || 0,
      totalWhatsapp: totalWhatsapp || 0,
      totalCadastros: totalCadastros || 0,
    });
  };

  const fetchChartData = async () => {
    const daysAgo = parseInt(period);
    const days = Array.from({ length: daysAgo }, (_, i) => {
      const date = subDays(new Date(), daysAgo - 1 - i);
      return format(date, "yyyy-MM-dd");
    });

    const { data: analytics } = await supabase
      .from("analytics_events")
      .select("tipo, created_at")
      .gte("created_at", `${days[0]}T00:00:00`)
      .lte("created_at", `${days[days.length - 1]}T23:59:59`);

    const grouped = days.map((date) => {
      const dayData = (analytics || []).filter((a) => a.created_at?.startsWith(date));
      return {
        date: format(new Date(date), "dd/MM", { locale: ptBR }),
        visualizacoes: dayData.filter((a) => a.tipo === "page_view").length,
        cliques: dayData.filter((a) => ["foto_view", "whatsapp_click", "phone_click", "site_click"].includes(a.tipo)).length,
        cadastros: dayData.filter((a) => a.tipo === "favorito_add").length,
      };
    });

    setChartData(grouped);
  };

  const fetchClickData = async () => {
    const startDate = getStartDate();
    const { data } = await supabase
      .from("analytics_events")
      .select("tipo")
      .in("tipo", ["whatsapp_click", "phone_click", "site_click", "foto_view", "banner_click"])
      .gte("created_at", `${startDate}T00:00:00`);

    const grouped: Record<string, number> = {};
    (data || []).forEach((item) => {
      const label = item.tipo.replace("click_", "").replace("banner_click", "banner");
      grouped[label] = (grouped[label] || 0) + 1;
    });

    setClickData(
      Object.entries(grouped)
        .map(([tipo, total]) => ({
          tipo: tipo.charAt(0).toUpperCase() + tipo.slice(1),
          total,
        }))
        .sort((a, b) => b.total - a.total)
    );
  };

  const fetchTopEmpresas = async () => {
    const startDate = getStartDate();
    const { data: analytics } = await supabase
      .from("analytics_events")
      .select("empresa_id, tipo")
      .not("empresa_id", "is", null)
      .gte("created_at", `${startDate}T00:00:00`);

    const grouped: Record<string, { views: number; clicks: number; whatsapp: number }> = {};
    (analytics || []).forEach((item) => {
      if (!item.empresa_id) return;
      if (!grouped[item.empresa_id]) grouped[item.empresa_id] = { views: 0, clicks: 0, whatsapp: 0 };
      if (item.tipo === "page_view") grouped[item.empresa_id].views++;
      else if (item.tipo === "whatsapp_click") grouped[item.empresa_id].whatsapp++;
      else grouped[item.empresa_id].clicks++;
    });

    const sortedIds = Object.entries(grouped)
      .sort((a, b) => (b[1].views + b[1].clicks + b[1].whatsapp) - (a[1].views + a[1].clicks + a[1].whatsapp))
      .slice(0, 10)
      .map(([id]) => id);

    if (sortedIds.length === 0) { setTopEmpresas([]); return; }

    const { data: empresas } = await supabase.from("empresas").select("id, nome, cidade").in("id", sortedIds);
    const empresasMap = new Map((empresas || []).map(e => [e.id, e]));

    setTopEmpresas(
      sortedIds.map((id) => ({
        id,
        nome: empresasMap.get(id)?.nome || "Empresa",
        cidade: empresasMap.get(id)?.cidade || "",
        visualizacoes: grouped[id].views,
        cliques: grouped[id].clicks,
        whatsapp: grouped[id].whatsapp,
      }))
    );
  };

  const fetchEstadosData = async () => {
    const { data: empresas } = await supabase.from("empresas").select("estado").eq("status", "aprovado");
    const grouped: Record<string, number> = {};
    (empresas || []).forEach((e) => { grouped[e.estado] = (grouped[e.estado] || 0) + 1; });
    setEstadosData(Object.entries(grouped).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([estado, total]) => ({ estado, total })));
  };

  const fetchCidadesData = async () => {
    const { data: empresas } = await supabase
      .from("empresas")
      .select("cidade")
      .eq("status", "aprovado");
    const grouped: Record<string, number> = {};
    (empresas || []).forEach((e) => {
      const c = (e.cidade || "").trim();
      if (c) grouped[c] = (grouped[c] || 0) + 1;
    });
    setCidadesData(
      Object.entries(grouped)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([cidade, total]) => ({ cidade, total }))
    );
  };

  const fetchCategoriasData = async () => {
    const { data: empresas } = await supabase
      .from("empresas")
      .select("nicho")
      .eq("status", "aprovado");
    const grouped: Record<string, number> = {};
    (empresas || []).forEach((e) => {
      const n = (e.nicho || "Outros").trim() || "Outros";
      grouped[n] = (grouped[n] || 0) + 1;
    });
    setCategoriasData(
      Object.entries(grouped)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([categoria, total]) => ({ categoria, total }))
    );
  };

  const fetchUltimasEmpresas = async () => {
    const { data } = await supabase
      .from("empresas")
      .select("id, slug, nome, cidade, nicho, plano, criado_em")
      .order("criado_em", { ascending: false })
      .limit(10);
    setUltimasEmpresas((data as UltimaEmpresa[]) || []);
  };

  const fetchAvaliacoesRecentes = async () => {
    const { data } = await supabase
      .from("avaliacoes")
      .select("id, nome_avaliador, nota, comentario, created_at, aprovado, empresa_id")
      .order("created_at", { ascending: false })
      .limit(5);
    const items = (data as AvaliacaoRecente[]) || [];
    const ids = Array.from(new Set(items.map((a) => a.empresa_id)));
    if (ids.length > 0) {
      const { data: empresas } = await supabase.from("empresas").select("id, nome").in("id", ids);
      const map = new Map((empresas || []).map((e) => [e.id, e.nome]));
      items.forEach((a) => { a.empresa_nome = map.get(a.empresa_id) || "Empresa"; });
    }
    setAvaliacoesRecentes(items);
  };


  const fetchDeviceData = async () => {
    const startDate = getStartDate();
    const { data } = await supabase
      .from("analytics_events")
      .select("cidade")
      .gte("created_at", `${startDate}T00:00:00`)
      .not("cidade", "is", null);

    const grouped: Record<string, number> = {};
    (data || []).forEach((item) => {
      const d = (item as any).cidade || "desconhecido";
      grouped[d] = (grouped[d] || 0) + 1;
    });

    setDeviceData(
      Object.entries(grouped)
        .map(([device, total]) => ({ device, total }))
        .sort((a, b) => b.total - a.total)
    );
  };

  const fetchTopBuscas = async () => {
    const startDate = getStartDate();
    const { data } = await supabase
      .from("analytics_events")
      .select("termo_busca")
      .eq("tipo", "busca")
      .gte("created_at", `${startDate}T00:00:00`)
      .not("termo_busca", "is", null);

    const grouped: Record<string, number> = {};
    (data || []).forEach((item) => {
      const termo = ((item as any).termo_busca || "").toLowerCase().trim();
      if (termo) grouped[termo] = (grouped[termo] || 0) + 1;
    });

    setTopBuscas(
      Object.entries(grouped)
        .map(([termo, total]) => ({ termo, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10)
    );
  };

  const fetchTopPaginas = async () => {
    const startDate = getStartDate();
    const { data } = await supabase
      .from("analytics_events")
      .select("referrer")
      .eq("tipo", "page_view")
      .gte("created_at", `${startDate}T00:00:00`);

    const grouped: Record<string, number> = {};
    (data || []).forEach((item) => {
      const p = item.referrer || "/";
      grouped[p] = (grouped[p] || 0) + 1;
    });

    setTopPaginas(
      Object.entries(grouped)
        .map(([referrer, total]) => ({ referrer, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10)
    );
  };

  const fetchHourlyData = async () => {
    const startDate = getStartDate();
    const { data } = await supabase
      .from("analytics_events")
      .select("created_at")
      .eq("tipo", "page_view")
      .gte("created_at", `${startDate}T00:00:00`);

    const hours: Record<number, number> = {};
    for (let i = 0; i < 24; i++) hours[i] = 0;

    (data || []).forEach((item) => {
      if (item.created_at) {
        const h = new Date(item.created_at).getHours();
        hours[h]++;
      }
    });

    setHourlyData(
      Object.entries(hours).map(([h, total]) => ({
        hora: `${h.toString().padStart(2, "0")}h`,
        total,
      }))
    );
  };

  const fetchReferrerData = async () => {
    const startDate = getStartDate();
    const { data } = await supabase
      .from("analytics_events")
      .select("referrer")
      .gte("created_at", `${startDate}T00:00:00`)
      .not("referrer", "is", null);

    const grouped: Record<string, number> = {};
    (data || []).forEach((item) => {
      let ref = (item as any).referrer || "";
      if (!ref || ref === "" || ref === "direct") ref = "Direto";
      else {
        try {
          ref = new URL(ref).hostname.replace("www.", "");
        } catch {
          ref = ref.substring(0, 30);
        }
      }
      grouped[ref] = (grouped[ref] || 0) + 1;
    });

    setReferrerData(
      Object.entries(grouped)
        .map(([referrer, total]) => ({ referrer, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 8)
    );
  };

  const fetchSystemHealth = async () => {
    const [{ data: lastEvent }, { count: totalAprovadas }, { count: totalEmpresas }] = await Promise.all([
      supabase.from("analytics_events").select("created_at").order("created_at", { ascending: false }).limit(1).single(),
      supabase.from("empresas").select("*", { count: "exact", head: true }).eq("status", "aprovado"),
      supabase.from("empresas").select("*", { count: "exact", head: true }),
    ]);

    const total = totalEmpresas || 0;
    const aprovadas = totalAprovadas || 0;

    setSystemHealth({
      dbStatus: "online",
      lastActivity: lastEvent?.created_at || null,
      taxaAprovacao: total > 0 ? (aprovadas / total) * 100 : 0,
    });
  };

  const fetchActiveVisitors = async () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("analytics_events")
      .select("session_id", { count: "exact", head: true })
      .gte("created_at", fiveMinAgo)
      .not("session_id", "is", null);

    setActiveVisitors(count || 0);
  };

  const fetchRecentEvents = async () => {
    const { data } = await supabase
      .from("analytics_events")
      .select("id, tipo, referrer, created_at")
      .order("created_at", { ascending: false })
      .limit(15);

    setRealtimeEvents((data as RealtimeEvent[]) || []);
  };

  const exportCSV = () => {
    const headers = ["Data", "Visualizações", "Cliques", "Cadastros"];
    const rows = chartData.map((d) => [d.date, d.visualizacoes, d.cliques, d.cadastros]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics_${period}dias_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  const getVariation = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const viewsVariation = getVariation(stats.totalVisualizacoes, stats.previousVisualizacoes);
  const clicksVariation = getVariation(stats.totalCliques, stats.previousCliques);

  const funnelData = [
    { name: "Visitantes", value: stats.totalVisualizacoes, fill: "#1e3a5f" },
    { name: "Cliques", value: stats.totalCliques, fill: "#3b82f6" },
    { name: "WhatsApp", value: stats.totalWhatsapp, fill: "#22c55e" },
    { name: "Cadastros", value: stats.totalCadastros, fill: "#f59e0b" },
  ];

  const statCards = [
    { title: "Empresas Ativas", value: stats.totalEmpresas, icon: Building2, color: "text-primary" },
    { title: "Premium", value: stats.empresasPremium, icon: TrendingUp, color: "text-amber-500" },
    { title: "Pendentes", value: stats.empresasPendentes, icon: Users, color: "text-orange-500" },
    { title: "Visualizações", value: stats.totalVisualizacoes, icon: Eye, color: "text-blue-500", variation: viewsVariation },
    { title: "Cliques", value: stats.totalCliques, icon: MousePointer, color: "text-secondary", variation: clicksVariation },
    { title: "Conversão", value: `${stats.taxaConversao.toFixed(1)}%`, icon: Percent, color: "text-purple-500" },
    { title: "Sessões", value: stats.sessionsUnicas, icon: Globe, color: "text-cyan-500" },
    { title: "Buscas", value: stats.totalBuscas, icon: Search, color: "text-indigo-500" },
    { title: "Favoritos", value: stats.totalFavoritos, icon: Heart, color: "text-red-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Dashboard Analytics</h1>
          <p className="text-muted-foreground">Visão completa do Guia Local BR</p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={(v) => setPeriod(v as "1" | "7" | "30" | "90")}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Hoje</SelectItem>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* System Health + Realtime Bar */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-green-200/50 bg-gradient-to-br from-green-50 to-green-100/50 dark:border-green-900/30 dark:from-green-950/20 dark:to-green-900/10 shadow-sm transition-all hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="relative rounded-full bg-green-200/50 p-2 dark:bg-green-900/50">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse border border-white dark:border-slate-900" />
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-green-600/80 dark:text-green-400/80">Status do Sistema</p>
                <p className="text-xl font-bold text-green-700 dark:text-green-300">Online</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 shadow-sm border-slate-200/60 dark:border-slate-700/50 transition-all hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100/50 p-2 dark:bg-blue-900/30">
                <Activity className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80">Última Atividade</p>
                <p className="text-sm font-bold text-foreground">
                  {systemHealth.lastActivity
                    ? formatDistanceToNow(new Date(systemHealth.lastActivity), { addSuffix: true, locale: ptBR })
                    : "Sem dados"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 shadow-sm border-slate-200/60 dark:border-slate-700/50 transition-all hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-purple-100/50 p-2 dark:bg-purple-900/30">
                <Users className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80">Usuários Registrados</p>
                <p className="text-xl font-bold text-foreground">{stats.totalUsuarios}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 shadow-sm border-slate-200/60 dark:border-slate-700/50 transition-all hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="relative rounded-full bg-amber-100/50 p-2 dark:bg-amber-900/30">
                <Zap className="h-6 w-6 text-amber-500" />
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse border border-white dark:border-slate-900" />
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80">Visitantes Ativos</p>
                <p className="text-xl font-bold text-foreground">
                  {activeVisitors} <span className="text-xs font-normal text-muted-foreground">agora</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 [&>*]:min-w-0">
        {statCards.map((stat, index) => (
          <Card key={index} className="bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-800/80 shadow-sm hover:shadow-md transition-shadow border-slate-200/60 dark:border-slate-700/50">
            <CardContent className="p-3">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="mb-2 rounded-full bg-slate-100/80 p-2 dark:bg-slate-800">
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <p className="text-xl font-bold tracking-tight text-foreground">{stat.value}</p>
                <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground/80">{stat.title}</p>
                {stat.variation !== undefined && (
                  <div className={`mt-1.5 flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${stat.variation >= 0 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                    {stat.variation >= 0 ? <ArrowUpRight className="mr-0.5 h-3 w-3" /> : <ArrowDownRight className="mr-0.5 h-3 w-3" />}
                    {Math.abs(stat.variation).toFixed(1)}%
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm border-slate-200/60 dark:border-slate-700/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Evolução de Tráfego</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1e3a5f" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#1e3a5f" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorCadastros" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="visualizacoes" stroke="#1e3a5f" fillOpacity={1} fill="url(#colorViews)" name="Visualizações" strokeWidth={2} />
                  <Area type="monotone" dataKey="cliques" stroke="#22c55e" fillOpacity={1} fill="url(#colorClicks)" name="Cliques" strokeWidth={2} />
                  <Area type="monotone" dataKey="cadastros" stroke="#f59e0b" fillOpacity={1} fill="url(#colorCadastros)" name="Cadastros" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cliques por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {clickData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={clickData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="total" nameKey="tipo" label={({ tipo, total }) => `${tipo}: ${total}`}>
                      {clickData.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">Nenhum dado disponível</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Funnel + Referrers */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Funil de Conversão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {funnelData.map((item, index) => {
                const maxVal = funnelData[0].value || 1;
                const pct = maxVal > 0 ? (item.value / maxVal) * 100 : 0;
                return (
                  <div key={item.name} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-muted-foreground">{item.value} ({pct.toFixed(1)}%)</span>
                    </div>
                    <div className="h-6 rounded-md bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-md transition-all duration-500 flex items-center justify-end pr-2"
                        style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: item.fill }}
                      >
                        {pct > 15 && <span className="text-[10px] text-white font-medium">{pct.toFixed(0)}%</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Origem dos Visitantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {referrerData.length > 0 ? (
              <div className="space-y-2">
                {referrerData.map((r, i) => {
                  const total = referrerData.reduce((a, b) => a + b.total, 0);
                  const pct = total > 0 ? ((r.total / total) * 100).toFixed(1) : "0";
                  return (
                    <div key={r.referrer} className="flex items-center justify-between rounded-lg border border-border p-2.5">
                      <div className="flex items-center gap-2">
                        <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${i < 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                          {i + 1}
                        </span>
                        <span className="text-sm font-medium">{r.referrer}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{r.total} ({pct}%)</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-40 items-center justify-center text-muted-foreground">Nenhum dado disponível</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Realtime Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="relative">
              <Activity className="h-5 w-5 text-green-500" />
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            </div>
            Atividade em Tempo Real
            <Badge variant="outline" className="ml-auto text-[10px]">Ao Vivo</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {realtimeEvents.length > 0 ? (
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
              {realtimeEvents.map((event) => (
                <div key={event.id} className="flex items-center gap-3 rounded-lg border border-border p-2 text-sm">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500 flex-shrink-0 animate-pulse" />
                  <Badge variant="outline" className="text-[10px] flex-shrink-0">
                    {EVENT_LABELS[event.tipo] || event.tipo}
                  </Badge>
                  <span className="text-muted-foreground truncate flex-1">{event.referrer || "/"}</span>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0">
                    {event.created_at ? formatDistanceToNow(new Date(event.created_at), { addSuffix: true, locale: ptBR }) : ""}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-20 items-center justify-center text-muted-foreground">Aguardando atividade...</div>
          )}
        </CardContent>
      </Card>

      {/* Dispositivos + Horário de pico */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Dispositivos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deviceData.length > 0 ? (
              <div className="space-y-3">
                {deviceData.map((d, i) => {
                  const total = deviceData.reduce((a, b) => a + b.total, 0);
                  const pct = total > 0 ? ((d.total / total) * 100).toFixed(1) : "0";
                  const Icon = DEVICE_ICONS[d.device] || Monitor;
                  return (
                    <div key={d.device} className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium capitalize">{d.device}</span>
                          <span className="text-muted-foreground">{d.total} ({pct}%)</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-40 items-center justify-center text-muted-foreground">Nenhum dado disponível</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Horário de Pico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hora" fontSize={10} interval={2} />
                  <YAxis fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="total" fill="#1e3a5f" radius={[2, 2, 0, 0]} name="Acessos" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Buscas + Top Páginas */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Termos Mais Buscados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topBuscas.length > 0 ? (
              <div className="space-y-2">
                {topBuscas.map((b, i) => (
                  <div key={b.termo} className="flex items-center justify-between rounded-lg border border-border p-2.5">
                    <div className="flex items-center gap-2">
                      <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${i < 3 ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"}`}>
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium">{b.termo}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{b.total}x</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-40 items-center justify-center text-muted-foreground">Nenhuma busca registrada</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Páginas Mais Visitadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topPaginas.length > 0 ? (
              <div className="space-y-2">
                {topPaginas.map((p, i) => (
                  <div key={p.referrer} className="flex items-center justify-between rounded-lg border border-border p-2.5">
                    <div className="flex items-center gap-2">
                      <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${i < 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium truncate max-w-[200px]">{p.referrer}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{p.total}x</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-40 items-center justify-center text-muted-foreground">Nenhum dado disponível</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Empresas & Estados */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Empresas</CardTitle>
          </CardHeader>
          <CardContent>
            {topEmpresas.length > 0 ? (
              <div className="space-y-2">
                {topEmpresas.map((empresa, index) => (
                  <div key={empresa.id} className="flex items-center justify-between rounded-lg border border-border p-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold flex-shrink-0 ${index < 3 ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"}`}>
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{empresa.nome}</p>
                        <p className="text-[10px] text-muted-foreground">{empresa.cidade}</p>
                      </div>
                    </div>
                    <div className="flex gap-3 text-xs flex-shrink-0">
                      <span className="flex items-center gap-1 text-muted-foreground" title="Views">
                        <Eye className="h-3 w-3" />{empresa.visualizacoes}
                      </span>
                      <span className="flex items-center gap-1 text-secondary" title="Cliques">
                        <MousePointer className="h-3 w-3" />{empresa.cliques}
                      </span>
                      <span className="flex items-center gap-1 text-green-600" title="WhatsApp">
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /></svg>
                        {empresa.whatsapp}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-40 items-center justify-center text-muted-foreground">Nenhum dado disponível</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Distribuição por Estado
            </CardTitle>
          </CardHeader>
          <CardContent>
            {estadosData.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={estadosData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" fontSize={11} />
                    <YAxis dataKey="estado" type="category" width={40} fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="total" fill="#1e3a5f" radius={[0, 4, 4, 0]} name="Empresas" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-40 items-center justify-center text-muted-foreground">Nenhum dado disponível</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Atividade Diária Detalhada</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Legend />
                <Bar dataKey="visualizacoes" fill="#1e3a5f" name="Visualizações" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cliques" fill="#22c55e" name="Cliques" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cadastros" fill="#f59e0b" name="Cadastros" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top Cidades + Distribuição por Categoria */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Top 10 Cidades
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cidadesData.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cidadesData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" fontSize={11} />
                    <YAxis dataKey="cidade" type="category" width={100} fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="total" fill="#22c55e" radius={[0, 4, 4, 0]} name="Empresas" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-40 items-center justify-center text-muted-foreground">Nenhum dado disponível</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {categoriasData.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoriasData}
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      dataKey="total"
                      nameKey="categoria"
                      label={({ categoria, total }) => `${categoria}: ${total}`}
                    >
                      {categoriasData.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-40 items-center justify-center text-muted-foreground">Nenhum dado disponível</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Últimas Empresas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Últimas Empresas Cadastradas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ultimasEmpresas.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-2">Nome</th>
                    <th className="py-2 pr-2">Cidade</th>
                    <th className="py-2 pr-2 hidden md:table-cell">Categoria</th>
                    <th className="py-2 pr-2">Plano</th>
                    <th className="py-2 pr-2 hidden sm:table-cell">Data</th>
                    <th className="py-2 pr-2 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {ultimasEmpresas.map((emp) => (
                    <tr key={emp.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-2 pr-2 font-medium truncate max-w-[180px]">{emp.nome}</td>
                      <td className="py-2 pr-2 text-muted-foreground">{emp.cidade}</td>
                      <td className="py-2 pr-2 text-muted-foreground hidden md:table-cell truncate max-w-[140px]">{emp.nicho || "—"}</td>
                      <td className="py-2 pr-2">
                        <Badge variant={emp.plano === "premium" ? "default" : "outline"} className="text-[10px]">
                          {emp.plano || "free"}
                        </Badge>
                      </td>
                      <td className="py-2 pr-2 text-xs text-muted-foreground hidden sm:table-cell">
                        {emp.criado_em ? format(new Date(emp.criado_em), "dd/MM/yy", { locale: ptBR }) : "—"}
                      </td>
                      <td className="py-2 pr-2 text-right">
                        <Button asChild size="sm" variant="ghost">
                          <a href={`/empresa/${emp.slug || emp.id}`} target="_blank" rel="noreferrer">
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex h-20 items-center justify-center text-muted-foreground">Nenhuma empresa cadastrada</div>
          )}
        </CardContent>
      </Card>

      {/* Avaliações Recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Avaliações Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {avaliacoesRecentes.length > 0 ? (
            <div className="space-y-2">
              {avaliacoesRecentes.map((av) => (
                <div key={av.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
                  <div className="flex-shrink-0">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <svg
                          key={i}
                          className={`h-3.5 w-3.5 ${i < av.nota ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"}`}
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm truncate">{av.empresa_nome}</span>
                      <span className="text-xs text-muted-foreground">por {av.nome_avaliador || "Anônimo"}</span>
                      {!av.aprovado && <Badge variant="destructive" className="text-[10px]">Pendente</Badge>}
                    </div>
                    {av.comentario && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{av.comentario}</p>
                    )}
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(av.created_at), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                  <Button asChild size="sm" variant="ghost" className="flex-shrink-0">
                    <a href="/admin/avaliacoes">Moderar</a>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-20 items-center justify-center text-muted-foreground">Nenhuma avaliação ainda</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
