import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ESTADOS_BR, NIVEIS_PARCEIRO, type NivelParceiro } from "@/lib/constants";
import { CIDADES_BR } from "@/lib/cidades";
import { Download, Loader2, MapPin, Plus, Trash2, Edit, ExternalLink, BarChart3, Users, Building2, DollarSign, Eye, MessageCircle, Trophy, TrendingUp } from "lucide-react";

interface ParceiroAnalytics {
  parceiro_id: string;
  nome: string;
  email: string;
  nivel: NivelParceiro;
  slug: string | null;
  cidades_count: number;
  total_empresas: number;
  total_premium: number;
  total_free: number;
  total_views: number;
  total_whatsapp: number;
  total_telefone: number;
  total_vendas: number;
  total_pagamentos_confirmados: number;
}

interface CidadeAtendida {
  estado: string;
  cidade: string;
}

export function AdminParceirosAnalytics() {
  const [data, setData] = useState<ParceiroAnalytics[]>([]);
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ParceiroAnalytics | null>(null);
  const [cidadesEdit, setCidadesEdit] = useState<CidadeAtendida[]>([]);
  const [bioEdit, setBioEdit] = useState("");
  const [whatsappEdit, setWhatsappEdit] = useState("");
  const [avatarEdit, setAvatarEdit] = useState("");
  const [newEstado, setNewEstado] = useState("");
  const [newCidade, setNewCidade] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    const [{ data: rows }, { data: ov }] = await Promise.all([
      (supabase.rpc as any)("admin_get_parceiros_analytics"),
      (supabase.rpc as any)("admin_get_parceiros_overview"),
    ]);
    if (rows) setData(rows as ParceiroAnalytics[]);
    if (ov) setOverview(ov);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openEdit = async (p: ParceiroAnalytics) => {
    const { data } = await supabase
      .from("parceiros" as any)
      .select("cidades_atendidas, bio, whatsapp, avatar_url")
      .eq("id", p.parceiro_id)
      .single();
    const row = data as any;
    setCidadesEdit((row?.cidades_atendidas || []) as CidadeAtendida[]);
    setBioEdit(row?.bio || "");
    setWhatsappEdit(row?.whatsapp || "");
    setAvatarEdit(row?.avatar_url || "");
    setEditing(p);
  };

  const addCidade = () => {
    if (!newEstado || !newCidade.trim()) return;
    const c = { estado: newEstado, cidade: newCidade.trim() };
    if (cidadesEdit.some((x) => x.estado === c.estado && x.cidade.toLowerCase() === c.cidade.toLowerCase())) {
      toast({ title: "Cidade já adicionada", variant: "destructive" });
      return;
    }
    setCidadesEdit([...cidadesEdit, c]);
    setNewCidade("");
  };

  const removeCidade = (idx: number) => {
    setCidadesEdit(cidadesEdit.filter((_, i) => i !== idx));
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    const { error } = await supabase
      .from("parceiros" as any)
      .update({
        cidades_atendidas: cidadesEdit as any,
        bio: bioEdit || null,
        whatsapp: whatsappEdit.replace(/\D/g, "") || null,
        avatar_url: avatarEdit || null,
      })
      .eq("id", editing.parceiro_id);
    setSaving(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Parceiro atualizado!" });
    setEditing(null);
    fetchData();
  };

  const exportCSV = () => {
    const headers = [
      "Nome",
      "Email",
      "Nível",
      "Cidades",
      "Empresas",
      "Premium",
      "Free",
      "Views",
      "WhatsApp",
      "Telefone",
      "Vendas (R$)",
      "Pagamentos",
    ];
    const rows = data.map((d) => [
      d.nome,
      d.email,
      d.nivel,
      d.cidades_count,
      d.total_empresas,
      d.total_premium,
      d.total_free,
      d.total_views,
      d.total_whatsapp,
      d.total_telefone,
      Number(d.total_vendas).toFixed(2),
      d.total_pagamentos_confirmados,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `parceiros_analytics_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "CSV exportado!" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Analytics dos Parceiros</h1>
          <p className="text-muted-foreground">
            Performance, vendas e gestão regional de cada parceiro do Guia Local BR
          </p>
        </div>
        <Button variant="outline" onClick={exportCSV} disabled={data.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* KPIs globais */}
      {overview && (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          <OverviewKpi icon={Users} label="Parceiros" value={overview.total_parceiros} accent="text-blue-600 bg-blue-50" />
          <OverviewKpi icon={Building2} label="Empresas" value={overview.total_empresas} accent="text-violet-600 bg-violet-50" />
          <OverviewKpi icon={Trophy} label="Premium" value={overview.total_premium} accent="text-amber-600 bg-amber-50" />
          <OverviewKpi icon={Eye} label="Views" value={overview.total_views} accent="text-cyan-600 bg-cyan-50" />
          <OverviewKpi icon={MessageCircle} label="WhatsApp" value={overview.total_whatsapp} accent="text-green-600 bg-green-50" />
          <OverviewKpi icon={DollarSign} label="Vendas" value={`R$ ${Number(overview.total_vendas || 0).toFixed(0)}`} accent="text-emerald-600 bg-emerald-50" />
        </div>
      )}

      {/* Podium top 3 */}
      {!loading && data.length > 0 && <Podium data={data.slice(0, 3)} />}

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5 text-primary" /> Ranking completo
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Parceiro</TableHead>
                    <TableHead>Nível</TableHead>
                    <TableHead className="text-center">Cidades</TableHead>
                    <TableHead className="text-center">Empresas</TableHead>
                    <TableHead className="text-center">Premium</TableHead>
                    <TableHead className="text-center">Views</TableHead>
                    <TableHead className="text-center">WhatsApp</TableHead>
                    <TableHead className="text-right">Vendas</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((p) => {
                    const nivel = NIVEIS_PARCEIRO[p.nivel] || NIVEIS_PARCEIRO.bronze;
                    return (
                      <TableRow key={p.parceiro_id}>
                        <TableCell>
                          <div className="font-medium">{p.nome}</div>
                          <div className="text-xs text-muted-foreground">{p.email}</div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${nivel.bg} ${nivel.color} border-0`}>
                            {nivel.emoji} {nivel.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">{p.cidades_count}</TableCell>
                        <TableCell className="text-center font-medium">{p.total_empresas}</TableCell>
                        <TableCell className="text-center">
                          <span className="font-medium text-amber-600">{p.total_premium}</span>
                          <span className="text-xs text-muted-foreground"> / {p.total_free}</span>
                        </TableCell>
                        <TableCell className="text-center">{p.total_views}</TableCell>
                        <TableCell className="text-center text-green-600 font-medium">
                          {p.total_whatsapp}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="font-medium">R$ {Number(p.total_vendas).toFixed(2)}</div>
                          <div className="text-xs text-muted-foreground">
                            {p.total_pagamentos_confirmados} pagamentos
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="default" asChild>
                              <Link to={`/admin/parceiros-analytics/${p.parceiro_id}`}>
                                <TrendingUp className="h-4 w-4 mr-1" /> Detalhes
                              </Link>
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => openEdit(p)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            {p.slug && (
                              <Button size="sm" variant="ghost" asChild>
                                <Link to={`/parceiro-local/${p.slug}`} target="_blank">
                                  <ExternalLink className="h-4 w-4" />
                                </Link>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar {editing?.nome}</DialogTitle>
            <DialogDescription>
              Configure as cidades atendidas, bio pública e contato WhatsApp deste parceiro.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div>
              <Label>Bio (aparece na página pública)</Label>
              <Textarea
                value={bioEdit}
                onChange={(e) => setBioEdit(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Resuma quem é o parceiro e como ele atende a região..."
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>WhatsApp (somente dígitos com DDD)</Label>
                <Input
                  value={whatsappEdit}
                  onChange={(e) => setWhatsappEdit(e.target.value)}
                  placeholder="35999999999"
                />
              </div>
              <div>
                <Label>URL do avatar</Label>
                <Input
                  value={avatarEdit}
                  onChange={(e) => setAvatarEdit(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div>
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Cidades atendidas
              </Label>
              <div className="mt-2 grid grid-cols-[120px_1fr_auto] gap-2">
                <Select value={newEstado} onValueChange={setNewEstado}>
                  <SelectTrigger>
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS_BR.map((e) => (
                      <SelectItem key={e.sigla} value={e.sigla}>
                        {e.sigla} — {e.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={newCidade}
                  onChange={(e) => setNewCidade(e.target.value)}
                  placeholder="Nome da cidade"
                  list="cidades-sugestoes"
                />
                <datalist id="cidades-sugestoes">
                  {newEstado &&
                    CIDADES_BR[newEstado]?.map((c) => (
                      <option key={c.cidade} value={c.label} />
                    ))}
                </datalist>
                <Button type="button" onClick={addCidade}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {cidadesEdit.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhuma cidade adicionada.</p>
                )}
                {cidadesEdit.map((c, idx) => (
                  <Badge key={idx} variant="secondary" className="gap-1 pl-3 pr-1">
                    {c.cidade} — {c.estado}
                    <button
                      type="button"
                      onClick={() => removeCidade(idx)}
                      className="ml-1 rounded p-0.5 hover:bg-destructive/20"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button onClick={saveEdit} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OverviewKpi({ icon: Icon, label, value, accent }: any) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`p-2 rounded-lg ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
          <p className="text-lg font-bold leading-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Podium({ data }: { data: ParceiroAnalytics[] }) {
  const order = [1, 0, 2]; // 2º, 1º, 3º (visual de pódio)
  const heights = ["h-28", "h-36", "h-24"];
  const medals = ["🥈", "🥇", "🥉"];
  const gradients = [
    "from-slate-300 to-slate-400",
    "from-amber-300 to-amber-500",
    "from-orange-300 to-orange-500",
  ];

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="h-5 w-5 text-amber-500" /> Pódio dos parceiros
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3 items-end">
          {order.map((idx, pos) => {
            const p = data[idx];
            if (!p) return <div key={pos} />;
            return (
              <Link
                key={p.parceiro_id}
                to={`/admin/parceiros-analytics/${p.parceiro_id}`}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="text-2xl">{medals[pos]}</div>
                <div className="text-center">
                  <div className="font-bold text-sm truncate max-w-[120px] group-hover:text-primary">
                    {p.nome}
                  </div>
                  <div className="text-xs text-muted-foreground">{p.total_empresas} empresas</div>
                </div>
                <div className={`w-full rounded-t-lg bg-gradient-to-t ${gradients[pos]} ${heights[pos]} flex flex-col items-center justify-center text-white shadow-lg`}>
                  <div className="text-2xl font-bold">{p.total_views}</div>
                  <div className="text-[10px] uppercase opacity-90">views</div>
                  <div className="text-xs mt-1 font-medium">R$ {Number(p.total_vendas).toFixed(0)}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
