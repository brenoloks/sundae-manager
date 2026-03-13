import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Subscription {
  id: string;
  status: string;
  billing_cycle: string;
  current_period_start: string;
  current_period_end: string;
  tenants: { name: string } | null;
  plans: { name: string; price_monthly: number } | null;
}

export default function AdminSubscriptions() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("*, tenants(name), plans(name, price_monthly)")
        .order("created_at", { ascending: false });
      setSubs((data as any) || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const statusColor = (s: string) => {
    if (s === "active") return "default";
    if (s === "canceled") return "destructive";
    return "secondary";
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Assinaturas</h1>
        <p className="text-muted-foreground mt-1">Acompanhe todas as assinaturas</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sorveteria</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Ciclo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Período</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subs.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.tenants?.name || "—"}</TableCell>
                  <TableCell>{s.plans?.name || "—"}</TableCell>
                  <TableCell>R$ {Number(s.plans?.price_monthly || 0).toFixed(2)}</TableCell>
                  <TableCell className="capitalize">{s.billing_cycle === "monthly" ? "Mensal" : "Anual"}</TableCell>
                  <TableCell>
                    <Badge variant={statusColor(s.status) as any}>
                      {s.status === "active" ? "Ativa" : s.status === "canceled" ? "Cancelada" : s.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(s.current_period_start), "dd/MM/yy", { locale: ptBR })} — {format(new Date(s.current_period_end), "dd/MM/yy", { locale: ptBR })}
                  </TableCell>
                </TableRow>
              ))}
              {subs.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {loading ? "Carregando..." : "Nenhuma assinatura encontrada"}
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
