import { useState, useRef, useEffect, useCallback } from "react";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  Download,
  Upload,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  History,
  FileSpreadsheet,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  importRowSchema,
  MAX_IMPORT_ROWS,
  buildRedesSociais,
  normalizeHeader,
  parseBairros,
  detectHeaderRow,
  isExampleRow,
  collectFotos,
  MAX_FOTOS,
  type ImportRow,
} from "@/lib/empresa-import-schema";

const TEMPLATE_URL = "/templates/GuiaLocalBR_Template_Importacao.xlsx";

interface Props {
  /** ID do usuário que será dono (e "imported_by") das empresas */
  usuarioId: string;
  /** Plano padrão se a planilha não trouxer */
  planoPadrao?: "free" | "premium";
  /** Status padrão se a planilha não trouxer */
  statusPadrao?: "aprovado" | "pendente";
  onDone?: () => void;
}

interface ParsedRow {
  rowNumber: number;
  data: ImportRow | null;
  errors: { field: string; message: string }[];
  raw: Record<string, unknown>;
}

interface ImportLog {
  id: string;
  filename: string;
  total_rows: number;
  success_count: number;
  error_count: number;
  created_at: string;
}

export function BulkImportXLSX({
  usuarioId,
  planoPadrao = "free",
  statusPadrao = "aprovado",
  onDone,
}: Props) {
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [rows, setRows] = useState<ParsedRow[] | null>(null);
  const [filename, setFilename] = useState<string>("");
  const [result, setResult] = useState<{ ok: number; fail: number } | null>(null);
  const [logs, setLogs] = useState<ImportLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    const { data } = await supabase
      .from("import_logs" as any)
      .select("id, filename, total_rows, success_count, error_count, created_at")
      .eq("user_id", usuarioId)
      .order("created_at", { ascending: false })
      .limit(10);
    setLogs(((data as unknown) as ImportLog[]) || []);
    setLogsLoading(false);
  }, [usuarioId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // ===== Template =====
  const downloadTemplate = (format: "xlsx" | "csv") => {
    if (format === "xlsx") {
      const a = document.createElement("a");
      a.href = TEMPLATE_URL;
      a.download = "GuiaLocalBR_Template_Importacao.xlsx";
      a.click();
      return;
    }
    const headersCSV = [
      "Nome da Empresa",
      "Categoria",
      "Cidade",
      "UF",
      "Bairro",
      "Endereço Completo",
      "Telefone / WhatsApp",
      "Site (URL)",
      "Instagram",
      "Descrição Curta",
      "Plano",
      "Foto 1 (URL)",
      "Foto 2 (URL)",
      "Foto 3 (URL)",
      "Foto 4 (URL)",
      "Foto 5 (URL)",
      "Foto 6 (URL)",
      "Foto 7 (URL)",
      "Foto 8 (URL)",
    ];
    const example = [
      "Pizzaria Bella Napoli",
      "Restaurantes e Gastronomia",
      "Maringá",
      "PR",
      "Zona 7",
      "Av. Colombo, 1200 - Zona 7",
      "44999887766",
      "https://bellanapoli.com.br",
      "@bellanapoli",
      "A melhor pizza artesanal de Maringá.",
      "premium",
      "https://exemplo.com/foto1.jpg",
      "", "", "", "", "", "", "",
    ];
    const csv = Papa.unparse({ fields: headersCSV, data: [example] });
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modelo-empresas-guialocalbr.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // ===== Parse =====
  /** Recebe matriz crua (com possível preâmbulo) e devolve linhas normalizadas. */
  const matrixToObjects = (matrix: unknown[][]): Record<string, unknown>[] => {
    if (matrix.length === 0) return [];
    const headerIdx = detectHeaderRow(matrix);
    const headerRow = (matrix[headerIdx] || []).map((c) => String(c ?? ""));
    const out: Record<string, unknown>[] = [];
    for (let i = headerIdx + 1; i < matrix.length; i++) {
      const row = matrix[i] || [];
      // pula linhas totalmente vazias
      if (!row.some((c) => c !== null && c !== undefined && String(c).trim() !== "")) continue;
      const obj: Record<string, unknown> = {};
      headerRow.forEach((h, j) => {
        if (!h || !String(h).trim()) return;
        const key = normalizeHeader(h);
        if (key === "_ignored") {
          obj._id = row[j]; // preserva ID para detectar linha EXEMPLO
          return;
        }
        const val = row[j];
        obj[key] = typeof val === "string" ? val.trim() : val;
      });
      out.push(obj);
    }
    return out;
  };

  const parseRows = (raw: Record<string, unknown>[]) => {
    // remove linha EXEMPLO oficial
    const filtered = raw.filter((r) => !isExampleRow(r));
    if (filtered.length === 0) {
      toast({ title: "Planilha vazia", description: "Nenhuma linha de dados encontrada.", variant: "destructive" });
      return null;
    }
    if (filtered.length > MAX_IMPORT_ROWS) {
      toast({
        title: "Excesso de linhas",
        description: `Máximo de ${MAX_IMPORT_ROWS} por arquivo. Esta tem ${filtered.length}.`,
        variant: "destructive",
      });
      return null;
    }
    return filtered.map<ParsedRow>((normalized, idx) => {
      // Fallback: se WhatsApp vazio mas Telefone preenchido, usa o mesmo número
      if (!normalized.whatsapp && normalized.telefone) {
        normalized.whatsapp = normalized.telefone;
      }
      if (!normalized.plano) normalized.plano = planoPadrao;
      if (!normalized.status) normalized.status = statusPadrao;
      const parsed = importRowSchema.safeParse(normalized);
      return {
        rowNumber: idx + 2,
        data: parsed.success ? parsed.data : null,
        errors: parsed.success
          ? []
          : parsed.error.issues.map((i) => ({
              field: (i.path[0] as string) || "campo",
              message: i.message,
            })),
        raw: normalized,
      };
    });
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParsing(true);
    setResult(null);
    setRows(null);
    setFilename(file.name);
    try {
      const isCSV = /\.csv$/i.test(file.name);
      let matrix: unknown[][] = [];
      if (isCSV) {
        const text = await file.text();
        const out = Papa.parse<string[]>(text, { skipEmptyLines: true });
        matrix = out.data as unknown[][];
      } else {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        // Procura a aba de importação (com emoji ou nome) — fallback p/ primeira
        const targetSheet =
          wb.SheetNames.find((n) => /import/i.test(n)) ?? wb.SheetNames[0];
        const sheet = wb.Sheets[targetSheet];
        matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as unknown[][];
      }
      const objects = matrixToObjects(matrix);
      const parsed = parseRows(objects);
      if (parsed) setRows(parsed);
    } catch (err) {
      console.error(err);
      toast({
        title: "Erro ao ler arquivo",
        description: "Confirme que o arquivo é um .xlsx ou .csv válido.",
        variant: "destructive",
      });
    } finally {
      setParsing(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  // ===== Import =====
  const importValid = async () => {
    if (!rows) return;
    const valid = rows.filter((r) => r.data !== null);
    if (valid.length === 0) {
      toast({ title: "Nenhuma linha válida", variant: "destructive" });
      return;
    }
    setImporting(true);
    let okCount = 0;
    let failCount = 0;
    const errorDetails: { row: number; nome: string; error: string }[] = [];

    const chunkSize = 50;
    const nowIso = new Date().toISOString();

    for (let i = 0; i < valid.length; i += chunkSize) {
      const slice = valid.slice(i, i + chunkSize);
      const chunk = slice.map((r) => {
        const d = r.data!;
        const fotos = collectFotos(d);
        return {
          usuario_id: usuarioId,
          imported_by: usuarioId,
          imported_at: nowIso,
          nome: d.nome,
          telefone: d.telefone,
          whatsapp: d.whatsapp || d.telefone,
          nicho: d.categoria,
          estado: d.estado,
          cidade: d.cidade,
          bairros: parseBairros(d.bairros),
          endereco: d.endereco || null,
          cep: d.cep || null,
          descricao: d.descricao || null,
          site: d.site || null,
          foto_principal: fotos[0] || null,
          fotos_adicionais: fotos.slice(1, MAX_FOTOS),
          redes_sociais: buildRedesSociais(d.instagram, d.facebook) as any,
          plano: d.plano as "free" | "premium",
          status: d.status as "aprovado" | "pendente",
        };
      });
      const { error } = await supabase.from("empresas").insert(chunk as any);
      if (error) {
        console.error("Erro de inserção:", error);
        failCount += chunk.length;
        slice.forEach((r) =>
          errorDetails.push({
            row: r.rowNumber,
            nome: String(r.raw.nome ?? "—"),
            error: error.message,
          }),
        );
      } else {
        okCount += chunk.length;
      }
    }

    // Log da importação
    await supabase.from("import_logs" as any).insert({
      user_id: usuarioId,
      filename,
      total_rows: rows.length,
      success_count: okCount,
      error_count: failCount + rows.filter((r) => r.data === null).length,
      errors: errorDetails as any,
    });

    setResult({ ok: okCount, fail: failCount });
    setImporting(false);
    toast({
      title: "Importação concluída",
      description: `${okCount} importada(s), ${failCount} falharam.`,
    });
    fetchLogs();
    onDone?.();
  };

  const validCount = rows?.filter((r) => r.data !== null).length ?? 0;
  const invalidCount = rows?.filter((r) => r.data === null).length ?? 0;

  // ===== UI =====
  return (
    <div className="space-y-6">
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Importar Empresas em Massa
          </CardTitle>
          <CardDescription>
            Aceita <strong>.xlsx</strong> ou <strong>.csv</strong>. Até {MAX_IMPORT_ROWS} empresas por
            arquivo. Suporta o template oficial (com abas de categorias e instruções) — até <strong>{MAX_FOTOS} fotos</strong> por empresa Premium.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              size="lg"
              onClick={() => fileRef.current?.click()}
              disabled={parsing}
              className="flex-1 sm:flex-none"
            >
              {parsing ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Upload className="mr-2 h-5 w-5" />
              )}
              Selecionar arquivo (.xlsx ou .csv)
            </Button>
            <Button type="button" variant="outline" onClick={() => downloadTemplate("xlsx")}>
              <Download className="mr-2 h-4 w-4" />
              Baixar Template XLSX
            </Button>
            <Button type="button" variant="outline" onClick={() => downloadTemplate("csv")}>
              <Download className="mr-2 h-4 w-4" />
              Baixar Template CSV
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
              onChange={handleFile}
              className="hidden"
            />
          </div>

          {rows && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3">
                <Badge className="bg-green-600">
                  <CheckCircle2 className="mr-1 h-3 w-3" /> {validCount} válidas
                </Badge>
                {invalidCount > 0 && (
                  <Badge variant="destructive">
                    <XCircle className="mr-1 h-3 w-3" /> {invalidCount} com erro
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  Arquivo: <strong>{filename}</strong>
                </span>
                <div className="ml-auto">
                  <Button onClick={importValid} disabled={importing || validCount === 0}>
                    {importing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    Confirmar Importação ({validCount})
                  </Button>
                </div>
              </div>

              {/* Preview */}
              <div className="rounded-md border">
                <div className="max-h-[400px] overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 z-10 bg-muted">
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Cidade/UF</TableHead>
                        <TableHead>WhatsApp</TableHead>
                        <TableHead>Plano</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Validação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.slice(0, 100).map((r) => {
                        const errFields = new Set(r.errors.map((e) => e.field));
                        const cellCls = (f: string) =>
                          errFields.has(f) ? "bg-destructive/10 text-destructive font-medium" : "";
                        return (
                          <TableRow
                            key={r.rowNumber}
                            className={r.data === null ? "bg-destructive/5" : ""}
                          >
                            <TableCell className="font-mono text-xs">{r.rowNumber}</TableCell>
                            <TableCell className={cellCls("nome")}>
                              {String(r.raw.nome ?? "—")}
                            </TableCell>
                            <TableCell className={cellCls("categoria")}>
                              {String(r.raw.categoria ?? "—")}
                            </TableCell>
                            <TableCell className={`${cellCls("cidade")} ${cellCls("estado")}`}>
                              {String(r.raw.cidade ?? "—")}/{String(r.raw.estado ?? "—")}
                            </TableCell>
                            <TableCell className={cellCls("whatsapp")}>
                              {String(r.raw.whatsapp ?? "—")}
                            </TableCell>
                            <TableCell className={cellCls("plano")}>
                              {String(r.raw.plano ?? planoPadrao)}
                            </TableCell>
                            <TableCell className={cellCls("status")}>
                              {String(r.raw.status ?? statusPadrao)}
                            </TableCell>
                            <TableCell>
                              {r.data ? (
                                <Badge variant="outline" className="text-green-700 border-green-300">
                                  ok
                                </Badge>
                              ) : (
                                <span className="text-xs text-destructive">
                                  {r.errors.map((e) => `${e.field}: ${e.message}`).join("; ")}
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                {rows.length > 100 && (
                  <div className="border-t bg-muted/30 p-2 text-center text-xs text-muted-foreground">
                    Mostrando 100 de {rows.length} linhas. A importação processará todas as válidas.
                  </div>
                )}
              </div>

              {invalidCount > 0 && (
                <div className="flex items-start gap-2 rounded-md border border-amber-400/40 bg-amber-50 p-3 text-sm dark:bg-amber-950/20">
                  <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
                  <div>
                    Há {invalidCount} linha(s) com erro. Corrija na planilha e reenvie — apenas as
                    válidas serão importadas.
                  </div>
                </div>
              )}

              {result && (
                <div className="rounded-md border border-border bg-muted/40 p-3 text-sm">
                  <strong>Resultado:</strong> {result.ok} importada(s), {result.fail} falharam no
                  banco.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-4 w-4" />
            Histórico de Importações
          </CardTitle>
          <CardDescription>Suas últimas 10 importações.</CardDescription>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Nenhuma importação ainda.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Arquivo</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Sucesso</TableHead>
                  <TableHead className="text-right">Erros</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="text-xs">
                      {new Date(l.created_at).toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate text-xs">{l.filename}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{l.total_rows}</TableCell>
                    <TableCell className="text-right font-mono text-xs text-green-700">
                      {l.success_count}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-destructive">
                      {l.error_count}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
