import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Download, RefreshCw, Shield, FileSpreadsheet, Users, BarChart3, Building2, Upload, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, subDays } from "date-fns";
import { AdminZipRestore } from "./AdminZipRestore";

export function AdminConfiguracoes() {
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  const [exportingCSV, setExportingCSV] = useState<string | null>(null);
  const [analyticsPeriod, setAnalyticsPeriod] = useState("30");
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restoreMode, setRestoreMode] = useState<"upsert" | "insert">("upsert");
  const [restoring, setRestoring] = useState(false);
  const [restoreReport, setRestoreReport] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportData = async () => {
    setExporting(true);
    try {
      const tables = [
        "empresas",
        "analytics",
        "avaliacoes",
        "blog_posts",
        "client_pages",
        "client_service_pages",
        "empresa_milestones",
        "favoritos",
        "notificacoes_parceiro",
        "pagamentos",
        "parceiros",
        "profiles",
        "user_roles",
      ] as const;

      const results = await Promise.all(
        tables.map(async (t) => {
          const { data, error } = await supabase.from(t as any).select("*");
          return [t, error ? { __error: error.message } : data] as const;
        })
      );

      // Fetch auth users + storage list via edge function
      let extra: any = { auth_users: [], storage_files: [], counts: { users: 0, files: 0 } };
      try {
        const { data: extraData, error: extraErr } = await supabase.functions.invoke("admin-backup");
        if (!extraErr && extraData) extra = extraData;
      } catch (e) {
        console.warn("admin-backup falhou", e);
      }

      const exportPayload: Record<string, unknown> = {
        exportDate: new Date().toISOString(),
        version: 3,
        totalTables: tables.length,
        auth_users: extra.auth_users,
        storage_files: extra.storage_files,
        counts: extra.counts,
      };
      for (const [t, data] of results) {
        exportPayload[t] = data;
      }

      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `guia-local-br-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Backup completo!",
        description: `${tables.length} tabelas + ${extra.counts.users} usuários + ${extra.counts.files} arquivos exportados.`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao exportar backup",
        variant: "destructive",
      });
    }
    setExporting(false);
  };

  const handleRestore = async () => {
    if (!restoreFile) return;
    setRestoring(true);
    setRestoreReport(null);
    try {
      const text = await restoreFile.text();
      const backup = JSON.parse(text);

      const { data, error } = await supabase.functions.invoke("admin-restore", {
        body: { backup, mode: restoreMode },
      });

      if (error) throw error;
      setRestoreReport(data.report);
      toast({ title: "Restauração concluída!", description: "Veja o relatório por tabela abaixo." });
    } catch (e: any) {
      toast({ title: "Erro na restauração", description: e.message || String(e), variant: "destructive" });
    }
    setRestoring(false);
  };


  const downloadCSV = (filename: string, headers: string[], rows: string[][]) => {
    const bom = "\uFEFF"; // UTF-8 BOM for Excel
    const csv = bom + [headers.join(";"), ...rows.map((r) => r.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(";"))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportEmpresasCSV = async () => {
    setExportingCSV("empresas");
    try {
      const { data } = await supabase.from("empresas").select("*").order("criado_em", { ascending: false });
      if (!data) throw new Error("Sem dados");

      const headers = ["Nome", "Endereço", "Cidade", "Estado", "Telefone", "WhatsApp", "Site", "Nicho", "Plano", "Status", "Destaque Banner", "Destaque Rotação", "Data Cadastro"];
      const rows = data.map((e: any) => [
        e.nome, e.endereco, e.cidade, e.estado, e.telefone, e.whatsapp,
        e.site || "", e.nicho || "", e.plano || "free", e.status || "pendente",
        e.destaque_banner ? "Sim" : "Não", e.destaque_rotacao ? "Sim" : "Não",
        e.criado_em ? format(new Date(e.criado_em), "dd/MM/yyyy HH:mm") : "",
      ]);

      downloadCSV(`empresas_${format(new Date(), "yyyy-MM-dd")}.csv`, headers, rows);
      toast({ title: "Sucesso", description: `${data.length} empresas exportadas!` });
    } catch {
      toast({ title: "Erro", description: "Erro ao exportar empresas", variant: "destructive" });
    }
    setExportingCSV(null);
  };

  const exportAnalyticsCSV = async () => {
    setExportingCSV("analytics");
    try {
      const startDate = format(subDays(new Date(), parseInt(analyticsPeriod)), "yyyy-MM-dd");
      const { data } = await supabase
        .from("analytics")
        .select("*")
        .gte("data_hora", `${startDate}T00:00:00`)
        .order("data_hora", { ascending: false });

      if (!data) throw new Error("Sem dados");

      const headers = ["Tipo Evento", "Página", "Cidade Usuário", "Dispositivo", "Referrer", "Termo Busca", "Session ID", "Data/Hora"];
      const rows = data.map((a: any) => [
        a.tipo_evento, a.pagina || "", a.cidade_usuario || "", a.dispositivo || "",
        a.referrer || "", a.busca_termo || "", a.session_id || "",
        a.data_hora ? format(new Date(a.data_hora), "dd/MM/yyyy HH:mm:ss") : "",
      ]);

      downloadCSV(`analytics_${analyticsPeriod}dias_${format(new Date(), "yyyy-MM-dd")}.csv`, headers, rows);
      toast({ title: "Sucesso", description: `${data.length} registros exportados!` });
    } catch {
      toast({ title: "Erro", description: "Erro ao exportar analytics", variant: "destructive" });
    }
    setExportingCSV(null);
  };

  const exportParceirosCSV = async () => {
    setExportingCSV("parceiros");
    try {
      const { data } = await supabase.from("parceiros").select("*").order("data_adicao", { ascending: false });
      if (!data) throw new Error("Sem dados");

      const headers = ["E-mail", "Data de Adição"];
      const rows = data.map((p: any) => [
        p.email,
        p.data_adicao ? format(new Date(p.data_adicao), "dd/MM/yyyy HH:mm") : "",
      ]);

      downloadCSV(`parceiros_${format(new Date(), "yyyy-MM-dd")}.csv`, headers, rows);
      toast({ title: "Sucesso", description: `${data.length} parceiros exportados!` });
    } catch {
      toast({ title: "Erro", description: "Erro ao exportar parceiros", variant: "destructive" });
    }
    setExportingCSV(null);
  };

  const resetDestaques = async () => {
    if (!confirm("Tem certeza que deseja resetar todos os destaques?")) return;

    await supabase
      .from("empresas")
      .update({ destaque_banner: false, destaque_rotacao: false })
      .neq("id", "00000000-0000-0000-0000-000000000000");

    toast({ title: "Sucesso", description: "Destaques resetados!" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground">Gerenciar configurações e exportações do sistema</p>
      </div>

      {/* CSV Exports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Exportação CSV
          </CardTitle>
          <CardDescription>
            Exporte dados em formato CSV compatível com Excel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Empresas</span>
              </div>
              <p className="text-xs text-muted-foreground">Todas as empresas com todos os campos</p>
              <Button size="sm" className="w-full" onClick={exportEmpresasCSV} disabled={exportingCSV === "empresas"}>
                {exportingCSV === "empresas" ? <RefreshCw className="mr-2 h-3 w-3 animate-spin" /> : <Download className="mr-2 h-3 w-3" />}
                Exportar
              </Button>
            </div>

            <div className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Analytics</span>
              </div>
              <Select value={analyticsPeriod} onValueChange={setAnalyticsPeriod}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Últimos 7 dias</SelectItem>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                  <SelectItem value="90">Últimos 90 dias</SelectItem>
                  <SelectItem value="365">Último ano</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" className="w-full" onClick={exportAnalyticsCSV} disabled={exportingCSV === "analytics"}>
                {exportingCSV === "analytics" ? <RefreshCw className="mr-2 h-3 w-3 animate-spin" /> : <Download className="mr-2 h-3 w-3" />}
                Exportar
              </Button>
            </div>

            <div className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Parceiros</span>
              </div>
              <p className="text-xs text-muted-foreground">Lista completa de parceiros</p>
              <Button size="sm" className="w-full" onClick={exportParceirosCSV} disabled={exportingCSV === "parceiros"}>
                {exportingCSV === "parceiros" ? <RefreshCw className="mr-2 h-3 w-3 animate-spin" /> : <Download className="mr-2 h-3 w-3" />}
                Exportar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Backup JSON */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Backup Completo
          </CardTitle>
          <CardDescription>
            Exporta <strong>tudo</strong>: 13 tabelas do banco, usuários do sistema de autenticação e a lista completa de arquivos do Storage (com URLs públicas) em um único JSON.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={exportData} disabled={exporting}>
            {exporting ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Exportar Backup JSON
          </Button>
          <Button variant="outline" onClick={() => setRestoreOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Restaurar de Backup JSON (Antigo)
          </Button>
          <AdminZipRestore />
        </CardContent>
      </Card>

      {/* Restore Dialog */}
      <Dialog open={restoreOpen} onOpenChange={(o) => { setRestoreOpen(o); if (!o) { setRestoreFile(null); setRestoreReport(null); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" /> Restaurar Backup
            </DialogTitle>
            <DialogDescription>
              Carregue um arquivo JSON exportado anteriormente. Os dados serão restaurados nas tabelas do banco respeitando a ordem de dependências.
            </DialogDescription>
          </DialogHeader>

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Atenção</AlertTitle>
            <AlertDescription className="text-xs space-y-1">
              <div>• <strong>Usuários do auth</strong> e <strong>arquivos do Storage</strong> não são restaurados automaticamente (apenas mantidos no JSON para referência).</div>
              <div>• Modo <strong>upsert</strong> sobrescreve registros existentes com mesmo ID.</div>
              <div>• Modo <strong>insert</strong> falha em IDs duplicados (mais seguro para mesclar bases).</div>
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Arquivo .json</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                onChange={(e) => setRestoreFile(e.target.files?.[0] ?? null)}
                className="block w-full mt-1 text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-primary file:text-primary-foreground"
              />
            </div>

            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={restoreMode === "upsert"} onCheckedChange={() => setRestoreMode("upsert")} />
                Upsert (sobrescreve)
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={restoreMode === "insert"} onCheckedChange={() => setRestoreMode("insert")} />
                Insert (mantém existentes)
              </label>
            </div>

            {restoreReport && (
              <div className="max-h-64 overflow-auto rounded border border-border p-3 text-xs space-y-1 bg-muted/30">
                <div className="font-medium mb-1">Relatório:</div>
                {Object.entries(restoreReport).map(([t, r]: any) => (
                  <div key={t} className="flex justify-between gap-2">
                    <span className="font-mono">{t}</span>
                    <span className={r.failed > 0 ? "text-destructive" : "text-green-600"}>
                      ✓ {r.inserted} {r.failed > 0 && `· ✗ ${r.failed}`}
                      {r.error && <span className="ml-2 italic">({r.error.slice(0, 60)})</span>}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setRestoreOpen(false)}>Fechar</Button>
            <Button onClick={handleRestore} disabled={!restoreFile || restoring}>
              {restoring ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Restaurar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Destaques */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Gerenciar Destaques
          </CardTitle>
          <CardDescription>
            Controle de rotação de empresas em destaque
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <h4 className="font-medium">Banner 24h</h4>
            <p className="text-sm text-muted-foreground">
              Empresas marcadas com destaque banner aparecem na seção principal da home
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <h4 className="font-medium">Rotação Horária</h4>
            <p className="text-sm text-muted-foreground">
              Empresas com rotação horária aparecem em destaque no grid da home
            </p>
          </div>
          <Button variant="outline" onClick={resetDestaques}>
            Resetar Todos os Destaques
          </Button>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Segurança
          </CardTitle>
          <CardDescription>
            Informações de segurança do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span>RLS (Row Level Security) ativado em todas as tabelas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span>Autenticação por e-mail/senha configurada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span>Storage com políticas de acesso configuradas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span>Analytics com dados anonimizados</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span>Validação de upload (máx. 5MB por arquivo)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
