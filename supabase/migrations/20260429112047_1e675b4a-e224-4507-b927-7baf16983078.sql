-- Fix generate_slug: unaccent extension is not available; use translate() to strip common Portuguese accents
CREATE OR REPLACE FUNCTION public.generate_slug(input_name text)
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  -- Lowercase and strip common Portuguese accents without depending on the unaccent extension
  base_slug := lower(coalesce(input_name, ''));
  base_slug := translate(
    base_slug,
    'áàâãäåāăąéèêëēĕėęěíìîïīĭįóòôõöøōŏőúùûüūŭůűųçćĉċčñń",.;:!?¿¡',
    'aaaaaaaaaeeeeeeeeeiiiiiiiooooooooouuuuuuuuuccccccnn       '
  );
  base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
  base_slug := regexp_replace(base_slug, '^-|-$', '', 'g');

  IF base_slug = '' THEN
    base_slug := 'empresa';
  END IF;

  final_slug := base_slug;

  WHILE EXISTS (SELECT 1 FROM public.empresas WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  RETURN final_slug;
END;
$function$;