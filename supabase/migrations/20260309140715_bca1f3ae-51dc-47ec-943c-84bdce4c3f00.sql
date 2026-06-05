
-- Allow parceiros with empty email for generic invite links
ALTER TABLE public.parceiros ALTER COLUMN email SET DEFAULT '';

-- Drop unique constraint on email if exists to allow multiple empty emails
-- First check if constraint exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'parceiros_email_key') THEN
    ALTER TABLE public.parceiros DROP CONSTRAINT parceiros_email_key;
  END IF;
END $$;

-- Add a partial unique index that only enforces uniqueness for non-empty emails
CREATE UNIQUE INDEX IF NOT EXISTS parceiros_email_unique ON public.parceiros (email) WHERE email != '';
