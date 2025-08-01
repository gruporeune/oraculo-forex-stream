import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Video, Users, BarChart3, HeadphonesIcon, Smartphone } from "lucide-react";

const resources = [
  {
    icon: BookOpen,
    title: "Guias Completos",
    description: "Materiais educativos sobre trading de opções binárias, análise técnica e gestão de risco.",
  },
  {
    icon: Video,
    title: "Vídeo Aulas",
    description: "Tutoriais em vídeo que ensinam desde o básico até estratégias avançadas de trading.",
  },
  {
    icon: Users,
    title: "Comunidade VIP",
    description: "Acesso exclusivo à nossa comunidade de traders experientes e mentores especializados.",
  },
  {
    icon: BarChart3,
    title: "Análises de Mercado",
    description: "Relatórios diários com análises técnicas e fundamentais dos principais ativos.",
  },
  {
    icon: HeadphonesIcon,
    title: "Suporte 24/7",
    description: "Atendimento especializado disponível 24 horas por dia, 7 dias por semana.",
  },
  {
    icon: Smartphone,
    title: "App Mobile",
    description: "Aplicativo mobile para acompanhar sinais e gerenciar suas operações em qualquer lugar.",
  },
];

export function ResourcesSection() {
  return (
    <section id="resources" className="py-16 sm:py-20 px-4 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
            Recursos{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-purple-400">
              Exclusivos
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto px-4">
            Tenha acesso a uma plataforma completa com tudo que você precisa para se tornar um trader de sucesso.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {resources.map((resource, index) => (
            <motion.div
              key={resource.title}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="h-full border-border/50 bg-card/50 backdrop-blur-sm hover:border-purple-500/50 transition-all duration-300 group">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600/20 to-purple-400/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <resource.icon className="w-6 h-6 text-purple-600" />
                  </div>
                  <CardTitle className="text-xl">{resource.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {resource.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}