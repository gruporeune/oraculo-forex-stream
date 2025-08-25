import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Star, Crown, Gem, Diamond, Check, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";


const planDetails = {
  free: {
    name: "FREE",
    price: "Gratuito",
    icon: Star,
    color: "text-muted-foreground",
    borderColor: "border-muted",
    features: ["5 sinais por dia", "Link de referência (10% comissão)", "Suporte básico"]
  },
  partner: {
    name: "PARTNER", 
    price: "$33",
    icon: Check,
    color: "text-cyber-green",
    borderColor: "border-cyber-green",
    features: ["20 sinais por dia", "1% lucro diário até 200%", "Grupo VIP", "Área de membros"]
  },
  master: {
    name: "MASTER",
    price: "$100", 
    icon: Crown,
    color: "text-gold",
    borderColor: "border-gold",
    features: ["100 sinais por dia", "1% lucro diário até 200%", "Grupo VIP", "Área de membros", "Suporte prioritário"]
  },
  premium: {
    name: "PREMIUM",
    price: "$500",
    icon: Gem, 
    color: "text-neon-purple",
    borderColor: "border-neon-purple",
    features: ["500 sinais por dia", "1% lucro diário até 200%", "Grupo VIP", "Área de membros", "Suporte VIP 24/7"]
  },
  platinum: {
    name: "PLATINUM",
    price: "$1,000",
    icon: Diamond,
    color: "text-primary",
    borderColor: "border-primary", 
    features: ["1000 sinais por dia", "1% lucro diário até 200%", "Grupo VIP", "Área de membros", "Suporte dedicado", "Mentoria 1:1"]
  }
};

export default function RegisterPage() {
  const { plan } = useParams<{ plan: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    password: ""
  });

  const planInfo = planDetails[plan as keyof typeof planDetails];

  if (!planInfo) {
    navigate("/");
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement registration logic with Supabase
    console.log("Registration data:", { ...formData, plan });
    // Redirect to dashboard after successful registration
    navigate("/dashboard");
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-radial from-background via-background to-background/50 relative overflow-hidden">
      
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-4xl">
          <Button
            onClick={() => navigate("/")}
            variant="ghost"
            className="mb-6 text-gold hover:text-gold/80"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao site
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Plan Summary */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Card className={`glass-card ${planInfo.borderColor} border-2 h-full`}>
                <CardHeader className="text-center">
                  <div className={`mx-auto mb-4 p-4 rounded-full bg-background/20 w-fit ${planInfo.color}`}>
                    <planInfo.icon className="w-10 h-10" />
                  </div>
                  <CardTitle className={`text-3xl font-bold ${planInfo.color}`}>
                    Plano {planInfo.name}
                  </CardTitle>
                  <div className="text-4xl font-bold text-foreground mb-4">
                    {planInfo.price}
                  </div>
                  {planInfo.name === "MASTER" && (
                    <Badge className="bg-gradient-primary text-black font-bold mb-4">
                      MAIS POPULAR
                    </Badge>
                  )}
                </CardHeader>

                <CardContent>
                  <h3 className="font-semibold text-foreground mb-4">Incluído no seu plano:</h3>
                  <div className="space-y-3">
                    {planInfo.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 p-4 rounded-lg bg-gold/10 border border-gold/20">
                    <h4 className="font-semibold text-gold mb-2">🎯 Garantia de Resultados</h4>
                    <p className="text-sm text-muted-foreground">
                      Sinais com 75% de assertividade comprovada. Se não ficar satisfeito nos primeiros 7 dias, 
                      devolvemos 100% do seu investimento.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Registration Form */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Card className="glass-card border-gold/20">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-primary">
                    Criar sua conta
                  </CardTitle>
                  <CardDescription>
                    Preencha seus dados para ativar seu plano {planInfo.name}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Nome Completo</Label>
                      <Input
                        id="fullName"
                        placeholder="Seu nome completo"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange("fullName", e.target.value)}
                        required
                        className="bg-background/50 border-gold/20 focus:border-gold"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="username">Nome de Usuário (ID)</Label>
                      <Input
                        id="username"
                        placeholder="Escolha um username único"
                        value={formData.username}
                        onChange={(e) => handleInputChange("username", e.target.value)}
                        required
                        className="bg-background/50 border-gold/20 focus:border-gold"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        required
                        className="bg-background/50 border-gold/20 focus:border-gold"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone (com DDD)</Label>
                      <Input
                        id="phone"
                        placeholder="(11) 99999-9999"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        required
                        className="bg-background/50 border-gold/20 focus:border-gold"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Senha</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Crie uma senha segura"
                        value={formData.password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                        required
                        className="bg-background/50 border-gold/20 focus:border-gold"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-primary text-black font-bold hover:shadow-glow transition-all duration-300"
                      size="lg"
                    >
                      {planInfo.name === "FREE" ? "ATIVAR CONTA GRATUITA" : `ATIVAR PLANO ${planInfo.name}`}
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">
                      Ao criar sua conta, você concorda com nossos termos de uso e política de privacidade.
                    </p>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}