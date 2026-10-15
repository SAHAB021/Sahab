import { useEffect, useState } from 'react';
import { Menu, X, Sun, Moon, Globe, ArrowRight, UserCircle, LayoutDashboard } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useSiteContent } from '@/contexts/SiteContentContext';
import { supabase } from '@/lib/supabase';

export default function Header() {
  const { t, lang, toggleLang, theme, toggleTheme, dir } = useApp();
  const { settings } = useSiteContent();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [isStaff, setIsStaff] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeHref, setActiveHref] = useState(() => (window.location.hash.startsWith('#/') ? '' : '#home'));

  useEffect(() => {
    // The dashboard button is only shown to signed-in, active staff (the dashboard itself
    // is protected separately by the admin login and database permissions).
    const applySession = (hasSession: boolean) => {
      setAuthed(hasSession);
      if (!hasSession) {
        setIsStaff(false);
        return;
      }
      supabase.rpc('is_staff').then(({ data, error }) => setIsStaff(!error && data === true));
    };
    supabase.auth.getSession().then(({ data: { session } }) => applySession(!!session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => applySession(!!session));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Highlight the nav link of the section currently on screen (home page),
  // or of the current route (catalog / services pages).
  useEffect(() => {
    const updateFromHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/catalog')) setActiveHref('#/catalog');
      // Services now live under "Contracting & Construction"
      else if (hash.startsWith('#/services')) setActiveHref('#/services/contracting');
      else if (hash.startsWith('#/')) setActiveHref('');
    };
    updateFromHash();
    window.addEventListener('hashchange', updateFromHash);

    const ids = ['home'];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActiveHref(`#${e.target.id}`);
        }
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => {
      window.removeEventListener('hashchange', updateFromHash);
      io.disconnect();
    };
  }, []);

  // Lock page scroll and allow Escape to close while the mobile menu is open.
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMobileOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [mobileOpen]);

  const navItems = [
    { label: t.nav.home, href: '#home' },
    { label: t.nav.equipment, href: '#/catalog' },
    { label: lang === 'ar' ? 'المقاولات والإنشاءات' : 'Contracting & Construction', href: '#/services/contracting' },
  ];

  return (
    <>
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled || mobileOpen
          ? 'bg-elevated/90 backdrop-blur-xl border-b border-base shadow-lg'
          : 'header-over-hero'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 lg:gap-6 h-16 lg:h-20">
          {/* Logo */}
          <a href="#home" className="flex items-center gap-2 group min-w-0 shrink">
            <div className="relative">
              <img src="/logo.png" alt="" aria-hidden="true" className="w-10 h-10 lg:w-12 lg:h-12 transition-transform group-hover:scale-105 object-contain shrink-0 rounded-lg" />
            </div>
            <div className="flex flex-col leading-none min-w-0">
              {lang === 'ar' && settings?.logo_ar ? (
                <img src={settings.logo_ar} alt="سحاب" className="h-7 lg:h-9 w-auto object-contain" />
              ) : lang === 'en' && settings?.logo_en ? (
                <img src={settings.logo_en} alt="SAHAB" className="h-7 lg:h-9 w-auto object-contain" />
              ) : (
                <>
                  <span className="text-xl lg:text-2xl font-black text-base-primary tracking-tight truncate max-w-[9rem] sm:max-w-[14rem] lg:max-w-[12rem] xl:max-w-[16rem]">
                    {lang === 'ar' ? (settings?.company_name_ar || 'سحاب') : (settings?.company_name_en || 'SAHAB')}
                  </span>
                  <span className="hidden min-[380px]:block text-[0.6rem] lg:text-xs text-base-muted font-medium tracking-wider whitespace-nowrap">
                    {lang === 'ar' ? 'معدات ومقاولات' : 'EQUIPMENT & CONTRACTING'}
                  </span>
                </>
              )}
            </div>
          </a>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-0.5 xl:gap-2" aria-label={lang === 'ar' ? 'القائمة الرئيسية' : 'Main navigation'}>
            {navItems.map((item) => {
              const active = activeHref === item.href;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`relative px-2 xl:px-3 py-2 text-sm font-semibold whitespace-nowrap transition-colors group ${
                    active ? 'text-yellow-accent' : scrolled ? 'text-base-muted hover:text-base-primary' : 'hero-nav-link'
                  }`}
                >
                  {item.label}
                  <span
                    className={`absolute bottom-0 inset-x-2 xl:inset-x-3 h-0.5 bg-yellow-accent origin-center transition-transform duration-300 ${
                      active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                    }`}
                  />
                </a>
              );
            })}
          </nav>

          {/* Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 shrink-0">
            {/* Language toggle */}
            <button
              onClick={toggleLang}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-base hover:border-yellow-accent text-base-muted hover:text-yellow-accent transition-all text-sm font-semibold"
              aria-label="Toggle language"
            >
              <Globe size={16} />
              <span>{lang === 'ar' ? 'EN' : 'ع'}</span>
            </button>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-base hover:border-yellow-accent text-base-muted hover:text-yellow-accent transition-all"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Dashboard link: staff only */}
            {isStaff && (
              <a
                href="#/admin"
                title={lang === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
                aria-label={lang === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg border border-yellow-accent/60 bg-yellow-accent/10 text-yellow-accent hover:bg-yellow-accent hover:text-black transition-all text-sm font-bold"
              >
                <LayoutDashboard size={18} />
                <span className="hidden md:inline lg:hidden 2xl:inline">{lang === 'ar' ? 'لوحة التحكم' : 'Dashboard'}</span>
              </a>
            )}

            {/* Account link */}
            <a
              href="#/account"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-base hover:border-yellow-accent text-base-muted hover:text-yellow-accent transition-all text-sm font-semibold"
            >
              <UserCircle size={18} />
              <span className="hidden sm:inline">{authed ? (lang === 'ar' ? 'حسابي' : 'My Account') : (lang === 'ar' ? 'تسجيل الدخول' : 'Login')}</span>
            </a>

            {/* CTA */}
            <a
              href="#/catalog"
              className="hidden sm:inline-flex lg:hidden xl:inline-flex btn-primary text-sm"
            >
              {t.cta.orderEquipment}
              <ArrowRight size={16} className={dir === 'rtl' ? 'rotate-180' : ''} />
            </a>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-lg border border-base text-base-primary"
              aria-label="Menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Scroll progress */}
      <div className="absolute bottom-0 inset-x-0 h-0.5 pointer-events-none">
        <div
          className="h-full bg-yellow-accent origin-left rtl:origin-right transition-transform duration-150"
          style={{ transform: `scaleX(${progress})` }}
        />
      </div>

    </header>

      {/* Mobile nav: full-height panel */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-x-0 top-16 bottom-0 z-40 bg-elevated animate-fade-in overflow-y-auto">
          <nav className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-1">
            {isStaff && (
              <a
                href="#/admin"
                onClick={() => setMobileOpen(false)}
                className="menu-item-in flex items-center gap-2 px-4 py-4 mb-2 text-lg font-bold rounded-xl border-2 border-yellow-accent/60 bg-yellow-accent/10 text-yellow-accent"
              >
                <LayoutDashboard size={20} />
                {lang === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
              </a>
            )}
            {navItems.map((item, i) => {
              const active = activeHref === item.href;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`menu-item-in flex items-center justify-between px-4 py-4 text-lg font-bold rounded-xl transition-all border ${
                    active ? 'text-yellow-accent border-yellow-accent/40 bg-yellow-accent/5' : 'text-base-primary border-transparent hover:border-base'
                  }`}
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  {item.label}
                  <ArrowRight size={18} className={`text-base-muted ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                </a>
              );
            })}
            <a
              href="#/account"
              onClick={() => setMobileOpen(false)}
              className="menu-item-in px-4 py-4 text-lg font-bold text-base-primary rounded-xl border border-transparent hover:border-base transition-all flex items-center gap-2"
              style={{ animationDelay: `${navItems.length * 0.05}s` }}
            >
              <UserCircle size={20} />
              {authed ? (lang === 'ar' ? 'حسابي' : 'My Account') : (lang === 'ar' ? 'تسجيل الدخول' : 'Login')}
            </a>
            <a
              href="#/catalog"
              onClick={() => setMobileOpen(false)}
              className="menu-item-in btn-primary mt-4 justify-center text-base"
              style={{ animationDelay: `${(navItems.length + 1) * 0.05}s` }}
            >
              {t.cta.orderEquipment}
            </a>
          </nav>
        </div>
      )}
    </>
  );
}
