import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Pencil, Trash2, Store, Search } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface StoreRow {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  is_active: boolean;
}

const emptyForm = { name: "", slug: "", address: "", city: "", state: "", phone: "" };

export default function OwnerStores() {
  const { profile } = useAuth();
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const tenantId = profile?.tenant_id;

  const fetchStores = async () => {
    if (!tenantId) return;
    const { data } = await supabase
      .from("stores")
      .select("id, name, slug, address, city, state, phone, is_active")
      .eq("tenant_id", tenantId)
      .order("name");
    setStores((data as StoreRow[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchStores(); }, [tenantId]);

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };

  const openEdit = (s: StoreRow) => {
    setEditingId(s.id);
    setForm({ name: s.name, slug: s.slug, address: s.address || "", city: s.city || "", state: s.state || "", phone: s.phone || "" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.slug || !tenantId) { toast.error("Nome e slug são obrigatórios"); return; }
    const payload = {
      name: form.name,
      slug: form.slug.toLowerCase().replace(/\s/g, "-"),
      tenant_id: tenantId,
      address: form.address || null,
      city: form.city || null,
      state: form.state || null,
      phone: form.phone || null,
    };

    if (editingId) {
      const { error } = await supabase.from("stores").update(payload).eq("id", editingId);
      if (error) toast.error(error.message); else toast.success("Loja atualizada!");
    } else {
      const { error } = await supabase.from("stores").insert(payload);
      if (error) toast.error(error.message); else toast.success("Loja criada!");
    }
    setDialogOpen(false); setEditingId(null); setForm(emptyForm); fetchStores();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("stores").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Loja removida"); fetchStores(); }
  };

  const filtered = stores.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));

  const fields = [
    { key: "name", label: "Nome da Loja", placeholder: "Filial Centro" },
    { key: "slug", label: "Slug", placeholder: "filial-centro" },
    { key: "address", label: "Endereço", placeholder: "Rua das Flores, 123" },
    { key: "city", label: "Cidade", placeholder: "São Paulo" },
    { key: "state", label: "Estado", placeholder: "SP" },
    { key: "phone", label: "Telefone", placeholder: "(11) 99999-0000" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Minhas Lojas</h1>
          <p className="text-muted-foreground mt-1">Gerencie as lojas da sua rede</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Nova Loja</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Loja" : "Nova Loja"}</DialogTitle>
              <DialogDescription>Preencha os dados da loja</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {fields.map((f) => (
                <div key={f.key}>
                  <Label>{f.label}</Label>
                  <Input placeholder={f.placeholder} value={(form as any)[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
                </div>
              ))}
              <Button onClick={handleSave} className="w-full">{editingId ? "Salvar" : "Criar Loja"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar loja..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Loja</TableHead>
                <TableHead>Cidade/UF</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s, i) => (
                <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="border-b transition-colors hover:bg-muted/50">
                  <TableCell className="font-medium flex items-center gap-2">
                    <Store className="w-4 h-4 text-primary" />{s.name}
                  </TableCell>
                  <TableCell>{s.city ? `${s.city}/${s.state}` : "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{s.phone || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={s.is_active ? "default" : "secondary"}>{s.is_active ? "Ativa" : "Inativa"}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  {loading ? "Carregando..." : "Nenhuma loja encontrada"}
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
