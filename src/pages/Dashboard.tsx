import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DollarSign, ShoppingCart, TrendingUp, Users, ArrowUpRight, Package, Store } from "lucide-react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import { format, subDays } from "date-fns";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export default function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ salesToday: 0, orderCount: 0, avgTicket: 0, productCount: 0 });
  const [weeklyData, setWeeklyData] = useState<{ day: string; vendas: number }[]>([]);
  const [topProducts, setTopProducts] = useState<{ name: string; qty: number; revenue: number }[]>([]);
  const [tenantName, setTenantName] = useState("");

  const tenantId = profile?.tenant_id;

  useEffect(() => {
    if (!tenantId) return;
    const today = format(new Date(), "yyyy-MM-dd");

    const fetchAll = async () => {
      const [tenantRes, todayOrders, productCount, weekOrders] = await Promise.all([
        supabase.from("tenants").select("name").eq("id", tenantId).single(),
        supabase.from("orders").select("total, order_items(product_name, quantity, total_price)")
          .eq("tenant_id", tenantId).gte("created_at", `${today}T00:00:00`).lte("created_at", `${today}T23:59:59`),
        supabase.from("products").select("id").eq("tenant_id", tenantId).eq("is_active", true),
        supabase.from("orders").select("total, created_at")
          .eq("tenant_id", tenantId)
          .gte("created_at", format(subDays(new Date(), 6), "yyyy-MM-dd") + "T00:00:00"),
      ]);

      setTenantName(tenantRes.data?.name || "");

      const orders = todayOrders.data || [];
      const salesToday = orders.reduce((s, o) => s + Number(o.total), 0);
      const orderCount = orders.length;
      setStats({
        salesToday,
        orderCount,
        avgTicket: orderCount > 0 ? salesToday / orderCount : 0,
        productCount: productCount.data?.length || 0,
      });

      // Top products today
      const prodMap: Record<string, { qty: number; revenue: number }> = {};
      orders.forEach((o: any) => {
        o.order_items?.forEach((item: any) => {
          if (!prodMap[item.product_name]) prodMap[item.product_name] = { qty: 0, revenue: 0 };
          prodMap[item.product_name].qty += Number(item.quantity);
          prodMap[item.product_name].revenue += Number(item.total_price);
        });
      });
      setTopProducts(Object.entries(prodMap).map(([name, d]) => ({ name, ...d })).sort((a, b) => b.revenue - a.revenue).slice(0, 5));

      // Weekly chart
      const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
      const dayMap: Record<string, number> = {};
      (weekOrders.data || []).forEach((o) => {
        const d = days[new Date(o.created_at).getDay()];
        dayMap[d] = (dayMap[d] || 0) + Number(o.total);
      });
      setWeeklyData(days.map((d) => ({ day: d, vendas: dayMap[d] || 0 })));
    };

    fetchAll();
  }, [tenantId]);

  const statCards = [
    { label: "Vendas Hoje", value: `R$ ${stats.salesToday.toFixed(2)}`, icon: DollarSign, color: "bg-primary" },
    { label: "Nº de Vendas", value: String(stats.orderCount), icon: ShoppingCart, color: "bg-accent" },
    { label: "Ticket Médio", value: `R$ ${stats.avgTicket.toFixed(2)}`, icon: TrendingUp, color: "bg-primary" },
    { label: "Produtos Ativos", value: String(stats.productCount), icon: Package, color: "bg-accent" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Resumo do dia — {tenantName}</p>
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={item} initial="hidden" animate="show" className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle className="text-base">Vendas da Semana</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={13} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={13} tickFormatter={(v) => `R$${(v / 1000).toFixed(1)}k`} />
                  <Tooltip formatter={(v: number) => [`R$ ${v.toFixed(2)}`, "Vendas"]} />
                  <Bar dataKey="vendas" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item} initial="hidden" animate="show">
          <Card className="h-full">
            <CardHeader><CardTitle className="text-base">Top Produtos Hoje</CardTitle></CardHeader>
            <CardContent>
              {topProducts.length > 0 ? (
                <div className="space-y-3">
                  {topProducts.map((p, i) => (
                    <div key={p.name} className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">{i + 1}</span>
                      <span className="flex-1 font-medium text-foreground text-sm truncate">{p.name}</span>
                      <span className="text-xs text-muted-foreground">{p.qty}un</span>
                      <span className="text-sm font-semibold text-foreground">R$ {p.revenue.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-muted-foreground text-sm text-center py-8">Nenhuma venda hoje ainda</p>}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
