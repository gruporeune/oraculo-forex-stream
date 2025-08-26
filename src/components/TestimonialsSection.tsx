import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState } from "react";

const VideoModal = ({ youtubeId, open, onOpenChange, title }: { youtubeId: string | null; open: boolean; onOpenChange: (open: boolean) => void; title: string | null }) => {
  if (!youtubeId) return null;
  const videoSrc = `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black border-gray-800 p-0 max-w-4xl w-full aspect-video">
        <iframe
          src={videoSrc}
          title={title || "Video"}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full rounded-lg"
        ></iframe>
      </DialogContent>
    </Dialog>
  );
};

const videoTestimonials = [
  {
    title: "Depoimento #1",
    thumbnail: "https://img.youtube.com/vi/6qO1AWwVrgk/maxresdefault.jpg",
    youtubeId: "6qO1AWwVrgk",
    description: "Finalmente um sistema que funciona de verdade!"
  },
  {
    title: "Depoimento #2", 
    thumbnail: "https://img.youtube.com/vi/qtIpqwZ7j8A/maxresdefault.jpg",
    youtubeId: "qtIpqwZ7j8A",
    description: "Finalmente um sistema que funciona de verdade!"
  },
  {
    title: "Depoimento #3",
    thumbnail: "/lovable-uploads/892048e8-dfe9-47b0-8259-f7b6b585171d.png",
    youtubeId: null,
    description: "Finalmente um sistema que funciona de verdade!",
    comingSoon: true
  }
];

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


export function TestimonialsSection() {
  const [modalVideo, setModalVideo] = useState<{ id: string | null; title: string | null }>({ id: null, title: null });

  const handlePlay = (youtubeId: string, title: string) => {
    setModalVideo({ id: youtubeId, title });
  };

  return (
    <section className="py-20 px-4">
      <VideoModal
        youtubeId={modalVideo.id}
        title={modalVideo.title}
        open={!!modalVideo.id}
        onOpenChange={(isOpen) => !isOpen && setModalVideo({ id: null, title: null })}
      />
      
      <div className="max-w-7xl mx-auto">
        {/* Video Testimonials Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-bold bg-clip-text text-transparent bg-gradient-primary mb-6">
            Resultados Reais dos Nossos Usuários
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Veja os depoimentos reais de quem já está lucrando com o ORÁCULO.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {videoTestimonials.map((video, index) => (
            <motion.div
              key={video.title}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div 
                className={`glass-card border-gold/20 hover:border-gold/50 hover:shadow-glow transition-all duration-300 rounded-2xl overflow-hidden ${!video.comingSoon ? 'cursor-pointer group' : ''}`}
                onClick={() => !video.comingSoon && video.youtubeId && handlePlay(video.youtubeId, video.title)}
              >
                <div className="relative overflow-hidden">
                  <img 
                    src={video.thumbnail} 
                    alt={video.title}
                    className={`w-full h-48 object-cover ${!video.comingSoon ? 'group-hover:scale-105' : ''} transition-transform duration-300`}
                  />
                  {!video.comingSoon ? (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-all duration-300">
                      <div className="w-16 h-16 rounded-full bg-gold/90 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Play className="w-6 h-6 text-black ml-1" fill="currentColor" />
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-gray-600 flex items-center justify-center mx-auto mb-2">
                          <Play className="w-6 h-6 text-gray-400 ml-1" fill="currentColor" />
                        </div>
                        <span className="text-white text-sm">(Em breve)</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="p-6">
                  <h3 className="text-lg font-bold text-foreground mb-2">
                    {video.title}
                  </h3>
                  <div className="flex items-center justify-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-gold text-lg">★</span>
                    ))}
                  </div>
                  <p className="text-center text-muted-foreground italic">
                    "{video.description}"
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Text Testimonials Section */}
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
          {testimonials.slice(0, 6).map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="p-6 rounded-2xl border border-border bg-card/80 backdrop-blur-sm shadow-lg"
            >
              <div className="text-sm text-muted-foreground leading-relaxed mb-4">
                "{testimonial.text}"
              </div>
              <div className="flex items-center gap-3">
                <img
                  width={40}
                  height={40}
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="h-10 w-10 rounded-full object-cover"
                />
                <div className="flex flex-col">
                  <div className="font-medium tracking-tight leading-5 text-foreground">{testimonial.name}</div>
                  <div className="leading-5 opacity-60 tracking-tight text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}