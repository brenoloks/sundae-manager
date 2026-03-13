import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IceCream2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex">
      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-primary"
              style={{
                width: `${60 + i * 40}px`,
                height: `${60 + i * 40}px`,
                top: `${10 + i * 15}%`,
                left: `${5 + i * 12}%`,
                opacity: 0.15 - i * 0.02,
              }}
            />
          ))}
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-8">
              <IceCream2 className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-5xl font-extrabold text-primary-foreground mb-4 leading-tight">
              Gerencie sua<br />sorveteria com<br /><span className="text-accent">inteligência</span>
            </h1>
            <p className="text-primary-foreground/60 text-lg max-w-md">
              PDV rápido, controle de caixa, relatórios e muito mais. Tudo em um só lugar.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <IceCream2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">GelaTech</span>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-1">Bem-vindo de volta</h2>
          <p className="text-muted-foreground mb-8">Entre com suas credenciais para acessar o sistema</p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">E-mail</label>
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Senha</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-muted-foreground">
                <input type="checkbox" className="rounded" />
                Lembrar de mim
              </label>
              <a href="#" className="text-primary font-medium hover:underline">Esqueci a senha</a>
            </div>
            <Button type="submit" className="w-full h-11 text-base font-semibold">
              Entrar
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Não tem uma conta?{" "}
            <a href="#" className="text-primary font-medium hover:underline">Fale conosco</a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
