import { BarChart3, TrendingUp, DollarSign, ShoppingCart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, LineChart, Line } from "recharts";

const dailyData = [
  { hour: "08h", vendas: 120 },
  { hour: "09h", vendas: 280 },
  { hour: "10h", vendas: 450 },
  { hour: "11h", vendas: 380 },
  { hour: "12h", vendas: 520 },
  { hour: "13h", vendas: 610 },
  { hour: "14h", vendas: 490 },
  { hour: "15h", vendas: 350 },
  { hour: "16h", vendas: 420 },
  { hour: "17h", vendas: 280 },
];

const monthlyData = [
  { day: "01", vendas: 2800 },
  { day: "05", vendas: 3200 },
  { day: "10", vendas: 4100 },
  { day: "15", vendas: 3800 },
  { day: "20", vendas: 5200 },
  { day: "25", vendas: 4600 },
  { day: "30", vendas: 3900 },
];

export default function Reports() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
        <p className="text-muted-foreground">Análise de desempenho</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Faturamento Mensal", value: "R$ 89.400", icon: DollarSign },
          { label: "Total de Vendas", value: "1.247", icon: ShoppingCart },
          { label: "Ticket Médio", value: "R$ 71,69", icon: TrendingUp },
          { label: "Crescimento", value: "+18%", icon: BarChart3 },
        ].map((s) => (
          <Card key={s.label} className="shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <s.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold text-foreground">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader><CardTitle className="text-base font-semibold">Vendas por Hora — Hoje</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(200 15% 90%)" />
                <XAxis dataKey="hour" fontSize={12} stroke="hsl(200 10% 45%)" />
                <YAxis fontSize={12} stroke="hsl(200 10% 45%)" />
                <Tooltip />
                <Bar dataKey="vendas" fill="hsl(173 58% 39%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader><CardTitle className="text-base font-semibold">Evolução Mensal</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(200 15% 90%)" />
                <XAxis dataKey="day" fontSize={12} stroke="hsl(200 10% 45%)" />
                <YAxis fontSize={12} stroke="hsl(200 10% 45%)" />
                <Tooltip />
                <Line type="monotone" dataKey="vendas" stroke="hsl(25 95% 53%)" strokeWidth={2.5} dot={{ fill: "hsl(25 95% 53%)", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
