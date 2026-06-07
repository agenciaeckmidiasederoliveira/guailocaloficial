import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload, AlertTriangle, RefreshCw, FileArchive, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import JSZip from "jszip";

export function AdminZipRestore() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"upsert" | "insert">("upsert");
  const [restoring, setRestoring] = useState(false);
  
  // Progress states
  const [currentPhase, setCurrentPhase] = useState<string>("");
  const [progressValue, setProgressValue] = useState(0);
  const [logs, setLogs] = useState<{message: string, type: 'info' | 'success' | 'error'}[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setLogs(prev => [...prev, { message, type }]);
    if (type === 'error') console.error(message);
    else console.log(message);
  };

  const processTableBatch = async (tableName: string, rows: any[], batchSize = 50) => {
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      try {
        const query = supabase.from(tableName as any);
        const { error } = mode === "upsert" 
          ? await query.upsert(batch) 
          : await query.insert(batch);
          
        if (error) throw error;
        successCount += batch.length;
      } catch (e: any) {
        errorCount += batch.length;
        addLog(`Erro lote ${tableName}: ${e.message}`, 'error');
      }
      setProgressValue(prev => Math.min(99, prev + (batch.length / rows.length) * 100));
    }
    return { successCount, errorCount };
  };

  const handleRestore = async () => {
    if (!file) return;
    setRestoring(true);
    setLogs([]);
    setCurrentPhase("Lendo arquivo ZIP...");
    setProgressValue(0);

    try {
      const zip = new JSZip();
      const loadedZip = await zip.loadAsync(file);
      
      const tablesOrder = [
        "user_roles.json",
        "profiles.json",
        "categorias.json",
        "estados.json",
        "cidades.json",
        "tenants.json",
        "empresas.json",
        "parceiros.json",
        "analytics.json",
        "avaliacoes.json",
        "blog_posts.json",
        "client_pages.json",
        "client_service_pages.json",
        "empresa_milestones.json",
        "favoritos.json",
        "notificacoes_parceiro.json",
        "pagamentos.json"
      ];

      addLog("ZIP carregado. Lendo tabelas...", "info");
      
      let totalTablesProcessed = 0;
      
      for (const fileName of tablesOrder) {
        // Zip entries might be nested in a root folder like "guia-local-br-backup-completo-*/data/..."
        // So we search for the file ending with this name in the /data/ folder
        const zipFiles = Object.values(loadedZip.files);
        const fileEntry = zipFiles.find(f => f.name.includes(`data/${fileName}`));
        
        if (!fileEntry) continue;

        setCurrentPhase(`Restaurando ${fileName.replace('.json', '')}...`);
        setProgressValue(0);
        
        const content = await fileEntry.async("string");
        const rows = JSON.parse(content);
        
        if (!Array.isArray(rows) || rows.length === 0) {
          addLog(`Tabela ${fileName} vazia ou inválida.`, 'info');
          continue;
        }

        addLog(`Iniciando ${fileName} (${rows.length} registros)`, 'info');
        
        const tableName = fileName.replace('.json', '');
        const { successCount, errorCount } = await processTableBatch(tableName, rows);
        
        addLog(`${tableName}: ${successCount} sucesso, ${errorCount} erros.`, errorCount > 0 ? 'error' : 'success');
        totalTablesProcessed++;
      }

      // Restore images if present
      setCurrentPhase("Restaurando Imagens...");
      setProgressValue(0);
      const imageFiles = Object.values(loadedZip.files).filter(f => f.name.includes('imagens/') && !f.dir);
      
      if (imageFiles.length > 0) {
        addLog(`Encontradas ${imageFiles.length} imagens para restaurar.`, 'info');
        let imgSuccess = 0;
        let imgError = 0;
        
        for (let i = 0; i < imageFiles.length; i++) {
          const imgFile = imageFiles[i];
          try {
            // Reconstruct path: "imagens/empresas/uuid/foto.jpg" -> "empresas/uuid/foto.jpg"
            const pathParts = imgFile.name.split('imagens/');
            if (pathParts.length < 2) continue;
            
            const storagePath = pathParts[1];
            // Infer bucket from first part of storagePath
            const bucketParts = storagePath.split('/');
            const bucketName = bucketParts[0] === 'empresas' ? 'empresas' : 'parceiros'; // fallback logic
            const filePath = bucketParts.slice(1).join('/');

            if (!filePath) continue;

            const blob = await imgFile.async("blob");
            
            const { error } = await supabase.storage
              .from(bucketName)
              .upload(storagePath, blob, { upsert: true });

            if (error) {
              // Ignore duplicate errors if upsert is tricky
              addLog(`Erro img ${storagePath}: ${error.message}`, 'error');
              imgError++;
            } else {
              imgSuccess++;
            }
          } catch (err: any) {
            imgError++;
          }
          setProgressValue(Math.floor(((i + 1) / imageFiles.length) * 100));
        }
        addLog(`Imagens: ${imgSuccess} sucesso, ${imgError} erros.`, imgError > 0 ? 'error' : 'success');
      }

      setCurrentPhase("Concluído!");
      setProgressValue(100);
      toast({ title: "Restauração ZIP concluída!", description: "Veja o relatório abaixo." });
      
    } catch (e: any) {
      addLog(`Erro fatal: ${e.message}`, 'error');
      toast({ title: "Erro na restauração", description: e.message || String(e), variant: "destructive" });
    } finally {
      setRestoring(false);
    }
  };

  return (
    <>
      <Button variant="default" onClick={() => setOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
        <FileArchive className="mr-2 h-4 w-4" />
        Restaurar Backup Completo (.zip)
      </Button>

      <Dialog open={open} onOpenChange={(o) => { 
        setOpen(o); 
        if (!o && !restoring) { setFile(null); setLogs([]); setCurrentPhase(""); } 
      }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileArchive className="h-5 w-5" /> Restaurar Backup Completo (Novo Formato)
            </DialogTitle>
            <DialogDescription>
              Carregue o arquivo .zip gerado pelo novo sistema de backup. Ele contém os dados em JSON (paginação completa), arquivos do storage e etc.
            </DialogDescription>
          </DialogHeader>

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Atenção</AlertTitle>
            <AlertDescription className="text-xs space-y-1">
              <div>• Modo <strong>upsert</strong> sobrescreve registros existentes com mesmo ID (recomendado).</div>
              <div>• Não feche esta janela durante a importação para não interromper o processo.</div>
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Arquivo .zip</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip,application/zip"
                disabled={restoring}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="block w-full mt-1 text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-primary file:text-primary-foreground"
              />
            </div>

            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox disabled={restoring} checked={mode === "upsert"} onCheckedChange={() => setMode("upsert")} />
                Upsert (sobrescreve)
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox disabled={restoring} checked={mode === "insert"} onCheckedChange={() => setMode("insert")} />
                Insert (mantém existentes)
              </label>
            </div>

            {restoring || logs.length > 0 ? (
              <div className="space-y-2 border rounded-md p-4 bg-muted/20">
                <div className="flex justify-between items-center text-sm font-medium mb-1">
                  <span>{currentPhase || "Aguardando..."}</span>
                  <span>{Math.round(progressValue)}%</span>
                </div>
                <Progress value={progressValue} className="h-2" />
                
                <div className="mt-4 max-h-48 overflow-y-auto space-y-1 text-xs font-mono bg-black/5 p-2 rounded">
                  {logs.map((log, i) => (
                    <div key={i} className={`flex items-start gap-1 ${
                      log.type === 'error' ? 'text-red-600' : 
                      log.type === 'success' ? 'text-green-600' : 'text-slate-600'
                    }`}>
                      {log.type === 'error' ? <XCircle className="h-3 w-3 mt-0.5 shrink-0" /> : 
                       log.type === 'success' ? <CheckCircle2 className="h-3 w-3 mt-0.5 shrink-0" /> : 
                       <span className="w-3 text-center opacity-50">-</span>}
                      <span>{log.message}</span>
                    </div>
                  ))}
                  {logs.length === 0 && <div className="text-muted-foreground italic">Os logs de importação aparecerão aqui...</div>}
                </div>
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={restoring}>Cancelar</Button>
            <Button onClick={handleRestore} disabled={!file || restoring}>
              {restoring ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              {restoring ? "Processando..." : "Iniciar Restauração"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
