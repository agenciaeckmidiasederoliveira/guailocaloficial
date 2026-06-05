import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PARCEIRO_LIMITS, WHATSAPP_NUMBER, SITE_URL, NIVEIS_PARCEIRO, type NivelParceiro } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { RankingParceiros } from "@/components/parceiros/RankingParceiros";
import { MeuImpacto } from "@/components/parceiros/MeuImpacto";
import { BulkImportXLSX } from "@/components/BulkImportXLSX";
import { MapPin, Upload } from "lucide-react";
import {
  Building2,
  Crown,
  Plus,
  MessageCircle,
  TrendingUp,
  Eye,
  Loader2,
  ExternalLink,
  LinkIcon,
  Star,
  MousePointerClick,
  CreditCard,
  Bell,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ParceiroInfo {
  id: string;
  nome: string | null;
  nivel: NivelParceiro;
  cota_premium: number;
  cota_free: number | null;
}

interface EmpresaParceiro {
  id: string;
  slug: string | null;
  nome: string;
  cidade: string;
  estado: string;
  plano: string;
  status: string;
  criado_em: string;
}

interface Pagamento {
  id: string;
  empresa_id: string | null;
  valor: number;
  status: string;
  metodo_pagamento: string | null;
  created_at: string;
}

interface EmpresaStats {
  empresa_id: string;
  views: number;
  whatsapp_clicks: number;
  telefone_clicks: number;
  site_clicks: number;
  avg_nota: number;
  total_avaliacoes: number;
}

export default function Parceiro() {
  const { user, isParceiro, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [empresas, setEmpresas] = useState<EmpresaParceiro[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Map<string, EmpresaStats>>(new Map());
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [parceiroInfo, setParceiroInfo] = useState<ParceiroInfo | null>(null);
  const [unreadNotif, setUnreadNotif] = useState(0);
  const [empresasRegiao, setEmpresasRegiao] = useState<any[]>([]);
  const [parceiroExtra, setParceiroExtra] = useState<{ slug: string | null; cidades_atendidas: any[] } | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || !isParceiro)) {
      navigate("/");
    }
  }, [user, isParceiro, authLoading, navigate]);

  useEffect(() => {
    if (user && isParceiro) {
      fetchAll();
      // Fetch parceiro own info (nome, nivel, cotas)
      (supabase.rpc as any)("get_my_parceiro_info").then(({ data }: { data: ParceiroInfo[] | null }) => {
        if (data && data.length > 0) {
          setParceiroInfo(data[0]);
        }
      });
      // Fetch parceiro extra info (slug, cidades_atendidas) direto da tabela
      supabase.from("parceiros").select("slug, cidades_atendidas").eq("email", user.email?.toLowerCase() || "").maybeSingle().then(({ data }) => {
        if (data) setParceiroExtra({ slug: data.slug, cidades_atendidas: (data.cidades_atendidas as any) || [] });
      });
      // Empresas da região
      (supabase.rpc as any)("get_empresas_das_minhas_cidades").then(({ data }: { data: any[] | null }) => {
        setEmpresasRegiao(data || []);
      });
      // Fetch unread notifications count
      (supabase.rpc as any)("count_minhas_notificacoes_nao_lidas").then(({ data }: { data: number | null }) => {
        setUnreadNotif(data || 0);
      });

      // Realtime: atualiza badge quando chega nova notificação
      const channel = supabase
        .channel("parceiro-notificacoes")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "notificacoes_parceiro" },
          () => {
            (supabase.rpc as any)("count_minhas_notificacoes_nao_lidas").then(
              ({ data }: { data: number | null }) => setUnreadNotif(data || 0)
            );
            toast({
              title: "🔔 Nova notificação!",
              description: "Confira a aba notificações para ver os detalhes.",
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, isParceiro, toast]);

  const fetchAll = async () => {
    if (!user) return;
    setLoading(true);

    const [empresasRes, pagamentosRes] = await Promise.all([
      supabase
        .from("empresas")
        .select("id, slug, nome, cidade, estado, plano, status, criado_em")
        .eq("usuario_id", user.id)
        .order("criado_em", { ascending: false }),
      supabase
        .from("pagamentos")
        .select("id, empresa_id, valor, status, metodo_pagamento, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    const empresasList = empresasRes.data || [];
    setEmpresas(empresasList);
    setPagamentos(pagamentosRes.data || []);

    // Fetch analytics and reviews for each empresa
    if (empresasList.length > 0) {
      const ids = empresasList.map((e) => e.id);

      const [analyticsRes, avaliacoesRes] = await Promise.all([
        supabase
          .from("analytics_events")
          .select("empresa_id, tipo")
          .in("empresa_id", ids),
        supabase
          .from("avaliacoes")
          .select("empresa_id, nota")
          .in("empresa_id", ids),
      ]);

      const statsMap = new Map<string, EmpresaStats>();
      ids.forEach((id) => {
        statsMap.set(id, {
          empresa_id: id,
          views: 0,
          whatsapp_clicks: 0,
          telefone_clicks: 0,
          site_clicks: 0,
          avg_nota: 0,
          total_avaliacoes: 0,
        });
      });

      (analyticsRes.data || []).forEach((a) => {
        if (!a.empresa_id) return;
        const s = statsMap.get(a.empresa_id);
        if (!s) return;
        if (a.tipo === "page_view" || a.tipo === "foto_view") s.views++;
        if (a.tipo === "whatsapp_click") s.whatsapp_clicks++;
        if (a.tipo === "phone_click") s.telefone_clicks++;
        if (a.tipo === "site_click") s.site_clicks++;
      });

      (avaliacoesRes.data || []).forEach((a) => {
        const s = statsMap.get(a.empresa_id);
        if (!s) return;
        s.total_avaliacoes++;
        s.avg_nota = ((s.avg_nota * (s.total_avaliacoes - 1)) + a.nota) / s.total_avaliacoes;
      });

      setStats(statsMap);
    }

    setLoading(false);
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user || !isParceiro) return null;

  const totalEmpresas = empresas.length;
  const premiumEmpresas = empresas.filter((e) => e.plano === "premium").length;
  const freeEmpresas = empresas.filter((e) => e.plano === "free").length;
  const aprovadas = empresas.filter((e) => e.status === "aprovado").length;

  const cotaPremium = parceiroInfo?.cota_premium ?? PARCEIRO_LIMITS.premiumEmpresas;
  const canAddPremium = true; // Removido o limite (Prompt 3)
  const cotaPercent = 100; // Sempre 100% ou 0, pois é ilimitado
  const nivelInfo = parceiroInfo ? NIVEIS_PARCEIRO[parceiroInfo.nivel] : NIVEIS_PARCEIRO.bronze;

  // Color the bar by % usage
  const cotaBarColor = "bg-green-500";

  const totalViews = Array.from(stats.values()).reduce((sum, s) => sum + s.views, 0);
  const totalWhatsapp = Array.from(stats.values()).reduce((sum, s) => sum + s.whatsapp_clicks, 0);

  const copyEmpresaLink = (empresa: EmpresaParceiro) => {
    const slug = empresa.slug || empresa.id;
    const url = `${SITE_URL}/empresa/${slug}`;
    navigator.clipboard.writeText(url).then(() => {
      toast({ title: "Link copiado!", description: url });
    });
  };

  const whatsappSupport = `https://wa.me/${WHATSAPP_NUMBER}?text=Olá, sou parceiro do Guia Local BR e preciso de suporte!`;

  const statusLabel = (s: string) =>
    s === "CONFIRMED" || s === "RECEIVED" ? "Pago" :
    s === "PENDING" || s === "pendente" ? "Pendente" :
    s === "OVERDUE" ? "Vencido" : s;

  const statusVariant = (s: string) =>
    s === "CONFIRMED" || s === "RECEIVED" ? "default" as const :
    s === "PENDING" || s === "pendente" ? "secondary" as const : "destructive" as const;

  return (
    <Layout>
      <div className="bg-gradient-hero py-10 text-primary-foreground">
        <div className="container">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${nivelInfo.gradient} text-2xl shadow-lg`}>
                {nivelInfo.emoji}
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold md:text-3xl">
                  {parceiroInfo?.nome ? `Olá, ${parceiroInfo.nome}!` : "Área do Parceiro"}
                </h1>
                <p className="text-primary-foreground/80">
                  Parceiro <span className="font-semibold">{nivelInfo.label}</span> • Cota Premium: Ilimitado
                </p>
              </div>
            </div>
            <Button asChild variant="secondary" size="sm" className="relative">
              <Link to="/parceiro/notificacoes">
                <Bell className="mr-2 h-4 w-4" />
                Notificações
                {unreadNotif > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground shadow">
                    {unreadNotif > 9 ? "9+" : unreadNotif}
                  </span>
                )}
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="container py-8 space-y-6">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalEmpresas}</p>
                <p className="text-sm text-muted-foreground">Total de Empresas</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                <Eye className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalViews}</p>
                <p className="text-sm text-muted-foreground">Visualizações</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
                <MousePointerClick className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalWhatsapp}</p>
                <p className="text-sm text-muted-foreground">Cliques WhatsApp</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10">
                <Crown className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {premiumEmpresas}
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    (ilimitado)
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">Premium</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Sua cota Premium</span>
              <span className="text-muted-foreground">
                <strong className="text-foreground">{premiumEmpresas}</strong> cadastradas (sem limites)
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all ${cotaBarColor}`}
                style={{ width: `100%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Cadastros <strong>Premium e Grátis</strong> são ilimitados para o seu plano de Parceiro!
            </p>
          </CardContent>
        </Card>

        {/* Meu Impacto - Gráfico 30 dias */}
        <MeuImpacto userId={user.id} />

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/cadastro">
              <Plus className="mr-2 h-4 w-4" />
              Cadastrar Nova Empresa
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <a href={whatsappSupport} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="mr-2 h-4 w-4" />
              Suporte via WhatsApp
            </a>
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="empresas" className="space-y-4">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="empresas">Minhas Empresas</TabsTrigger>
            <TabsTrigger value="regiao">Região</TabsTrigger>
            <TabsTrigger value="importar">Importar XLSX</TabsTrigger>
            <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
          </TabsList>

          <TabsContent value="regiao">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Empresas da Minha Região
                </CardTitle>
                <CardDescription>
                  Todas as empresas aprovadas nas cidades que você atende
                  {parceiroExtra?.slug && (
                    <> · <Link to={`/parceiro-local/${parceiroExtra.slug}`} className="text-primary underline">ver minha página pública</Link></>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="mb-2 text-sm font-medium">Cidades atendidas ({parceiroExtra?.cidades_atendidas.length || 0})</p>
                  {(!parceiroExtra?.cidades_atendidas || parceiroExtra.cidades_atendidas.length === 0) ? (
                    <p className="text-sm text-muted-foreground">Nenhuma cidade atribuída ainda. Solicite ao admin via WhatsApp.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {parceiroExtra.cidades_atendidas.map((c: any, i: number) => (
                        <Badge key={i} variant="secondary">
                          <MapPin className="mr-1 h-3 w-3" />
                          {c.cidade}/{c.estado}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="border-t pt-4">
                  <p className="mb-3 text-sm font-medium">Empresas aprovadas ({empresasRegiao.length})</p>
                  {empresasRegiao.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma empresa aprovada nas suas cidades ainda.</p>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {empresasRegiao.map((e) => (
                        <Link key={e.id} to={`/empresa/${e.slug || e.id}`} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50">
                          <div className="min-w-0">
                            <p className="truncate font-medium">{e.nome}</p>
                            <p className="text-xs text-muted-foreground">{e.cidade}/{e.estado} · {e.nicho || "—"}</p>
                          </div>
                          <Badge variant={e.plano === "premium" ? "default" : "secondary"} className={e.plano === "premium" ? "bg-amber-500" : ""}>
                            {e.plano === "premium" ? "Premium" : "Free"}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="importar">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Importar Empresas via XLSX
                </CardTitle>
                <CardDescription>
                  Baixe o modelo, preencha em planilha e suba aqui. As empresas serão cadastradas em seu nome como Grátis aprovadas.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BulkImportXLSX usuarioId={user.id} planoPadrao="free" statusPadrao="aprovado" onDone={fetchAll} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="empresas">
            <Card>
              <CardHeader>
                <CardTitle>Minhas Empresas</CardTitle>
                <CardDescription>
                  Desempenho e status de cada empresa
                </CardDescription>
              </CardHeader>
              <CardContent>
                {empresas.length === 0 ? (
                  <div className="py-12 text-center">
                    <Building2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                    <p className="text-muted-foreground">Nenhuma empresa cadastrada ainda</p>
                    <Button asChild className="mt-4">
                      <Link to="/cadastro">Cadastrar Primeira Empresa</Link>
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Mobile: Cards */}
                    <div className="space-y-3 md:hidden">
                      {empresas.map((empresa) => {
                        const s = stats.get(empresa.id);
                        return (
                          <div key={empresa.id} className="rounded-lg border border-border bg-card p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-medium">{empresa.nome}</p>
                                <p className="text-xs text-muted-foreground">
                                  {empresa.cidade}/{empresa.estado}
                                </p>
                              </div>
                              <Badge
                                variant={empresa.plano === "premium" ? "default" : "secondary"}
                                className={empresa.plano === "premium" ? "bg-amber-500 hover:bg-amber-600 shrink-0" : "shrink-0"}
                              >
                                {empresa.plano === "premium" ? "Premium" : "Grátis"}
                              </Badge>
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                              <Badge
                                variant={
                                  empresa.status === "aprovado" ? "default" :
                                  empresa.status === "pendente" ? "secondary" : "destructive"
                                }
                              >
                                {empresa.status === "aprovado" ? "Online" :
                                 empresa.status === "pendente" ? "Pendente" : "Rejeitado"}
                              </Badge>
                              {s && s.total_avaliacoes > 0 && (
                                <span className="inline-flex items-center gap-1 text-xs">
                                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                  {s.avg_nota.toFixed(1)} ({s.total_avaliacoes})
                                </span>
                              )}
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                              <div className="rounded-md bg-muted/50 p-2">
                                <p className="text-base font-bold leading-none">{s?.views || 0}</p>
                                <p className="mt-1 text-[10px] text-muted-foreground">Visualizações</p>
                              </div>
                              <div className="rounded-md bg-muted/50 p-2">
                                <p className="text-base font-bold leading-none">{s?.whatsapp_clicks || 0}</p>
                                <p className="mt-1 text-[10px] text-muted-foreground">WhatsApp</p>
                              </div>
                            </div>
                            <div className="mt-3 flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => copyEmpresaLink(empresa)}
                              >
                                <LinkIcon className="mr-1 h-3 w-3" />
                                Link
                              </Button>
                              <Button variant="outline" size="sm" className="flex-1" asChild>
                                <Link to={`/empresa/${empresa.slug || empresa.id}`}>
                                  <ExternalLink className="mr-1 h-3 w-3" />
                                  Ver
                                </Link>
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Desktop: Table */}
                    <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Plano</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-center">Views</TableHead>
                          <TableHead className="text-center">WhatsApp</TableHead>
                          <TableHead className="text-center">Avaliação</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {empresas.map((empresa) => {
                          const s = stats.get(empresa.id);
                          return (
                            <TableRow key={empresa.id}>
                              <TableCell className="font-medium max-w-[180px] truncate">
                                <div>
                                  <p className="truncate">{empresa.nome}</p>
                                  <p className="text-xs text-muted-foreground">{empresa.cidade}/{empresa.estado}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={empresa.plano === "premium" ? "default" : "secondary"}
                                  className={empresa.plano === "premium" ? "bg-amber-500 hover:bg-amber-600" : ""}
                                >
                                  {empresa.plano === "premium" ? "Premium" : "Grátis"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    empresa.status === "aprovado" ? "default" :
                                    empresa.status === "pendente" ? "secondary" : "destructive"
                                  }
                                >
                                  {empresa.status === "aprovado" ? "Online" :
                                   empresa.status === "pendente" ? "Pendente" : "Rejeitado"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className="text-sm font-medium">{s?.views || 0}</span>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className="text-sm font-medium">{s?.whatsapp_clicks || 0}</span>
                              </TableCell>
                              <TableCell className="text-center">
                                {s && s.total_avaliacoes > 0 ? (
                                  <div className="flex items-center justify-center gap-1">
                                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                    <span className="text-sm font-medium">{s.avg_nota.toFixed(1)}</span>
                                    <span className="text-xs text-muted-foreground">({s.total_avaliacoes})</span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground">—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => copyEmpresaLink(empresa)}
                                    title="Copiar link"
                                  >
                                    <LinkIcon className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" asChild>
                                    <Link to={`/empresa/${empresa.slug || empresa.id}`}>
                                      <ExternalLink className="mr-1 h-3 w-3" />
                                      Ver
                                    </Link>
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pagamentos">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Histórico de Pagamentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pagamentos.length === 0 ? (
                  <div className="py-12 text-center">
                    <CreditCard className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                    <p className="text-muted-foreground">Nenhum pagamento registrado</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Empresa</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Método</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pagamentos.map((p) => {
                          const empresa = empresas.find((e) => e.id === p.empresa_id);
                          return (
                            <TableRow key={p.id}>
                              <TableCell className="text-sm">
                                {format(new Date(p.created_at), "dd/MM/yyyy", { locale: ptBR })}
                              </TableCell>
                              <TableCell className="font-medium">
                                {empresa?.nome || "—"}
                              </TableCell>
                              <TableCell>R$ {Number(p.valor).toFixed(2)}</TableCell>
                              <TableCell className="text-sm">
                                {p.metodo_pagamento || "—"}
                              </TableCell>
                              <TableCell>
                                <Badge variant={statusVariant(p.status)}>
                                  {statusLabel(p.status)}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Ranking de Parceiros */}
        <RankingParceiros highlightId={parceiroInfo?.id} />
      </div>
    </Layout>
  );
}
