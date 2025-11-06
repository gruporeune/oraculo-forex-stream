import AutoScroll from "embla-carousel-auto-scroll";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import exnovaLogo from "@/assets/brokers/exnova.png";
import iqOptionLogo from "@/assets/brokers/iq-option.png";
import polariumLogo from "@/assets/brokers/polarium.png";
import pocketOptionLogo from "@/assets/brokers/pocket-option.png";
import binollaLogo from "@/assets/brokers/binolla.png";
import olympTradeLogo from "@/assets/brokers/olymp-trade.png";

interface Logo {
  id: string;
  description: string;
  image: string;
  className?: string;
}

const logos: Logo[] = [
  {
    id: "exnova",
    description: "Exnova",
    image: exnovaLogo,
    className: "h-8 w-auto",
  },
  {
    id: "iq-option",
    description: "IQ Option",
    image: iqOptionLogo,
    className: "h-8 w-auto",
  },
  {
    id: "polarium",
    description: "Polarium Broker",
    image: polariumLogo,
    className: "h-8 w-auto",
  },
  {
    id: "pocket-option",
    description: "Pocket Option",
    image: pocketOptionLogo,
    className: "h-10 w-auto",
  },
  {
    id: "binolla",
    description: "Binolla",
    image: binollaLogo,
    className: "h-8 w-auto",
  },
  {
    id: "olymp-trade",
    description: "Olymp Trade",
    image: olympTradeLogo,
    className: "h-8 w-auto",
  },
];

export function BrokersCarousel() {
  return (
    <div className="py-8">
      <div className="relative mx-auto flex items-center justify-center">
        <Carousel
          opts={{ loop: true }}
          plugins={[AutoScroll({ playOnInit: true, speed: 1 })]}
        >
          <CarouselContent className="ml-0">
            {logos.map((logo) => (
              <CarouselItem
                key={logo.id}
                className="flex basis-1/3 justify-center pl-0 sm:basis-1/4 md:basis-1/5 lg:basis-1/6"
              >
                <div className="mx-10 flex shrink-0 items-center justify-center">
                  <div>
                    <img
                      src={logo.image}
                      alt={logo.description}
                      className={logo.className}
                    />
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
        <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-background to-transparent"></div>
        <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent"></div>
      </div>
    </div>
  );
}
