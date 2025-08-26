import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play } from "lucide-react";
import { motion } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState } from "react";

const videos = [
  {
    title: "Como o ORÁCULO Transformou Minha Vida",
    thumbnail: "https://img.youtube.com/vi/6qO1AWwVrgk/maxresdefault.jpg",
    duration: "5:42",
    views: "12.4K",
    author: "Maria Silva",
    youtubeId: "6qO1AWwVrgk"
  },
  {
    title: "R$ 50.000 em 3 Meses com o ORÁCULO",
    thumbnail: "https://img.youtube.com/vi/qtIpqwZ7j8A/maxresdefault.jpg", 
    duration: "8:15",
    views: "23.7K",
    author: "João Santos",
    youtubeId: "qtIpqwZ7j8A"
  }
];

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

export function VideoSection() {
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
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-bold bg-clip-text text-transparent bg-gradient-primary mb-6">
            Veja os Resultados na Prática
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Assista aos depoimentos reais e demonstrações ao vivo de como o ORÁCULO 
            está mudando a vida financeira de milhares de pessoas.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {videos.map((video, index) => (
            <motion.div
              key={video.title}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card 
                className="glass-card border-gold/20 hover:border-gold/50 hover:shadow-glow transition-all duration-300 cursor-pointer group"
                onClick={() => handlePlay(video.youtubeId, video.title)}
              >
                <div className="relative overflow-hidden rounded-t-lg">
                  <img 
                    src={video.thumbnail} 
                    alt={video.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-all duration-300">
                    <div className="w-16 h-16 rounded-full bg-gold/90 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Play className="w-6 h-6 text-black ml-1" fill="currentColor" />
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                    {video.duration}
                  </div>
                </div>
                
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-foreground line-clamp-2">
                    {video.title}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>{video.author}</span>
                    <span>{video.views} visualizações</span>
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