import { Store, Bell, Palette, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground">Dados da sorveteria</p>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Store className="w-4 h-4 text-primary" /> Dados da Empresa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Nome Fantasia</label>
              <Input defaultValue="Gelato Mágico" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">CNPJ</label>
              <Input defaultValue="12.345.678/0001-90" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Telefone</label>
              <Input defaultValue="(11) 99999-0000" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">E-mail</label>
              <Input defaultValue="contato@gelatomagico.com" />
            </div>
          </div>
          <Button className="font-semibold">Salvar Alterações</Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="shadow-sm p-5 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Palette className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">Aparência</p>
            <p className="text-xs text-muted-foreground">Tema e personalização</p>
          </div>
        </Card>
        <Card className="shadow-sm p-5 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <Bell className="w-5 h-5 text-accent" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">Notificações</p>
            <p className="text-xs text-muted-foreground">Alertas e avisos</p>
          </div>
        </Card>
        <Card className="shadow-sm p-5 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow sm:col-span-2">
          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">Segurança</p>
            <p className="text-xs text-muted-foreground">Senhas e permissões</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
