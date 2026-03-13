import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Lock, Unlock, Clock } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CashSession { id: string; opening_amount: number; closing_amount: number | null; status: string; opened_at: string; closed_at: string | null; notes: string | null; }

export default function CashRegister() {
  const { user, profile } = useAuth();
  const [sessions, setSessions] = useState<CashSession[]>([]);
  const [currentSession, setCurrentSession] = useState<CashSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [closeDialog, setCloseDialog] = useState(false);
  const [openingAmount, setOpeningAmount] = useState("");
  const [closingAmount, setClosingAmount] = useState("");
  const [closingNotes, setClosingNotes] = useState("");
  const [sessionSales, setSessionSales] = useState(0);
  const tenantId = profile?.tenant_id;

  const fetchSessions = async () => {
    if (!tenantId) return;
    const { data } = await supabase.from("cash_sessions").select("*").eq("tenant_id", tenantId).order("opened_at", { ascending: false }).limit(20);
    const all = (data as CashSession[]) || [];
    setSessions(all);
    const open = all.find((s) => s.status === "open");
    setCurrentSession(open || null);
    if (open) {
      const { data: orders } = await supabase.from("orders").select("total").eq("cash_session_id", open.id);
      setSessionSales(orders?.reduce((sum, o) => sum + Number(o.total), 0) || 0);
    }
    setLoading(false);
  };
  useEffect(() => { fetchSessions(); }, [tenantId]);

  const handleOpen = async () => {
    if (!user || !tenantId) return;
    const { error } = await supabase.from("cash_sessions").insert({ tenant_id: tenantId, opened_by: user.id, opening_amount: parseFloat(openingAmount) || 0 });
    if (error) toast.error(error.message); else { toast.success("Caixa aberto!"); setOpenDialog(false); setOpeningAmount(""); fetchSessions(); }
  };
  const handleClose = async () => {
    if (!currentSession || !user) return;
    const { error } = await supabase.from("cash_sessions").update({ status: "closed", closing_amount: parseFloat(closingAmount) || 0, closed_by: user.id, closed_at: new Date().toISOString(), notes: closingNotes || null }).eq("id", currentSession.id);
    if (error) toast.error(error.message); else { toast.success("Caixa fechado!"); setCloseDialog(false); setClosingAmount(""); setClosingNotes(""); fetchSessions(); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  const expectedClosing = (currentSession?.opening_amount || 0) + sessionSales;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
      <div><h1 className="text-2xl font-bold text-foreground">Caixa</h1><p className="text-muted-foreground mt-1">Controle de abertura e fechamento</p></div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card className={`border-2 ${currentSession ? "border-primary" : "border-muted"}`}>
          <CardContent className="p-6">
            {currentSession ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center"><Unlock className="w-5 h-5 text-primary-foreground" /></div><div><h3 className="font-bold text-foreground">Caixa Aberto</h3><p className="text-sm text-muted-foreground">Desde {format(new Date(currentSession.opened_at), "dd/MM HH:mm", { locale: ptBR })}</p></div></div>
                  <Badge variant="default">Aberto</Badge>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground">Abertura</p><p className="font-bold text-foreground">R$ {Number(currentSession.opening_amount).toFixed(2)}</p></div>
                  <div className="p-3 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground">Vendas</p><p className="font-bold text-primary">R$ {sessionSales.toFixed(2)}</p></div>
                  <div className="p-3 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground">Esperado</p><p className="font-bold text-foreground">R$ {expectedClosing.toFixed(2)}</p></div>
                </div>
                <Button variant="destructive" className="w-full" onClick={() => setCloseDialog(true)}><Lock className="w-4 h-4 mr-2" />Fechar Caixa</Button>
              </div>
            ) : (
              <div className="text-center space-y-4 py-4">
                <Lock className="w-12 h-12 mx-auto text-muted-foreground" />
                <div><h3 className="font-bold text-foreground">Caixa Fechado</h3><p className="text-sm text-muted-foreground">Abra o caixa para começar</p></div>
                <Button onClick={() => setOpenDialog(true)}><Unlock className="w-4 h-4 mr-2" />Abrir Caixa</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
      <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="w-4 h-4" />Histórico</CardTitle></CardHeader><CardContent>
        <div className="space-y-3">{sessions.filter((s) => s.status === "closed").slice(0, 10).map((s) => (
          <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <div><p className="text-sm font-medium text-foreground">{format(new Date(s.opened_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p><p className="text-xs text-muted-foreground">Fechado {s.closed_at ? format(new Date(s.closed_at), "HH:mm") : "—"}</p></div>
            <div className="text-right"><p className="text-sm font-medium text-foreground">R$ {Number(s.closing_amount || 0).toFixed(2)}</p><p className="text-xs text-muted-foreground">Abertura: R$ {Number(s.opening_amount).toFixed(2)}</p></div>
          </div>
        ))}{sessions.filter((s) => s.status === "closed").length === 0 && <p className="text-center text-muted-foreground py-4 text-sm">Nenhum caixa fechado ainda</p>}</div>
      </CardContent></Card>
      <Dialog open={openDialog} onOpenChange={setOpenDialog}><DialogContent><DialogHeader><DialogTitle>Abrir Caixa</DialogTitle><DialogDescription>Informe o valor inicial</DialogDescription></DialogHeader><div className="space-y-4 mt-4"><div><Label>Valor de Abertura (R$)</Label><Input type="number" step="0.01" value={openingAmount} onChange={(e) => setOpeningAmount(e.target.value)} placeholder="100.00" autoFocus /></div><Button onClick={handleOpen} className="w-full">Abrir Caixa</Button></div></DialogContent></Dialog>
      <Dialog open={closeDialog} onOpenChange={setCloseDialog}><DialogContent><DialogHeader><DialogTitle>Fechar Caixa</DialogTitle><DialogDescription>Esperado: R$ {expectedClosing.toFixed(2)}</DialogDescription></DialogHeader><div className="space-y-4 mt-4"><div><Label>Valor em Caixa (R$)</Label><Input type="number" step="0.01" value={closingAmount} onChange={(e) => setClosingAmount(e.target.value)} placeholder={expectedClosing.toFixed(2)} autoFocus /></div>{closingAmount && <div className={`text-sm font-medium ${parseFloat(closingAmount) === expectedClosing ? "text-primary" : "text-destructive"}`}>Diferença: R$ {(parseFloat(closingAmount) - expectedClosing).toFixed(2)}</div>}<div><Label>Observações</Label><Input value={closingNotes} onChange={(e) => setClosingNotes(e.target.value)} /></div><Button onClick={handleClose} className="w-full" variant="destructive">Confirmar Fechamento</Button></div></DialogContent></Dialog>
    </div>
  );
}
