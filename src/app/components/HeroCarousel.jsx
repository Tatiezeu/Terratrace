import { useCallback, useEffect, useRef, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const slides = [
  {
    id: 1,
    videoId: 'yxevKDDP9j0',
    headline: 'Securing Land Tenure',
    subheadline: 'Digital transformation of property rights across Africa',
    background: 'linear-gradient(135deg, rgba(0, 33, 71, 0.95) 0%, rgba(0, 61, 122, 0.85) 100%)',
  },
  {
    id: 2,
    videoId: 'TX3dVj9LSLQ',
    headline: 'Transparent Verification',
    subheadline: 'Blockchain-secured land codes preventing fraud and disputes',
    background: 'linear-gradient(135deg, rgba(0, 50, 90, 0.95) 0%, rgba(0, 33, 71, 0.85) 100%)',
  },
  {
    id: 3,
    videoId: 'lU80xzT4fWY',
    headline: 'Digital Registration',
    subheadline: 'Streamlined Titre Foncier process with 30-day transparency',
    background: 'linear-gradient(135deg, rgba(0, 40, 80, 0.95) 0%, rgba(0, 50, 90, 0.85) 100%)',
  },
];

export default function HeroCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isHoveringVideo, setIsHoveringVideo] = useState(false);
  const autoplayRef = useRef(null);

  const startAutoplay = useCallback(() => {
    stopAutoplay();
    autoplayRef.current = setInterval(() => {
      if (emblaApi) emblaApi.scrollNext();
    }, 8000);
  }, [emblaApi]);

  const stopAutoplay = useCallback(() => {
    if (autoplayRef.current) {
      clearInterval(autoplayRef.current);
      autoplayRef.current = null;
    }
  }, []);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    startAutoplay();
    return () => {
      emblaApi.off('select', onSelect);
      stopAutoplay();
    };
  }, [emblaApi, onSelect, startAutoplay, stopAutoplay]);

  // Pause / resume autoplay based on hover state
  useEffect(() => {
    if (isHoveringVideo) {
      stopAutoplay();
    } else {
      startAutoplay();
    }
  }, [isHoveringVideo, startAutoplay, stopAutoplay]);

  return (
    <section id="home" className="relative w-full h-screen overflow-hidden">
      <div className="embla overflow-hidden h-full" ref={emblaRef}>
        <div className="embla__container flex h-full">
          {slides.map((slide, index) => (
            <div key={slide.id} className="embla__slide flex-[0_0_100%] min-w-0 relative h-full">
              {/* Background with gradient overlay */}
              <div
                className="absolute inset-0"
                style={{ background: slide.background }}
              >
                {/* Decorative geometric pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute top-0 left-0 w-96 h-96 border border-white rounded-full transform -translate-x-1/2 -translate-y-1/2" />
                  <div className="absolute bottom-0 right-0 w-96 h-96 border border-white rounded-full transform translate-x-1/2 translate-y-1/2" />
                </div>
              </div>

              {/* Content */}
              <div className="relative z-10 h-screen flex items-center justify-center px-6">
                <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-12 items-center">
                  {/* Text Content */}
                  <AnimatePresence mode="wait">
                    {selectedIndex === index && (
                      <motion.div
                        key={`text-${slide.id}`}
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 50 }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        className="text-white space-y-6"
                      >
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          <div className="inline-block px-4 py-2 bg-[#D4AF37]/20 backdrop-blur-sm rounded-full border border-[#D4AF37]/30 mb-6">
                            <span className="text-[#D4AF37] text-sm tracking-widest">MINDCAF CERTIFIED</span>
                          </div>
                        </motion.div>

                        <motion.h1
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          className="text-5xl lg:text-7xl leading-tight"
                          style={{ fontFamily: 'var(--font-display)' }}
                        >
                          {slide.headline}
                        </motion.h1>

                        <motion.p
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 }}
                          className="text-xl lg:text-2xl text-white/80"
                        >
                          {slide.subheadline}
                        </motion.p>

                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 }}
                          className="flex gap-4 pt-4"
                        >
                          <button className="px-8 py-4 bg-[#D4AF37] text-[#002147] rounded-full hover:bg-[#F4C430] transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1">
                            Get Started
                          </button>
                          <button className="px-8 py-4 border-2 border-white/30 text-white rounded-full hover:bg-white/10 transition-all duration-300 backdrop-blur-sm">
                            Learn More
                          </button>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* YouTube Video Embed */}
                  <AnimatePresence mode="wait">
                    {selectedIndex === index && (
                      <motion.div
                        key={`video-${slide.id}`}
                        initial={{ opacity: 0, scale: 0.9, x: 50 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9, x: -50 }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        className="relative"
                      >
                        <div
                          className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl border-4 border-white/10"
                          onMouseEnter={() => setIsHoveringVideo(true)}
                          onMouseLeave={() => setIsHoveringVideo(false)}
                        >
                          <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${slide.videoId}?controls=1&modestbranding=1&rel=0`}
                            title={slide.headline}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="absolute inset-0"
                          />
                        </div>
                        {/* Decorative glow */}
                        <div className="absolute -inset-4 bg-[#D4AF37]/20 rounded-3xl blur-3xl -z-10" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <button
        onClick={scrollPrev}
        className="absolute left-8 top-1/2 -translate-y-1/2 z-20 w-14 h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all duration-300 hover:scale-110"
      >
        <ChevronLeft className="w-6 h-6 text-white" />
      </button>

      <button
        onClick={scrollNext}
        className="absolute right-8 top-1/2 -translate-y-1/2 z-20 w-14 h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all duration-300 hover:scale-110"
      >
        <ChevronRight className="w-6 h-6 text-white" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 flex gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => emblaApi?.scrollTo(index)}
            className={`transition-all duration-300 rounded-full ${
              selectedIndex === index
                ? 'w-12 h-3 bg-[#D4AF37]'
                : 'w-3 h-3 bg-white/30 hover:bg-white/50'
            }`}
          />
        ))}
      </div>
    </section>
  );
}
