import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { LEGAL_ENGLISH_FALLBACK } from '@/content/legalEnglish';

export interface SiteBanner {
  id: string;
  title_ar: string;
  title_en: string;
  subtitle_ar: string;
  subtitle_en: string;
  image_url: string;
  button_text_ar: string;
  button_text_en: string;
  button_link: string;
  is_active: boolean;
  display_order: number;
}

export interface SiteSettings {
  company_name_ar: string;
  company_name_en: string;
  /** Official registered name, shown in both languages in the footer. */
  legal_name_ar: string;
  legal_name_en: string;
  phone: string;
  whatsapp: string;
  email: string;
  address_ar: string;
  address_en: string;
  business_hours_ar: string;
  business_hours_en: string;
  maps_link: string;
  facebook_url: string;
  twitter_url: string;
  instagram_url: string;
  linkedin_url: string;
  tiktok_url: string;
  snapchat_url: string;
  youtube_url: string;
  cr_number: string;
  unified_number: string;
  vat_number: string;
  logo_ar: string;
  logo_en: string;
  business_platform_logo: string;
  copyright_text_ar: string;
  copyright_text_en: string;
}

export interface LegalPage {
  id: string;
  title_ar: string;
  title_en: string;
  content_ar: string;
  content_en: string;
  is_active: boolean;
  display_order: number;
}

interface SiteContentValue {
  banner: SiteBanner | null;
  banners: SiteBanner[];
  settings: SiteSettings | null;
  legalPages: LegalPage[];
  loading: boolean;
  reload: () => Promise<void>;
}

const SiteContentContext = createContext<SiteContentValue | undefined>(undefined);

const defaultSettings: SiteSettings = {
  company_name_ar: 'سحاب',
  company_name_en: 'SAHAB',
  legal_name_ar: '',
  legal_name_en: '',
  phone: '',
  whatsapp: '',
  email: '',
  address_ar: '',
  address_en: '',
  business_hours_ar: '',
  business_hours_en: '',
  maps_link: '',
  facebook_url: '',
  twitter_url: '',
  instagram_url: '',
  linkedin_url: '',
  tiktok_url: '',
  snapchat_url: '',
  youtube_url: '',
  cr_number: '',
  unified_number: '',
  vat_number: '',
  logo_ar: '',
  logo_en: '',
  business_platform_logo: '',
  copyright_text_ar: '',
  copyright_text_en: '',
};

export function SiteContentProvider({ children }: { children: ReactNode }) {
  const [banners, setBanners] = useState<SiteBanner[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [legalPages, setLegalPages] = useState<LegalPage[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [bannerRes, settingsRes, legalRes] = await Promise.all([
        supabase.from('site_banners').select('*').order('display_order', { ascending: true }),
        supabase.from('site_settings').select('*').eq('id', 1).maybeSingle(),
        supabase.from('legal_pages').select('*').order('display_order', { ascending: true }),
      ]);
      if (bannerRes.data) setBanners(bannerRes.data as SiteBanner[]);
      setSettings((settingsRes.data as SiteSettings) || defaultSettings);
      if (legalRes.data) {
        setLegalPages(
          (legalRes.data as LegalPage[]).map((p) =>
            p.content_en?.trim() || !LEGAL_ENGLISH_FALLBACK[p.id] ? p : { ...p, content_en: LEGAL_ENGLISH_FALLBACK[p.id] },
          ),
        );
      }
    } catch {
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const activeBanners = banners.filter((b) => b.is_active);
  const banner = activeBanners[0] || null;

  return (
    <SiteContentContext.Provider
      value={{ banner, banners: activeBanners, settings, legalPages, loading, reload: load }}
    >
      {children}
    </SiteContentContext.Provider>
  );
}

export function useSiteContent() {
  const ctx = useContext(SiteContentContext);
  if (!ctx) throw new Error('useSiteContent must be used within SiteContentProvider');
  return ctx;
}
