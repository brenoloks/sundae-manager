import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from "recharts";
import { motion } from "framer-motion";

const PIE_COLORS = ["hsl(173 58% 39%)", "hsl(25 95% 53%)", "hsl(200 25% 60%)", "hsl(200 15% 80%)"];
const pmLabels: Record<string, string> = { dinheiro: "Dinheiro", pix: "PIX", credito: "Crédito", debito: "Débito" };

export default function Reports() {
  const { profile } = useAuth();
  const [weeklyData, setWeeklyData] = useState<{ day: string; vendas: number }[]>([]);
  const [paymentData, setPaymentData] = useState<{ name: string; value: number }[]>([]);
  const [topProducts, setTopProducts] = useState<{ name: string; qty: number; revenue: number }[]>([]);
  const [period, setPeriod] = useState(() => {
    const today = new Date(); const start = new Date(today); start.setDate(start.getDate() - 6);
    return { start: start.toISOString().slice(0, 10), end: today.toISOString().slice(0, 10) };
  });
  const tenantId = profile?.tenant_id;

  useEffect(() => {
    if (!tenantId) return;
    const fetchReports = async () => {
      const { data: orders } = await supabase.from("orders").select("total, payment_method, created_at, order_items(product_name, quantity, total_price)").eq("tenant_id", tenantId).gte("created_at", `${period.start}T00:00:00`).lte("created_at", `${period.end}T23:59:59`);
      if (!orders) return;
      const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
      const dayMap: Record<string, number> = {};
      orders.forEach((o) => { const d = days[new Date(o.created_at).getDay()]; dayMap[d] = (dayMap[d] || 0) + Number(o.total); });
      setWeeklyData(days.map((d) => ({ day: d, vendas: dayMap[d] || 0 })));
      const pmMap: Record<string, number> = {};
      orders.forEach((o) => { const l = pmLabels[o.payment_method] || o.payment_method; pmMap[l] = (pmMap[l] || 0) + 1; });
      setPaymentData(Object.entries(pmMap).map(([name, value]) => ({ name, value })));
      const prodMap: Record<string, { qty: number; revenue: number }> = {};
      orders.forEach((o) => { (o.order_items as any[])?.forEach((item) => { if (!prodMap[item.product_name]) prodMap[item.product_name] = { qty: 0, revenue: 0 }; prodMap[item.product_name].qty += Number(item.quantity); prodMap[item.product_name].revenue += Number(item.total_price); }); });
      setTopProducts(Object.entries(prodMap).map(([name, d]) => ({ name, ...d })).sort((a, b) => b.revenue - a.revenue).slice(0, 10));
    };
    fetchReports();
  }, [tenantId, period]);

  const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold text-foreground">Relatórios</h1><p className="text-muted-foreground mt-1">Análise de vendas e desempenho</p></div>
        <div className="flex items-center gap-2"><Input type="date" value={period.start} onChange={(e) => setPeriod({ ...period, start: e.target.value })} className="w-auto" /><span className="text-muted-foreground">até</span><Input type="date" value={period.end} onChange={(e) => setPeriod({ ...period, end: e.target.value })} className="w-auto" /></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={item} initial="hidden" animate="show" className="lg:col-span-2"><Card><CardHeader><CardTitle className="text-base">Vendas por Dia</CardTitle></CardHeader><CardContent>
          <ResponsiveContainer width="100%" height={280}><BarChart data={weeklyData}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={13} /><YAxis stroke="hsl(var(--muted-foreground))" fontSize={13} tickFormatter={(v) => `R$${(v / 1000).toFixed(1)}k`} /><Tooltip formatter={(v: number) => [`R$ ${v.toFixed(2)}`, "Vendas"]} /><Bar dataKey="vendas" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>
        </CardContent></Card></motion.div>
        <motion.div variants={item} initial="hidden" animate="show"><Card className="h-full"><CardHeader><CardTitle className="text-base">Formas de Pagamento</CardTitle></CardHeader><CardContent className="flex flex-col items-center">
          {paymentData.length > 0 ? (<><ResponsiveContainer width="100%" height={180}><PieChart><Pie data={paymentData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>{paymentData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}</Pie></PieChart></ResponsiveContainer>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-2 text-sm">{paymentData.map((p, i) => <div key={p.name} className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} /><span className="text-muted-foreground">{p.name}</span><span className="font-semibold text-foreground ml-auto">{p.value}</span></div>)}</div></>) : <p className="text-muted-foreground text-sm py-8">Sem dados</p>}
        </CardContent></Card></motion.div>
      </div>
      <motion.div variants={item} initial="hidden" animate="show"><Card><CardHeader><CardTitle className="text-base">Produtos Mais Vendidos</CardTitle></CardHeader><CardContent>
        {topProducts.length > 0 ? <div className="space-y-3">{topProducts.map((p, i) => <div key={p.name} className="flex items-center gap-4"><span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">{i + 1}</span><span className="flex-1 font-medium text-foreground">{p.name}</span><span className="text-sm text-muted-foreground">{p.qty} un.</span><span className="text-sm font-semibold text-foreground w-24 text-right">R$ {p.revenue.toFixed(2)}</span></div>)}</div> : <p className="text-muted-foreground text-sm text-center py-8">Sem dados</p>}
      </CardContent></Card></motion.div>
    </div>
  );
}
