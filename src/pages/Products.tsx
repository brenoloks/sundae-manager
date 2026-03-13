import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Search, Pencil, Trash2, Package, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface Category { id: string; name: string; color: string; }
interface Product {
  id: string; name: string; description: string | null; price: number; cost_price: number;
  stock: number; min_stock: number; unit: string; price_per_kg: number;
  image_url: string | null; is_active: boolean; category_id: string | null;
  categories: { name: string; color: string } | null;
}

const emptyForm = { name: "", description: "", price: "", cost_price: "", stock: "0", min_stock: "5", unit: "un", price_per_kg: "", category_id: "", image_url: "" };

export default function Products() {
  const { profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [newCat, setNewCat] = useState({ name: "", color: "#3b82f6" });
  const tenantId = profile?.tenant_id;

  const fetchProducts = async () => {
    if (!tenantId) return;
    const { data } = await supabase.from("products").select("*, categories(name, color)").eq("tenant_id", tenantId).order("name");
    setProducts((data as any) || []); setLoading(false);
  };
  const fetchCategories = async () => {
    if (!tenantId) return;
    const { data } = await supabase.from("categories").select("*").eq("tenant_id", tenantId).eq("is_active", true).order("name");
    setCategories((data as Category[]) || []);
  };
  useEffect(() => { fetchProducts(); fetchCategories(); }, [tenantId]);

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (p: Product) => {
    setEditingId(p.id);
    setForm({ name: p.name, description: p.description || "", price: String(p.price), cost_price: String(p.cost_price), stock: String(p.stock), min_stock: String(p.min_stock), unit: p.unit, price_per_kg: String(p.price_per_kg || ""), category_id: p.category_id || "", image_url: p.image_url || "" });
    setDialogOpen(true);
  };
  const handleSave = async () => {
    if (!form.name || !tenantId) { toast.error("Nome é obrigatório"); return; }
    const payload = { tenant_id: tenantId, name: form.name, description: form.description || null, price: parseFloat(form.price) || 0, cost_price: parseFloat(form.cost_price) || 0, stock: parseInt(form.stock) || 0, min_stock: parseInt(form.min_stock) || 5, unit: form.unit, price_per_kg: parseFloat(form.price_per_kg) || 0, category_id: form.category_id || null, image_url: form.image_url || null };
    if (editingId) { const { error } = await supabase.from("products").update(payload).eq("id", editingId); if (error) toast.error(error.message); else toast.success("Produto atualizado!"); }
    else { const { error } = await supabase.from("products").insert(payload); if (error) toast.error(error.message); else toast.success("Produto criado!"); }
    setDialogOpen(false); setEditingId(null); setForm(emptyForm); fetchProducts();
  };
  const handleDelete = async (id: string) => { const { error } = await supabase.from("products").delete().eq("id", id); if (error) toast.error(error.message); else { toast.success("Removido"); fetchProducts(); } };
  const handleCreateCategory = async () => {
    if (!newCat.name || !tenantId) return;
    const { error } = await supabase.from("categories").insert({ tenant_id: tenantId, name: newCat.name, color: newCat.color });
    if (error) toast.error(error.message); else { toast.success("Categoria criada!"); setNewCat({ name: "", color: "#3b82f6" }); setCatDialogOpen(false); fetchCategories(); }
  };
  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold text-foreground">Produtos</h1><p className="text-muted-foreground mt-1">{products.length} produtos cadastrados</p></div>
        <div className="flex gap-2">
          <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
            <DialogTrigger asChild><Button variant="outline" onClick={() => setCatDialogOpen(true)}>+ Categoria</Button></DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle>Nova Categoria</DialogTitle><DialogDescription>Organize seus produtos</DialogDescription></DialogHeader>
              <div className="space-y-4 mt-4"><div><Label>Nome</Label><Input value={newCat.name} onChange={(e) => setNewCat({ ...newCat, name: e.target.value })} placeholder="Sorvetes" /></div><div><Label>Cor</Label><Input type="color" value={newCat.color} onChange={(e) => setNewCat({ ...newCat, color: e.target.value })} /></div><Button onClick={handleCreateCategory} className="w-full">Criar</Button></div>
            </DialogContent>
          </Dialog>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Novo Produto</Button></DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{editingId ? "Editar Produto" : "Novo Produto"}</DialogTitle><DialogDescription>Preencha os dados do produto</DialogDescription></DialogHeader>
              <div className="space-y-4 mt-4">
                <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Açaí 500ml" /></div>
                <div><Label>Descrição</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                <div><Label>Categoria</Label><Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
                <div className="grid grid-cols-2 gap-4"><div><Label>Preço (R$)</Label><Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div><div><Label>Custo (R$)</Label><Input type="number" step="0.01" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} /></div></div>
                <div><Label>Tipo de Venda</Label><Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="un">Unidade</SelectItem><SelectItem value="kg">Por Peso (kg)</SelectItem></SelectContent></Select></div>
                {form.unit === "kg" && <div><Label>Preço por kg (R$)</Label><Input type="number" step="0.01" value={form.price_per_kg} onChange={(e) => setForm({ ...form, price_per_kg: e.target.value })} /></div>}
                <div className="grid grid-cols-2 gap-4"><div><Label>Estoque</Label><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div><div><Label>Estoque Mínimo</Label><Input type="number" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: e.target.value })} /></div></div>
                <Button onClick={handleSave} className="w-full">{editingId ? "Salvar" : "Criar Produto"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Buscar produto..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
      <Card><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Produto</TableHead><TableHead>Categoria</TableHead><TableHead>Preço</TableHead><TableHead>Estoque</TableHead><TableHead>Status</TableHead><TableHead className="w-24">Ações</TableHead></TableRow></TableHeader>
        <TableBody>{filtered.map((p, i) => (
          <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="border-b transition-colors hover:bg-muted/50">
            <TableCell className="font-medium flex items-center gap-2"><Package className="w-4 h-4 text-primary" />{p.name}{p.unit === "kg" && <Badge variant="outline" className="text-xs">kg</Badge>}</TableCell>
            <TableCell>{p.categories ? <Badge style={{ backgroundColor: p.categories.color, color: "#fff" }}>{p.categories.name}</Badge> : <span className="text-muted-foreground">—</span>}</TableCell>
            <TableCell>R$ {Number(p.unit === "kg" ? p.price_per_kg : p.price).toFixed(2)}{p.unit === "kg" ? "/kg" : ""}</TableCell>
            <TableCell><div className="flex items-center gap-1">{p.stock <= p.min_stock && <AlertTriangle className="w-3 h-3 text-destructive" />}<span className={p.stock <= p.min_stock ? "text-destructive font-semibold" : ""}>{p.stock}</span></div></TableCell>
            <TableCell><Badge variant={p.is_active ? "default" : "secondary"}>{p.is_active ? "Ativo" : "Inativo"}</Badge></TableCell>
            <TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="w-4 h-4" /></Button><Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></div></TableCell>
          </motion.tr>
        ))}{filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">{loading ? "Carregando..." : "Nenhum produto encontrado"}</TableCell></TableRow>}</TableBody>
      </Table></CardContent></Card>
    </div>
  );
}
