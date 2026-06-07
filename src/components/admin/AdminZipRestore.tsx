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

// --- Mapping helpers ---
  const slugify = (text: string) => {
    if (!text) return '';
    return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-');
  };

  const processTableBatch = async (tableName: string, rows: any[], batchSize = 50) => {
    let successCount = 0;
    let errorCount = 0;
    
    // Process mapping caches per-batch
    const estadoCache: Record<string, string> = {};
    const cidadeCache: Record<string, string> = {};
    const categoriaCache: Record<string, string> = {};

    const getOrCreateEstado = async (uf: string) => {
      if (!uf) return null;
      uf = uf.toUpperCase();
      if (estadoCache[uf]) return estadoCache[uf];
      
      const ESTADOS_BR: any = { 'AC':'Acre','AL':'Alagoas','AP':'Amapá','AM':'Amazonas','BA':'Bahia','CE':'Ceará','DF':'Distrito Federal','ES':'Espírito Santo','GO':'Goiás','MA':'Maranhão','MT':'Mato Grosso','MS':'Mato Grosso do Sul','MG':'Minas Gerais','PA':'Pará','PB':'Paraíba','PR':'Paraná','PE':'Pernambuco','PI':'Piauí','RJ':'Rio de Janeiro','RN':'Rio Grande do Norte','RS':'Rio Grande do Sul','RO':'Rondônia','RR':'Roraima','SC':'Santa Catarina','SP':'São Paulo','SE':'Sergipe','TO':'Tocantins' };
      const nome = ESTADOS_BR[uf] || uf;
      const slug = slugify(nome);
      
      const { data: existing } = await supabase.from('estados').select('id').eq('uf', uf).maybeSingle();
      if (existing) { estadoCache[uf] = existing.id; return existing.id; }
      
      const { data: novo } = await supabase.from('estados').upsert({ uf, nome, slug }, { onConflict: 'slug' }).select('id').maybeSingle();
      if (novo) estadoCache[uf] = novo.id;
      return novo ? novo.id : null;
    };

    const getOrCreateCidade = async (nomeCidade: string, uf: string) => {
      if (!nomeCidade || !uf) return null;
      const cacheKey = `${nomeCidade}-${uf}`.toLowerCase();
      if (cidadeCache[cacheKey]) return cidadeCache[cacheKey];
      
      const estadoId = await getOrCreateEstado(uf);
      if (!estadoId) return null;
      
      const slug = slugify(nomeCidade) + '-' + uf.toLowerCase();
      const { data: existing } = await supabase.from('cidades').select('id').eq('slug', slug).maybeSingle();
      if (existing) { cidadeCache[cacheKey] = existing.id; return existing.id; }
      
      const { data: novo } = await supabase.from('cidades').upsert({ nome: nomeCidade, estado_id: estadoId, slug }, { onConflict: 'slug' }).select('id').maybeSingle();
      if (novo) cidadeCache[cacheKey] = novo.id;
      return novo ? novo.id : null;
    };

    const getOrCreateCategoria = async (nicho: string) => {
      if (!nicho) return null;
      const name = nicho.trim();
      const slug = slugify(name);
      if (categoriaCache[slug]) return categoriaCache[slug];
      
      const { data: existing } = await supabase.from('categorias').select('id').eq('slug', slug).maybeSingle();
      if (existing) { categoriaCache[slug] = existing.id; return existing.id; }
      
      const { data: novo } = await supabase.from('categorias').upsert({ nome: name, slug }, { onConflict: 'slug' }).select('id').maybeSingle();
      if (novo) categoriaCache[slug] = novo.id;
      return novo ? novo.id : null;
    };

    for (let i = 0; i < rows.length; i += batchSize) {
      let batch = rows.slice(i, i + batchSize);
      
      if (tableName === 'empresas') {
        for (const row of batch) {
           if (row.cidade && row.estado) row.cidade_id = await getOrCreateCidade(row.cidade, row.estado);
           if (row.nicho) row.categoria_id = await getOrCreateCategoria(row.nicho);
        }
      }

      batch = batch.map(row => {
        const newRow = { ...row };
        if (tableName === 'profiles') {
           if (newRow.created_at) { newRow.criado_em = newRow.created_at; delete newRow.created_at; }
           if (!newRow.nome) newRow.nome = "Sem Nome";
        }
        if (tableName === 'empresas') {
           delete newRow.bairros; delete newRow.fotos_adicionais; delete newRow.videos;
           delete newRow.meta_description; delete newRow.data_expiracao_destaque; 
           delete newRow.imported_at; delete newRow.usuario_id;
           delete newRow.cidade; delete newRow.estado; delete newRow.nicho;
           
           if (newRow.plano === 'free') newRow.plano = 'gratis';
           if (newRow.faq !== undefined) { newRow.faqs = newRow.faq; delete newRow.faq; }
           if (newRow.created_at) { newRow.criado_em = newRow.created_at; delete newRow.created_at; }
           if (newRow.data_cadastro) { newRow.criado_em = newRow.data_cadastro; delete newRow.data_cadastro; }
        }
        if (tableName === 'parceiros') {
           // Fix syntax issue for enum types or integers mapped to strings
           if (newRow.plano === 'diamante') newRow.plano = 1; // Example mapping, usually safe to delete if invalid
           else if (typeof newRow.plano === 'string') delete newRow.plano; 
        }
        if (tableName === 'blog_posts') { delete newRow.tags; delete newRow.visualizacoes; }
        if (tableName === 'client_pages' && newRow.created_at) { newRow.criado_em = newRow.created_at; delete newRow.created_at; }
        return newRow;
      });

      if (tableName === 'profiles' || tableName === 'user_roles') {
        return { successCount: 0, errorCount: rows.length }; // skip
      }

      try {
        const query = supabase.from(tableName as any);
        const { error } = mode === "upsert" ? await query.upsert(batch) : await query.insert(batch);
          
        if (error) {
          if (error.message && error.message.includes("Could not find the table")) {
             return { successCount: 0, errorCount: rows.length };
          }

          // Auto-heal logic
          for (let row of batch) {
            let retry = true;
            let currentRow = { ...row };
            let attempts = 0;
            
            while (retry && attempts < 10) {
              attempts++;
              const { error: singleError } = mode === "upsert" 
                ? await supabase.from(tableName as any).upsert(currentRow)
                : await supabase.from(tableName as any).insert(currentRow);

              if (singleError) {
                 const msg = singleError.message;
                 const match = msg.match(/Could not find the '([^']+)' column/);
                 if (match && match[1]) {
                    delete currentRow[match[1]];
                    continue; // auto-heal: remove missing col and retry
                 }
                 if (msg.includes("violates unique constraint") && msg.includes("slug")) {
                    currentRow.slug = currentRow.slug + '-' + Math.floor(Math.random() * 1000);
                    continue; // auto-heal: randomize slug
                 }
                 if (!msg.includes("Could not find the table")) {
                   addLog(`Erro ${tableName} (ID: ${currentRow.id?.slice(0,6)}): ${msg}`, 'error');
                 }
                 errorCount++;
                 retry = false;
              } else {
                 successCount++;
                 retry = false;
              }
            }
          }
        } else {
          successCount += batch.length;
        }
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
