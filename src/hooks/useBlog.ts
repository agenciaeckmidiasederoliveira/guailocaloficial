import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BlogPost {
  id: string;
  slug: string;
  tipo: "empresa" | "artigo";
  status: "rascunho" | "publicado" | "arquivado";
  titulo: string;
  subtitulo?: string | null;
  conteudo: string;
  resumo?: string | null;
  tags: string[];
  empresa_id?: string | null;
  empresa_nome?: string | null;
  empresa_cidade?: string | null;
  empresa_categoria?: string | null;
  empresa_telefone?: string | null;
  empresa_whatsapp?: string | null;
  empresa_site?: string | null;
  empresa_endereco?: string | null;
  empresa_foto_url?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string | null;
  schema_json?: any;
  tempo_leitura: number;
  visualizacoes: number;
  publicado_em?: string | null;
  criado_em: string;
  atualizado_em: string;
}

export function useBlogPostsAdmin() {
  return useQuery({
    queryKey: ["blog-posts-admin"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("blog_posts")
        .select("*")
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return (data || []) as BlogPost[];
    },
  });
}

export function useBlogPostsPublicos(tipo?: "empresa" | "artigo") {
  return useQuery({
    queryKey: ["blog-posts-publicos", tipo],
    queryFn: async () => {
      let query = (supabase as any)
        .from("blog_posts")
        .select("id, slug, tipo, titulo, subtitulo, resumo, tags, empresa_nome, empresa_cidade, empresa_foto_url, empresa_categoria, tempo_leitura, visualizacoes, publicado_em")
        .eq("status", "publicado")
        .order("publicado_em", { ascending: false });
      if (tipo) query = query.eq("tipo", tipo);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as BlogPost[];
    },
  });
}

export function useBlogPostBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await (supabase as any)
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("status", "publicado")
        .maybeSingle();
      if (error) throw error;
      if (data) {
        (supabase as any).rpc("incrementar_visualizacao_post", { post_slug: slug }).then(() => {});
      }
      return data as BlogPost | null;
    },
    enabled: !!slug,
  });
}

export function useBlogPostById(id: string | undefined) {
  return useQuery({
    queryKey: ["blog-post-id", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await (supabase as any)
        .from("blog_posts")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as BlogPost | null;
    },
    enabled: !!id,
  });
}

export function useSalvarPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (post: Partial<BlogPost> & { id?: string }) => {
      const agora = new Date().toISOString();
      if (post.id) {
        const { id, ...patch } = post;
        if (patch.status === "publicado" && !patch.publicado_em) {
          (patch as any).publicado_em = agora;
        }
        const { data, error } = await (supabase as any)
          .from("blog_posts").update(patch).eq("id", id).select().single();
        if (error) throw error;
        return data;
      }
      const insert: any = { ...post };
      if (insert.status === "publicado") insert.publicado_em = agora;
      const { data, error } = await (supabase as any)
        .from("blog_posts").insert(insert).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blog-posts-admin"] });
      qc.invalidateQueries({ queryKey: ["blog-posts-publicos"] });
    },
  });
}

export function usePublicarPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; publicar: boolean }) => {
      const { id, publicar } = params;
      const patch: any = {
        status: publicar ? "publicado" : "rascunho",
      };
      if (publicar) patch.publicado_em = new Date().toISOString();
      const { error } = await (supabase as any).from("blog_posts").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blog-posts-admin"] });
      qc.invalidateQueries({ queryKey: ["blog-posts-publicos"] });
    },
  });
}

export function useExcluirPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("blog_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blog-posts-admin"] });
    },
  });
}

export async function gerarArtigoIA(
  payload:
    | { modo: "empresa"; empresa_id: string; tipoArtigo: string; tom: string }
    | { modo: "tematico"; tema: string; foco: string; publicoAlvo: string; tipoConteudo: string }
): Promise<any> {
  const { data, error } = await supabase.functions.invoke("generate-blog-post", { body: payload });
  if (error) throw error;
  if ((data as any)?.error) throw new Error((data as any).error);
  return (data as any).post;
}

export interface SugestaoTema {
  tema: string;
  foco: string;
  publicoAlvo: string;
  tipoConteudo: string;
  justificativa: string;
}

export async function sugerirTemasIA(): Promise<SugestaoTema[]> {
  const { data, error } = await supabase.functions.invoke("generate-blog-post", { body: { modo: "sugerir-temas" } });
  if (error) throw error;
  if ((data as any)?.error) throw new Error((data as any).error);
  return ((data as any).sugestoes || []) as SugestaoTema[];
}
