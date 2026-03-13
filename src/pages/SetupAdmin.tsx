import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield } from "lucide-react";

export default function SetupAdmin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      toast.error("Preencha todos os campos");
      return;
    }
    setLoading(true);

    // Sign up
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (signUpError || !signUpData.user) {
      toast.error(signUpError?.message || "Erro ao criar usuário");
      setLoading(false);
      return;
    }

    // Assign super_admin role
    const { error: roleError } = await supabase.from("user_roles").insert({
      user_id: signUpData.user.id,
      role: "super_admin" as any,
    });

    if (roleError) {
      toast.error("Usuário criado mas erro ao atribuir role: " + roleError.message);
    } else {
      toast.success("Admin criado com sucesso! Faça login.");
      setDone(true);
    }
    setLoading(false);
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <Shield className="w-12 h-12 text-primary mx-auto" />
            <h2 className="text-xl font-bold text-foreground">Admin criado!</h2>
            <p className="text-muted-foreground">Use suas credenciais para fazer login.</p>
            <Button onClick={() => navigate("/")} className="w-full">Ir para Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mx-auto mb-2">
            <Shield className="w-6 h-6 text-accent-foreground" />
          </div>
          <CardTitle>Setup Inicial</CardTitle>
          <CardDescription>Crie o primeiro administrador do sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSetup} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Nome completo</label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Administrador" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">E-mail</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@gelatech.com" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Senha</label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Criando..." : "Criar Admin"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
