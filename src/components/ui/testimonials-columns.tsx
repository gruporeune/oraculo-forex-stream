"use client";
import React from "react";
import { motion } from "motion/react";

export const TestimonialsColumn = (props: {
  className?: string;
  testimonials: typeof testimonials;
  duration?: number;
}) => {
  return (
    <div className={props.className}>
      <motion.div
        animate={{
          translateY: "-50%",
        }}
        transition={{
          duration: props.duration || 10,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 pb-6 bg-background"
      >
        {[
          ...new Array(2).fill(0).map((_, index) => (
            <React.Fragment key={index}>
              {props.testimonials.map(({ text, image, name, role }, i) => (
                <div className="glass-card border-gold/20 p-10 rounded-3xl shadow-glow max-w-xs w-full" key={i}>
                  <div className="text-foreground">{text}</div>
                  <div className="flex items-center gap-2 mt-5">
                    <img
                      width={40}
                      height={40}
                      src={image}
                      alt={name}
                      className="h-10 w-10 rounded-full"
                    />
                    <div className="flex flex-col">
                      <div className="font-medium tracking-tight leading-5 text-foreground">{name}</div>
                      <div className="leading-5 text-gold tracking-tight">{role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </React.Fragment>
          )),
        ]}
      </motion.div>
    </div>
  );
};

const testimonials = [
  {
    text: "O ORÁCULO mudou minha vida! Em apenas uma semana obtive 85% de acertos nas operações. Nunca vi algo tão preciso!",
    image: "https://randomuser.me/api/portraits/women/1.jpg",
    name: "Maria Silva",
    role: "Trader Iniciante",
  },
  {
    text: "Incrível! A IA do ORÁCULO é impressionante. Lucrei R$ 15.000 no primeiro mês usando os sinais automatizados.",
    image: "https://randomuser.me/api/portraits/men/2.jpg",
    name: "João Santos",
    role: "Empresário",
  },
  {
    text: "Testei vários sistemas, mas nenhum se compara ao ORÁCULO. A precisão dos sinais é incomparável!",
    image: "https://randomuser.me/api/portraits/women/3.jpg",
    name: "Ana Costa",
    role: "Investidora",
  },
  {
    text: "Finalmente um sistema que funciona de verdade! O ORÁCULO me trouxe a consistência que eu buscava no trading.",
    image: "https://randomuser.me/api/portraits/men/4.jpg",
    name: "Carlos Oliveira",
    role: "Trader Profissional",
  },
  {
    text: "A rentabilidade diária do ORÁCULO superou todas minhas expectativas. Recomendo para todos!",
    image: "https://randomuser.me/api/portraits/women/5.jpg",
    name: "Patricia Lima",
    role: "Contadora",
  },
  {
    text: "Simplesmente revolucionário! O ORÁCULO democratizou o acesso ao trading profissional.",
    image: "https://randomuser.me/api/portraits/women/6.jpg",
    name: "Lucia Ferreira",
    role: "Professora",
  },
  {
    text: "Com o ORÁCULO consegui transformar R$ 500 em R$ 8.000 em 30 dias. Fantástico!",
    image: "https://randomuser.me/api/portraits/men/7.jpg",
    name: "Roberto Silva",
    role: "Comerciante",
  },
  {
    text: "A tecnologia do ORÁCULO é impressionante. Os sinais chegam na hora exata e com alta precisão.",
    image: "https://randomuser.me/api/portraits/women/8.jpg",
    name: "Fernanda Souza",
    role: "Médica",
  },
  {
    text: "Melhor investimento que já fiz! O ORÁCULO pagou por si mesmo na primeira semana.",
    image: "https://randomuser.me/api/portraits/men/9.jpg",
    name: "Miguel Torres",
    role: "Engenheiro",
  },
];

const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(6, 9);

export { firstColumn, secondColumn, thirdColumn };