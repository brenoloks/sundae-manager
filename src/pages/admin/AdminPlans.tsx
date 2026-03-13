import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, Check, Store, HardDrive } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Separator } from "@/components/ui/separator";

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  max_users: number;
  max_products: number;
  included_stores: number;
  price_per_extra_store: number;
  storage_limit_gb: number;
  price_per_extra_gb: number;
  is_active: boolean;
}

const emptyForm = {
  name: "", description: "",
  price_monthly: "", price_yearly: "",
  max_users: "5", max_products: "100",
  included_stores: "1", price_per_extra_store: "49.90",
  storage_limit_gb: "2", price_per_extra_gb: "5",
};

export default function AdminPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchPlans = async () => {
    const { data } = await supabase.from("plans").select("*").order("price_monthly");
    setPlans((data as Plan[]) || []);
  };

  useEffect(() => { fetchPlans(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (plan: Plan) => {
    setEditingId(plan.id);
    setForm({
      name: plan.name,
      description: plan.description || "",
      price_monthly: String(plan.price_monthly),
      price_yearly: String(plan.price_yearly),
      max_users: String(plan.max_users),
      max_products: String(plan.max_products),
      included_stores: String(plan.included_stores),
      price_per_extra_store: String(plan.price_per_extra_store),
      storage_limit_gb: String(plan.storage_limit_gb),
      price_per_extra_gb: String(plan.price_per_extra_gb),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name) { toast.error("Nome é obrigatório"); return; }
    const payload = {
      name: form.name,
      description: form.description || null,
      price_monthly: parseFloat(form.price_monthly) || 0,
      price_yearly: parseFloat(form.price_yearly) || 0,
      max_users: parseInt(form.max_users) || 5,
      max_products: parseInt(form.max_products) || 100,
      included_stores: parseInt(form.included_stores) || 1,
      price_per_extra_store: parseFloat(form.price_per_extra_store) || 0,
      storage_limit_gb: parseFloat(form.storage_limit_gb) || 2,
      price_per_extra_gb: parseFloat(form.price_per_extra_gb) || 5,
    };

    if (editingId) {
      const { error } = await supabase.from("plans").update(payload).eq("id", editingId);
      if (error) toast.error(error.message);
      else toast.success("Plano atualizado!");
    } else {
      const { error } = await supabase.from("plans").insert(payload);
      if (error) toast.error(error.message);
      else toast.success("Plano criado!");
    }

    setDialogOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    fetchPlans();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("plans").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Plano removido"); fetchPlans(); }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Planos</h1>
          <p className="text-muted-foreground mt-1">Gerencie os planos do SaaS com preços por loja e armazenamento</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Novo Plano</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingId ? "Editar Plano" : "Novo Plano"}</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Básico" /></div>
              <div><Label>Descrição</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ideal para pequenas sorveterias" /></div>
              
              <Separator />
              <p className="text-sm font-semibold text-foreground">Preços Base</p>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Mensal (R$)</Label><Input type="number" value={form.price_monthly} onChange={(e) => setForm({ ...form, price_monthly: e.target.value })} /></div>
                <div><Label>Anual (R$)</Label><Input type="number" value={form.price_yearly} onChange={(e) => setForm({ ...form, price_yearly: e.target.value })} /></div>
              </div>

              <Separator />
              <p className="text-sm font-semibold text-foreground">Limites</p>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Máx. Usuários</Label><Input type="number" value={form.max_users} onChange={(e) => setForm({ ...form, max_users: e.target.value })} /></div>
                <div><Label>Máx. Produtos</Label><Input type="number" value={form.max_products} onChange={(e) => setForm({ ...form, max_products: e.target.value })} /></div>
              </div>

              <Separator />
              <p className="text-sm font-semibold text-foreground">Multi-Loja</p>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Lojas Inclusas</Label><Input type="number" value={form.included_stores} onChange={(e) => setForm({ ...form, included_stores: e.target.value })} /></div>
                <div><Label>R$/Loja Extra</Label><Input type="number" step="0.01" value={form.price_per_extra_store} onChange={(e) => setForm({ ...form, price_per_extra_store: e.target.value })} /></div>
              </div>

              <Separator />
              <p className="text-sm font-semibold text-foreground">Armazenamento</p>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>GB Inclusos</Label><Input type="number" step="0.5" value={form.storage_limit_gb} onChange={(e) => setForm({ ...form, storage_limit_gb: e.target.value })} /></div>
                <div><Label>R$/GB Extra</Label><Input type="number" step="0.01" value={form.price_per_extra_gb} onChange={(e) => setForm({ ...form, price_per_extra_gb: e.target.value })} /></div>
              </div>

              <Button onClick={handleSave} className="w-full">{editingId ? "Salvar Alterações" : "Criar Plano"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan, i) => (
          <motion.div key={plan.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                    {plan.description && <p className="text-sm text-muted-foreground">{plan.description}</p>}
                  </div>
                  <Badge variant={plan.is_active ? "default" : "secondary"}>
                    {plan.is_active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-foreground">
                    R$ {Number(plan.price_monthly).toFixed(2)}
                    <span className="text-sm font-normal text-muted-foreground">/mês</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ou R$ {Number(plan.price_yearly).toFixed(2)}/ano
                  </p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /><span>Até {plan.max_users} usuários</span></div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /><span>Até {plan.max_products} produtos</span></div>
                  <div className="flex items-center gap-2"><Store className="w-4 h-4 text-primary" /><span>{plan.included_stores} loja{plan.included_stores > 1 ? "s" : ""} inclusa{plan.included_stores > 1 ? "s" : ""}</span></div>
                  {plan.price_per_extra_store > 0 && (
                    <div className="flex items-center gap-2 text-muted-foreground pl-6"><span>+ R$ {Number(plan.price_per_extra_store).toFixed(2)}/loja extra</span></div>
                  )}
                  <div className="flex items-center gap-2"><HardDrive className="w-4 h-4 text-primary" /><span>{plan.storage_limit_gb} GB de armazenamento</span></div>
                  {plan.price_per_extra_gb > 0 && (
                    <div className="flex items-center gap-2 text-muted-foreground pl-6"><span>+ R$ {Number(plan.price_per_extra_gb).toFixed(2)}/GB extra</span></div>
                  )}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(plan)}><Pencil className="w-3 h-3 mr-1" />Editar</Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(plan.id)}>
                    <Trash2 className="w-3 h-3 mr-1 text-destructive" />Remover
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
        {plans.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center text-muted-foreground">
              Nenhum plano cadastrado. Crie o primeiro!
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
