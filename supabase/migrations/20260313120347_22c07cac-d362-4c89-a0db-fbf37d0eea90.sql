
-- 1. Add 'owner' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'owner';

-- 2. Add new pricing fields to plans
ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS included_stores integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS price_per_extra_store numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS storage_limit_gb numeric NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS price_per_extra_gb numeric NOT NULL DEFAULT 5;

-- 3. Create stores table
CREATE TABLE public.stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  address text,
  city text,
  state text,
  phone text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, slug)
);

-- 4. Add store_id to profiles (nullable, super_admin/owner won't have one)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL;

-- 5. Add extra_stores and extra_storage_gb to subscriptions for billing calc
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS extra_stores integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS extra_storage_gb numeric NOT NULL DEFAULT 0;

-- 6. Enable RLS on stores
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- 7. RLS: super_admins can manage all stores
CREATE POLICY "Super admins can manage all stores"
  ON public.stores FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- 8. RLS: owners can manage their tenant stores
CREATE POLICY "Owners can manage own tenant stores"
  ON public.stores FOR ALL TO authenticated
  USING (tenant_id = (SELECT profiles.tenant_id FROM profiles WHERE profiles.id = auth.uid()));

-- 9. RLS: store users can view their store
CREATE POLICY "Users can view own store"
  ON public.stores FOR SELECT TO authenticated
  USING (id = (SELECT profiles.store_id FROM profiles WHERE profiles.id = auth.uid()));

-- 10. Enable realtime for stores
ALTER PUBLICATION supabase_realtime ADD TABLE public.stores;
