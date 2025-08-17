import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "w-full px-4 py-3 border border-gray-600 rounded-lg bg-gray-800/50 text-white placeholder-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors",
        className
      )}
      {...props}
    />
  )
}

export default function AdminLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          // Verificar se é admin
          const { data: adminData } = await supabase
            .from('admin_users')
            .select('id')
            .eq('user_id', session.user.id)
            .single();

          if (adminData) {
            navigate('/admin/withdrawals');
          } else {
            toast({
              title: "Acesso Negado",
              description: "Você não tem permissão para acessar esta área.",
              variant: "destructive",
            });
            await supabase.auth.signOut();
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        setError(loginError.message);
        return;
      }

      if (data.user) {
        // Verificar se é admin
        const { data: adminData } = await supabase
          .from('admin_users')
          .select('id')
          .eq('user_id', data.user.id)
          .single();

        if (!adminData) {
          setError("Você não tem permissão para acessar esta área administrativa.");
          await supabase.auth.signOut();
          return;
        }

        toast({
          title: "Login realizado",
          description: "Bem-vindo ao painel administrativo!",
        });
      }
    } catch (error: any) {
      setError(error.message || "Erro ao fazer login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900/20 to-black flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-gray-900/80 backdrop-blur-xl border border-red-500/20 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Painel Administrativo</h1>
            <p className="text-gray-400">Gerenciamento de Saques</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@exemplo.com"
                  className="pl-11"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-11 pr-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:cursor-not-allowed"
            >
              {isLoading ? "Entrando..." : "Entrar no Painel"}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-gray-400 hover:text-gray-300 text-sm transition-colors"
            >
              ← Voltar para login principal
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}