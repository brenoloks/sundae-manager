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
  extra_stores: number;
  extra_storage_gb: number;
  current_period_start: string;
  current_period_end: string;
  tenants: { name: string } | null;
  plans: { name: string; price_monthly: number; price_yearly: number; price_per_extra_store: number; price_per_extra_gb: number } | null;
}

export default function AdminSubscriptions() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("*, tenants(name), plans(name, price_monthly, price_yearly, price_per_extra_store, price_per_extra_gb)")
        .order("created_at", { ascending: false });
      setSubs((data as any) || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const calcTotal = (s: Subscription) => {
    if (!s.plans) return 0;
    const base = s.billing_cycle === "yearly" ? s.plans.price_yearly / 12 : s.plans.price_monthly;
    const storeExtra = (s.extra_stores || 0) * (s.plans.price_per_extra_store || 0);
    const storageExtra = (s.extra_storage_gb || 0) * (s.plans.price_per_extra_gb || 0);
    return base + storeExtra + storageExtra;
  };

  const statusColor = (s: string) => {
    if (s === "active") return "default";
    if (s === "canceled") return "destructive";
    return "secondary";
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Assinaturas</h1>
        <p className="text-muted-foreground mt-1">Acompanhe todas as assinaturas com custos extras</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sorveteria</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Base</TableHead>
                <TableHead>Extras</TableHead>
                <TableHead>Total/mês</TableHead>
                <TableHead>Ciclo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Período</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subs.map((s) => {
                const storeExtra = (s.extra_stores || 0) * (s.plans?.price_per_extra_store || 0);
                const storageExtra = (s.extra_storage_gb || 0) * (s.plans?.price_per_extra_gb || 0);
                const total = calcTotal(s);
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.tenants?.name || "—"}</TableCell>
                    <TableCell>{s.plans?.name || "—"}</TableCell>
                    <TableCell>R$ {Number(s.plans?.price_monthly || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-sm">
                      {(s.extra_stores > 0 || s.extra_storage_gb > 0) ? (
                        <div className="space-y-0.5">
                          {s.extra_stores > 0 && <div>{s.extra_stores} loja(s): +R$ {storeExtra.toFixed(2)}</div>}
                          {s.extra_storage_gb > 0 && <div>{s.extra_storage_gb} GB: +R$ {storageExtra.toFixed(2)}</div>}
                        </div>
                      ) : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="font-semibold">R$ {total.toFixed(2)}</TableCell>
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
                );
              })}
              {subs.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
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
