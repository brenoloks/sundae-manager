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
import { Plus, Search, Pencil, Trash2, Store } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface StoreRow {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  address: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  tenants: { name: string } | null;
}

interface TenantOption {
  id: string;
  name: string;
}

const emptyForm = { name: "", slug: "", tenant_id: "", address: "", city: "", state: "", phone: "" };

export default function AdminStores() {
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchStores = async () => {
    const { data } = await supabase
      .from("stores")
      .select("*, tenants(name)")
      .order("created_at", { ascending: false });
    setStores((data as any) || []);
    setLoading(false);
  };

  const fetchTenants = async () => {
    const { data } = await supabase.from("tenants").select("id, name").eq("is_active", true).order("name");
    setTenants((data as TenantOption[]) || []);
  };

  useEffect(() => { fetchStores(); fetchTenants(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (s: StoreRow) => {
    setEditingId(s.id);
    setForm({
      name: s.name,
      slug: s.slug,
      tenant_id: s.tenant_id,
      address: s.address || "",
      city: s.city || "",
      state: s.state || "",
      phone: s.phone || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.slug || !form.tenant_id) {
      toast.error("Nome, slug e sorveteria são obrigatórios");
      return;
    }
    const payload = {
      name: form.name,
      slug: form.slug.toLowerCase().replace(/\s/g, "-"),
      tenant_id: form.tenant_id,
      address: form.address || null,
      city: form.city || null,
      state: form.state || null,
      phone: form.phone || null,
    };

    if (editingId) {
      const { error } = await supabase.from("stores").update(payload).eq("id", editingId);
      if (error) toast.error(error.message);
      else toast.success("Loja atualizada!");
    } else {
      const { error } = await supabase.from("stores").insert(payload);
      if (error) toast.error(error.message);
      else toast.success("Loja criada!");
    }

    setDialogOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    fetchStores();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("stores").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Loja removida"); fetchStores(); }
  };

  const filtered = stores.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.tenants?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Lojas</h1>
          <p className="text-muted-foreground mt-1">Gerencie as lojas de cada sorveteria</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Nova Loja</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Loja" : "Nova Loja"}</DialogTitle>
              <DialogDescription>Vincule a loja a uma sorveteria</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Sorveteria</Label>
                <Select value={form.tenant_id} onValueChange={(v) => setForm({ ...form, tenant_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a sorveteria" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {[
                { key: "name", label: "Nome da Loja", placeholder: "Filial Centro" },
                { key: "slug", label: "Slug", placeholder: "filial-centro" },
                { key: "address", label: "Endereço", placeholder: "Rua das Flores, 123" },
                { key: "city", label: "Cidade", placeholder: "São Paulo" },
                { key: "state", label: "Estado", placeholder: "SP" },
                { key: "phone", label: "Telefone", placeholder: "(11) 99999-0000" },
              ].map((f) => (
                <div key={f.key}>
                  <Label>{f.label}</Label>
                  <Input
                    placeholder={f.placeholder}
                    value={(form as any)[f.key]}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  />
                </div>
              ))}
              <Button onClick={handleSave} className="w-full">
                {editingId ? "Salvar Alterações" : "Criar Loja"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar por loja ou sorveteria..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Loja</TableHead>
                <TableHead>Sorveteria</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Cidade/UF</TableHead>
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
                  <TableCell>{s.tenants?.name || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{s.slug}</TableCell>
                  <TableCell>{s.city ? `${s.city}/${s.state}` : "—"}</TableCell>
                  <TableCell>
                    <Badge variant={s.is_active ? "default" : "secondary"}>
                      {s.is_active ? "Ativa" : "Inativa"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
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
