import { TestimonialsColumn } from "@/components/ui/testimonials-columns";
import { motion } from "framer-motion";

const testimonials = [
  {
    text: "Em apenas 30 dias usando o ORÁCULO, consegui recuperar todas as perdas que tive em 2 anos operando sozinha. Incrível!",
    image: "https://randomuser.me/api/portraits/women/1.jpg",
    name: "Maria Silva",
    role: "Trader Iniciante",
  },
  {
    text: "Nunca pensei que seria possível ter uma renda passiva tão consistente. O ORÁCULO mudou minha vida financeira completamente.",
    image: "https://randomuser.me/api/portraits/men/2.jpg",
    name: "João Santos",
    role: "Empresário",
  },
  {
    text: "Com 65 anos, descobri uma nova fonte de renda. O sistema é tão fácil que até eu consegui usar sem problemas!",
    image: "https://randomuser.me/api/portraits/women/3.jpg",
    name: "Ana Costa",
    role: "Aposentada",
  },
  {
    text: "Testei várias estratégias antes de conhecer o ORÁCULO. Nenhuma chega nem perto da precisão desta IA.",
    image: "https://randomuser.me/api/portraits/men/4.jpg",
    name: "Carlos Lima",
    role: "Investidor",
  },
  {
    text: "Conseguindo pagar minha faculdade com os lucros do ORÁCULO. É incrível como uma IA pode ser tão assertiva!",
    image: "https://randomuser.me/api/portraits/women/5.jpg",
    name: "Fernanda Oliveira",
    role: "Estudante",
  },
  {
    text: "20 anos operando manualmente e nunca vi uma ferramenta tão precisa. O ORÁCULO é revolucionário!",
    image: "https://randomuser.me/api/portraits/men/6.jpg",
    name: "Ricardo Mendes",
    role: "Trader Profissional",
  },
  {
    text: "Sistema muito intuitivo e resultados surpreendentes. Recomendo para qualquer pessoa que queira ter sucesso.",
    image: "https://randomuser.me/api/portraits/women/7.jpg",
    name: "Camila Rocha",
    role: "Consultora",
  },
  {
    text: "Resultados consistentes e suporte excepcional. O ORÁCULO superou todas as minhas expectativas.",
    image: "https://randomuser.me/api/portraits/men/8.jpg",
    name: "André Pereira",
    role: "Analista",
  },
  {
    text: "Transformou completamente minha perspectiva sobre trading. Agora tenho confiança nos meus investimentos.",
    image: "https://randomuser.me/api/portraits/women/9.jpg",
    name: "Larissa Campos",
    role: "Empreendedora",
  }
];

const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(6, 9);

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