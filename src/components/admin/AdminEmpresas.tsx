import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SITE_URL } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { BulkImportXLSX } from "@/components/BulkImportXLSX";
import { Upload } from "lucide-react";
import {
  Search,
  Check,
  X,
  Edit,
  Trash2,
  Star,
  Plus,
  Crown,
  Loader2,
  Copy,
  Sparkles,
  LinkIcon,
  Download,
} from "lucide-react";

interface Empresa {
  id: string;
  nome: string;
  slug: string | null;
  cidade: string;
  estado: string;
  plano: "free" | "premium";
  status: "pendente" | "aprovado" | "rejeitado";
  destaque_banner: boolean;
  destaque_rotacao: boolean;
  descricao: string | null;
  criado_em: string;
}

export function AdminEmpresas() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "pendente" | "aprovado" | "premium">("all");
  const [editingEmpresa, setEditingEmpresa] = useState<Empresa | null>(null);
  const [descricaoSEO, setDescricaoSEO] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchEmpresas();
  }, [filter]);

  const fetchEmpresas = async () => {
    setLoading(true);
    let query = supabase
      .from("empresas")
      .select("id, nome, slug, cidade, estado, plano, status, destaque_banner, destaque_rotacao, descricao, criado_em")
      .order("criado_em", { ascending: false });

    if (filter === "pendente") {
      query = query.eq("status", "pendente");
    } else if (filter === "aprovado") {
      query = query.eq("status", "aprovado");
    } else if (filter === "premium") {
      query = query.eq("plano", "premium");
    }

    const { data, error } = await query;

    if (!error && data) {
      setEmpresas(data as Empresa[]);
    }
    setLoading(false);
    setSelectedIds(new Set());
  };

  const updateStatus = async (id: string, status: "aprovado" | "rejeitado") => {
    const { error } = await supabase
      .from("empresas")
      .update({ status })
      .eq("id", id);

    if (!error) {
      toast({ title: "Sucesso", description: `Empresa ${status === "aprovado" ? "aprovada" : "rejeitada"}!` });
      fetchEmpresas();
    }
  };

  const toggleDestaque = async (id: string, field: "destaque_banner" | "destaque_rotacao", value: boolean) => {
    const { error } = await supabase
      .from("empresas")
      .update({ [field]: value })
      .eq("id", id);

    if (!error) {
      toast({ title: "Sucesso", description: "Destaque atualizado!" });
      fetchEmpresas();
    }
  };

  const deleteEmpresa = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta empresa?")) return;

    const { error } = await supabase
      .from("empresas")
      .delete()
      .eq("id", id);

    if (!error) {
      toast({ title: "Sucesso", description: "Empresa excluída!" });
      fetchEmpresas();
    }
  };

  const saveDescricaoSEO = async () => {
    if (!editingEmpresa) return;

    const { error } = await supabase
      .from("empresas")
      .update({ descricao: descricaoSEO })
      .eq("id", editingEmpresa.id);

    if (!error) {
      toast({ title: "Sucesso", description: "Descrição SEO atualizada!" });
      setEditingEmpresa(null);
      fetchEmpresas();
    }
  };

  // Bulk actions
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredEmpresas.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredEmpresas.map((e) => e.id)));
    }
  };

  const bulkUpdateStatus = async (status: "aprovado" | "rejeitado") => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    const ids = Array.from(selectedIds);
    const { error } = await supabase
      .from("empresas")
      .update({ status })
      .in("id", ids);

    if (!error) {
      toast({ title: "Sucesso", description: `${ids.length} empresa(s) ${status === "aprovado" ? "aprovada(s)" : "rejeitada(s)"}!` });
      fetchEmpresas();
    }
    setBulkLoading(false);
  };

  const bulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Tem certeza que deseja excluir ${selectedIds.size} empresa(s)?`)) return;
    setBulkLoading(true);
    const ids = Array.from(selectedIds);
    const { error } = await supabase
      .from("empresas")
      .delete()
      .in("id", ids);

    if (!error) {
      toast({ title: "Sucesso", description: `${ids.length} empresa(s) excluída(s)!` });
      fetchEmpresas();
    }
    setBulkLoading(false);
  };

  const bulkChangePlano = async (plano: "free" | "premium") => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    const ids = Array.from(selectedIds);
    const { error } = await supabase
      .from("empresas")
      .update({ plano })
      .in("id", ids);

    if (!error) {
      toast({ title: "Sucesso", description: `${ids.length} empresa(s) alterada(s) para ${plano === "premium" ? "Premium" : "Grátis"}!` });
      fetchEmpresas();
    }
    setBulkLoading(false);
  };

  const togglePlanoRapido = async (id: string, currentPlano: string) => {
    const newPlano = currentPlano === "premium" ? "free" : "premium";
    const { error } = await supabase
      .from("empresas")
      .update({ plano: newPlano })
      .eq("id", id);

    if (!error) {
      toast({ title: "Sucesso", description: `Plano alterado para ${newPlano === "premium" ? "Premium" : "Grátis"}!` });
      fetchEmpresas();
    }
  };

  const duplicarEmpresa = async (empresa: Empresa) => {
    // Fetch full empresa data
    const { data: fullEmpresa } = await supabase
      .from("empresas")
      .select("*")
      .eq("id", empresa.id)
      .single();

    if (!fullEmpresa) return;

    const { id, criado_em, atualizado_em, slug, ...rest } = fullEmpresa as any;
    const { error } = await supabase.from("empresas").insert({
      ...rest,
      nome: `Cópia de ${fullEmpresa.nome}`,
      status: "pendente",
      slug: null, // Will be auto-generated by trigger
    } as any);

    if (!error) {
      toast({ title: "Sucesso", description: `Empresa duplicada como "Cópia de ${empresa.nome}"` });
      fetchEmpresas();
    }
  };

  const copyEmpresaLink = (empresa: Empresa) => {
    const slug = empresa.slug || empresa.id;
    const url = `${SITE_URL}/empresa/${slug}`;
    navigator.clipboard.writeText(url).then(() => {
      toast({ title: "Link copiado!", description: url });
    });
  };

  const isNew = (criadoEm: string) => {
    const diff = Date.now() - new Date(criadoEm).getTime();
    return diff < 24 * 60 * 60 * 1000; // 24h
  };

  const filteredEmpresas = empresas.filter((e) =>
    e.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.cidade.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportCSV = () => {
    const headers = ["Nome", "Cidade", "Estado", "Plano", "Status", "Data Cadastro", "Link"];
    const rows = filteredEmpresas.map((e) => [
      e.nome,
      e.cidade,
      e.estado,
      e.plano,
      e.status,
      new Date(e.criado_em).toLocaleDateString("pt-BR"),
      `${SITE_URL}/empresa/${e.slug || e.id}`,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `empresas_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "CSV exportado!", description: `${filteredEmpresas.length} empresas exportadas.` });
  };

  const downloadTemplate = () => {
    const headers = ["nome", "cidade", "estado", "telefone", "whatsapp", "nicho", "endereco", "plano", "status"];
    const csv = [headers].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `template_importacao_empresas.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Template baixado!", description: "Preencha a planilha e importe via XLSX/CSV." });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Gerenciar Empresas</h1>
          <p className="text-muted-foreground">Aprovar, editar e gerenciar empresas cadastradas</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/admin/empresas/nova">
              <Plus className="mr-2 h-4 w-4" />
              Nova Empresa
            </Link>
          </Button>
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Importar XLSX
          </Button>
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="mr-2 h-4 w-4" />
            Template
          </Button>
          <Button variant="outline" onClick={exportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
      </div>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Importar Empresas via XLSX</DialogTitle>
          </DialogHeader>
          {user && (
            <BulkImportXLSX
              usuarioId={user.id}
              planoPadrao="free"
              statusPadrao="aprovado"
              onDone={() => { setImportOpen(false); fetchEmpresas(); }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Lista de Empresas ({filteredEmpresas.length})</CardTitle>
            <div className="flex flex-wrap gap-2">
              {(["all", "pendente", "aprovado", "premium"] as const).map((f) => (
                <Button
                  key={f}
                  variant={filter === f ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(f)}
                >
                  {f === "all" && "Todas"}
                  {f === "pendente" && "Pendentes"}
                  {f === "aprovado" && "Aprovadas"}
                  {f === "premium" && "Premium"}
                </Button>
              ))}
            </div>
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou cidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {/* Bulk Actions Bar */}
          {selectedIds.size > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
              <span className="text-sm font-medium text-primary">
                {selectedIds.size} selecionada(s)
              </span>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => bulkUpdateStatus("aprovado")} disabled={bulkLoading}>
                  <Check className="mr-1 h-3 w-3" /> Aprovar
                </Button>
                <Button size="sm" variant="outline" onClick={() => bulkUpdateStatus("rejeitado")} disabled={bulkLoading}>
                  <X className="mr-1 h-3 w-3" /> Rejeitar
                </Button>
                <Button size="sm" variant="outline" onClick={() => bulkChangePlano("premium")} disabled={bulkLoading}>
                  <Crown className="mr-1 h-3 w-3" /> Premium
                </Button>
                <Button size="sm" variant="outline" onClick={() => bulkChangePlano("free")} disabled={bulkLoading}>
                  Grátis
                </Button>
                <Button size="sm" variant="destructive" onClick={bulkDelete} disabled={bulkLoading}>
                  <Trash2 className="mr-1 h-3 w-3" /> Excluir
                </Button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
            {/* Mobile: Card view */}
            <div className="space-y-3 md:hidden">
              {filteredEmpresas.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma empresa encontrada</p>
              )}
              {filteredEmpresas.map((empresa) => (
                <div
                  key={empresa.id}
                  className={`rounded-lg border p-3 ${selectedIds.has(empresa.id) ? "border-primary bg-primary/5" : "border-border bg-card"}`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedIds.has(empresa.id)}
                      onCheckedChange={() => toggleSelect(empresa.id)}
                      className="mt-1"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium">{empresa.nome}</p>
                        {isNew(empresa.criado_em) && (
                          <Badge className="bg-emerald-500 px-1.5 py-0 text-[10px]">
                            <Sparkles className="mr-0.5 h-2.5 w-2.5" />
                            Nova
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {empresa.cidade}, {empresa.estado}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <button onClick={() => togglePlanoRapido(empresa.id, empresa.plano)} title="Alternar plano">
                          {empresa.plano === "premium" ? (
                            <Badge className="bg-amber-500 hover:bg-amber-600">
                              <Crown className="mr-1 h-3 w-3" />
                              Premium
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Grátis</Badge>
                          )}
                        </button>
                        <Badge
                          variant={
                            empresa.status === "aprovado"
                              ? "default"
                              : empresa.status === "pendente"
                              ? "outline"
                              : "destructive"
                          }
                        >
                          {empresa.status}
                        </Badge>
                        {empresa.destaque_banner && (
                          <Badge variant="outline" className="gap-1">
                            <Star className="h-3 w-3" /> Banner
                          </Badge>
                        )}
                        {empresa.destaque_rotacao && (
                          <Badge variant="outline">🔄 Rotação</Badge>
                        )}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {empresa.status === "pendente" && (
                          <>
                            <Button size="sm" variant="outline" className="h-8 flex-1 min-w-[80px] text-green-600" onClick={() => updateStatus(empresa.id, "aprovado")}>
                              <Check className="mr-1 h-3 w-3" /> Aprovar
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 flex-1 min-w-[80px] text-red-600" onClick={() => updateStatus(empresa.id, "rejeitado")}>
                              <X className="mr-1 h-3 w-3" /> Rejeitar
                            </Button>
                          </>
                        )}
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600" onClick={() => copyEmpresaLink(empresa)} title="Copiar link">
                          <LinkIcon className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => duplicarEmpresa(empresa)} title="Duplicar">
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => navigate(`/admin/empresas/editar/${empresa.id}`)} title="Editar">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => deleteEmpresa(empresa.id)} title="Excluir">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: Table view */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={filteredEmpresas.length > 0 && selectedIds.size === filteredEmpresas.length}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Localização</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Destaques</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmpresas.map((empresa) => (
                    <TableRow key={empresa.id} className={selectedIds.has(empresa.id) ? "bg-primary/5" : ""}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(empresa.id)}
                          onCheckedChange={() => toggleSelect(empresa.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {empresa.nome}
                          {isNew(empresa.criado_em) && (
                            <Badge className="bg-emerald-500 text-[10px] px-1.5 py-0">
                              <Sparkles className="mr-0.5 h-2.5 w-2.5" />
                              Nova
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {empresa.cidade}, {empresa.estado}
                      </TableCell>
                      <TableCell>
                        <button onClick={() => togglePlanoRapido(empresa.id, empresa.plano)} className="cursor-pointer" title="Clique para alternar plano">
                          {empresa.plano === "premium" ? (
                            <Badge className="bg-amber-500 hover:bg-amber-600 transition-colors">
                              <Crown className="mr-1 h-3 w-3" />
                              Premium
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="hover:bg-secondary/80 transition-colors">Grátis</Badge>
                          )}
                        </button>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            empresa.status === "aprovado"
                              ? "default"
                              : empresa.status === "pendente"
                              ? "outline"
                              : "destructive"
                          }
                        >
                          {empresa.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant={empresa.destaque_banner ? "default" : "outline"}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              toggleDestaque(empresa.id, "destaque_banner", !empresa.destaque_banner)
                            }
                            title="Banner 24h"
                          >
                            <Star className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={empresa.destaque_rotacao ? "default" : "outline"}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              toggleDestaque(empresa.id, "destaque_rotacao", !empresa.destaque_rotacao)
                            }
                            title="Rotação horária"
                          >
                            🔄
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          {empresa.status === "pendente" && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-green-600 hover:bg-green-50 hover:text-green-700"
                                onClick={() => updateStatus(empresa.id, "aprovado")}
                                title="Aprovar"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                                onClick={() => updateStatus(empresa.id, "rejeitado")}
                                title="Rejeitar"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                            onClick={() => copyEmpresaLink(empresa)}
                            title="Copiar link da empresa"
                          >
                            <LinkIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => duplicarEmpresa(empresa)}
                            title="Duplicar empresa"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => navigate(`/admin/empresas/editar/${empresa.id}`)}
                            title="Editar empresa"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => deleteEmpresa(empresa.id)}
                            title="Excluir empresa"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredEmpresas.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        Nenhuma empresa encontrada
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingEmpresa} onOpenChange={() => setEditingEmpresa(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Descrição SEO</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Empresa: <strong>{editingEmpresa?.nome}</strong>
            </p>
            <Textarea
              value={descricaoSEO}
              onChange={(e) => setDescricaoSEO(e.target.value)}
              placeholder="Escreva uma descrição otimizada para SEO..."
              rows={6}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingEmpresa(null)}>
              Cancelar
            </Button>
            <Button onClick={saveDescricaoSEO}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
