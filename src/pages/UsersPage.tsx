import { Search, Plus, Pencil, Trash2, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

const users = [
  { id: 1, name: "João Silva", email: "joao@gelato.com", role: "Gerente", active: true },
  { id: 2, name: "Maria Santos", email: "maria@gelato.com", role: "Atendente", active: true },
  { id: 3, name: "Pedro Oliveira", email: "pedro@gelato.com", role: "Atendente", active: true },
  { id: 4, name: "Ana Costa", email: "ana@gelato.com", role: "Caixa", active: false },
];

export default function UsersPage() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Usuários</h1>
          <p className="text-muted-foreground">Gerencie a equipe</p>
        </div>
        <Button className="gap-2 font-semibold"><Plus className="w-4 h-4" /> Novo Usuário</Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar usuário..." className="pl-9" />
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            {users.length} usuários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left pb-3 font-medium">Nome</th>
                  <th className="text-left pb-3 font-medium">E-mail</th>
                  <th className="text-left pb-3 font-medium">Função</th>
                  <th className="text-center pb-3 font-medium">Status</th>
                  <th className="text-right pb-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <motion.tr
                    key={u.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3 font-medium text-foreground">{u.name}</td>
                    <td className="py-3 text-muted-foreground">{u.email}</td>
                    <td className="py-3"><Badge variant="outline">{u.role}</Badge></td>
                    <td className="py-3 text-center">
                      <Badge variant={u.active ? "default" : "secondary"} className={u.active ? "bg-primary/10 text-primary border-0" : ""}>
                        {u.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="w-4 h-4" /></Button>
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
