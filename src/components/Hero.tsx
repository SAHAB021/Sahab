import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ChevronLeft } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useSiteContent } from '@/contexts/SiteContentContext';
import { responsiveSrcSet } from '@/components/SafeImage';

/** Counts the numeric part of a stat (e.g. "+10") up from zero once visible. */
function CountUp({ value }: { value: string }) {
  const match = value.match(/^(\D*)(\d+)(\D*)$/);
  const ref = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState(match ? 0 : null);

  useEffect(() => {
    if (!match || !ref.current) return;
    const target = parseInt(match[2], 10);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setN(target);
      return;
    }
    let raf = 0;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / 1600);
        setN(Math.round(target * (1 - Math.pow(1 - t, 3))));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    io.observe(ref.current);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!match) return <span ref={ref}>{value}</span>;
  return <span ref={ref}>{match[1]}{n}{match[3]}</span>;
}

/** Splits a headline into words that rise in one after another. */
function RevealWords({ text, baseDelay = 0.15 }: { text: string; baseDelay?: number }) {
  return (
    <>
      {text.split(/\s+/).filter(Boolean).map((word, i) => (
        <span key={`${word}-${i}`} className="word-mask">
          <span style={{ animationDelay: `${baseDelay + i * 0.09}s` }}>{word}</span>
          {'\u00A0'}
        </span>
      ))}
    </>
  );
}

export default function Hero() {
  const { t, dir, lang } = useApp();
  const { banner, settings } = useSiteContent();
  const sectionRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const spotRef = useRef<HTMLDivElement>(null);

  // Parallax: background drifts slower than the page, content fades as it leaves.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        const h = window.innerHeight;
        if (y > h * 1.2) return;
        if (bgRef.current) bgRef.current.style.transform = `translate3d(0, ${y * 0.35}px, 0)`;
        if (contentRef.current) {
          contentRef.current.style.transform = `translate3d(0, ${y * 0.15}px, 0)`;
          contentRef.current.style.opacity = String(Math.max(0, 1 - y / (h * 0.8)));
        }
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Soft yellow light that follows the cursor (mouse devices only).
  const onPointerMove = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse' || !spotRef.current || !sectionRef.current) return;
    const r = sectionRef.current.getBoundingClientRect();
    spotRef.current.style.opacity = '1';
    spotRef.current.style.background = `radial-gradient(600px circle at ${e.clientX - r.left}px ${e.clientY - r.top}px, rgba(255, 209, 0, 0.12), transparent 60%)`;
  };

  const heroImage = banner?.image_url || 'https://images.pexels.com/photos/33870733/pexels-photo-33870733.jpeg?auto=compress&cs=tinysrgb&w=1920';
  const headline = banner?.title_ar || banner?.title_en || t.hero.headline;
  const subtext = banner?.subtitle_ar || banner?.subtitle_en || t.hero.subtext;
  const primaryCtaText = banner?.button_text_ar || banner?.button_text_en || t.hero.primaryCta;
  const primaryCtaLink = banner?.button_link || '#/catalog';
  const secondaryCtaText = settings?.whatsapp
    ? (lang === 'ar' ? 'تواصل مع فريق سحاب' : 'Contact SAHAB Team')
    : t.hero.secondaryCta;
  const secondaryCtaLink = settings?.whatsapp
    ? `https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, '')}`
    : '#contact';

  return (
    <section
      id="home"
      ref={sectionRef}
      onPointerMove={onPointerMove}
      onPointerLeave={() => spotRef.current && (spotRef.current.style.opacity = '0')}
      className="relative min-h-[100svh] flex items-center overflow-hidden hero-bg"
    >
      <div ref={bgRef} className="absolute inset-0 z-0 will-change-transform">
        <img src={heroImage} srcSet={responsiveSrcSet(heroImage)} sizes="100vw" alt="" decoding="async" className="w-full h-full object-cover hero-kenburns" />
        <div className="absolute inset-0 hero-shade-side" />
        <div className="absolute inset-0 hero-shade-bottom" />
      </div>
      <div className="absolute inset-0 z-0 industrial-pattern opacity-30" />
      <div className="absolute inset-0 z-0 vignette" />
      <div className="absolute inset-0 z-0 film-grain" />
      <div ref={spotRef} className="absolute inset-0 z-0 pointer-events-none opacity-0 transition-opacity duration-500" />
      <div ref={contentRef} className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-24 pb-16 will-change-transform">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-yellow-accent/30 bg-yellow-accent/10 backdrop-blur-sm mb-6 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-yellow-accent animate-pulse" />
            <span className="text-yellow-accent text-sm font-semibold tracking-wide">{t.hero.badge}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black hero-text leading-[1.15] tracking-tight mb-6">
            <RevealWords text={lang === 'ar' ? (banner?.title_ar || headline) : (banner?.title_en || headline)} />
          </h1>
          <p className="text-lg lg:text-xl hero-text-soft leading-relaxed mb-8 max-w-xl animate-fade-in-up delay-200">
            {lang === 'ar' ? (banner?.subtitle_ar || subtext) : (banner?.subtitle_en || subtext)}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up delay-300">
            <a href={primaryCtaLink} className="btn-primary group">
              {lang === 'ar' ? (banner?.button_text_ar || primaryCtaText) : (banner?.button_text_en || primaryCtaText)}
              <ArrowRight size={18} className={`transition-transform group-hover:translate-x-1 ${dir === 'rtl' ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
            </a>
            <a href={secondaryCtaLink} target={settings?.whatsapp ? '_blank' : undefined} rel={settings?.whatsapp ? 'noopener noreferrer' : undefined} className="btn-secondary group">
              {secondaryCtaText}
              <ChevronLeft size={18} className={`transition-transform group-hover:-translate-x-1 ${dir === 'rtl' ? 'rotate-180 group-hover:translate-x-1' : ''}`} />
            </a>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:gap-6 mt-16 pt-8 border-t hero-line animate-fade-in-up delay-500">
            {t.company.stats.map((stat, i) => (
              <div key={i}>
                <div className="text-lg min-[400px]:text-xl sm:text-2xl lg:text-3xl font-black text-yellow-accent mb-1 tabular-nums break-words"><CountUp value={stat.value} /></div>
                <div className="text-xs lg:text-sm hero-text-faint font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <a href="#equipment" aria-label={lang === 'ar' ? 'انتقل للأسفل' : 'Scroll down'} className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 hidden lg:flex flex-col items-center gap-2 animate-fade-in delay-600">
        <div className="w-6 h-10 rounded-full border-2 hero-line flex items-start justify-center p-1.5">
          <div className="w-1 h-2 rounded-full bg-yellow-accent animate-bounce" />
        </div>
      </a>
    </section>
  );
}
