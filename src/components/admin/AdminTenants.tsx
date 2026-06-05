import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Edit, Trash2, Globe, MapPin } from "lucide-react";

interface Tenant {
  id: string;
  slug: string;
  nome_cidade: string;
  uf: string;
  parceiro_id: string | null;
  dominio_customizado: string | null;
  subdominio: string | null;
  ativo: boolean;
  parceiros?: {
    nome_completo: string | null;
    email: string | null;
  };
}

export function AdminTenants() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Tenant>>({
    slug: "",
    nome_cidade: "",
    uf: "",
    dominio_customizado: "",
    subdominio: "",
    ativo: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    setLoading(true);
    // Assumindo que a tabela "parceiros" existe ou que ligamos a auth.users, ajustaremos
    const { data, error } = await supabase
      .from("tenants")
      .select(`*`);
    
    if (error) {
      console.error(error);
      toast({ title: "Erro", description: "Falha ao carregar tenants", variant: "destructive" });
    } else {
      setTenants(data as Tenant[]);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    if (!formData.slug || !formData.nome_cidade || !formData.uf) {
      toast({ title: "Atenção", description: "Preencha os campos obrigatórios.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }

    try {
      if (formData.id) {
        await supabase.from("tenants").update(formData as any).eq("id", formData.id);
        toast({ title: "Sucesso", description: "Tenant atualizado." });
      } else {
        await supabase.from("tenants").insert([formData as any]);
        toast({ title: "Sucesso", description: "Novo Tenant criado." });
      }
      setIsOpen(false);
      fetchTenants();
      setFormData({ slug: "", nome_cidade: "", uf: "", dominio_customizado: "", subdominio: "", ativo: true });
    } catch (err) {
      toast({ title: "Erro", description: "Verifique os dados ou slugs repetidos.", variant: "destructive" });
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir? Isto pode quebrar empresas ligadas a este tenant!")) return;
    await supabase.from("tenants").delete().eq("id", id);
    fetchTenants();
    toast({ title: "Excluído", description: "Tenant removido com sucesso." });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Gerenciar Cidades (Tenants)</h1>
          <p className="text-muted-foreground">Sistema Multi-Tenant para franquias/parceiros e domínios</p>
        </div>
        <Button onClick={() => { setFormData({ slug: "", nome_cidade: "", uf: "", dominio_customizado: "", subdominio: "", ativo: true }); setIsOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Novo Tenant
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : tenants.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">Nenhum Tenant cadastrado.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cidade/UF</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Acesso (URL)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {t.nome_cidade} / {t.uf}
                    </TableCell>
                    <TableCell>{t.slug}</TableCell>
                    <TableCell>
                      {t.dominio_customizado ? (
                        <span className="flex items-center gap-1 text-blue-600"><Globe className="h-3 w-3" /> {t.dominio_customizado}</span>
                      ) : t.subdominio ? (
                        <span className="text-muted-foreground">{t.subdominio}.guialocalbr.com.br</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Sem URL</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={t.ativo ? "default" : "destructive"}>{t.ativo ? "Ativo" : "Inativo"}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => { setFormData(t); setIsOpen(true); }}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(t.id)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{formData.id ? "Editar" : "Novo"} Tenant</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Nome da Cidade *</label>
                <Input value={formData.nome_cidade} onChange={e => setFormData({...formData, nome_cidade: e.target.value})} placeholder="Ex: Maringá" />
              </div>
              <div>
                <label className="text-sm font-medium">UF *</label>
                <Input value={formData.uf} onChange={e => setFormData({...formData, uf: e.target.value})} placeholder="Ex: PR" maxLength={2} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Slug Único *</label>
              <Input value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})} placeholder="Ex: maringa-pr" />
              <p className="text-xs text-muted-foreground mt-1">Usado no banco de dados e URLs padrão</p>
            </div>
            <div>
              <label className="text-sm font-medium">Subdomínio</label>
              <Input value={formData.subdominio || ""} onChange={e => setFormData({...formData, subdominio: e.target.value.toLowerCase()})} placeholder="Ex: maringa" />
              <p className="text-xs text-muted-foreground mt-1">Se preenchido, acessível em: maringa.guialocalbr.com.br</p>
            </div>
            <div>
              <label className="text-sm font-medium">Domínio Customizado (Exclusivo)</label>
              <Input value={formData.dominio_customizado || ""} onChange={e => setFormData({...formData, dominio_customizado: e.target.value.toLowerCase()})} placeholder="Ex: guiamaringa.com.br" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={isSubmitting}>{isSubmitting ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
