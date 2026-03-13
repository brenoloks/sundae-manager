import { useState } from "react";
import { Search, Plus, Pencil, Trash2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

const mockProducts = [
  { id: 1, name: "Casquinha Simples", category: "Sorvetes", type: "unidade", price: 8, active: true },
  { id: 2, name: "Casquinha Dupla", category: "Sorvetes", type: "unidade", price: 14, active: true },
  { id: 3, name: "Sundae", category: "Sorvetes", type: "unidade", price: 18, active: true },
  { id: 4, name: "Picolé Frutas", category: "Picolés", type: "unidade", price: 6, active: true },
  { id: 5, name: "Picolé Premium", category: "Picolés", type: "unidade", price: 8, active: true },
  { id: 6, name: "Açaí Self-Service", category: "Açaí", type: "peso", price: 69.9, active: true },
  { id: 7, name: "Sorvete Self-Service", category: "Sorvetes", type: "peso", price: 59.9, active: true },
  { id: 8, name: "Milk Shake", category: "Bebidas", type: "unidade", price: 18, active: true },
  { id: 9, name: "Água Mineral", category: "Bebidas", type: "unidade", price: 4, active: false },
];

export default function Products() {
  const [search, setSearch] = useState("");

  const filtered = mockProducts.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Produtos</h1>
          <p className="text-muted-foreground">Gerencie o cardápio da sorveteria</p>
        </div>
        <Button className="gap-2 font-semibold">
          <Plus className="w-4 h-4" /> Novo Produto
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar produto..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />
            {filtered.length} produtos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left pb-3 font-medium">Produto</th>
                  <th className="text-left pb-3 font-medium">Categoria</th>
                  <th className="text-left pb-3 font-medium">Tipo</th>
                  <th className="text-right pb-3 font-medium">Preço</th>
                  <th className="text-center pb-3 font-medium">Status</th>
                  <th className="text-right pb-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3 font-medium text-foreground">{p.name}</td>
                    <td className="py-3 text-muted-foreground">{p.category}</td>
                    <td className="py-3">
                      <Badge variant={p.type === "peso" ? "secondary" : "outline"}>
                        {p.type === "peso" ? "Peso" : "Unidade"}
                      </Badge>
                    </td>
                    <td className="py-3 text-right font-semibold text-foreground">
                      R$ {p.price.toFixed(2).replace(".", ",")}
                      {p.type === "peso" && <span className="text-xs text-muted-foreground">/kg</span>}
                    </td>
                    <td className="py-3 text-center">
                      <Badge variant={p.active ? "default" : "secondary"} className={p.active ? "bg-primary/10 text-primary border-0" : ""}>
                        {p.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
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
