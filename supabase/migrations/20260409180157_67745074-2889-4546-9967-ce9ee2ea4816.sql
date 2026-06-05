
-- Add slug column
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS slug text;

-- Function to generate slug from name
CREATE OR REPLACE FUNCTION public.generate_slug(input_name text)
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  -- Normalize: lowercase, remove accents, replace non-alphanumeric with hyphens
  base_slug := lower(unaccent(input_name));
  base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
  base_slug := regexp_replace(base_slug, '^-|-$', '', 'g');
  
  -- Try base slug first
  final_slug := base_slug;
  
  WHILE EXISTS (SELECT 1 FROM public.empresas WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

-- Trigger function to auto-set slug on insert/update
CREATE OR REPLACE FUNCTION public.set_empresa_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' OR (TG_OP = 'UPDATE' AND OLD.nome IS DISTINCT FROM NEW.nome) THEN
    NEW.slug := public.generate_slug(NEW.nome);
    -- Ensure uniqueness by appending ID fragment if collision
    IF EXISTS (SELECT 1 FROM public.empresas WHERE slug = NEW.slug AND id != NEW.id) THEN
      NEW.slug := NEW.slug || '-' || left(NEW.id::text, 8);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER set_empresa_slug_trigger
BEFORE INSERT OR UPDATE ON public.empresas
FOR EACH ROW
EXECUTE FUNCTION public.set_empresa_slug();

-- Enable unaccent extension
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Backfill existing empresas with slugs
DO $$
DECLARE
  r RECORD;
  new_slug text;
BEGIN
  FOR r IN SELECT id, nome FROM public.empresas WHERE slug IS NULL OR slug = '' LOOP
    new_slug := public.generate_slug(r.nome);
    IF EXISTS (SELECT 1 FROM public.empresas WHERE slug = new_slug AND id != r.id) THEN
      new_slug := new_slug || '-' || left(r.id::text, 8);
    END IF;
    UPDATE public.empresas SET slug = new_slug WHERE id = r.id;
  END LOOP;
END;
$$;

-- Add unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS empresas_slug_unique ON public.empresas (slug);
