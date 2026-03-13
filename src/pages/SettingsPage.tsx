import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Store, Printer, Upload, X, Image } from "lucide-react";

interface TenantData {
  id: string;
  name: string;
  slug: string;
  cnpj: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  logo_url: string | null;
}

interface PrintSettings {
  showLogo: boolean;
  storeName: boolean;
  footerText: string;
  paperWidth: string;
}

const DEFAULT_PRINT: PrintSettings = {
  showLogo: true,
  storeName: true,
  footerText: "Obrigado pela preferência!",
  paperWidth: "80mm",
};

export default function SettingsPage() {
  const { profile } = useAuth();
  const [tenant, setTenant] = useState<TenantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [printSettings, setPrintSettings] = useState<PrintSettings>(DEFAULT_PRINT);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tenantId = profile?.tenant_id;

  useEffect(() => {
    if (!tenantId) return;
    const fetch = async () => {
      const { data } = await supabase.from("tenants").select("*").eq("id", tenantId).single();
      if (data) setTenant(data as TenantData);
      // Load print settings from localStorage (per tenant)
      const saved = localStorage.getItem(`print_settings_${tenantId}`);
      if (saved) setPrintSettings(JSON.parse(saved));
      setLoading(false);
    };
    fetch();
  }, [tenantId]);

  const updateField = (field: keyof TenantData, value: string) => {
    if (!tenant) return;
    setTenant({ ...tenant, [field]: value });
  };

  const handleSave = async () => {
    if (!tenant) return;
    setSaving(true);
    const { error } = await supabase.from("tenants").update({
      name: tenant.name,
      cnpj: tenant.cnpj,
      phone: tenant.phone,
      email: tenant.email,
      address: tenant.address,
      city: tenant.city,
      state: tenant.state,
    }).eq("id", tenant.id);
    if (error) toast.error("Erro ao salvar: " + error.message);
    else toast.success("Dados atualizados!");
    setSaving(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !tenant) return;
    if (!file.type.startsWith("image/")) { toast.error("Selecione uma imagem"); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error("Imagem deve ter no máximo 2MB"); return; }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${tenant.id}/logo.${ext}`;

    const { error: uploadError } = await supabase.storage.from("logos").upload(path, file, { upsert: true });
    if (uploadError) { toast.error("Erro no upload: " + uploadError.message); setUploading(false); return; }

    const { data: urlData } = supabase.storage.from("logos").getPublicUrl(path);
    const logoUrl = urlData.publicUrl + `?t=${Date.now()}`;

    const { error: updateError } = await supabase.from("tenants").update({ logo_url: logoUrl }).eq("id", tenant.id);
    if (updateError) toast.error("Erro ao salvar logo");
    else { setTenant({ ...tenant, logo_url: logoUrl }); toast.success("Logo atualizado!"); }
    setUploading(false);
  };

  const handleRemoveLogo = async () => {
    if (!tenant) return;
    await supabase.from("tenants").update({ logo_url: null }).eq("id", tenant.id);
    setTenant({ ...tenant, logo_url: null });
    toast.success("Logo removido");
  };

  const savePrintSettings = () => {
    if (!tenantId) return;
    localStorage.setItem(`print_settings_${tenantId}`, JSON.stringify(printSettings));
    toast.success("Configurações de impressão salvas!");
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;
  if (!tenant) return <div className="p-8 text-center text-muted-foreground">Tenant não encontrado</div>;

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground">Gerencie os dados e preferências da sua sorveteria</p>
      </div>

      <Tabs defaultValue="empresa" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="empresa" className="gap-2"><Store className="w-4 h-4" />Empresa</TabsTrigger>
          <TabsTrigger value="logo" className="gap-2"><Image className="w-4 h-4" />Logo</TabsTrigger>
          <TabsTrigger value="impressao" className="gap-2"><Printer className="w-4 h-4" />Impressão</TabsTrigger>
        </TabsList>

        {/* --- Tab: Empresa --- */}
        <TabsContent value="empresa">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Store className="w-4 h-4 text-primary" />Dados da Empresa</CardTitle>
              <CardDescription>Informações exibidas no sistema e nos recibos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label>Nome Fantasia</Label><Input value={tenant.name} onChange={(e) => updateField("name", e.target.value)} /></div>
                <div><Label>CNPJ</Label><Input value={tenant.cnpj || ""} onChange={(e) => updateField("cnpj", e.target.value)} placeholder="00.000.000/0000-00" /></div>
                <div><Label>Telefone</Label><Input value={tenant.phone || ""} onChange={(e) => updateField("phone", e.target.value)} placeholder="(00) 00000-0000" /></div>
                <div><Label>E-mail</Label><Input value={tenant.email || ""} onChange={(e) => updateField("email", e.target.value)} placeholder="contato@exemplo.com" /></div>
              </div>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1"><Label>Endereço</Label><Input value={tenant.address || ""} onChange={(e) => updateField("address", e.target.value)} /></div>
                <div><Label>Cidade</Label><Input value={tenant.city || ""} onChange={(e) => updateField("city", e.target.value)} /></div>
                <div><Label>Estado</Label><Input value={tenant.state || ""} onChange={(e) => updateField("state", e.target.value)} placeholder="SP" /></div>
              </div>
              <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar Alterações"}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- Tab: Logo --- */}
        <TabsContent value="logo">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Image className="w-4 h-4 text-primary" />Logo da Empresa</CardTitle>
              <CardDescription>Exibido nos recibos e no sistema (máx. 2MB, formato imagem)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-6">
                <div className="w-28 h-28 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-muted overflow-hidden">
                  {tenant.logo_url ? (
                    <img src={tenant.logo_url} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <Image className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <div className="space-y-2">
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                    <Upload className="w-4 h-4 mr-2" />{uploading ? "Enviando..." : "Enviar Logo"}
                  </Button>
                  {tenant.logo_url && (
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={handleRemoveLogo}>
                      <X className="w-4 h-4 mr-1" />Remover
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- Tab: Impressão --- */}
        <TabsContent value="impressao">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Printer className="w-4 h-4 text-primary" />Configurações de Impressão</CardTitle>
              <CardDescription>Personalize a aparência dos recibos impressos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Mostrar logo no recibo</p>
                  <p className="text-xs text-muted-foreground">Exibe a logo da empresa no topo do comprovante</p>
                </div>
                <Switch checked={printSettings.showLogo} onCheckedChange={(v) => setPrintSettings({ ...printSettings, showLogo: v })} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Mostrar nome da loja</p>
                  <p className="text-xs text-muted-foreground">Exibe o nome fantasia abaixo da logo</p>
                </div>
                <Switch checked={printSettings.storeName} onCheckedChange={(v) => setPrintSettings({ ...printSettings, storeName: v })} />
              </div>
              <Separator />
              <div>
                <Label>Texto do rodapé</Label>
                <Input value={printSettings.footerText} onChange={(e) => setPrintSettings({ ...printSettings, footerText: e.target.value })} placeholder="Obrigado pela preferência!" />
              </div>
              <div>
                <Label>Largura do papel</Label>
                <div className="flex gap-2 mt-2">
                  {["58mm", "80mm"].map((w) => (
                    <Button key={w} variant={printSettings.paperWidth === w ? "default" : "outline"} size="sm" onClick={() => setPrintSettings({ ...printSettings, paperWidth: w })}>
                      {w}
                    </Button>
                  ))}
                </div>
              </div>
              <Button onClick={savePrintSettings}>Salvar Configurações</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
