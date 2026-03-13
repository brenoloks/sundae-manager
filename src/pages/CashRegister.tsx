import { DollarSign, ArrowUpCircle, ArrowDownCircle, Lock, Unlock, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

const movements = [
  { id: 1, type: "entrada", desc: "Venda #0047", value: 42.0, user: "Maria", time: "14:32" },
  { id: 2, type: "entrada", desc: "Venda #0046", value: 28.5, time: "14:15", user: "Maria" },
  { id: 3, type: "saida", desc: "Sangria", value: 200.0, time: "13:00", user: "João" },
  { id: 4, type: "entrada", desc: "Venda #0045", value: 95.0, time: "12:48", user: "Maria" },
  { id: 5, type: "entrada", desc: "Venda #0044", value: 18.0, time: "12:30", user: "João" },
  { id: 6, type: "saida", desc: "Despesa — Gelo", value: 35.0, time: "11:00", user: "João" },
];

export default function CashRegister() {
  const isOpen = true;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Controle de Caixa</h1>
          <p className="text-muted-foreground">Hoje — 13 de Março de 2026</p>
        </div>
        <Button variant={isOpen ? "destructive" : "default"} className="gap-2 font-semibold">
          {isOpen ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          {isOpen ? "Fechar Caixa" : "Abrir Caixa"}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground font-medium">Valor Inicial</p>
            <p className="text-2xl font-bold text-foreground mt-1">R$ 200,00</p>
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" /> Aberto às 08:00 por João
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground font-medium">Entradas</p>
            <p className="text-2xl font-bold text-primary mt-1">+ R$ 3.850,00</p>
            <p className="text-xs text-muted-foreground mt-2">47 vendas realizadas</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground font-medium">Saídas</p>
            <p className="text-2xl font-bold text-destructive mt-1">- R$ 235,00</p>
            <p className="text-xs text-muted-foreground mt-2">2 movimentações</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold">Movimentações</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1 text-xs">
              <ArrowDownCircle className="w-3 h-3" /> Sangria
            </Button>
            <Button variant="outline" size="sm" className="gap-1 text-xs">
              <ArrowUpCircle className="w-3 h-3" /> Entrada
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {movements.map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/30 transition-colors"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${m.type === "entrada" ? "bg-primary/10" : "bg-destructive/10"}`}>
                  {m.type === "entrada" ? (
                    <ArrowUpCircle className="w-4 h-4 text-primary" />
                  ) : (
                    <ArrowDownCircle className="w-4 h-4 text-destructive" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground text-sm">{m.desc}</p>
                  <p className="text-xs text-muted-foreground">{m.user} • {m.time}</p>
                </div>
                <span className={`font-semibold text-sm ${m.type === "entrada" ? "text-primary" : "text-destructive"}`}>
                  {m.type === "entrada" ? "+" : "-"} R$ {m.value.toFixed(2).replace(".", ",")}
                </span>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
