import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Loader2 } from "lucide-react";
import { format, subDays, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";

interface Empresa {
  id: string;
  criado_em: string;
  status: string;
}

interface DiaStats {
  dia: string;
  cadastradas: number;
  aprovadas: number;
}

export function MeuImpacto({ userId }: { userId: string }) {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const since = subDays(new Date(), 30).toISOString();
      const { data } = await supabase
        .from("empresas")
        .select("id, criado_em, status")
        .eq("usuario_id", userId)
        .gte("criado_em", since);
      setEmpresas((data as Empresa[]) || []);
      setLoading(false);
    };
    load();
  }, [userId]);

  const chartData = useMemo<DiaStats[]>(() => {
    const days: DiaStats[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = startOfDay(subDays(new Date(), i));
      const label = format(d, "dd/MM", { locale: ptBR });
      const cadastradas = empresas.filter(
        (e) => startOfDay(new Date(e.criado_em)).getTime() === d.getTime()
      ).length;
      const aprovadas = empresas.filter(
        (e) =>
          startOfDay(new Date(e.criado_em)).getTime() === d.getTime() &&
          e.status === "aprovado"
      ).length;
      days.push({ dia: label, cadastradas, aprovadas });
    }
    return days;
  }, [empresas]);

  const total30d = empresas.length;
  const aprovadas30d = empresas.filter((e) => e.status === "aprovado").length;
  const taxa = total30d > 0 ? Math.round((aprovadas30d / total30d) * 100) : 0;

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Meu Impacto (últimos 30 dias)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-3 gap-3">
          <div className="rounded-lg border bg-card p-3 text-center">
            <p className="text-2xl font-bold">{total30d}</p>
            <p className="text-xs text-muted-foreground">Cadastradas</p>
          </div>
          <div className="rounded-lg border bg-card p-3 text-center">
            <p className="text-2xl font-bold text-secondary">{aprovadas30d}</p>
            <p className="text-xs text-muted-foreground">Aprovadas</p>
          </div>
          <div className="rounded-lg border bg-card p-3 text-center">
            <p className="text-2xl font-bold text-primary">{taxa}%</p>
            <p className="text-xs text-muted-foreground">Taxa de aprovação</p>
          </div>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="dia" tick={{ fontSize: 10 }} interval={4} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Line
                type="monotone"
                dataKey="cadastradas"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                name="Cadastradas"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="aprovadas"
                stroke="hsl(var(--secondary))"
                strokeWidth={2}
                name="Aprovadas"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
