import { motion } from "framer-motion";
import { Users, TrendingUp, DollarSign, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ReferralSection() {
  const referralBenefits = [
    {
      icon: DollarSign,
      title: "10% por Indicação",
      description: "Ganhe 10% de comissão para cada pessoa que você indicar e se cadastrar"
    },
    {
      icon: Users,
      title: "Indicações Ilimitadas",
      description: "Não há limite para o número de pessoas que você pode indicar"
    },
    {
      icon: TrendingUp,
      title: "Renda Passiva",
      description: "Crie uma fonte de renda passiva indicando amigos e conhecidos"
    },
    {
      icon: Gift,
      title: "Bônus Especiais",
      description: "Receba bônus especiais ao atingir metas de indicações mensais"
    }
  ];

  return (
    <section id="referral" className="py-24 px-4 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
            Ganhe por Indicação
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Transforme sua rede de contatos em uma fonte de renda. 
            Indique amigos e ganhe <span className="text-blue-600 font-semibold">10% de comissão</span> por cada indicação que se cadastrar.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {referralBenefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-600 to-blue-400 rounded-2xl flex items-center justify-center">
                <benefit.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
              <p className="text-muted-foreground">{benefit.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-gradient-to-r from-blue-600/10 to-blue-400/10 rounded-3xl p-8 text-center border border-blue-500/20"
        >
          <h3 className="text-2xl font-bold mb-4">Como Funciona o Programa de Indicações</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg mb-3">
                1
              </div>
              <h4 className="font-semibold mb-2">Cadastre-se</h4>
              <p className="text-sm text-muted-foreground">Crie sua conta no O ORÁCULO</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg mb-3">
                2
              </div>
              <h4 className="font-semibold mb-2">Compartilhe</h4>
              <p className="text-sm text-muted-foreground">Use seu link de indicação para convidar amigos</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg mb-3">
                3
              </div>
              <h4 className="font-semibold mb-2">Ganhe</h4>
              <p className="text-sm text-muted-foreground">Receba 10% de comissão por cada indicação</p>
            </div>
          </div>
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white"
            onClick={() => window.location.href = '/register'}
          >
            Começar a Indicar Agora
          </Button>
        </motion.div>
      </div>
    </section>
  );
}