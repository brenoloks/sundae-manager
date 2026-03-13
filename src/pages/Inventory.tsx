import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertTriangle, ArrowDown, ArrowUp, Package, Plus, History, Search } from "lucide-react";
import { motion } from "framer-motion";

interface Product {
  id: string; name: string; stock: number; min_stock: number | null; unit: string;
  categories: { name: string; color: string } | null;
}

interface StockMovement {
  id: string; type: string; quantity: number; reason: string | null; notes: string | null;
  created_at: string; product_id: string;
  products: { name: string } | null;
}

const reasonOptions: Record<string, string[]> = {
  entrada: ["Compra", "Devolução", "Ajuste de inventário", "Produção", "Outro"],
  saida: ["Perda/Avaria", "Vencimento", "Ajuste de inventário", "Consumo interno", "Outro"],
};

export default function Inventory() {
  const { user, profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [search, setSearch] = useState("");
  const [movSearch, setMovSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ product_id: "", type: "entrada", quantity: "", reason: "", notes: "" });
  const tenantId = profile?.tenant_id;

  const fetchProducts = async () => {
    if (!tenantId) return;
    const { data } = await supabase.from("products").select("id, name, stock, min_stock, unit, categories(name, color)").eq("tenant_id", tenantId).eq("is_active", true).order("name");
    setProducts((data as any) || []);
    setLoading(false);
  };

  const fetchMovements = async () => {
    if (!tenantId) return;
    const { data } = await supabase.from("stock_movements").select("*, products(name)").eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(100);
    setMovements((data as any) || []);
  };

  useEffect(() => { fetchProducts(); fetchMovements(); }, [tenantId]);

  const lowStockProducts = products.filter((p) => p.stock <= (p.min_stock ?? 5));
  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  const filteredMovements = movements.filter((m) =>
    (m.products?.name || "").toLowerCase().includes(movSearch.toLowerCase()) ||
    (m.reason || "").toLowerCase().includes(movSearch.toLowerCase())
  );

  const openMovement = (productId?: string) => {
    setForm({ product_id: productId || "", type: "entrada", quantity: "", reason: "", notes: "" });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.product_id || !form.quantity || !user || !tenantId) {
      toast.error("Preencha produto e quantidade");
      return;
    }
    const qty = parseInt(form.quantity);
    if (qty <= 0) { toast.error("Quantidade deve ser maior que zero"); return; }

    const product = products.find((p) => p.id === form.product_id);
    if (!product) return;

    if (form.type === "saida" && qty > product.stock) {
      toast.error(`Estoque insuficiente. Disponível: ${product.stock}`);
      return;
    }

    // Insert movement
    const { error: movError } = await supabase.from("stock_movements").insert({
      tenant_id: tenantId,
      product_id: form.product_id,
      type: form.type,
      quantity: qty,
      reason: form.reason || null,
      notes: form.notes || null,
      user_id: user.id,
    });
    if (movError) { toast.error(movError.message); return; }

    // Update product stock
    const newStock = form.type === "entrada" ? product.stock + qty : product.stock - qty;
    const { error: updateError } = await supabase.from("products").update({ stock: Math.max(0, newStock) }).eq("id", form.product_id);
    if (updateError) { toast.error(updateError.message); return; }

    toast.success(`${form.type === "entrada" ? "Entrada" : "Saída"} de ${qty} ${product.unit === "kg" ? "kg" : "un"} registrada!`);
    setDialogOpen(false);
    fetchProducts();
    fetchMovements();
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Controle de Estoque</h1>
          <p className="text-muted-foreground mt-1">{products.length} produtos • {lowStockProducts.length} com estoque baixo</p>
        </div>
        <Button onClick={() => openMovement()}>
          <Plus className="w-4 h-4 mr-2" />Nova Movimentação
        </Button>
      </div>

      {/* Low stock alerts */}
      {lowStockProducts.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-4 h-4" />Alertas de Estoque Baixo
            </CardTitle>
            <CardDescription>{lowStockProducts.length} produto(s) abaixo do estoque mínimo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {lowStockProducts.map((p) => (
                <Badge key={p.id} variant="outline" className="border-destructive/50 text-destructive cursor-pointer hover:bg-destructive/10" onClick={() => openMovement(p.id)}>
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {p.name}: {p.stock}/{p.min_stock ?? 5}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="estoque" className="space-y-4">
        <TabsList>
          <TabsTrigger value="estoque" className="gap-2"><Package className="w-4 h-4" />Estoque Atual</TabsTrigger>
          <TabsTrigger value="historico" className="gap-2"><History className="w-4 h-4" />Histórico</TabsTrigger>
        </TabsList>

        {/* Current stock */}
        <TabsContent value="estoque">
          <div className="relative max-w-sm mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar produto..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Estoque</TableHead>
                    <TableHead>Mínimo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-28">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p, i) => {
                    const isLow = p.stock <= (p.min_stock ?? 5);
                    return (
                      <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="border-b transition-colors hover:bg-muted/50">
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell>
                          {p.categories ? <Badge style={{ backgroundColor: p.categories.color, color: "#fff" }}>{p.categories.name}</Badge> : "—"}
                        </TableCell>
                        <TableCell>
                          <span className={isLow ? "text-destructive font-bold" : "font-semibold"}>
                            {p.stock} {p.unit === "kg" ? "kg" : "un"}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{p.min_stock ?? 5}</TableCell>
                        <TableCell>
                          {isLow ? (
                            <Badge variant="destructive" className="gap-1"><AlertTriangle className="w-3 h-3" />Baixo</Badge>
                          ) : (
                            <Badge variant="secondary">Normal</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="outline" size="sm" className="gap-1 text-emerald-600" onClick={() => { setForm({ product_id: p.id, type: "entrada", quantity: "", reason: "", notes: "" }); setDialogOpen(true); }}>
                              <ArrowDown className="w-3 h-3" />Entrada
                            </Button>
                            <Button variant="outline" size="sm" className="gap-1 text-destructive" onClick={() => { setForm({ product_id: p.id, type: "saida", quantity: "", reason: "", notes: "" }); setDialogOpen(true); }}>
                              <ArrowUp className="w-3 h-3" />Saída
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">{loading ? "Carregando..." : "Nenhum produto encontrado"}</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Movement history */}
        <TabsContent value="historico">
          <div className="relative max-w-sm mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar no histórico..." value={movSearch} onChange={(e) => setMovSearch(e.target.value)} className="pl-9" />
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Qtd</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Obs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMovements.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {format(new Date(m.created_at), "dd/MM HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="font-medium">{m.products?.name || "—"}</TableCell>
                      <TableCell>
                        {m.type === "entrada" ? (
                          <Badge className="bg-emerald-100 text-emerald-700 gap-1"><ArrowDown className="w-3 h-3" />Entrada</Badge>
                        ) : (
                          <Badge variant="destructive" className="gap-1"><ArrowUp className="w-3 h-3" />Saída</Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-semibold">{m.quantity}</TableCell>
                      <TableCell className="text-muted-foreground">{m.reason || "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-xs max-w-[150px] truncate">{m.notes || "—"}</TableCell>
                    </TableRow>
                  ))}
                  {filteredMovements.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma movimentação encontrada</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Movement dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form.type === "entrada" ? "Entrada de Estoque" : "Saída de Estoque"}</DialogTitle>
            <DialogDescription>Registrar movimentação manual de estoque</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Produto</Label>
              <Select value={form.product_id} onValueChange={(v) => setForm({ ...form, product_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione o produto" /></SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name} (estoque: {p.stock})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo</Label>
              <div className="flex gap-2 mt-1">
                <Button variant={form.type === "entrada" ? "default" : "outline"} size="sm" className={form.type === "entrada" ? "bg-emerald-600 hover:bg-emerald-700" : ""} onClick={() => setForm({ ...form, type: "entrada", reason: "" })}>
                  <ArrowDown className="w-4 h-4 mr-1" />Entrada
                </Button>
                <Button variant={form.type === "saida" ? "destructive" : "outline"} size="sm" onClick={() => setForm({ ...form, type: "saida", reason: "" })}>
                  <ArrowUp className="w-4 h-4 mr-1" />Saída
                </Button>
              </div>
            </div>
            <div>
              <Label>Quantidade</Label>
              <Input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="10" />
            </div>
            <div>
              <Label>Motivo</Label>
              <Select value={form.reason} onValueChange={(v) => setForm({ ...form, reason: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione o motivo" /></SelectTrigger>
                <SelectContent>
                  {(reasonOptions[form.type] || []).map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Observações (opcional)</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Detalhes adicionais..." rows={2} />
            </div>
            <Button onClick={handleSubmit} className="w-full">
              Registrar {form.type === "entrada" ? "Entrada" : "Saída"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
