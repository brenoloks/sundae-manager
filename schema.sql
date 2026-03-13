-- ============================================================
-- GelaTech - Schema Completo para Supabase Self-Hosted
-- Execute este script no banco de dados PostgreSQL do Supabase
-- ============================================================

-- 1. ENUM TYPE
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'manager', 'cashier', 'owner');

-- 2. SEQUENCE
CREATE SEQUENCE IF NOT EXISTS public.orders_order_number_seq;

-- 3. TABLES (na ordem correta para respeitar foreign keys)

-- plans
CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price_monthly numeric NOT NULL DEFAULT 0,
  price_yearly numeric NOT NULL DEFAULT 0,
  max_users integer NOT NULL DEFAULT 5,
  max_products integer NOT NULL DEFAULT 100,
  included_stores integer NOT NULL DEFAULT 1,
  storage_limit_gb numeric NOT NULL DEFAULT 2,
  price_per_extra_store numeric NOT NULL DEFAULT 0,
  price_per_extra_gb numeric NOT NULL DEFAULT 5,
  features jsonb DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- tenants
CREATE TABLE public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  cnpj text,
  email text,
  phone text,
  address text,
  city text,
  state text,
  logo_url text,
  plan_id uuid REFERENCES public.plans(id),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- stores
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
  UNIQUE (tenant_id, slug)
);

-- profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- user_roles
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- subscriptions
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.plans(id),
  status text NOT NULL DEFAULT 'active',
  billing_cycle text NOT NULL DEFAULT 'monthly',
  current_period_start timestamp with time zone NOT NULL DEFAULT now(),
  current_period_end timestamp with time zone NOT NULL DEFAULT (now() + interval '30 days'),
  extra_stores integer NOT NULL DEFAULT 0,
  extra_storage_gb numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- categories
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text DEFAULT '#3b82f6',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- products
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0,
  cost_price numeric DEFAULT 0,
  price_per_kg numeric DEFAULT 0,
  stock integer NOT NULL DEFAULT 0,
  min_stock integer DEFAULT 5,
  unit text NOT NULL DEFAULT 'un',
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- cash_sessions
CREATE TABLE public.cash_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL,
  opened_by uuid NOT NULL REFERENCES auth.users(id),
  closed_by uuid REFERENCES auth.users(id),
  opening_amount numeric NOT NULL DEFAULT 0,
  closing_amount numeric,
  status text NOT NULL DEFAULT 'open',
  opened_at timestamp with time zone NOT NULL DEFAULT now(),
  closed_at timestamp with time zone,
  notes text
);

-- orders
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL,
  cash_session_id uuid REFERENCES public.cash_sessions(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  order_number integer NOT NULL DEFAULT nextval('orders_order_number_seq'),
  subtotal numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'dinheiro',
  status text NOT NULL DEFAULT 'completed',
  customer_name text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- order_items
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id),
  product_name text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL,
  total_price numeric NOT NULL,
  weight_kg numeric
);

-- stock_movements
CREATE TABLE public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  type text NOT NULL DEFAULT 'entrada',
  quantity integer NOT NULL DEFAULT 0,
  reason text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_tenant_created_with_plan()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.plan_id IS NOT NULL THEN
    INSERT INTO public.subscriptions (tenant_id, plan_id, status, billing_cycle, current_period_start, current_period_end)
    VALUES (
      NEW.id,
      NEW.plan_id,
      'active',
      'monthly',
      now(),
      now() + interval '30 days'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_tenant_plan_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.plan_id IS NOT NULL AND (OLD.plan_id IS DISTINCT FROM NEW.plan_id) THEN
    UPDATE public.subscriptions
    SET status = 'canceled', updated_at = now()
    WHERE tenant_id = NEW.id AND status = 'active';

    INSERT INTO public.subscriptions (tenant_id, plan_id, status, billing_cycle, current_period_start, current_period_end)
    VALUES (
      NEW.id,
      NEW.plan_id,
      'active',
      'monthly',
      now(),
      now() + interval '30 days'
    );
  END IF;

  IF NEW.plan_id IS NULL AND OLD.plan_id IS NOT NULL THEN
    UPDATE public.subscriptions
    SET status = 'canceled', updated_at = now()
    WHERE tenant_id = NEW.id AND status = 'active';
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================
-- 5. TRIGGERS
-- ============================================================

-- Trigger: criar profile automaticamente quando novo usuário é criado
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger: criar subscription quando tenant é criado com plano
CREATE TRIGGER on_tenant_created_with_plan
  AFTER INSERT ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_tenant_created_with_plan();

-- Trigger: gerenciar subscription quando plano do tenant muda
CREATE TRIGGER on_tenant_plan_change
  AFTER UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_tenant_plan_change();

-- ============================================================
-- 6. ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 7. RLS POLICIES
-- ============================================================

-- === plans ===
CREATE POLICY "Plans are viewable by authenticated users" ON public.plans
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admins can manage plans" ON public.plans
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'));

-- === tenants ===
CREATE POLICY "Super admins can manage all tenants" ON public.tenants
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can view own tenant" ON public.tenants
  FOR SELECT TO authenticated
  USING (id = (SELECT profiles.tenant_id FROM profiles WHERE profiles.id = auth.uid()));

CREATE POLICY "Owners can update own tenant" ON public.tenants
  FOR UPDATE TO authenticated
  USING (id = (SELECT profiles.tenant_id FROM profiles WHERE profiles.id = auth.uid()))
  WITH CHECK (id = (SELECT profiles.tenant_id FROM profiles WHERE profiles.id = auth.uid()));

-- === stores ===
CREATE POLICY "Super admins can manage all stores" ON public.stores
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Owners can manage own tenant stores" ON public.stores
  FOR ALL TO authenticated
  USING (tenant_id = (SELECT profiles.tenant_id FROM profiles WHERE profiles.id = auth.uid()));

CREATE POLICY "Users can view own store" ON public.stores
  FOR SELECT TO authenticated
  USING (id = (SELECT profiles.store_id FROM profiles WHERE profiles.id = auth.uid()));

-- === profiles ===
CREATE POLICY "Super admins can manage all profiles" ON public.profiles
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid());

