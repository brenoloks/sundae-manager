import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface UserProfile {
  id: string;
  full_name: string | null;
  tenant_id: string | null;
  created_at: string;
  tenants: { name: string } | null;
  user_roles: { role: string }[];
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*, tenants(name), user_roles(role)")
        .order("created_at", { ascending: false });
      setUsers((data as any) || []);
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Usuários</h1>
        <p className="text-muted-foreground mt-1">Todos os usuários do sistema</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Sorveteria</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Criado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.full_name || "Sem nome"}</TableCell>
                  <TableCell>{u.tenants?.name || "—"}</TableCell>
                  <TableCell>
                    {u.user_roles?.length > 0
                      ? u.user_roles.map((r) => (
                          <Badge key={r.role} variant="outline" className="mr-1 capitalize">{r.role.replace("_", " ")}</Badge>
                        ))
                      : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{format(new Date(u.created_at), "dd/MM/yyyy")}</TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
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
