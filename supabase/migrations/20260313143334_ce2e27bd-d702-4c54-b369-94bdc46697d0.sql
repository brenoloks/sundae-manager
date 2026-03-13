
-- Stock movements table
CREATE TABLE public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'entrada',
  quantity integer NOT NULL DEFAULT 0,
  reason text,
  notes text,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tenant stock movements"
ON public.stock_movements FOR SELECT TO authenticated
USING (tenant_id = (SELECT profiles.tenant_id FROM profiles WHERE profiles.id = auth.uid()));

CREATE POLICY "Users can create stock movements"
ON public.stock_movements FOR INSERT TO authenticated
WITH CHECK (tenant_id = (SELECT profiles.tenant_id FROM profiles WHERE profiles.id = auth.uid()));

CREATE POLICY "Super admins manage all stock movements"
ON public.stock_movements FOR ALL TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE INDEX idx_stock_movements_product ON public.stock_movements(product_id);
CREATE INDEX idx_stock_movements_tenant ON public.stock_movements(tenant_id);
