import {
  Phone, Mail, MapPin, Clock, MessageCircle, FileText,
  Facebook, Instagram, Linkedin, Youtube, ArrowRight, ShieldCheck, Ghost,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useSiteContent } from '@/contexts/SiteContentContext';

function XIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export default function Footer() {
  const { t, lang, dir } = useApp();
  const { settings, legalPages } = useSiteContent();
  const isRtl = lang === 'ar';

  const companyName = isRtl ? (settings?.company_name_ar || 'سحاب') : (settings?.company_name_en || 'SAHAB');
  const companyFullNameAr = settings?.legal_name_ar?.trim() || t.footer.companyNameAr;
  const companyFullNameEn = settings?.legal_name_en?.trim() || t.footer.companyNameEn;
  const companyDesc = isRtl
    ? 'تأجير المعدات الثقيلة وخدمات المقاولات والإنشاءات للمشاريع الصناعية والتجارية'
    : 'Heavy equipment rental and contracting services for industrial and commercial projects';

  const logoUrl = isRtl ? (settings?.logo_ar || '') : (settings?.logo_en || '');
  const businessPlatformLogo = settings?.business_platform_logo || '';

  const phone = settings?.phone || '';
  const whatsapp = settings?.whatsapp || '';
  const email = settings?.email || '';
  const addressAr = settings?.address_ar || '';
  const addressEn = settings?.address_en || '';
  const address = isRtl ? addressAr : addressEn;
  const businessHours = isRtl ? (settings?.business_hours_ar || '') : (settings?.business_hours_en || '');
  const mapsLink = settings?.maps_link || '';
  const unifiedNumber = settings?.unified_number || '';
  // Hide the CR line when it repeats the unified number.
  const crNumber = settings?.cr_number && settings.cr_number !== unifiedNumber ? settings.cr_number : '';
  const vatNumber = settings?.vat_number || '';

  const navItems = [
    { label: t.nav.home, href: '#home' },
    { label: t.nav.equipment, href: '#/catalog' },
    { label: isRtl ? 'المقاولات والإنشاءات' : 'Contracting & Construction', href: '#/services/contracting' },
    { label: isRtl ? 'حسابي' : 'My Account', href: '#/account' },
  ];

  // Only link pages that actually have content, so visitors never land on an empty page.
  const activeLegalPages = legalPages.filter((p) => p.is_active && (p.content_ar?.trim() || p.content_en?.trim()));

  const socials = [
    { icon: MessageCircle, url: whatsapp ? `https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}` : '' },
    { icon: Instagram, url: settings?.instagram_url },
    { icon: Youtube, url: settings?.youtube_url },
    { icon: Facebook, url: settings?.facebook_url },
    { icon: Linkedin, url: settings?.linkedin_url },
    { icon: XIcon, url: settings?.twitter_url },
  ].filter((s) => s.url);

  const followLinks = [
    { icon: XIcon, label: isRtl ? 'منصة إكس' : 'X', url: settings?.twitter_url },
    { icon: Linkedin, label: isRtl ? 'لينكدإن' : 'LinkedIn', url: settings?.linkedin_url },
    { icon: Ghost, label: isRtl ? 'سناب شات' : 'Snapchat', url: settings?.snapchat_url },
  ].filter((s) => s.url);

  const copyrightText = isRtl
    ? (settings?.copyright_text_ar || t.footer.copyright)
    : (settings?.copyright_text_en || t.footer.copyright);
  const rightsText = t.footer.rights;

  const contactCtaHref = '#contact';
  const contactCtaLabel = isRtl ? 'تواصل مع فريق سحاب' : 'Contact SAHAB Team';

  return (
    <footer className="bg-elevated border-t border-base" dir={dir}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-12">
        {/* Main grid — 4 columns on desktop, stacked on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {/* Column 1: SAHAB brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <img src="/logo.png" alt="" aria-hidden="true" className="w-11 h-11 object-contain shrink-0" />
                </div>
              <div className="flex flex-col leading-none">
                {logoUrl ? (
                  <img src={logoUrl} alt={companyName} className="h-7 w-auto object-contain" />
                ) : (
                  <>
                    <span className="text-xl font-black text-base-primary tracking-tight">{companyName}</span>
                    <span className="text-[0.6rem] text-base-muted font-medium tracking-wider">
                      {isRtl ? 'معدات ومقاولات' : 'EQUIPMENT & CONTRACTING'}
                    </span>
                  </>
                )}
              </div>
            </div>
            <p className="text-sm text-base-muted leading-relaxed">{companyDesc}</p>
            {socials.length > 0 && (
              <div className="flex gap-2 pt-1">
                {socials.map((s, i) => (
                  <a
                    key={i}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-lg border border-base flex items-center justify-center text-base-muted hover:border-yellow-accent hover:text-yellow-accent transition-all"
                  >
                    <s.icon size={15} />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-base-primary uppercase tracking-wider">
              {isRtl ? 'روابط سريعة' : 'Quick Links'}
            </h4>
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="text-sm text-base-muted hover:text-yellow-accent transition-colors">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Contact */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-base-primary uppercase tracking-wider">
              {isRtl ? 'تواصل معنا' : 'Contact Us'}
            </h4>
            <ul className="space-y-2.5">
              {phone && (
                <li>
                  <a href={`tel:${phone}`} className="flex items-center gap-2.5 text-sm text-base-muted hover:text-yellow-accent transition-colors">
                    <Phone size={15} className="text-yellow-accent flex-shrink-0" />
                    <span dir="ltr">{phone}</span>
                  </a>
                </li>
              )}
              {whatsapp && (
                <li>
                  <a href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-sm text-base-muted hover:text-yellow-accent transition-colors">
                    <MessageCircle size={15} className="text-yellow-accent flex-shrink-0" />
                    <span dir="ltr">{whatsapp}</span>
                  </a>
                </li>
              )}
              {email && (
                <li>
                  <a href={`mailto:${email}`} className="flex items-center gap-2.5 text-sm text-base-muted hover:text-yellow-accent transition-colors">
                    <Mail size={15} className="text-yellow-accent flex-shrink-0" />
                    <span>{email}</span>
                  </a>
                </li>
              )}
              {(address || settings) && (
                <li>
                  {mapsLink ? (
                    <a href={mapsLink} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2.5 text-sm text-base-muted hover:text-yellow-accent transition-colors">
                      <MapPin size={15} className="text-yellow-accent flex-shrink-0 mt-0.5" />
                      <span>{address || t.footer.country}</span>
                    </a>
                  ) : (
                    <div className="flex items-start gap-2.5 text-sm text-base-muted">
                      <MapPin size={15} className="text-yellow-accent flex-shrink-0 mt-0.5" />
                      <span>{address || t.footer.country}</span>
                    </div>
                  )}
                </li>
              )}
              {businessHours && (
                <li>
                  <div className="flex items-start gap-2.5 text-sm text-base-muted">
                    <Clock size={15} className="text-yellow-accent flex-shrink-0 mt-0.5" />
                    <span>{businessHours}</span>
                  </div>
                </li>
              )}
            </ul>
            {/* CTA button */}
            <a href={contactCtaHref} className="inline-flex items-center gap-2 mt-3 px-4 py-2.5 rounded-lg bg-yellow-accent text-black text-sm font-bold hover:bg-yellow-accent/90 transition-colors">
              {contactCtaLabel}
              <ArrowRight size={15} className={isRtl ? 'rotate-180' : ''} />
            </a>
          </div>

          {/* Column 4: Company Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-base-primary uppercase tracking-wider">
              {isRtl ? 'معلومات الشركة' : 'Company Info'}
            </h4>
            <ul className="space-y-2">
              <li className="text-sm text-base-muted">
                {isRtl ? 'الاسم التجاري' : 'Company Name'}:
                <span className="text-base-primary block text-sm font-semibold mt-0.5" lang="ar" dir="rtl" style={{ textAlign: isRtl ? 'right' : 'left' }}>{companyFullNameAr}</span>
                <span className="text-base-primary block text-sm font-semibold mt-0.5" lang="en" dir="ltr" style={{ textAlign: isRtl ? 'right' : 'left' }}>{companyFullNameEn}</span>
              </li>
              {unifiedNumber && (
                <li className="text-sm text-base-muted">
                  {isRtl ? 'الرقم الوطني الموحد' : 'Unified National Number'}:
                  <span className="text-base-primary block text-sm font-semibold mt-0.5 tabular-nums"><bdi dir="ltr">{unifiedNumber}</bdi></span>
                </li>
              )}
              {crNumber && (
                <li className="text-sm text-base-muted">
                  {isRtl ? 'رقم السجل التجاري' : 'CR Number'}:
                  <span className="text-base-primary block text-sm font-semibold mt-0.5 tabular-nums"><bdi dir="ltr">{crNumber}</bdi></span>
                </li>
              )}
              {vatNumber && (
                <li className="text-sm text-base-muted">
                  {isRtl ? 'الرقم الضريبي' : 'VAT Number'}:
                  <span className="text-base-primary block text-sm font-semibold mt-0.5 tabular-nums"><bdi dir="ltr">{vatNumber}</bdi></span>
                </li>
              )}
            </ul>
            {/* Saudi Business Platform logo */}
            {businessPlatformLogo && (
              <div className="pt-2">
                <p className="text-xs text-base-muted mb-1.5">{isRtl ? 'منصة الأعمال السعودية' : 'Saudi Business Platform'}</p>
                <img
                  src={businessPlatformLogo}
                  alt={isRtl ? 'منصة الأعمال السعودية' : 'Saudi Business Platform'}
                  className="max-h-16 w-auto object-contain opacity-80"
                />
              </div>
            )}
            {/* Country */}
            <div className="text-sm text-base-muted flex items-center gap-1.5 pt-1">
              <ShieldCheck size={14} className="text-yellow-accent flex-shrink-0" />
              {t.footer.country}
            </div>
          </div>
        </div>

        {/* Legal links bar */}
        {activeLegalPages.length > 0 && (
          <div className="mt-8 pt-6 border-t border-base">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <span className="text-xs font-bold text-base-muted uppercase tracking-wider">
                {isRtl ? 'الصفحات القانونية' : 'Legal'}:
              </span>
              {activeLegalPages.map((page) => (
                <a
                  key={page.id}
                  href={`#/legal/${page.id}`}
                  className="text-xs text-base-muted hover:text-yellow-accent transition-colors flex items-center gap-1"
                >
                  <FileText size={11} />
                  {isRtl ? page.title_ar : page.title_en}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Follow us bar */}
        {followLinks.length > 0 && (
          <div className="mt-6 pt-5 border-t border-base">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              <span className="text-xs font-bold text-base-muted uppercase tracking-wider">
                {isRtl ? 'تابعنا' : 'Follow us'}:
              </span>
              {followLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-base-muted hover:text-yellow-accent transition-colors"
                >
                  <link.icon size={15} />
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Copyright bar */}
        <div className="mt-6 pt-5 border-t border-base">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-base-muted text-center sm:text-start">
              {copyrightText} — {rightsText}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
