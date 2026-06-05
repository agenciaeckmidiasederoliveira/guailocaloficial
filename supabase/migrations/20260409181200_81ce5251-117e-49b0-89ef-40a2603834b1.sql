
-- Tabela de pagamentos Asaas
CREATE TABLE public.pagamentos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  asaas_customer_id text,
  asaas_payment_id text,
  valor decimal(10,2) NOT NULL DEFAULT 39.90,
  status text NOT NULL DEFAULT 'pendente',
  metodo_pagamento text,
  invoice_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;

-- Users can view their own payments
CREATE POLICY "Usuarios podem ver seus pagamentos"
ON public.pagamentos
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admin can view all payments
CREATE POLICY "Admin pode ver todos pagamentos"
ON public.pagamentos
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
));

-- Service role inserts (edge functions)
CREATE POLICY "Service role pode inserir pagamentos"
ON public.pagamentos
FOR INSERT
TO service_role
WITH CHECK (true);

-- Service role updates
CREATE POLICY "Service role pode atualizar pagamentos"
ON public.pagamentos
FOR UPDATE
TO service_role
USING (true);

-- Also allow authenticated users to insert (for checkout flow)
CREATE POLICY "Usuarios podem criar pagamentos"
ON public.pagamentos
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_pagamentos_updated_at
BEFORE UPDATE ON public.pagamentos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
