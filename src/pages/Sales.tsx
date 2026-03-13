import { Search, Eye, Receipt, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

const sales = [
  { id: 47, date: "13/03/2026 14:32", user: "Maria", items: 3, total: 42.0, payment: "PIX" },
  { id: 46, date: "13/03/2026 14:15", user: "Maria", items: 2, total: 28.5, payment: "Dinheiro" },
  { id: 45, date: "13/03/2026 12:48", user: "Maria", items: 5, total: 95.0, payment: "Cartão Créd." },
  { id: 44, date: "13/03/2026 12:30", user: "João", items: 1, total: 18.0, payment: "PIX" },
  { id: 43, date: "13/03/2026 11:45", user: "João", items: 4, total: 62.0, payment: "Cartão Déb." },
  { id: 42, date: "13/03/2026 11:10", user: "Maria", items: 2, total: 36.0, payment: "Dinheiro" },
  { id: 41, date: "13/03/2026 10:30", user: "João", items: 3, total: 54.0, payment: "PIX" },
];

const paymentColor: Record<string, string> = {
  PIX: "bg-primary/10 text-primary",
  Dinheiro: "bg-accent/10 text-accent",
  "Cartão Créd.": "bg-secondary text-secondary-foreground",
  "Cartão Déb.": "bg-muted text-muted-foreground",
};

export default function Sales() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Vendas</h1>
        <p className="text-muted-foreground">Histórico de vendas</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar venda..." className="pl-9" />
        </div>
        <Button variant="outline" className="gap-2"><Calendar className="w-4 h-4" /> Filtrar data</Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Receipt className="w-4 h-4 text-primary" />
            {sales.length} vendas hoje
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left pb-3 font-medium">#</th>
                  <th className="text-left pb-3 font-medium">Data/Hora</th>
                  <th className="text-left pb-3 font-medium">Vendedor</th>
                  <th className="text-center pb-3 font-medium">Itens</th>
                  <th className="text-left pb-3 font-medium">Pagamento</th>
                  <th className="text-right pb-3 font-medium">Total</th>
                  <th className="text-right pb-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s, i) => (
                  <motion.tr
                    key={s.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3 font-mono text-muted-foreground">#{String(s.id).padStart(4, "0")}</td>
                    <td className="py-3 text-muted-foreground">{s.date}</td>
                    <td className="py-3 text-foreground">{s.user}</td>
                    <td className="py-3 text-center">{s.items}</td>
                    <td className="py-3">
                      <Badge variant="secondary" className={paymentColor[s.payment] || ""}>{s.payment}</Badge>
                    </td>
                    <td className="py-3 text-right font-semibold text-foreground">R$ {s.total.toFixed(2).replace(".", ",")}</td>
                    <td className="py-3 text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="w-4 h-4" /></Button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
