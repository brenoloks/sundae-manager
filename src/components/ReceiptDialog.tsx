import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Printer, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useRef, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ReceiptItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  weight_kg?: number | null;
}

interface ReceiptData {
  id: string;
  order_number?: number;
  created_at: string;
  subtotal: number;
  discount: number;
  total: number;
  payment_method: string;
  customer_name?: string | null;
  items: ReceiptItem[];
  tenant_name?: string;
  store_name?: string;
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

const pmLabels: Record<string, string> = {
  dinheiro: "Dinheiro",
  pix: "PIX",
  credito: "Crédito",
  debito: "Débito",
};

export default function ReceiptDialog({
  open,
  onOpenChange,
  data,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ReceiptData | null;
}) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const { profile } = useAuth();
  const [tenantInfo, setTenantInfo] = useState<{ name: string; logo_url: string | null; cnpj: string | null; phone: string | null } | null>(null);
  const [printSettings, setPrintSettings] = useState<PrintSettings>(DEFAULT_PRINT);

  useEffect(() => {
    if (!open || !profile?.tenant_id) return;
    const fetchTenant = async () => {
      const { data: t } = await supabase.from("tenants").select("name, logo_url, cnpj, phone").eq("id", profile.tenant_id!).single();
      if (t) setTenantInfo(t as any);
    };
    fetchTenant();
    const saved = localStorage.getItem(`print_settings_${profile.tenant_id}`);
    if (saved) setPrintSettings(JSON.parse(saved));
  }, [open, profile?.tenant_id]);

  if (!data) return null;

  const paperWidth = printSettings.paperWidth === "58mm" ? 220 : 280;

  const handlePrint = () => {
    const content = receiptRef.current;
    if (!content) return;

    const printWindow = window.open("", "_blank", `width=${paperWidth + 40},height=600`);
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Recibo #${data.order_number || data.id.slice(0, 6)}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Courier New', monospace; font-size: 12px; width: ${paperWidth}px; margin: 0 auto; padding: 8px; }
            .center { text-align: center; }
            .right { text-align: right; }
            .bold { font-weight: bold; }
            .line { border-top: 1px dashed #000; margin: 6px 0; }
            .row { display: flex; justify-content: space-between; }
            .item { margin: 2px 0; }
            .header { margin-bottom: 8px; }
            .footer { margin-top: 8px; font-size: 10px; }
            .logo { max-width: 80px; max-height: 50px; margin: 0 auto 4px; display: block; }
            @media print { @page { margin: 0; size: ${printSettings.paperWidth} auto; } }
          </style>
        </head>
        <body>
          ${content.innerHTML}
          <script>window.onload = function() { window.print(); window.close(); }<\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const dateStr = format(new Date(data.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR });
  const displayName = data.tenant_name || tenantInfo?.name;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Comprovante de Venda</DialogTitle>
        </DialogHeader>

        <div className="bg-white text-black rounded-lg p-4 font-mono text-xs space-y-2 border shadow-inner max-h-[60vh] overflow-y-auto">
          <div ref={receiptRef}>
            <div className="center header">
              {printSettings.showLogo && tenantInfo?.logo_url && (
                <img src={tenantInfo.logo_url} alt="Logo" className="logo" style={{ maxWidth: 80, maxHeight: 50, margin: "0 auto 4px", display: "block" }} />
              )}
              {printSettings.storeName && displayName && (
                <p className="bold" style={{ fontSize: 14, textAlign: "center" }}>{displayName}</p>
              )}
              {tenantInfo?.cnpj && <p style={{ textAlign: "center", fontSize: 10 }}>CNPJ: {tenantInfo.cnpj}</p>}
              {tenantInfo?.phone && <p style={{ textAlign: "center", fontSize: 10 }}>Tel: {tenantInfo.phone}</p>}
              <div className="line" />
              <p style={{ textAlign: "center", fontWeight: "bold" }}>COMPROVANTE DE VENDA</p>
              <p style={{ textAlign: "center" }}>#{data.order_number || data.id.slice(0, 8)}</p>
              <p style={{ textAlign: "center" }}>{dateStr}</p>
              <div className="line" />
            </div>

            <div>
              {data.items.map((item, i) => (
                <div key={i} className="item">
                  <p>{item.product_name}</p>
                  <div className="row">
                    <span>
                      {item.weight_kg
                        ? `${item.weight_kg}kg x R$ ${item.unit_price.toFixed(2)}`
                        : `${item.quantity}x R$ ${item.unit_price.toFixed(2)}`}
                    </span>
                    <span className="bold">R$ {item.total_price.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="line" />
            <div className="row"><span>Subtotal</span><span>R$ {data.subtotal.toFixed(2)}</span></div>
            {data.discount > 0 && (
              <div className="row"><span>Desconto</span><span>-R$ {data.discount.toFixed(2)}</span></div>
            )}
            <div className="line" />
            <div className="row bold" style={{ fontSize: 14 }}>
              <span>TOTAL</span><span>R$ {data.total.toFixed(2)}</span>
            </div>
            <div className="line" />

            <p>Pagamento: {pmLabels[data.payment_method] || data.payment_method}</p>
            {data.customer_name && <p>Cliente: {data.customer_name}</p>}

            <div className="footer center">
              <div className="line" />
              <p style={{ textAlign: "center", marginTop: 6 }}>{printSettings.footerText}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-2">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4 mr-1" /> Fechar
          </Button>
          <Button className="flex-1" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-1" /> Imprimir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
