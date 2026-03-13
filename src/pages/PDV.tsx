import { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Search, ShoppingCart, Plus, Minus, X, CreditCard, Banknote, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface Product { id: string; name: string; price: number; unit: string; price_per_kg: number; stock: number; is_active: boolean; category_id: string | null; categories: { name: string; color: string } | null; }
interface CartItem { product: Product; quantity: number; weight_kg?: number; total: number; }
interface Category { id: string; name: string; color: string; }

const paymentMethods = [
  { value: "dinheiro", label: "Dinheiro", icon: Banknote },
  { value: "pix", label: "PIX", icon: Smartphone },
  { value: "credito", label: "Crédito", icon: CreditCard },
  { value: "debito", label: "Débito", icon: CreditCard },
];

export default function PDV() {
  const { user, profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("dinheiro");
  const [discount, setDiscount] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [weightInput, setWeightInput] = useState("");
  const [weightProduct, setWeightProduct] = useState<Product | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const tenantId = profile?.tenant_id;

  useEffect(() => {
    if (!tenantId) return;
    const fetchData = async () => {
      const [prodRes, catRes] = await Promise.all([
        supabase.from("products").select("*, categories(name, color)").eq("tenant_id", tenantId).eq("is_active", true).order("name"),
        supabase.from("categories").select("*").eq("tenant_id", tenantId).eq("is_active", true).order("name"),
      ]);
      setProducts((prodRes.data as any) || []);
      setCategories((catRes.data as Category[]) || []);
    };
    fetchData();
  }, [tenantId]);

  const filteredProducts = useMemo(() => products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !selectedCategory || p.category_id === selectedCategory;
    return matchSearch && matchCat;
  }), [products, search, selectedCategory]);

  const addToCart = (product: Product) => {
    if (product.unit === "kg") { setWeightProduct(product); setWeightInput(""); return; }
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) return prev.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * product.price } : i);
      return [...prev, { product, quantity: 1, total: product.price }];
    });
  };
  const addWeightItem = () => {
    if (!weightProduct) return;
    const kg = parseFloat(weightInput);
    if (!kg || kg <= 0) { toast.error("Informe o peso"); return; }
    setCart((prev) => [...prev, { product: weightProduct, quantity: 1, weight_kg: kg, total: kg * weightProduct.price_per_kg }]);
    setWeightProduct(null);
  };
  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => prev.map((i) => { if (i.product.id !== productId || i.weight_kg) return i; const nq = Math.max(0, i.quantity + delta); return nq === 0 ? i : { ...i, quantity: nq, total: nq * i.product.price }; }).filter((i) => i.quantity > 0));
  };
  const removeItem = (index: number) => setCart((prev) => prev.filter((_, i) => i !== index));

  const subtotal = cart.reduce((sum, i) => sum + i.total, 0);
  const discountValue = parseFloat(discount) || 0;
  const total = Math.max(0, subtotal - discountValue);

  const handleCheckout = async () => {
    if (cart.length === 0 || !user || !tenantId) return;
    setProcessing(true);
    try {
      const { data: sessions } = await supabase.from("cash_sessions").select("id").eq("tenant_id", tenantId).eq("status", "open").limit(1);
      const cashSessionId = sessions?.[0]?.id || null;
      const { data: order, error: orderError } = await supabase.from("orders").insert({
        tenant_id: tenantId, cash_session_id: cashSessionId, user_id: user.id,
        subtotal, discount: discountValue, total, payment_method: paymentMethod, customer_name: customerName || null,
      }).select("id").single();
      if (orderError) throw orderError;
      const items = cart.map((i) => ({ order_id: order.id, product_id: i.product.id, product_name: i.product.name, quantity: i.weight_kg ? 1 : i.quantity, unit_price: i.weight_kg ? i.product.price_per_kg : i.product.price, total_price: i.total, weight_kg: i.weight_kg || null }));
      const { error: itemsError } = await supabase.from("order_items").insert(items);
      if (itemsError) throw itemsError;
      for (const item of cart) { if (item.product.unit !== "kg") { await supabase.from("products").update({ stock: Math.max(0, item.product.stock - item.quantity) }).eq("id", item.product.id); } }
      toast.success(`Venda finalizada! Total: R$ ${total.toFixed(2)}`);
      setCart([]); setDiscount(""); setCustomerName(""); setCheckoutOpen(false);
      const { data: updated } = await supabase.from("products").select("*, categories(name, color)").eq("tenant_id", tenantId).eq("is_active", true).order("name");
      setProducts((updated as any) || []);
    } catch (err: any) { toast.error(err.message || "Erro ao finalizar venda"); } finally { setProcessing(false); }
  };

  return (
    <div className="flex h-[calc(100vh-0px)] overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 space-y-3 border-b">
          <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Buscar produto..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
          <div className="flex gap-2 flex-wrap">
            <Button variant={!selectedCategory ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory(null)}>Todos</Button>
            {categories.map((c) => <Button key={c.id} variant={selectedCategory === c.id ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory(selectedCategory === c.id ? null : c.id)} style={selectedCategory === c.id ? { backgroundColor: c.color } : {}}>{c.name}</Button>)}
          </div>
        </div>
        <ScrollArea className="flex-1 p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredProducts.map((p) => (
              <motion.div key={p.id} whileTap={{ scale: 0.95 }}>
                <Card className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/30" onClick={() => addToCart(p)}>
                  <CardContent className="p-3 text-center space-y-1">
                    <div className="w-full h-16 rounded bg-muted flex items-center justify-center"><span className="text-2xl">🍦</span></div>
                    <p className="font-medium text-sm text-foreground truncate">{p.name}</p>
                    <p className="text-primary font-bold text-sm">R$ {(p.unit === "kg" ? p.price_per_kg : p.price).toFixed(2)}{p.unit === "kg" && <span className="text-xs font-normal">/kg</span>}</p>
                    {p.stock <= 5 && p.unit !== "kg" && <p className="text-xs text-destructive">Estoque: {p.stock}</p>}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            {filteredProducts.length === 0 && <p className="col-span-full text-center text-muted-foreground py-8">Nenhum produto encontrado</p>}
          </div>
        </ScrollArea>
      </div>

      <div className="w-80 lg:w-96 border-l bg-card flex flex-col">
        <div className="p-4 border-b"><h2 className="font-bold text-foreground flex items-center gap-2"><ShoppingCart className="w-5 h-5" />Carrinho{cart.length > 0 && <Badge variant="secondary">{cart.length}</Badge>}</h2></div>
        <ScrollArea className="flex-1 p-3">
          <AnimatePresence>{cart.map((item, index) => (
            <motion.div key={`${item.product.id}-${index}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex items-center gap-2 py-2 border-b last:border-0">
              <div className="flex-1 min-w-0"><p className="text-sm font-medium text-foreground truncate">{item.product.name}</p><p className="text-xs text-muted-foreground">{item.weight_kg ? `${item.weight_kg}kg × R$ ${item.product.price_per_kg.toFixed(2)}` : `${item.quantity}x R$ ${item.product.price.toFixed(2)}`}</p></div>
              {!item.weight_kg && <div className="flex items-center gap-1"><Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.product.id, -1)}><Minus className="w-3 h-3" /></Button><span className="text-sm w-6 text-center">{item.quantity}</span><Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.product.id, 1)}><Plus className="w-3 h-3" /></Button></div>}
              <p className="text-sm font-semibold text-foreground w-16 text-right">R$ {item.total.toFixed(2)}</p>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeItem(index)}><X className="w-3 h-3" /></Button>
            </motion.div>
          ))}</AnimatePresence>
          {cart.length === 0 && <p className="text-center text-muted-foreground py-8 text-sm">Carrinho vazio</p>}
        </ScrollArea>
        <div className="border-t p-4 space-y-3">
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span className="font-medium text-foreground">R$ {subtotal.toFixed(2)}</span></div>
          {discountValue > 0 && <div className="flex justify-between text-sm"><span className="text-destructive">Desconto</span><span className="text-destructive">-R$ {discountValue.toFixed(2)}</span></div>}
          <Separator />
          <div className="flex justify-between text-lg font-bold"><span className="text-foreground">Total</span><span className="text-primary">R$ {total.toFixed(2)}</span></div>
          <Button className="w-full h-12 text-base" disabled={cart.length === 0} onClick={() => setCheckoutOpen(true)}>Finalizar Venda</Button>
        </div>
      </div>

      <Dialog open={!!weightProduct} onOpenChange={(o) => !o && setWeightProduct(null)}>
        <DialogContent><DialogHeader><DialogTitle>Informar Peso</DialogTitle><DialogDescription>{weightProduct?.name} — R$ {weightProduct?.price_per_kg.toFixed(2)}/kg</DialogDescription></DialogHeader>
          <div className="space-y-4 mt-4"><div><Label>Peso (kg)</Label><Input type="number" step="0.01" value={weightInput} onChange={(e) => setWeightInput(e.target.value)} placeholder="0.500" autoFocus /></div>
            {weightInput && parseFloat(weightInput) > 0 && <p className="text-sm text-muted-foreground">Total: R$ {(parseFloat(weightInput) * (weightProduct?.price_per_kg || 0)).toFixed(2)}</p>}
            <Button onClick={addWeightItem} className="w-full">Adicionar</Button></div>
        </DialogContent>
      </Dialog>

      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent><DialogHeader><DialogTitle>Finalizar Venda</DialogTitle><DialogDescription>Total: R$ {total.toFixed(2)}</DialogDescription></DialogHeader>
          <div className="space-y-4 mt-4">
            <div><Label>Pagamento</Label><div className="grid grid-cols-2 gap-2 mt-2">{paymentMethods.map((pm) => <Button key={pm.value} variant={paymentMethod === pm.value ? "default" : "outline"} onClick={() => setPaymentMethod(pm.value)} className="justify-start gap-2"><pm.icon className="w-4 h-4" />{pm.label}</Button>)}</div></div>
            <div><Label>Desconto (R$)</Label><Input type="number" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0.00" /></div>
            <div><Label>Cliente (opcional)</Label><Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="João" /></div>
            <Separator /><div className="flex justify-between text-lg font-bold"><span>Total</span><span className="text-primary">R$ {total.toFixed(2)}</span></div>
            <Button className="w-full h-12 text-base" onClick={handleCheckout} disabled={processing}>{processing ? "Processando..." : `Confirmar — R$ ${total.toFixed(2)}`}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
