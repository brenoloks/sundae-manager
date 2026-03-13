import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Search, Receipt } from "lucide-react";
import ReceiptDialog from "@/components/ReceiptDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Order { id: string; order_number?: number; subtotal: number; discount: number; total: number; payment_method: string; customer_name: string | null; created_at: string; order_items: { product_name: string; quantity: number; unit_price: number; total_price: number; weight_kg: number | null }[]; }
const pmLabels: Record<string, string> = { dinheiro: "Dinheiro", pix: "PIX", credito: "Crédito", debito: "Débito" };

export default function Sales() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState(format(new Date(), "yyyy-MM-dd"));
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const tenantId = profile?.tenant_id;

  useEffect(() => {
    if (!tenantId) return;
    const fetchOrders = async () => {
      const { data } = await supabase.from("orders").select("*, order_items(product_name, quantity, unit_price, total_price, weight_kg)").eq("tenant_id", tenantId).gte("created_at", `${dateFilter}T00:00:00`).lte("created_at", `${dateFilter}T23:59:59`).order("created_at", { ascending: false });
      setOrders((data as any) || []); setLoading(false);
    };
    fetchOrders();
  }, [tenantId, dateFilter]);

  const filtered = orders.filter((o) => (o.customer_name || "").toLowerCase().includes(search.toLowerCase()) || o.id.includes(search));
  const totalDay = filtered.reduce((sum, o) => sum + Number(o.total), 0);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold text-foreground">Vendas</h1><p className="text-muted-foreground mt-1">{filtered.length} vendas — Total: R$ {totalDay.toFixed(2)}</p></div>
        <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-auto" />
      </div>
      <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
      <Card><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Horário</TableHead><TableHead>Itens</TableHead><TableHead>Pagamento</TableHead><TableHead>Cliente</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
        <TableBody>{filtered.map((o) => (
          <TableRow key={o.id}>
            <TableCell className="font-mono text-xs text-muted-foreground">#{o.id.slice(0, 6)}</TableCell>
            <TableCell className="text-sm">{format(new Date(o.created_at), "HH:mm", { locale: ptBR })}</TableCell>
            <TableCell><div className="space-y-0.5">{o.order_items.map((item, i) => <p key={i} className="text-xs text-muted-foreground">{item.weight_kg ? `${item.weight_kg}kg` : `${item.quantity}x`} {item.product_name}</p>)}</div></TableCell>
            <TableCell><Badge variant="outline">{pmLabels[o.payment_method] || o.payment_method}</Badge></TableCell>
            <TableCell className="text-muted-foreground">{o.customer_name || "—"}</TableCell>
            <TableCell className="text-right font-semibold">R$ {Number(o.total).toFixed(2)}</TableCell>
          </TableRow>
        ))}{filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">{loading ? "Carregando..." : "Nenhuma venda encontrada"}</TableCell></TableRow>}</TableBody>
      </Table></CardContent></Card>
    </div>
  );
}
