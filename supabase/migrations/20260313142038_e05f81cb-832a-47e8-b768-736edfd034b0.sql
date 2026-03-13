
-- Fix overly permissive policy on order_items for super_admins
DROP POLICY "Super admins manage all order items" ON public.order_items;
CREATE POLICY "Super admins manage all order items" ON public.order_items
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));
