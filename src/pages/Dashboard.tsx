import { DollarSign, ShoppingCart, TrendingUp, Users, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from "recharts";

const stats = [
  { label: "Vendas Hoje", value: "R$ 3.850,00", change: "+12%", up: true, icon: DollarSign, color: "bg-primary" },
  { label: "Nº de Vendas", value: "47", change: "+8%", up: true, icon: ShoppingCart, color: "bg-accent" },
  { label: "Ticket Médio", value: "R$ 81,91", change: "-3%", up: false, icon: TrendingUp, color: "bg-primary" },
  { label: "Clientes Hoje", value: "38", change: "+15%", up: true, icon: Users, color: "bg-accent" },
];

const weeklyData = [
  { day: "Seg", vendas: 2400 },
  { day: "Ter", vendas: 3100 },
  { day: "Qua", vendas: 2800 },
  { day: "Qui", vendas: 3500 },
  { day: "Sex", vendas: 4200 },
  { day: "Sáb", vendas: 5800 },
  { day: "Dom", vendas: 4900 },
];

const paymentData = [
  { name: "PIX", value: 42, color: "hsl(173 58% 39%)" },
  { name: "Cartão Créd.", value: 28, color: "hsl(25 95% 53%)" },
  { name: "Cartão Déb.", value: 18, color: "hsl(200 25% 60%)" },
  { name: "Dinheiro", value: 12, color: "hsl(200 15% 80%)" },
];

const topProducts = [
  { name: "Açaí 500ml", qty: 32, revenue: "R$ 960,00" },
  { name: "Casquinha Dupla", qty: 28, revenue: "R$ 392,00" },
  { name: "Picolé Premium", qty: 25, revenue: "R$ 200,00" },
  { name: "Sorvete 1kg", qty: 18, revenue: "R$ 720,00" },
  { name: "Milk Shake", qty: 15, revenue: "R$ 270,00" },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export default function Dashboard() {
  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Resumo do dia — Sorveteria Gelato Mágico</p>
      </div>

      {/* Stats */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
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
                <div className="flex items-center gap-1 mt-3">
                  {s.up ? (
                    <ArrowUpRight className="w-4 h-4 text-primary" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-destructive" />
                  )}
                  <span className={`text-sm font-medium ${s.up ? "text-primary" : "text-destructive"}`}>
                    {s.change}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">vs ontem</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={item} initial="hidden" animate="show" className="lg:col-span-2">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Vendas da Semana</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(200 15% 90%)" />
                  <XAxis dataKey="day" stroke="hsl(200 10% 45%)" fontSize={13} />
                  <YAxis stroke="hsl(200 10% 45%)" fontSize={13} tickFormatter={(v) => `R$${v / 1000}k`} />
                  <Tooltip formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR")}`, "Vendas"]} />
                  <Bar dataKey="vendas" fill="hsl(173 58% 39%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item} initial="hidden" animate="show">
          <Card className="shadow-sm h-full">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Formas de Pagamento</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={paymentData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                    {paymentData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-2 text-sm">
                {paymentData.map((p) => (
                  <div key={p.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                    <span className="text-muted-foreground">{p.name}</span>
                    <span className="font-semibold text-foreground ml-auto">{p.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Top Products */}
      <motion.div variants={item} initial="hidden" animate="show">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Produtos Mais Vendidos Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center gap-4">
                  <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                    {i + 1}
                  </span>
                  <span className="flex-1 font-medium text-foreground">{p.name}</span>
                  <span className="text-sm text-muted-foreground">{p.qty} un.</span>
                  <span className="text-sm font-semibold text-foreground w-24 text-right">{p.revenue}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
