
-- Function to auto-create/update subscription when tenant plan changes
CREATE OR REPLACE FUNCTION public.handle_tenant_plan_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only act when plan_id changes and is not null
  IF NEW.plan_id IS NOT NULL AND (OLD.plan_id IS DISTINCT FROM NEW.plan_id) THEN
    -- Deactivate any existing active subscription for this tenant
    UPDATE public.subscriptions
    SET status = 'canceled', updated_at = now()
    WHERE tenant_id = NEW.id AND status = 'active';

    -- Create new active subscription
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

  -- If plan removed, cancel active subscriptions
  IF NEW.plan_id IS NULL AND OLD.plan_id IS NOT NULL THEN
    UPDATE public.subscriptions
    SET status = 'canceled', updated_at = now()
    WHERE tenant_id = NEW.id AND status = 'active';
  END IF;

  RETURN NEW;
END;
$$;

-- Attach trigger to tenants table
CREATE TRIGGER on_tenant_plan_change
  AFTER UPDATE OF plan_id ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_tenant_plan_change();

-- Also handle on insert (new tenant with plan)
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

CREATE TRIGGER on_tenant_created_with_plan
  AFTER INSERT ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_tenant_created_with_plan();
