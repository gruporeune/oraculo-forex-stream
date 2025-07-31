import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    password: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          navigate('/dashboard');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      // Sign up the user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: formData.fullName,
            username: formData.username,
            phone: formData.phone,
          }
        }
      });

      if (signUpError) {
        throw signUpError;
      }

      // Update profile with additional data
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            full_name: formData.fullName,
            updated_at: new Date().toISOString(),
          });

        if (profileError) {
          console.error('Profile update error:', profileError);
        }
      }

      setSuccess('Conta criada com sucesso! Verifique seu e-mail para confirmar.');
      
    } catch (error: any) {
      setError(error.message || 'Erro ao criar conta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-black relative overflow-hidden flex items-center justify-center">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-500/40 via-purple-700/50 to-black" />
      
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[120vh] h-[60vh] rounded-b-[50%] bg-purple-400/20 blur-[80px]" />
      <motion.div 
        className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[90vh] h-[90vh] rounded-t-full bg-purple-400/20 blur-[60px]"
        animate={{ 
          opacity: [0.3, 0.5, 0.3],
          scale: [1, 1.1, 1]
        }}
        transition={{ 
          duration: 6, 
          repeat: Infinity,
          repeatType: "mirror"
        }}
      />

      {/* Back to site button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 z-20 text-white/60 hover:text-white transition-colors duration-200 flex items-center gap-2"
      >
        <ArrowRight className="w-4 h-4 rotate-180" />
        Voltar ao site
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="relative group">
          {/* Glass card background */}
          <div className="relative bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-white/[0.05] shadow-2xl overflow-hidden">
            {/* Logo and header */}
            <div className="text-center space-y-1 mb-6">

              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/80"
              >
                Crie sua conta
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-white/60 text-sm"
              >
                Comece a operar com inteligência artificial
              </motion.p>
            </div>

            {/* Error/Success messages */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/20 border border-red-500/50 text-red-200 text-sm p-3 rounded-lg mb-4"
              >
                {error}
              </motion.div>
            )}
            
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-500/20 border border-green-500/50 text-green-200 text-sm p-3 rounded-lg mb-4"
              >
                {success}
              </motion.div>
            )}

            {/* Register form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name input */}
              <motion.div 
                className="relative"
                whileFocus={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <div className="relative flex items-center">
                  <User className={`absolute left-3 w-4 h-4 transition-all duration-300 ${
                    focusedInput === "fullName" ? 'text-white' : 'text-white/40'
                  }`} />
                  
                  <Input
                    type="text"
                    name="fullName"
                    placeholder="Nome completo"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    onFocus={() => setFocusedInput("fullName")}
                    onBlur={() => setFocusedInput(null)}
                    className="w-full bg-white/5 border-white/10 focus:border-white/20 text-white placeholder:text-white/30 h-11 pl-10 pr-3 focus:bg-white/10"
                    required
                  />
                </div>
              </motion.div>

              {/* Username input */}
              <motion.div 
                className="relative"
                whileFocus={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-white/40 text-sm">@</span>
                  
                  <Input
                    type="text"
                    name="username"
                    placeholder="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    onFocus={() => setFocusedInput("username")}
                    onBlur={() => setFocusedInput(null)}
                    className="w-full bg-white/5 border-white/10 focus:border-white/20 text-white placeholder:text-white/30 h-11 pl-10 pr-3 focus:bg-white/10"
                    required
                  />
                </div>
              </motion.div>

              {/* Email input */}
              <motion.div 
                className="relative"
                whileFocus={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <div className="relative flex items-center">
                  <Mail className={`absolute left-3 w-4 h-4 transition-all duration-300 ${
                    focusedInput === "email" ? 'text-white' : 'text-white/40'
                  }`} />
                  
                  <Input
                    type="email"
                    name="email"
                    placeholder="E-mail"
                    value={formData.email}
                    onChange={handleInputChange}
                    onFocus={() => setFocusedInput("email")}
                    onBlur={() => setFocusedInput(null)}
                    className="w-full bg-white/5 border-white/10 focus:border-white/20 text-white placeholder:text-white/30 h-11 pl-10 pr-3 focus:bg-white/10"
                    required
                  />
                </div>
              </motion.div>

              {/* Phone input */}
              <motion.div 
                className="relative"
                whileFocus={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <div className="relative flex items-center">
                  <Phone className={`absolute left-3 w-4 h-4 transition-all duration-300 ${
                    focusedInput === "phone" ? 'text-white' : 'text-white/40'
                  }`} />
                  
                  <Input
                    type="tel"
                    name="phone"
                    placeholder="(11) 99999-9999"
                    value={formData.phone}
                    onChange={handleInputChange}
                    onFocus={() => setFocusedInput("phone")}
                    onBlur={() => setFocusedInput(null)}
                    className="w-full bg-white/5 border-white/10 focus:border-white/20 text-white placeholder:text-white/30 h-11 pl-10 pr-3 focus:bg-white/10"
                    required
                  />
                </div>
              </motion.div>

              {/* Password input */}
              <motion.div 
                className="relative"
                whileFocus={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-white/40 text-sm">🔒</span>
                  
                  <Input
                    type="password"
                    name="password"
                    placeholder="Senha"
                    value={formData.password}
                    onChange={handleInputChange}
                    onFocus={() => setFocusedInput("password")}
                    onBlur={() => setFocusedInput(null)}
                    className="w-full bg-white/5 border-white/10 focus:border-white/20 text-white placeholder:text-white/30 h-11 pl-10 pr-3 focus:bg-white/10"
                    required
                    minLength={6}
                  />
                </div>
              </motion.div>

              {/* Terms and conditions */}
              <div className="text-xs text-white/60 mt-4">
                Ao criar uma conta, você concorda com nossos{' '}
                <a href="#" className="text-white/80 hover:text-white underline">
                  Termos de Uso
                </a>{' '}
                e{' '}
                <a href="#" className="text-white/80 hover:text-white underline">
                  Política de Privacidade
                </a>
              </div>

              {/* Register button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full relative group/button mt-6"
              >
                <div className="relative overflow-hidden bg-white text-black font-medium h-11 rounded-lg transition-all duration-300 flex items-center justify-center">
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-black/70 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <span className="flex items-center justify-center gap-2 text-sm font-medium">
                      Criar conta
                      <ArrowRight className="w-4 h-4 group-hover/button:translate-x-1 transition-transform duration-300" />
                    </span>
                  )}
                </div>
              </motion.button>

              {/* Login link */}
              <motion.p 
                className="text-center text-xs text-white/60 mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Já tem uma conta?{' '}
                <button 
                  type="button"
                  onClick={() => navigate('/login')}
                  className="relative inline-block group/login"
                >
                  <span className="relative z-10 text-white group-hover/login:text-white/70 transition-colors duration-300 font-medium">
                    Fazer login
                  </span>
                  <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-white group-hover/login:w-full transition-all duration-300" />
                </button>
              </motion.p>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}