import { TestimonialsColumn, firstColumn, secondColumn, thirdColumn } from "@/components/ui/testimonials-columns";
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

        <div className="flex justify-center gap-6 mt-10 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[740px] overflow-hidden">
          <TestimonialsColumn testimonials={firstColumn} duration={15} />
          <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={19} />
          <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={17} />
        </div>
      </div>
    </section>
  );
}