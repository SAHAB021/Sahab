import { useState, useEffect } from 'react';
import { Save, Loader2, Plus, Trash2, Pencil, X, Eye, EyeOff } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useEmployee } from '@/admin/EmployeeContext';
import { supabase } from '@/lib/supabase';
import ImageUploader from '@/components/ImageUploader';

interface BannerRow {
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

export default function SiteContentManager() {
  const { lang } = useApp();
  const { can } = useEmployee();
  const [tab, setTab] = useState<'banners' | 'settings' | 'legal'>('banners');

  if (!can('company_settings', 'edit') && !can('company_settings', 'manage')) {
    return <div className="p-8 text-center text-base-muted">{lang === 'ar' ? 'لا تملك صلاحية' : 'No permission'}</div>;
  }

  const tabs = [
    { id: 'banners' as const, labelAr: 'البانرات', labelEn: 'Banners' },
    { id: 'settings' as const, labelAr: 'الإعدادات والشعار', labelEn: 'Settings & Logo' },
    { id: 'legal' as const, labelAr: 'الصفحات القانونية', labelEn: 'Legal Pages' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-black text-base-primary mb-1">{lang === 'ar' ? 'إدارة المحتوى' : 'Content Management'}</h1>
        <p className="text-base-muted text-sm">{lang === 'ar' ? 'إدارة البانرات ومعلومات التواصل والصفحات القانونية' : 'Manage banners, contact info, and legal pages'}</p>
      </div>
      <div className="flex gap-1 border-b border-base">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${tab === t.id ? 'border-yellow-accent text-yellow-accent' : 'border-transparent text-base-muted hover:text-base-primary'}`}>
            {lang === 'ar' ? t.labelAr : t.labelEn}
          </button>
        ))}
      </div>
      {tab === 'banners' && <BannerManager lang={lang} />}
      {tab === 'settings' && <SettingsManager lang={lang} />}
      {tab === 'legal' && <LegalPagesManager lang={lang} />}
    </div>
  );
}

function BannerManager({ lang }: { lang: 'ar' | 'en' }) {
  const [banners, setBanners] = useState<BannerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<BannerRow | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const isRtl = lang === 'ar';

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('site_banners').select('*').order('display_order', { ascending: true });
    setBanners((data as BannerRow[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async (banner: BannerRow) => {
    setError('');
    try {
      if (editing?.id) {
        await supabase.from('site_banners').update(banner).eq('id', editing.id);
      } else {
        await supabase.from('site_banners').insert(banner);
      }
      setShowForm(false);
      setEditing(null);
      await load();
    } catch (e: any) { setError(e?.message || 'Failed'); }
  };

  const del = async (id: string) => {
    await supabase.from('site_banners').delete().eq('id', id);
    await load();
  };

  const toggle = async (b: BannerRow) => {
    await supabase.from('site_banners').update({ is_active: !b.is_active }).eq('id', b.id);
    await load();
  };

  const inputClass = 'w-full px-3 py-2.5 rounded-lg bg-base border border-base text-sm text-base-primary focus:border-yellow-accent focus:outline-none transition-colors';
  const labelClass = 'block text-xs font-semibold text-base-muted mb-1.5';

  if (loading) return <div className="text-center py-8 text-base-muted">Loading...</div>;

  return (
    <div className="space-y-4">
      <button onClick={() => { setEditing(null); setShowForm(true); }} className="btn-primary text-sm">
        <Plus size={16} /> {isRtl ? 'إضافة بانر' : 'Add Banner'}
      </button>
      {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-500">{error}</div>}
      <div className="space-y-2">
        {banners.map((b) => (
          <div key={b.id} className="card-industrial p-4 flex items-center gap-4">
            {b.image_url && <div className="w-16 h-12 rounded-lg overflow-hidden bg-black flex-shrink-0"><img src={b.image_url} alt="" className="w-full h-full object-cover" /></div>}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-base-primary text-sm">{isRtl ? b.title_ar : b.title_en || b.title_ar}</div>
              <div className="text-xs text-base-muted truncate">{isRtl ? b.subtitle_ar : b.subtitle_en}</div>
            </div>
            <div className={`px-2 py-1 rounded-md text-xs font-semibold ${b.is_active ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>
              {b.is_active ? (isRtl ? 'مفعّل' : 'Active') : (isRtl ? 'غير مفعّل' : 'Inactive')}
            </div>
            <button onClick={() => toggle(b)} className="p-1.5 rounded-md hover:bg-yellow-accent/10 text-base-muted hover:text-yellow-accent">{b.is_active ? <EyeOff size={14} /> : <Eye size={14} />}</button>
            <button onClick={() => { setEditing(b); setShowForm(true); }} className="p-1.5 rounded-md hover:bg-yellow-accent/10 text-base-muted hover:text-yellow-accent"><Pencil size={14} /></button>
            <button onClick={() => { if (confirm(isRtl ? 'حذف؟' : 'Delete?')) del(b.id); }} className="p-1.5 rounded-md hover:bg-red-500/10 text-base-muted hover:text-red-500"><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
      {showForm && (
        <BannerForm
          banner={editing}
          lang={lang}
          onSave={save}
          onClose={() => { setShowForm(false); setEditing(null); }}
          inputClass={inputClass}
          labelClass={labelClass}
        />
      )}
    </div>
  );
}

function BannerForm({ banner, lang, onSave, onClose, inputClass, labelClass }: any) {
  const [form, setForm] = useState<BannerRow>(banner || {
    id: '', title_ar: '', title_en: '', subtitle_ar: '', subtitle_en: '', image_url: '',
    button_text_ar: '', button_text_en: '', button_link: '#/catalog', is_active: true, display_order: 0,
  });
  const isRtl = lang === 'ar';
  const update = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-elevated rounded-2xl border border-base shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-elevated border-b border-base p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-base-primary">{banner ? (isRtl ? 'تعديل بانر' : 'Edit Banner') : (isRtl ? 'إضافة بانر' : 'Add Banner')}</h2>
          <button onClick={onClose} className="p-2 rounded-lg border border-base text-base-muted hover:text-yellow-accent"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelClass}>{isRtl ? 'العنوان (عربي)' : 'Title (AR)'}</label><input className={inputClass} value={form.title_ar} onChange={(e) => update('title_ar', e.target.value)} /></div>
            <div><label className={labelClass}>{isRtl ? 'العنوان (إنجليزي)' : 'Title (EN)'}</label><input className={inputClass} value={form.title_en} onChange={(e) => update('title_en', e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelClass}>{isRtl ? 'الوصف (عربي)' : 'Subtitle (AR)'}</label><textarea rows={2} className={`${inputClass} resize-none`} value={form.subtitle_ar} onChange={(e) => update('subtitle_ar', e.target.value)} /></div>
            <div><label className={labelClass}>{isRtl ? 'الوصف (إنجليزي)' : 'Subtitle (EN)'}</label><textarea rows={2} className={`${inputClass} resize-none`} value={form.subtitle_en} onChange={(e) => update('subtitle_en', e.target.value)} /></div>
          </div>
          <ImageUploader bucket="equipment-images" images={[]} mainImage={form.image_url} onMainImageChange={(url) => update('image_url', url)} onImagesChange={() => {}} maxImages={0} lang={lang} folder="banners" label={isRtl ? 'صورة البانر' : 'Banner Image'} />
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelClass}>{isRtl ? 'نص الزر (عربي)' : 'Button Text (AR)'}</label><input className={inputClass} value={form.button_text_ar} onChange={(e) => update('button_text_ar', e.target.value)} /></div>
            <div><label className={labelClass}>{isRtl ? 'نص الزر (إنجليزي)' : 'Button Text (EN)'}</label><input className={inputClass} value={form.button_text_en} onChange={(e) => update('button_text_en', e.target.value)} /></div>
          </div>
          <div><label className={labelClass}>{isRtl ? 'رابط الزر' : 'Button Link'}</label><input className={inputClass} value={form.button_link} onChange={(e) => update('button_link', e.target.value)} placeholder="#/catalog" /></div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_active} onChange={(e) => update('is_active', e.target.checked)} className="w-4 h-4 accent-yellow-accent" /><span className="text-sm text-base-primary">{isRtl ? 'مفعّل' : 'Active'}</span></label>
            <div><label className={labelClass}>{isRtl ? 'الترتيب' : 'Order'}</label><input type="number" className={`${inputClass} w-24`} value={form.display_order} onChange={(e) => update('display_order', parseInt(e.target.value) || 0)} /></div>
          </div>
        </div>
        <div className="sticky bottom-0 bg-elevated border-t border-base p-4 flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary text-sm">{isRtl ? 'إلغاء' : 'Cancel'}</button>
          <button onClick={() => onSave(form)} className="btn-primary text-sm">{isRtl ? 'حفظ' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}

function SettingsManager({ lang }: { lang: 'ar' | 'en' }) {
  const [settings, setSettings] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const isRtl = lang === 'ar';

  useEffect(() => {
    supabase.from('site_settings').select('*').eq('id', 1).maybeSingle().then(({ data }) => {
      if (data) setSettings(data);
    });
  }, []);

  const update = (k: string, v: string) => { setSettings((p: any) => ({ ...p, [k]: v })); setSaved(false); };

  const save = async () => {
    setSaving(true);
    await supabase.from('site_settings').update(settings).eq('id', 1);
    setSaving(false);
    setSaved(true);
  };

  if (!settings) return <div className="text-center py-8 text-base-muted">Loading...</div>;

  const inputClass = 'w-full px-3 py-2.5 rounded-lg bg-base border border-base text-sm text-base-primary focus:border-yellow-accent focus:outline-none transition-colors';
  const labelClass = 'block text-xs font-semibold text-base-muted mb-1.5';

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Company names */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-base-primary border-b border-base pb-2">{isRtl ? 'اسم الشركة' : 'Company Name'}</h3>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelClass}>{isRtl ? 'الاسم (عربي)' : 'Name (AR)'}</label><input className={inputClass} value={settings.company_name_ar} onChange={(e) => update('company_name_ar', e.target.value)} /></div>
          <div><label className={labelClass}>{isRtl ? 'الاسم (إنجليزي)' : 'Name (EN)'}</label><input className={inputClass} value={settings.company_name_en} onChange={(e) => update('company_name_en', e.target.value)} /></div>
        </div>
      </div>

      {/* Logos */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-base-primary border-b border-base pb-2">{isRtl ? 'الشعار' : 'Logo'}</h3>
        <ImageUploader bucket="equipment-images" images={[]} mainImage={settings.logo_ar} onMainImageChange={(url) => update('logo_ar', url)} onImagesChange={() => {}} maxImages={0} lang={lang} folder="logos" label={isRtl ? 'الشعار العربي (سحاب)' : 'Arabic Logo'} />
        <ImageUploader bucket="equipment-images" images={[]} mainImage={settings.logo_en} onMainImageChange={(url) => update('logo_en', url)} onImagesChange={() => {}} maxImages={0} lang={lang} folder="logos" label={isRtl ? 'الشعار الإنجليزي (SAHAB)' : 'English Logo'} />
      </div>

      {/* Contact */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-base-primary border-b border-base pb-2">{isRtl ? 'معلومات التواصل' : 'Contact Info'}</h3>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelClass}>{isRtl ? 'الهاتف' : 'Phone'}</label><input className={inputClass} value={settings.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+966500000000" /></div>
          <div><label className={labelClass}>{isRtl ? 'واتساب' : 'WhatsApp'}</label><input className={inputClass} value={settings.whatsapp} onChange={(e) => update('whatsapp', e.target.value)} placeholder="+966500000000" /></div>
        </div>
        <div><label className={labelClass}>{isRtl ? 'البريد الإلكتروني' : 'Email'}</label><input className={inputClass} value={settings.email} onChange={(e) => update('email', e.target.value)} placeholder="info@sahab.com" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelClass}>{isRtl ? 'العنوان (عربي)' : 'Address (AR)'}</label><input className={inputClass} value={settings.address_ar} onChange={(e) => update('address_ar', e.target.value)} /></div>
          <div><label className={labelClass}>{isRtl ? 'العنوان (إنجليزي)' : 'Address (EN)'}</label><input className={inputClass} value={settings.address_en} onChange={(e) => update('address_en', e.target.value)} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelClass}>{isRtl ? 'ساعات العمل (عربي)' : 'Business Hours (AR)'}</label><input className={inputClass} value={settings.business_hours_ar} onChange={(e) => update('business_hours_ar', e.target.value)} /></div>
          <div><label className={labelClass}>{isRtl ? 'ساعات العمل (إنجليزي)' : 'Business Hours (EN)'}</label><input className={inputClass} value={settings.business_hours_en} onChange={(e) => update('business_hours_en', e.target.value)} /></div>
        </div>
        <div><label className={labelClass}>{isRtl ? 'رابط الخريطة' : 'Maps Link'}</label><input className={inputClass} value={settings.maps_link} onChange={(e) => update('maps_link', e.target.value)} placeholder="https://maps.google.com/..." /></div>
      </div>

      {/* Commercial / Registration */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-base-primary border-b border-base pb-2">{isRtl ? 'المعلومات التجارية' : 'Commercial Info'}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className={labelClass}>{isRtl ? 'الاسم التجاري الرسمي (عربي)' : 'Official company name (Arabic)'}</label><input className={inputClass} value={settings.legal_name_ar} onChange={(e) => update('legal_name_ar', e.target.value)} /></div>
          <div><label className={labelClass}>{isRtl ? 'الاسم التجاري الرسمي (إنجليزي)' : 'Official company name (English)'}</label><input className={inputClass} dir="ltr" value={settings.legal_name_en} onChange={(e) => update('legal_name_en', e.target.value)} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelClass}>{isRtl ? 'الرقم الوطني الموحد' : 'Unified National Number'}</label><input className={inputClass} value={settings.unified_number} onChange={(e) => update('unified_number', e.target.value)} /></div>
          <div><label className={labelClass}>{isRtl ? 'رقم السجل التجاري' : 'CR Number'}</label><input className={inputClass} value={settings.cr_number} onChange={(e) => update('cr_number', e.target.value)} /></div>
          <div><label className={labelClass}>{isRtl ? 'الرقم الضريبي' : 'VAT Number'}</label><input className={inputClass} value={settings.vat_number} onChange={(e) => update('vat_number', e.target.value)} /></div>
        </div>
      </div>

      {/* Saudi Business Platform logo */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-base-primary border-b border-base pb-2">{isRtl ? 'منصة الأعمال السعودية' : 'Saudi Business Platform'}</h3>
        <ImageUploader bucket="equipment-images" images={[]} mainImage={settings.business_platform_logo} onMainImageChange={(url) => update('business_platform_logo', url)} onImagesChange={() => {}} maxImages={0} lang={lang} folder="logos" label={isRtl ? 'شعار منصة الأعمال السعودية' : 'Platform Logo'} />
      </div>

      {/* Social media */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-base-primary border-b border-base pb-2">{isRtl ? 'وسائل التواصل الاجتماعي' : 'Social Media'}</h3>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelClass}>{isRtl ? 'فيسبوك' : 'Facebook'}</label><input className={inputClass} value={settings.facebook_url} onChange={(e) => update('facebook_url', e.target.value)} /></div>
          <div><label className={labelClass}>{isRtl ? 'منصة إكس' : 'X'}</label><input className={inputClass} value={settings.twitter_url} onChange={(e) => update('twitter_url', e.target.value)} /></div>
          <div><label className={labelClass}>{isRtl ? 'انستجرام' : 'Instagram'}</label><input className={inputClass} value={settings.instagram_url} onChange={(e) => update('instagram_url', e.target.value)} /></div>
          <div><label className={labelClass}>{isRtl ? 'لينكدإن' : 'LinkedIn'}</label><input className={inputClass} value={settings.linkedin_url} onChange={(e) => update('linkedin_url', e.target.value)} /></div>
          <div><label className={labelClass}>{isRtl ? 'تيك توك' : 'TikTok'}</label><input className={inputClass} value={settings.tiktok_url} onChange={(e) => update('tiktok_url', e.target.value)} /></div>
          <div><label className={labelClass}>{isRtl ? 'سناب شات' : 'Snapchat'}</label><input className={inputClass} value={settings.snapchat_url} onChange={(e) => update('snapchat_url', e.target.value)} /></div>
          <div><label className={labelClass}>{isRtl ? 'يوتيوب' : 'YouTube'}</label><input className={inputClass} value={settings.youtube_url} onChange={(e) => update('youtube_url', e.target.value)} /></div>
        </div>
      </div>

      {/* Copyright text */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-base-primary border-b border-base pb-2">{isRtl ? 'نص حقوق النشر' : 'Copyright Text'}</h3>
        <div><label className={labelClass}>{isRtl ? 'نص عربي (اتركه فارغاً للقيمة الافتراضية)' : 'Arabic Text (empty for default)'}</label><input className={inputClass} value={settings.copyright_text_ar} onChange={(e) => update('copyright_text_ar', e.target.value)} /></div>
        <div><label className={labelClass}>{isRtl ? 'نص إنجليزي (اتركه فارغاً للقيمة الافتراضية)' : 'English Text (empty for default)'}</label><input className={inputClass} value={settings.copyright_text_en} onChange={(e) => update('copyright_text_en', e.target.value)} /></div>
      </div>

      <div className="flex items-center gap-3 sticky bottom-0 bg-elevated py-3 -mx-5 px-5 border-t border-base">
        <button onClick={save} disabled={saving} className="btn-primary text-sm flex items-center gap-2">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {isRtl ? 'حفظ' : 'Save'}
        </button>
        {saved && <span className="text-sm text-green-500">{isRtl ? 'تم الحفظ' : 'Saved'}</span>}
      </div>
    </div>
  );
}

function LegalPagesManager({ lang }: { lang: 'ar' | 'en' }) {
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any>(null);
  const isRtl = lang === 'ar';

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('legal_pages').select('*').order('display_order', { ascending: true });
    setPages(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async (page: any) => {
    await supabase.from('legal_pages').update({
      title_ar: page.title_ar, title_en: page.title_en,
      content_ar: page.content_ar, content_en: page.content_en,
      is_active: page.is_active, display_order: page.display_order,
    }).eq('id', page.id);
    setEditing(null);
    await load();
  };

  const toggle = async (p: any) => {
    await supabase.from('legal_pages').update({ is_active: !p.is_active }).eq('id', p.id);
    await load();
  };

  const inputClass = 'w-full px-3 py-2.5 rounded-lg bg-base border border-base text-sm text-base-primary focus:border-yellow-accent focus:outline-none transition-colors';
  const labelClass = 'block text-xs font-semibold text-base-muted mb-1.5';

  if (loading) return <div className="text-center py-8 text-base-muted">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {pages.map((p) => (
          <div key={p.id} className="card-industrial p-4 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-base-primary text-sm">{isRtl ? p.title_ar : p.title_en}</div>
              <div className="text-xs text-base-muted">{isRtl ? p.title_en : p.title_ar}</div>
            </div>
            <div className={`px-2 py-1 rounded-md text-xs font-semibold ${p.is_active ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>
              {p.is_active ? (isRtl ? 'مفعّل' : 'Active') : (isRtl ? 'غير مفعّل' : 'Inactive')}
            </div>
            <button onClick={() => toggle(p)} className="p-1.5 rounded-md hover:bg-yellow-accent/10 text-base-muted hover:text-yellow-accent">{p.is_active ? <EyeOff size={14} /> : <Eye size={14} />}</button>
            <button onClick={() => setEditing(p)} className="p-1.5 rounded-md hover:bg-yellow-accent/10 text-base-muted hover:text-yellow-accent"><Pencil size={14} /></button>
          </div>
        ))}
      </div>
      {editing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-elevated rounded-2xl border border-base shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-elevated border-b border-base p-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-base-primary">{isRtl ? 'تعديل صفحة' : 'Edit Page'}</h2>
              <button onClick={() => setEditing(null)} className="p-2 rounded-lg border border-base text-base-muted hover:text-yellow-accent"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelClass}>{isRtl ? 'العنوان (عربي)' : 'Title (AR)'}</label><input className={inputClass} value={editing.title_ar} onChange={(e) => setEditing({ ...editing, title_ar: e.target.value })} /></div>
                <div><label className={labelClass}>{isRtl ? 'العنوان (إنجليزي)' : 'Title (EN)'}</label><input className={inputClass} value={editing.title_en} onChange={(e) => setEditing({ ...editing, title_en: e.target.value })} /></div>
              </div>
              <div><label className={labelClass}>{isRtl ? 'المحتوى (عربي)' : 'Content (AR)'}</label><textarea rows={8} className={`${inputClass} resize-none font-mono text-xs`} value={editing.content_ar} onChange={(e) => setEditing({ ...editing, content_ar: e.target.value })} /></div>
              <div><label className={labelClass}>{isRtl ? 'المحتوى (إنجليزي)' : 'Content (EN)'}</label><textarea rows={8} className={`${inputClass} resize-none font-mono text-xs`} value={editing.content_en} onChange={(e) => setEditing({ ...editing, content_en: e.target.value })} /></div>
            </div>
            <div className="sticky bottom-0 bg-elevated border-t border-base p-4 flex justify-end gap-3">
              <button onClick={() => setEditing(null)} className="btn-secondary text-sm">{isRtl ? 'إلغاء' : 'Cancel'}</button>
              <button onClick={() => save(editing)} className="btn-primary text-sm">{isRtl ? 'حفظ' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
