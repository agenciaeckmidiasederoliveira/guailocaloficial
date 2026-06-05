-- Remove o trigger antigo que tentava atualizar uma coluna "updated_at" que não existe nesta tabela
DROP TRIGGER IF EXISTS trg_blog_posts_updated_at ON public.blog_posts;

-- Função dedicada para a tabela blog_posts (que usa "atualizado_em")
CREATE OR REPLACE FUNCTION public.update_blog_posts_atualizado_em()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_blog_posts_atualizado_em
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_blog_posts_atualizado_em();