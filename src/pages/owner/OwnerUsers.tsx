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
import { Plus, Search, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface UserRow {
  id: string;
  full_name: string | null;
  store_id: string | null;
  created_at: string;
  user_roles: { role: string }[];
  stores?: { name: string } | null;
}

interface StoreOption {
  id: string;
  name: string;
}

const emptyForm = { email: "", password: "", full_name: "", role: "cashier", store_id: "" };

export default function OwnerUsers() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const tenantId = profile?.tenant_id;

  const fetchUsers = async () => {
    if (!tenantId) return;
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, store_id, created_at, user_roles(role), stores:store_id(name)")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    setUsers((data as any) || []);
    setLoading(false);
  };

  const fetchStores = async () => {
    if (!tenantId) return;
    const { data } = await supabase
      .from("stores")
      .select("id, name")
      .eq("tenant_id", tenantId)
      .eq("is_active", true)
      .order("name");
    setStores((data as StoreOption[]) || []);
  };

  useEffect(() => { fetchUsers(); fetchStores(); }, [tenantId]);

  const handleCreate = async () => {
    if (!form.email || !form.password || !form.full_name || !tenantId) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-tenant-user", {
        body: {
          email: form.email,
          password: form.password,
          full_name: form.full_name,
          role: form.role,
          tenant_id: tenantId,
          store_id: form.store_id || null,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Usuário criado com sucesso!");
      setDialogOpen(false);
      setForm(emptyForm);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar usuário");
    } finally {
      setSaving(false);
    }
  };

  const getRoleBadge = (roles: { role: string }[]) => {
    const role = roles?.[0]?.role;
    if (role === "owner") return <Badge>Proprietário</Badge>;
    if (role === "manager") return <Badge variant="secondary">Gerente</Badge>;
    if (role === "cashier") return <Badge variant="outline">Caixa</Badge>;
    return <Badge variant="outline">{role || "—"}</Badge>;
  };

  const filtered = users.filter((u) =>
    (u.full_name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Usuários</h1>
          <p className="text-muted-foreground mt-1">Gerencie gerentes e operadores de caixa</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setForm(emptyForm); setDialogOpen(true); }}>
              <UserPlus className="w-4 h-4 mr-2" />Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Usuário</DialogTitle>
              <DialogDescription>O usuário receberá acesso imediato ao sistema</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div><Label>Nome Completo</Label><Input placeholder="João da Silva" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
              <div><Label>E-mail</Label><Input type="email" placeholder="joao@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div><Label>Senha</Label><Input type="password" placeholder="Mínimo 6 caracteres" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
              <div>
                <Label>Função</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manager">Gerente</SelectItem>
                    <SelectItem value="cashier">Operador de Caixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Loja (opcional)</Label>
                <Select value={form.store_id} onValueChange={(v) => setForm({ ...form, store_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Todas as lojas" /></SelectTrigger>
                  <SelectContent>
                    {stores.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} className="w-full" disabled={saving}>
                {saving ? "Criando..." : "Criar Usuário"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Loja</TableHead>
                <TableHead>Criado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u, i) => (
                <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="border-b transition-colors hover:bg-muted/50">
                  <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                  <TableCell>{getRoleBadge(u.user_roles)}</TableCell>
                  <TableCell className="text-muted-foreground">{(u.stores as any)?.name || "Todas"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(u.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  {loading ? "Carregando..." : "Nenhum usuário encontrado"}
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
