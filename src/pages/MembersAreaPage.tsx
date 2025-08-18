import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const VideoModal = ({ youtubeId, open, onOpenChange, title }: any) => {
  if (!youtubeId) return null;
  const videoSrc = `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black border-gray-800 p-0 max-w-4xl w-full aspect-video">
        <iframe
          src={videoSrc}
          title={title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full rounded-lg"
        ></iframe>
      </DialogContent>
    </Dialog>
  );
};

const VideoThumbnail = ({ video, onPlay }: any) => (
  <motion.div
    className="flex-shrink-0 w-full rounded-lg overflow-hidden cursor-pointer relative group"
    onClick={() => onPlay(video.youtubeId, video.title)}
    whileHover={{ scale: 1.05, zIndex: 10 }}
    transition={{ type: 'spring', stiffness: 300 }}
  >
    <img className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" alt={video.title} src={video.thumb} />
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
      <Play className="w-12 h-12 text-white drop-shadow-lg" />
    </div>
    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <p className="text-white font-semibold text-sm text-shadow">{video.title}</p>
    </div>
  </motion.div>
);

const VideoCategoryRow = ({ title, videos, onPlay }: any) => {
  const scrollRef = useRef(null);

  const scroll = (direction: string) => {
    const { current } = scrollRef;
    if (current) {
      const scrollAmount = (current as any).offsetWidth;
      (current as any).scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="mb-8">
      <h2 className="text-xl md:text-2xl font-bold text-white mb-4 text-shadow">{title}</h2>
      <div className="relative group">
        <Button onClick={() => scroll('left')} variant="ghost" className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 h-24 w-12 bg-black/30 text-white opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex items-center justify-center rounded-full">
          <ChevronLeft className="w-8 h-8" />
        </Button>
        <div ref={scrollRef} className="grid grid-flow-col auto-cols-[45%] sm:auto-cols-[30%] md:auto-cols-[22%] lg:auto-cols-[18.4%] gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {videos.map((video: any) => <VideoThumbnail key={video.id} video={video} onPlay={onPlay} />)}
        </div>
        <Button onClick={() => scroll('right')} variant="ghost" className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-20 h-24 w-12 bg-black/30 text-white opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex items-center justify-center rounded-full">
          <ChevronRight className="w-8 h-8" />
        </Button>
      </div>
    </div>
  );
};

interface MembersAreaPageProps {
  user: any;
  profile: any;
}

const MembersAreaPage = ({ user, profile }: MembersAreaPageProps) => {
  const [modalVideo, setModalVideo] = useState({ id: null, title: null });

  const getYoutubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : url;
  };

  const courses = {
    introducao: [
      { id: 1, title: "O que é OB?", youtubeId: "el3pUXM2Brk", thumb: "https://storage.googleapis.com/hostinger-horizons-assets-prod/2336c78e-def0-4586-a63c-7123d4877007/480a2c8317d1a95d6199fe7cf6bb401c.png" },
      { id: 2, title: "Analise Geral", youtubeId: "T68av5Xen4w", thumb: "https://rxlymqymfccfjupiquvg.supabase.co/storage/v1/object/public/thumbnails//2%20-%20analise%20geral.png" },
      { id: 3, title: "PriceAction", youtubeId: "cNZBOa-aFFk", thumb: "https://rxlymqymfccfjupiquvg.supabase.co/storage/v1/object/public/thumbnails//3%20-%20price%20action.png" },
      { id: 4, title: "Operacionais", youtubeId: "yysWdHQcYlo", thumb: "https://rxlymqymfccfjupiquvg.supabase.co/storage/v1/object/public/thumbnails//4%20-%20operacionais.png" },
      { id: 5, title: "Gestão de Risco", youtubeId: "zOsn1g7c_zc", thumb: "https://rxlymqymfccfjupiquvg.supabase.co/storage/v1/object/public/thumbnails//gestao.jpg" },
    ],
    analise: [
      { id: 6, title: "Introdução a Analise Grafica", youtubeId: "O1r6aiC2W6w", thumb: "https://rxlymqymfccfjupiquvg.supabase.co/storage/v1/object/public/thumbnails//6%20-%20intro.jpg" },
      { id: 7, title: "Analise Técnica", youtubeId: "Qwi-voZpBZk", thumb: "https://rxlymqymfccfjupiquvg.supabase.co/storage/v1/object/public/thumbnails//8%20-%20analise%20tecnica.png" },
      { id: 8, title: "Teoria de Down", youtubeId: "X8Mrihjxhpw", thumb: "https://rxlymqymfccfjupiquvg.supabase.co/storage/v1/object/public/thumbnails//7%20-%20teoria%20de%20down.png" },
      { id: 9, title: "Suporte e Resistencia", youtubeId: "K8wK8qph010", thumb: "https://rxlymqymfccfjupiquvg.supabase.co/storage/v1/object/public/thumbnails//9%20-%20aprenda%20suporte%20e%20resistencia.png" },
      { id: 10, title: "Pontos de Pivô", youtubeId: "lGv2p0FImJ4", thumb: "https://rxlymqymfccfjupiquvg.supabase.co/storage/v1/object/public/thumbnails//10-pivo.jpg" },
    ],
    operacionais: [
      { id: 11, title: "Canal de alta como operar?", youtubeId: "DCcF8U4fAwU", thumb: "https://rxlymqymfccfjupiquvg.supabase.co/storage/v1/object/public/thumbnails//11%20-%20canal%20de%20alta.png" },
      { id: 12, title: "SUP/RES como operar?", youtubeId: "XQ0p8rwT93Y", thumb: "https://rxlymqymfccfjupiquvg.supabase.co/storage/v1/object/public/thumbnails//12%20-%20suporte%20e%20resistencia%20como%20operar.png" },
      { id: 13, title: "Harami, como operar?", youtubeId: "uBl-ma-PzsY", thumb: "https://rxlymqymfccfjupiquvg.supabase.co/storage/v1/object/public/thumbnails//13%20-%20harami%20como%20operar.png" },
      { id: 14, title: "Bandeira, como operar?", youtubeId: "KjUXVyShzTk", thumb: "https://rxlymqymfccfjupiquvg.supabase.co/storage/v1/object/public/thumbnails//14%20-%20bandeira%20como%20operar.png" },
      { id: 15, title: "4 Operacionais para OB", youtubeId: "bmmdCEkndGE", thumb: "https://rxlymqymfccfjupiquvg.supabase.co/storage/v1/object/public/thumbnails//15%20-%204%20operacionais%20pra%20ob.png" },
    ],
  };

  const handlePlay = (youtubeUrl: string, title: string) => {
    const videoId = getYoutubeId(youtubeUrl);
    if (videoId) {
      setModalVideo({ id: videoId, title } as any);
    }
  };

  // Check if user has access to members area (now includes free plan)
  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-3xl font-bold mb-4">Área de Membros</h1>
          <p className="text-lg mb-6">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 min-h-screen overflow-x-hidden">
      <VideoModal
        youtubeId={modalVideo.id}
        title={modalVideo.title}
        open={!!modalVideo.id}
        onOpenChange={(isOpen: boolean) => !isOpen && setModalVideo({ id: null, title: null } as any)}
      />
      <header className="relative h-[75vh] md:h-[80vh] w-full overflow-hidden">
        <div className="absolute inset-0">
          <iframe
            className="absolute top-1/2 left-1/2 w-full h-full min-w-[177.77vh] min-h-full object-cover transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            src="https://www.youtube.com/embed/4oq96jMDZvk?autoplay=1&mute=1&loop=1&playlist=4oq96jMDZvk&controls=0&showinfo=0&autohide=1&modestbranding=1"
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          ></iframe>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent" />
        <div className="absolute top-0 left-0 p-4 md:p-8 flex justify-between w-full z-10">
          {/* Logo removida conforme solicitado */}
        </div>
        <div className="absolute bottom-0 left-0 p-4 md:p-8 text-white max-w-lg z-10">
          <h1 className="text-3xl md:text-5xl font-extrabold mb-4 text-shadow">A história do Bitcoin</h1>
          <p className="text-sm md:text-base mb-6 text-shadow-md">A primeira criptomoeda criada em 2008, guarda muitos segredos e enigmas pelo seu criador, Satoshi Nakamoto. Assista e veja um pouco da sua emocionante história.</p>
          <Button onClick={() => handlePlay('4oq96jMDZvk', 'A história do Bitcoin')} className="bg-white text-black font-bold px-6 py-3 rounded-lg flex items-center space-x-2 hover:bg-gray-200">
            <Play className="w-6 h-6" />
            <span>Assistir Agora</span>
          </Button>
        </div>
      </header>

      <main className="p-4 md:p-8">
        <VideoCategoryRow title="INTRODUÇÃO DE BINÁRIAS" videos={courses.introducao} onPlay={handlePlay} />
        <VideoCategoryRow title="ANALISE GRAFICA" videos={courses.analise} onPlay={handlePlay} />
        <VideoCategoryRow title="OPERACIONAIS" videos={courses.operacionais} onPlay={handlePlay} />
      </main>
    </div>
  );
};

export default MembersAreaPage;