import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { motion } from "framer-motion";

const testimonials = [
  {
    name: "Maria Silva",
    role: "Trader Iniciante",
    image: "/placeholder.svg",
    rating: 5,
    text: "Em apenas 30 dias usando o ORÁCULO, consegui recuperar todas as perdas que tive em 2 anos operando sozinha. Incrível!",
    profit: "R$ 12.847"
  },
  {
    name: "João Santos",
    role: "Empresário",
    image: "/placeholder.svg",
    rating: 5,
    text: "Nunca pensei que seria possível ter uma renda passiva tão consistente. O ORÁCULO mudou minha vida financeira completamente.",
    profit: "R$ 34.521"
  },
  {
    name: "Ana Costa",
    role: "Aposentada",
    image: "/placeholder.svg",
    rating: 5,
    text: "Com 65 anos, descobri uma nova fonte de renda. O sistema é tão fácil que até eu consegui usar sem problemas!",
    profit: "R$ 8.943"
  },
  {
    name: "Carlos Lima",
    role: "Investidor",
    image: "/placeholder.svg",
    rating: 5,
    text: "Testei várias estratégias antes de conhecer o ORÁCULO. Nenhuma chega nem perto da precisão desta IA.",
    profit: "R$ 67.234"
  },
  {
    name: "Fernanda Oliveira",
    role: "Estudante",
    image: "/placeholder.svg",
    rating: 5,
    text: "Conseguindo pagar minha faculdade com os lucros do ORÁCULO. É incrível como uma IA pode ser tão assertiva!",
    profit: "R$ 15.672"
  },
  {
    name: "Ricardo Mendes",
    role: "Trader Profissional",
    image: "/placeholder.svg",
    rating: 5,
    text: "20 anos operando manualmente e nunca vi uma ferramenta tão precisa. O ORÁCULO é revolucionário!",
    profit: "R$ 98.456"
  }
];

export function TestimonialsSection() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-bold bg-clip-text text-transparent bg-gradient-primary mb-6">
            Histórias de Sucesso
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Milhares de pessoas já transformaram suas vidas financeiras com o ORÁCULO. 
            Veja os resultados reais de quem decidiu confiar na nossa tecnologia.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="glass-card border-gold/20 hover:border-gold/50 hover:shadow-glow transition-all duration-300 h-full">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={testimonial.image} alt={testimonial.name} />
                      <AvatarFallback className="bg-gradient-primary text-black font-bold">
                        {testimonial.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">{testimonial.name}</h4>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>

                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-gold text-gold" />
                    ))}
                  </div>

                  <blockquote className="text-muted-foreground mb-4 italic">
                    "{testimonial.text}"
                  </blockquote>

                  <div className="text-center">
                    <span className="text-2xl font-bold text-green-500">+{testimonial.profit}</span>
                    <p className="text-sm text-muted-foreground">Lucro acumulado</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}