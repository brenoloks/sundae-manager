import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Store, Users, HardDrive, DollarSign, TrendingUp, Building2 } from "lucide-react";
import { motion } from "framer-motion";

interface StoreData {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  state: string | null;
  is_active: boolean;
}

interface SubData {
  status: string;
  billing_cycle: string;
  extra_stores: number;
  extra_storage_gb: number;
  current_period_end: string;
  plans: {
    name: string;
    price_monthly: number;
    price_yearly: number;
    included_stores: number;
    max_users: number;
    max_products: number;
    storage_limit_gb: number;
    price_per_extra_store: number;
    price_per_extra_gb: number;
  } | null;
}

interface TenantData {
  name: string;
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export default function OwnerDashboard() {
  const { profile } = useAuth();
  const [stores, setStores] = useState<StoreData[]>([]);
  const [tenant, setTenant] = useState<TenantData | null>(null);
  const [subscription, setSubscription] = useState<SubData | null>(null);
  const [userCount, setUserCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.tenant_id) return;
    const tenantId = profile.tenant_id;

    const fetchAll = async () => {
      const [storesRes, tenantRes, subRes, usersRes] = await Promise.all([
        supabase.from("stores").select("id, name, slug, city, state, is_active").eq("tenant_id", tenantId).order("name"),
        supabase.from("tenants").select("name").eq("id", tenantId).single(),
        supabase
          .from("subscriptions")
          .select("status, billing_cycle, extra_stores, extra_storage_gb, current_period_end, plans(name, price_monthly, price_yearly, included_stores, max_users, max_products, storage_limit_gb, price_per_extra_store, price_per_extra_gb)")
          .eq("tenant_id", tenantId)
          .eq("status", "active")
          .maybeSingle(),
        supabase.from("profiles").select("id").eq("tenant_id", tenantId),
      ]);

      setStores((storesRes.data as StoreData[]) || []);
      setTenant(tenantRes.data as TenantData | null);
      setSubscription((subRes.data as any) || null);
      setUserCount(usersRes.data?.length || 0);
      setLoading(false);
    };

    fetchAll();
  }, [profile?.tenant_id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const plan = subscription?.plans;
  const activeStores = stores.filter((s) => s.is_active).length;
  const includedStores = plan?.included_stores || 1;
  const extraStores = Math.max(0, activeStores - includedStores);
  const totalStorageGb = (plan?.storage_limit_gb || 0) + (subscription?.extra_storage_gb || 0);

  const monthlyBase = plan ? (subscription?.billing_cycle === "yearly" ? plan.price_yearly / 12 : plan.price_monthly) : 0;
  const monthlyExtras = extraStores * (plan?.price_per_extra_store || 0) + (subscription?.extra_storage_gb || 0) * (plan?.price_per_extra_gb || 0);
  const monthlyTotal = monthlyBase + monthlyExtras;

  const daysLeft = subscription
    ? Math.max(0, Math.ceil((new Date(subscription.current_period_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const statsCards = [
    { label: "Lojas Ativas", value: `${activeStores}/${includedStores + extraStores}`, icon: Store, color: "bg-primary" },
    { label: "Usuários", value: `${userCount}/${plan?.max_users || "—"}`, icon: Users, color: "bg-accent" },
    { label: "Armazenamento", value: `${totalStorageGb} GB`, icon: HardDrive, color: "bg-primary" },
    { label: "Custo Mensal", value: `R$ ${monthlyTotal.toFixed(2)}`, icon: DollarSign, color: "bg-accent" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">{tenant?.name || "Minha Rede"} — Visão geral da franquia</p>
      </div>

      {/* Stats */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((s) => (
          <motion.div key={s.label} variants={item}>
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">{s.label}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center`}>
                    <s.icon className="w-5 h-5 text-primary-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Plan & Subscription Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={item} initial="hidden" animate="show">
          <Card className="shadow-sm h-full">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" /> Plano Atual
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {plan ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-foreground">{plan.name}</span>
                    <Badge variant="default">Ativo</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-muted-foreground">Base mensal</p>
                      <p className="font-semibold text-foreground">R$ {monthlyBase.toFixed(2)}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-muted-foreground">Extras</p>
                      <p className="font-semibold text-foreground">R$ {monthlyExtras.toFixed(2)}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-muted-foreground">Lojas inclusas</p>
                      <p className="font-semibold text-foreground">{plan.included_stores}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-muted-foreground">Renova em</p>
                      <p className="font-semibold text-foreground">{daysLeft} dias</p>
                    </div>
                  </div>
                  {extraStores > 0 && (
                    <p className="text-sm text-muted-foreground">
                      +{extraStores} loja(s) extra(s) × R$ {(plan.price_per_extra_store || 0).toFixed(2)} = R$ {(extraStores * (plan.price_per_extra_store || 0)).toFixed(2)}/mês
                    </p>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">Nenhum plano ativo</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Stores list */}
        <motion.div variants={item} initial="hidden" animate="show">
          <Card className="shadow-sm h-full">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" /> Minhas Lojas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stores.length > 0 ? (
                <div className="space-y-3">
                  {stores.map((store) => (
                    <div key={store.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Store className="w-4 h-4 text-primary" />
                        <div>
                          <p className="font-medium text-foreground text-sm">{store.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {store.city ? `${store.city}/${store.state}` : store.slug}
                          </p>
                        </div>
                      </div>
                      <Badge variant={store.is_active ? "default" : "secondary"}>
                        {store.is_active ? "Ativa" : "Inativa"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Nenhuma loja cadastrada ainda.</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
