
-- Allow owners to update their own tenant
CREATE POLICY "Owners can update own tenant"
ON public.tenants FOR UPDATE TO authenticated
USING (id = (SELECT profiles.tenant_id FROM profiles WHERE profiles.id = auth.uid()))
WITH CHECK (id = (SELECT profiles.tenant_id FROM profiles WHERE profiles.id = auth.uid()));
