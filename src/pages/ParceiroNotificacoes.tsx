import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Bell, ArrowLeft, CheckCheck, Loader2, CheckCircle2, XCircle, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Notificacao {
  id: string;
  empresa_id: string | null;
  tipo: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  created_at: string;
}

export default function ParceiroNotificacoes() {
  const { user, isParceiro, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || !isParceiro)) navigate("/");
  }, [user, isParceiro, authLoading, navigate]);

  useEffect(() => {
    if (!user || !isParceiro) return;
    const load = async () => {
      const { data } = await (supabase.from as any)("notificacoes_parceiro")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      setNotificacoes((data as Notificacao[]) || []);
      setLoading(false);
      // Mark all as read on view
      await (supabase.rpc as any)("marcar_notificacoes_lidas");
    };
    load();

    // Realtime: anexa nova notificação no topo da lista quando chegar
    const channel = supabase
      .channel("parceiro-notif-page")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notificacoes_parceiro" },
        (payload) => {
          setNotificacoes((prev) => [payload.new as Notificacao, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isParceiro]);

  const marcarTodas = async () => {
    await (supabase.rpc as any)("marcar_notificacoes_lidas");
    setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })));
    toast({ title: "Notificações marcadas como lidas" });
  };

  const iconForTipo = (tipo: string) => {
    if (tipo === "aprovado") return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    if (tipo === "rejeitado") return <XCircle className="h-5 w-5 text-destructive" />;
    if (tipo === "milestone_views") return <TrendingUp className="h-5 w-5 text-amber-500" />;
    return <Bell className="h-5 w-5 text-primary" />;
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

  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/parceiro">
                <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
              </Link>
            </Button>
            <h1 className="font-display text-2xl font-bold md:text-3xl flex items-center gap-2">
              <Bell className="h-6 w-6 text-primary" />
              Notificações
            </h1>
          </div>
          {notificacoes.some((n) => !n.lida) && (
            <Button variant="outline" size="sm" onClick={marcarTodas}>
              <CheckCheck className="mr-2 h-4 w-4" /> Marcar todas como lidas
            </Button>
          )}
        </div>

        {notificacoes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <Bell className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">Você ainda não tem notificações.</p>
              <p className="text-sm text-muted-foreground">
                Quando uma empresa cadastrada por você for aprovada ou rejeitada, ela aparecerá aqui.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {notificacoes.map((n) => (
              <Card key={n.id} className={!n.lida ? "border-primary/40 bg-primary/5" : ""}>
                <CardContent className="flex items-start gap-3 p-4">
                  <div className="mt-0.5">{iconForTipo(n.tipo)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{n.titulo}</p>
                      {!n.lida && <Badge variant="default" className="text-[10px]">Nova</Badge>}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{n.mensagem}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {format(new Date(n.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
