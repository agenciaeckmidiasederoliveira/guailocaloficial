import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Trash2, Loader2, Mail, Copy, Check, Pencil, Crown, Gem } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { z } from "zod";
import { NIVEIS_PARCEIRO, type NivelParceiro } from "@/lib/constants";

interface Parceiro {
  id: string;
  email: string;
  nome: string | null;
  nivel: NivelParceiro;
  cota_premium: number;
  cota_free: number | null;
  data_adicao: string;
  convite_token: string;
}

export function AdminParceiros() {
  const [parceiros, setParceiros] = useState<Parceiro[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Parceiro | null>(null);
  const { toast } = useToast();

  // New invite form
  const [newEmail, setNewEmail] = useState("");
  const [newNome, setNewNome] = useState("");
  const [newNivel, setNewNivel] = useState<NivelParceiro>("bronze");
  const [newCotaPremium, setNewCotaPremium] = useState<number>(NIVEIS_PARCEIRO.bronze.cotaPremium);

  const getInviteLink = (token: string) => `${window.location.origin}/auth?convite=${token}`;

  const copyLink = (token: string, id: string) => {
    navigator.clipboard.writeText(getInviteLink(token));
    setCopiedId(id);
    toast({ title: "Link copiado!", description: "Compartilhe com o parceiro" });
    setTimeout(() => setCopiedId(null), 2000);
  };

  useEffect(() => {
    fetchParceiros();
  }, []);

  // Auto-update cota when nivel changes
  useEffect(() => {
    setNewCotaPremium(NIVEIS_PARCEIRO[newNivel].cotaPremium);
  }, [newNivel]);

  const fetchParceiros = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("parceiros")
      .select("id, email, nome, nivel, cota_premium, cota_free, data_adicao, convite_token")
      .order("data_adicao", { ascending: false });

    if (!error && data) {
      setParceiros(data as unknown as Parceiro[]);
    }
    setLoading(false);
  };

  const addParceiro = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);

    // Validate email if provided
    if (newEmail) {
      const emailSchema = z.string().email("E-mail inválido");
      if (!emailSchema.safeParse(newEmail).success) {
        toast({ title: "Erro", description: "E-mail inválido", variant: "destructive" });
        setAdding(false);
        return;
      }
    }

    const payload = {
      email: newEmail || "",
      nome: newNome || null,
      nivel: newNivel,
      cota_premium: newCotaPremium,
    };

    const { data, error } = await supabase
      .from("parceiros")
      .insert(payload as never)
      .select("id, email, nome, nivel, cota_premium, cota_free, data_adicao, convite_token")
      .single();

    if (error) {
      if (error.code === "23505") {
        toast({ title: "Erro", description: "Este e-mail já está cadastrado", variant: "destructive" });
      } else {
        toast({ title: "Erro", description: "Erro ao adicionar parceiro", variant: "destructive" });
      }
      setAdding(false);
      return;
    }

    if (data) {
      const novo = data as unknown as Parceiro;

      // If email provided, sync profile to parceiro role
      if (newEmail) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", newEmail)
          .single();
        if (profile) {
          await supabase.from("profiles").update({ role: "parceiro" }).eq("id", profile.id);
        }
      }

      // Copy invite link automatically
      navigator.clipboard.writeText(getInviteLink(novo.convite_token));
      toast({
        title: "Parceiro criado e link copiado!",
        description: newEmail ? `Convite enviado para ${newEmail}` : "Link genérico pronto para compartilhar",
      });

      // Reset form
      setNewEmail("");
      setNewNome("");
      setNewNivel("bronze");
      fetchParceiros();
    }
    setAdding(false);
  };

  const saveEdit = async () => {
    if (!editing) return;
    const { error } = await supabase
      .from("parceiros")
      .update({
        nome: editing.nome,
        nivel: editing.nivel,
        cota_premium: editing.cota_premium,
        cota_free: editing.cota_free,
      } as never)
      .eq("id", editing.id);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Parceiro atualizado!" });
      setEditing(null);
      fetchParceiros();
    }
  };

  const removeParceiro = async (id: string, email: string) => {
    const label = email || "este convite";
    if (!confirm(`Tem certeza que deseja remover ${label}?`)) return;

    const { error } = await supabase.from("parceiros").delete().eq("id", id);

    if (!error) {
      toast({ title: "Parceiro removido!" });
      if (email) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", email)
          .single();
        if (profile) {
          await supabase.from("profiles").update({ role: "user" }).eq("id", profile.id);
        }
      }
      fetchParceiros();
    }
  };

  const masterLink = `${window.location.origin}/auth?convite=diamante-master-vip`;
  const copyMasterLink = () => {
    navigator.clipboard.writeText(masterLink);
    setCopiedId("__master__");
    toast({ title: "Link mestre copiado!", description: "Compartilhe no seu WhatsApp" });
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Gerenciar Parceiros</h1>
        <p className="text-muted-foreground">
          Defina nome, nível e cota individual de cada parceiro. O link gerado já vem pré-configurado.
        </p>
      </div>

      {/* MASTER DIAMANTE LINK */}
      <Card className="border-cyan-400/40 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gem className="h-5 w-5 text-cyan-600" />
            Link Mestre Diamante 💎 — Cadastro Automático
          </CardTitle>
          <CardDescription>
            Compartilhe este link único no WhatsApp. Todos que se cadastrarem por ele entram
            <strong> automaticamente como parceiro Diamante (150 cotas Premium)</strong>. Funciona infinitas vezes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input value={masterLink} readOnly className="font-mono text-xs sm:text-sm" />
            <Button onClick={copyMasterLink} className="shrink-0">
              {copiedId === "__master__" ? (
                <><Check className="mr-2 h-4 w-4" /> Copiado</>
              ) : (
                <><Copy className="mr-2 h-4 w-4" /> Copiar link</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add Partner Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Criar Novo Parceiro / Link de Convite
          </CardTitle>
          <CardDescription>
            Configure tudo antes de gerar — o parceiro entra direto com nome, nível e cota corretos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={addParceiro} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome do parceiro (opcional)</Label>
              <Input
                id="nome"
                placeholder="Ex: João Silva"
                value={newNome}
                onChange={(e) => setNewNome(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail (opcional — vazio = link genérico)</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="parceiro@email.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="nivel">Nível</Label>
              <Select value={newNivel} onValueChange={(v) => setNewNivel(v as NivelParceiro)}>
                <SelectTrigger id="nivel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(NIVEIS_PARCEIRO) as [NivelParceiro, typeof NIVEIS_PARCEIRO[NivelParceiro]][]).map(
                    ([key, n]) => (
                      <SelectItem key={key} value={key}>
                        {n.emoji} {n.label} — {n.cotaPremium} Premium
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cota">Cota Premium personalizada</Label>
              <Input
                id="cota"
                type="number"
                min={0}
                value={newCotaPremium}
                onChange={(e) => setNewCotaPremium(Number(e.target.value) || 0)}
              />
            </div>

            <div className="sm:col-span-2">
              <Button type="submit" disabled={adding} className="w-full sm:w-auto">
                {adding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar parceiro e copiar link
              </Button>
              <p className="mt-2 text-xs text-muted-foreground">
                O link será copiado automaticamente para sua área de transferência.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Partners List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Parceiros ({parceiros.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : parceiros.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">Nenhum parceiro ainda</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Parceiro</TableHead>
                    <TableHead>Nível</TableHead>
                    <TableHead className="text-center">Cota Premium</TableHead>
                    <TableHead>Adicionado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parceiros.map((p) => {
                    const nivelInfo = NIVEIS_PARCEIRO[p.nivel] || NIVEIS_PARCEIRO.bronze;
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">
                          <div className="space-y-0.5">
                            <p>{p.nome || <span className="italic text-muted-foreground">Sem nome</span>}</p>
                            <p className="text-xs text-muted-foreground">
                              {p.email || <span className="italic">Convite genérico</span>}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${nivelInfo.bg} ${nivelInfo.color} ${nivelInfo.border}`}
                          >
                            <span>{nivelInfo.emoji}</span>
                            {nivelInfo.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-center font-medium">{p.cota_premium}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(p.data_adicao), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => copyLink(p.convite_token, p.id)}
                              title="Copiar link de convite"
                            >
                              {copiedId === p.id ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                            <Dialog open={editing?.id === p.id} onOpenChange={(o) => !o && setEditing(null)}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => setEditing({ ...p })}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              {editing && (
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Editar parceiro</DialogTitle>
                                    <DialogDescription>{editing.email || "Convite genérico"}</DialogDescription>
                                  </DialogHeader>
                                  <div className="grid gap-4 py-2">
                                    <div className="space-y-1.5">
                                      <Label>Nome</Label>
                                      <Input
                                        value={editing.nome || ""}
                                        onChange={(e) => setEditing({ ...editing, nome: e.target.value })}
                                      />
                                    </div>
                                    <div className="space-y-1.5">
                                      <Label>Nível</Label>
                                      <Select
                                        value={editing.nivel}
                                        onValueChange={(v) =>
                                          setEditing({ ...editing, nivel: v as NivelParceiro })
                                        }
                                      >
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {(Object.entries(NIVEIS_PARCEIRO) as [NivelParceiro, typeof NIVEIS_PARCEIRO[NivelParceiro]][]).map(
                                            ([key, n]) => (
                                              <SelectItem key={key} value={key}>
                                                {n.emoji} {n.label}
                                              </SelectItem>
                                            )
                                          )}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                      <Label>Cota Premium</Label>
                                      <Input
                                        type="number"
                                        min={0}
                                        value={editing.cota_premium}
                                        onChange={(e) =>
                                          setEditing({
                                            ...editing,
                                            cota_premium: Number(e.target.value) || 0,
                                          })
                                        }
                                      />
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button variant="outline" onClick={() => setEditing(null)}>
                                      Cancelar
                                    </Button>
                                    <Button onClick={saveEdit}>Salvar</Button>
                                  </DialogFooter>
                                </DialogContent>
                              )}
                            </Dialog>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => removeParceiro(p.id, p.email)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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
    </div>
  );
}
