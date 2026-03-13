import { useState } from "react";
import { Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, Banknote, Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const categories = ["Todos", "Sorvetes", "Picolés", "Açaí", "Bebidas", "Complementos"];

const products = [
  { id: 1, name: "Casquinha Simples", category: "Sorvetes", price: 8, type: "unidade" as const },
  { id: 2, name: "Casquinha Dupla", category: "Sorvetes", price: 14, type: "unidade" as const },
  { id: 3, name: "Sundae", category: "Sorvetes", price: 18, type: "unidade" as const },
  { id: 4, name: "Picolé Frutas", category: "Picolés", price: 6, type: "unidade" as const },
  { id: 5, name: "Picolé Premium", category: "Picolés", price: 8, type: "unidade" as const },
  { id: 6, name: "Açaí Self-Service", category: "Açaí", price: 69.90, type: "peso" as const, pricePerKg: 69.90 },
  { id: 7, name: "Sorvete Self-Service", category: "Sorvetes", price: 59.90, type: "peso" as const, pricePerKg: 59.90 },
  { id: 8, name: "Milk Shake", category: "Bebidas", price: 18, type: "unidade" as const },
  { id: 9, name: "Água Mineral", category: "Bebidas", price: 4, type: "unidade" as const },
  { id: 10, name: "Cobertura Extra", category: "Complementos", price: 3, type: "unidade" as const },
  { id: 11, name: "Granulado", category: "Complementos", price: 2, type: "unidade" as const },
  { id: 12, name: "Leite Condensado", category: "Complementos", price: 3, type: "unidade" as const },
];

interface CartItem {
  productId: number;
  name: string;
  quantity: number;
  weight?: number;
  unitPrice: number;
  total: number;
  type: "unidade" | "peso";
}

export default function PDV() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [weightInput, setWeightInput] = useState<{ productId: number; value: string } | null>(null);

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = activeCategory === "Todos" || p.category === activeCategory;
    return matchSearch && matchCategory;
  });

  const addToCart = (product: typeof products[0], weight?: number) => {
    setCart((prev) => {
      if (product.type === "peso" && weight) {
        const total = (product.pricePerKg! / 1000) * weight;
        return [...prev, { productId: product.id, name: product.name, quantity: 1, weight, unitPrice: product.pricePerKg!, total, type: "peso" }];
      }
      const existing = prev.find((i) => i.productId === product.id && i.type === "unidade");
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id && i.type === "unidade"
            ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.unitPrice }
            : i
        );
      }
      return [...prev, { productId: product.id, name: product.name, quantity: 1, unitPrice: product.price, total: product.price, type: "unidade" }];
    });
  };

  const updateQuantity = (index: number, delta: number) => {
    setCart((prev) => prev.map((item, i) => {
      if (i !== index) return item;
      const newQty = Math.max(1, item.quantity + delta);
      return { ...item, quantity: newQty, total: newQty * item.unitPrice };
    }));
  };

  const removeItem = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const cartTotal = cart.reduce((sum, i) => sum + i.total, 0);

  const handleProductClick = (product: typeof products[0]) => {
    if (product.type === "peso") {
      setWeightInput({ productId: product.id, value: "" });
    } else {
      addToCart(product);
    }
  };

  const confirmWeight = () => {
    if (!weightInput) return;
    const weight = parseFloat(weightInput.value);
    if (isNaN(weight) || weight <= 0) return;
    const product = products.find((p) => p.id === weightInput.productId)!;
    addToCart(product, weight);
    setWeightInput(null);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Products Panel */}
      <div className="flex-1 flex flex-col p-4 lg:p-6 overflow-hidden">
        <div className="flex items-center gap-4 mb-4">
          <h1 className="text-xl font-bold text-foreground">PDV</h1>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar produto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                activeCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filtered.map((product) => (
              <motion.button
                key={product.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleProductClick(product)}
                className="text-left"
              >
                <Card className="shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer h-full">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant={product.type === "peso" ? "secondary" : "outline"} className="text-[10px]">
                        {product.type === "peso" ? "Peso" : "Unidade"}
                      </Badge>
                    </div>
                    <p className="font-semibold text-foreground text-sm leading-tight">{product.name}</p>
                    <p className="text-primary font-bold mt-2">
                      R$ {product.price.toFixed(2).replace(".", ",")}
                      {product.type === "peso" && <span className="text-xs font-normal text-muted-foreground">/kg</span>}
                    </p>
                  </CardContent>
                </Card>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Cart Panel */}
      <div className="w-full max-w-sm border-l border-border bg-card flex flex-col">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-foreground">Venda Atual</h2>
          <Badge variant="secondary" className="ml-auto">{cart.length} itens</Badge>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <AnimatePresence>
            {cart.map((item, i) => (
              <motion.div
                key={`${item.productId}-${i}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">{item.name}</p>
                  {item.type === "peso" ? (
                    <p className="text-xs text-muted-foreground">{item.weight}g × R$ {item.unitPrice.toFixed(2)}/kg</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">R$ {item.unitPrice.toFixed(2)}</p>
                  )}
                </div>
                {item.type === "unidade" && (
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateQuantity(i, -1)} className="w-7 h-7 rounded-md bg-background flex items-center justify-center hover:bg-muted">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-7 text-center text-sm font-semibold">{item.quantity}</span>
                    <button onClick={() => updateQuantity(i, 1)} className="w-7 h-7 rounded-md bg-background flex items-center justify-center hover:bg-muted">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <span className="text-sm font-bold text-foreground w-20 text-right">
                  R$ {item.total.toFixed(2)}
                </span>
                <button onClick={() => removeItem(i)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          {cart.length === 0 && (
            <div className="text-center text-muted-foreground py-12">
              <ShoppingCart className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhum item adicionado</p>
            </div>
          )}
        </div>

        {/* Total & Payment */}
        <div className="border-t border-border p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground font-medium">Total</span>
            <span className="text-2xl font-bold text-foreground">
              R$ {cartTotal.toFixed(2).replace(".", ",")}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="h-12 gap-2"><Banknote className="w-4 h-4" /> Dinheiro</Button>
            <Button variant="outline" className="h-12 gap-2"><CreditCard className="w-4 h-4" /> Cartão</Button>
            <Button variant="outline" className="h-12 gap-2"><Smartphone className="w-4 h-4" /> PIX</Button>
            <Button className="h-12 gap-2 font-semibold" disabled={cart.length === 0}>Finalizar</Button>
          </div>
        </div>
      </div>

      {/* Weight Input Modal */}
      <AnimatePresence>
        {weightInput && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/30 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setWeightInput(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-2xl p-6 w-full max-w-sm shadow-lg mx-4"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-foreground">Informar Peso</h3>
                <button onClick={() => setWeightInput(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {products.find((p) => p.id === weightInput.productId)?.name} — informe o peso em gramas
              </p>
              <Input
                type="number"
                placeholder="Ex: 310"
                value={weightInput.value}
                onChange={(e) => setWeightInput({ ...weightInput, value: e.target.value })}
                className="h-14 text-2xl text-center font-bold mb-2"
                autoFocus
              />
              <p className="text-center text-sm text-muted-foreground mb-4">
                {weightInput.value && !isNaN(parseFloat(weightInput.value)) ? (
                  <>
                    Valor: <span className="font-bold text-foreground">
                      R$ {((products.find((p) => p.id === weightInput.productId)!.pricePerKg! / 1000) * parseFloat(weightInput.value)).toFixed(2).replace(".", ",")}
                    </span>
                  </>
                ) : "gramas"}
              </p>
              <Button onClick={confirmWeight} className="w-full h-12 font-semibold">
                Adicionar
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
