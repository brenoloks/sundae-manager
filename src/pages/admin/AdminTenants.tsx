import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  cnpj: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  state: string | null;
  is_active: boolean;
  created_at: string;
  plans: { name: string } | null;
}

export default function AdminTenants() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", cnpj: "", phone: "", email: "", city: "", state: "" });

  const fetchTenants = async () => {
    const { data } = await supabase
      .from("tenants")
      .select("*, plans(name)")
      .order("created_at", { ascending: false });
    setTenants((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { fetchTenants(); }, []);

  const handleCreate = async () => {
    if (!form.name || !form.slug) {
      toast.error("Nome e slug são obrigatórios");
      return;
    }
    const { error } = await supabase.from("tenants").insert({
      name: form.name,
      slug: form.slug.toLowerCase().replace(/\s/g, "-"),
      cnpj: form.cnpj || null,
      phone: form.phone || null,
      email: form.email || null,
      city: form.city || null,
      state: form.state || null,
    });
    if (error) {
      toast.error("Erro ao criar: " + error.message);
    } else {
      toast.success("Sorveteria criada!");
      setDialogOpen(false);
      setForm({ name: "", slug: "", cnpj: "", phone: "", email: "", city: "", state: "" });
      fetchTenants();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("tenants").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Removido"); fetchTenants(); }
  };

  const filtered = tenants.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sorveterias</h1>
          <p className="text-muted-foreground mt-1">Gerencie os tenants cadastrados</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Nova Sorveteria</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Sorveteria</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              {[
                { key: "name", label: "Nome", placeholder: "Gelato Mágico" },
                { key: "slug", label: "Slug", placeholder: "gelato-magico" },
                { key: "cnpj", label: "CNPJ", placeholder: "00.000.000/0001-00" },
                { key: "email", label: "E-mail", placeholder: "contato@gelato.com" },
                { key: "phone", label: "Telefone", placeholder: "(11) 99999-0000" },
                { key: "city", label: "Cidade", placeholder: "São Paulo" },
                { key: "state", label: "Estado", placeholder: "SP" },
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
              <Button onClick={handleCreate} className="w-full">Criar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Cidade/UF</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t, i) => (
                <motion.tr key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="border-b transition-colors hover:bg-muted/50">
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell className="text-muted-foreground">{t.slug}</TableCell>
                  <TableCell>{t.city ? `${t.city}/${t.state}` : "—"}</TableCell>
                  <TableCell>{t.plans?.name || "Sem plano"}</TableCell>
                  <TableCell>
                    <Badge variant={t.is_active ? "default" : "secondary"}>
                      {t.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon"><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {loading ? "Carregando..." : "Nenhuma sorveteria encontrada"}
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