-- === user_roles ===
CREATE POLICY "Super admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- === subscriptions ===
CREATE POLICY "Super admins can manage subscriptions" ON public.subscriptions
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can view own tenant subscriptions" ON public.subscriptions
  FOR SELECT TO authenticated
  USING (tenant_id = (SELECT profiles.tenant_id FROM profiles WHERE profiles.id = auth.uid()));

-- === categories ===
CREATE POLICY "Super admins manage all categories" ON public.categories
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Managers can manage categories" ON public.categories
  FOR ALL TO authenticated
  USING (tenant_id = (SELECT profiles.tenant_id FROM profiles WHERE profiles.id = auth.uid()));

CREATE POLICY "Users can view own tenant categories" ON public.categories
  FOR SELECT TO authenticated
  USING (tenant_id = (SELECT profiles.tenant_id FROM profiles WHERE profiles.id = auth.uid()));

-- === products ===
CREATE POLICY "Super admins manage all products" ON public.products
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Managers can manage products" ON public.products
  FOR ALL TO authenticated
  USING (tenant_id = (SELECT profiles.tenant_id FROM profiles WHERE profiles.id = auth.uid()));

CREATE POLICY "Users can view own tenant products" ON public.products
  FOR SELECT TO authenticated
  USING (tenant_id = (SELECT profiles.tenant_id FROM profiles WHERE profiles.id = auth.uid()));

-- === cash_sessions ===
CREATE POLICY "Super admins manage all cash sessions" ON public.cash_sessions
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can manage own tenant cash sessions" ON public.cash_sessions
  FOR ALL TO authenticated
  USING (tenant_id = (SELECT profiles.tenant_id FROM profiles WHERE profiles.id = auth.uid()));

CREATE POLICY "Users can view own tenant cash sessions" ON public.cash_sessions
  FOR SELECT TO authenticated
  USING (tenant_id = (SELECT profiles.tenant_id FROM profiles WHERE profiles.id = auth.uid()));

-- === orders ===
CREATE POLICY "Super admins manage all orders" ON public.orders
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can create orders" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = (SELECT profiles.tenant_id FROM profiles WHERE profiles.id = auth.uid()));

CREATE POLICY "Users can view own tenant orders" ON public.orders
  FOR SELECT TO authenticated
  USING (tenant_id = (SELECT profiles.tenant_id FROM profiles WHERE profiles.id = auth.uid()));

-- === order_items ===
CREATE POLICY "Super admins manage all order items" ON public.order_items
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can insert order items" ON public.order_items
  FOR INSERT TO authenticated
  WITH CHECK (order_id IN (SELECT orders.id FROM orders WHERE orders.tenant_id = (SELECT profiles.tenant_id FROM profiles WHERE profiles.id = auth.uid())));

CREATE POLICY "Users can view order items via orders" ON public.order_items
  FOR SELECT TO authenticated
  USING (order_id IN (SELECT orders.id FROM orders WHERE orders.tenant_id = (SELECT profiles.tenant_id FROM profiles WHERE profiles.id = auth.uid())));

-- === stock_movements ===
CREATE POLICY "Super admins manage all stock movements" ON public.stock_movements
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can create stock movements" ON public.stock_movements
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = (SELECT profiles.tenant_id FROM profiles WHERE profiles.id = auth.uid()));

CREATE POLICY "Users can view own tenant stock movements" ON public.stock_movements
  FOR SELECT TO authenticated
  USING (tenant_id = (SELECT profiles.tenant_id FROM profiles WHERE profiles.id = auth.uid()));

-- ============================================================
-- 8. STORAGE BUCKET
-- ============================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 9. REALTIME (opcional - descomente se precisar)
-- ============================================================
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.cash_sessions;
