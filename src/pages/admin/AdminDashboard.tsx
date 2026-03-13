import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, CreditCard, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export default function AdminDashboard() {
  const [stats, setStats] = useState({ tenants: 0, users: 0, activeSubs: 0, revenue: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const [tenantsRes, profilesRes, subsRes] = await Promise.all([
        supabase.from("tenants").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("subscriptions").select("plan_id, plans(price_monthly)").eq("status", "active"),
      ]);

      const revenue = (subsRes.data || []).reduce((sum: number, s: any) => sum + (s.plans?.price_monthly || 0), 0);

      setStats({
        tenants: tenantsRes.count || 0,
        users: profilesRes.count || 0,
        activeSubs: subsRes.data?.length || 0,
        revenue,
      });
    };
    fetchStats();
  }, []);

  const cards = [
    { label: "Sorveterias", value: stats.tenants, icon: Building2, color: "text-primary" },
    { label: "Usuários", value: stats.users, icon: Users, color: "text-accent" },
    { label: "Assinaturas Ativas", value: stats.activeSubs, icon: CreditCard, color: "text-primary" },
    { label: "Receita Mensal", value: `R$ ${stats.revenue.toFixed(2)}`, icon: TrendingUp, color: "text-accent" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Painel Administrativo</h1>
        <p className="text-muted-foreground mt-1">Visão geral do SaaS GelaTech</p>
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <motion.div key={c.label} variants={item}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
                <c.icon className={cn("w-5 h-5", c.color)} />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">{c.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
