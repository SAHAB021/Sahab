import { useState } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, ArrowUp, ArrowDown, X } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useAdmin } from '../AdminContext';
import type { AdminBrandRow } from '@/catalog/catalogApi';
import ImageUploader from '@/components/ImageUploader';
import SafeImage from '@/components/SafeImage';

function createEmptyBrand(): AdminBrandRow {
  return {
    id: '',
    name_ar: '',
    name_en: '',
    display_order: 0,
    hidden: false,
    logo: '',
  };
}

export default function BrandManager() {
  const { lang, dir } = useApp();
  const {
    brands, models,
    addBrand, updateBrand, deleteBrand, toggleBrandHidden, reorderBrand,
  } = useAdmin();

  const [showForm, setShowForm] = useState(false);
  const [editingBrand, setEditingBrand] = useState<AdminBrandRow | null>(null);
  const [form, setForm] = useState<AdminBrandRow>(createEmptyBrand());
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const openAdd = () => { setEditingBrand(null); setForm(createEmptyBrand()); setError(''); setShowForm(true); };
  const openEdit = (brand: AdminBrandRow) => { setEditingBrand(brand); setForm({ ...brand, logo: brand.logo || '' }); setError(''); setShowForm(true); };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const { id: _id, ...payload } = form;
      if (editingBrand) {
        await updateBrand(editingBrand.id, payload);
      } else {
        await addBrand(payload);
      }
      setShowForm(false);
    } catch (e: any) {
      setError(e?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const count = models.filter((m) => m.brand_id === id).length;
    if (count > 0) {
      setError(lang === 'ar'
        ? `لا يمكن حذف هذه الماركة لأنها مرتبطة بـ ${count} موديل. احذف الموديلات أو انقلها لماركة أخرى أولاً، أو استخدم زر الإخفاء.`
        : `This brand has ${count} models, so it can't be deleted. Delete or move its models first, or hide the brand instead.`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!confirm(lang === 'ar' ? 'حذف هذه الماركة نهائياً؟' : 'Delete this brand permanently?')) return;
    try {
      setError('');
      await deleteBrand(id);
    } catch (e: any) {
      setError(e?.message || 'Failed to delete');
    }
  };

  const handleToggleHidden = async (brand: AdminBrandRow) => {
    try {
      setError('');
      await toggleBrandHidden(brand.id, !brand.hidden);
    } catch (e: any) {
      setError(e?.message || 'Failed to toggle');
    }
  };

  const handleReorder = async (id: string, d: 'up' | 'down') => {
    try {
      setError('');
      await reorderBrand(id, d);
    } catch (e: any) {
      setError(e?.message || 'Failed to reorder');
    }
  };

  const update = <K extends keyof AdminBrandRow>(key: K, value: AdminBrandRow[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const sorted = [...brands].sort((a, b) => a.display_order - b.display_order);
  const getModelCount = (brandId: string) => models.filter((m) => m.brand_id === brandId).length;

  const inputClass = 'w-full px-3 py-2.5 rounded-lg bg-base border border-base text-sm text-base-primary focus:border-yellow-accent focus:outline-none transition-colors';
  const labelClass = 'block text-xs font-semibold text-base-muted mb-1.5';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-base-primary mb-1">{lang === 'ar' ? 'إدارة الماركات' : 'Brand Management'}</h1>
          <p className="text-base-muted text-sm">{lang === 'ar' ? `${brands.length} ماركة` : `${brands.length} brands`}</p>
          <p className="text-xs text-base-muted mt-1">{lang === 'ar' ? 'تظهر الماركة للعملاء داخل الفئة بمجرد إضافة معدة منها (من «إدارة المعدات» أو زر «ماركة جديدة» في نموذج المعدة).' : 'A brand appears to customers inside a category once a model of that brand is added (from Equipment, or "New brand" in the model form).'}</p>
        </div>
        <button onClick={openAdd} className="btn-primary text-sm"><Plus size={16} /> {lang === 'ar' ? 'إضافة ماركة' : 'Add Brand'}</button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-500">{error}</div>
      )}

      {/* Brand grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {sorted.map((brand) => (
          <div key={brand.id} className="card-industrial p-4 text-center">
            {brand.logo ? (
              <div className="w-20 h-12 mx-auto mb-3 rounded-xl bg-white p-1.5 flex items-center justify-center overflow-hidden">
                <SafeImage src={brand.logo} alt={brand.name_en} className="max-w-full max-h-full object-contain" />
              </div>
            ) : (
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-yellow-accent/10 border border-yellow-accent/20 flex items-center justify-center">
                <span className="text-xl font-black text-yellow-accent">{brand.name_en.charAt(0)}</span>
              </div>
            )}
            <div className="font-semibold text-base-primary text-sm mb-1">{lang === 'ar' ? brand.name_ar : brand.name_en}</div>
            <div className="text-xs text-base-muted mb-2">{getModelCount(brand.id)} {lang === 'ar' ? 'موديل' : 'models'}</div>
            <div className={`inline-block px-2 py-0.5 rounded-md text-xs font-semibold mb-3 ${brand.hidden ? 'bg-orange-500/10 text-orange-500' : 'bg-green-500/10 text-green-500'}`}>
              {brand.hidden ? (lang === 'ar' ? 'مخفي' : 'Hidden') : (lang === 'ar' ? 'ظاهر' : 'Visible')}
            </div>
            <div className="flex items-center justify-center gap-1">
              <button onClick={() => openEdit(brand)} className="p-1.5 rounded-md hover:bg-yellow-accent/10 text-base-muted hover:text-yellow-accent"><Pencil size={14} /></button>
              <button onClick={() => handleToggleHidden(brand)} className="p-1.5 rounded-md hover:bg-yellow-accent/10 text-base-muted hover:text-yellow-accent">{brand.hidden ? <Eye size={14} /> : <EyeOff size={14} />}</button>
              <button onClick={() => handleReorder(brand.id, dir === 'rtl' ? 'down' : 'up')} className="p-1.5 rounded-md hover:bg-yellow-accent/10 text-base-muted hover:text-yellow-accent"><ArrowUp size={14} /></button>
              <button onClick={() => handleReorder(brand.id, dir === 'rtl' ? 'up' : 'down')} className="p-1.5 rounded-md hover:bg-yellow-accent/10 text-base-muted hover:text-yellow-accent"><ArrowDown size={14} /></button>
              <button onClick={() => handleDelete(brand.id)} className="p-1.5 rounded-md hover:bg-red-500/10 text-base-muted hover:text-red-500"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowForm(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative w-full max-w-md bg-elevated rounded-2xl border border-base shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-base p-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-base-primary">{editingBrand ? (lang === 'ar' ? 'تعديل ماركة' : 'Edit Brand') : (lang === 'ar' ? 'إضافة ماركة' : 'Add Brand')}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg border border-base text-base-muted hover:text-yellow-accent"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              {error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-500">{error}</div>
              )}
              <div><label className={labelClass}>{lang === 'ar' ? 'الاسم (عربي)' : 'Name (Arabic)'}</label><input className={inputClass} value={form.name_ar} onChange={(e) => update('name_ar', e.target.value)} /></div>
              <div><label className={labelClass}>{lang === 'ar' ? 'الاسم (إنجليزي)' : 'Name (English)'}</label><input className={inputClass} value={form.name_en} onChange={(e) => update('name_en', e.target.value)} /></div>
              <ImageUploader
                bucket="equipment-images"
                images={[]}
                mainImage={form.logo || ''}
                onMainImageChange={(url) => update('logo', url)}
                onImagesChange={() => {}}
                maxImages={0}
                lang={lang}
                folder="brands"
                label={lang === 'ar' ? 'شعار الماركة (اختياري)' : 'Brand logo (optional)'}
              />
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.hidden} onChange={(e) => update('hidden', e.target.checked)} className="w-4 h-4 accent-yellow-accent" />
                <span className="text-sm font-semibold text-base-primary">{lang === 'ar' ? 'مخفي' : 'Hidden'}</span>
              </label>
            </div>
            <div className="border-t border-base p-4 flex items-center justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="btn-secondary text-sm">{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
              <button onClick={save} disabled={saving} className="btn-primary text-sm disabled:opacity-50">{editingBrand ? (lang === 'ar' ? 'حفظ' : 'Save') : (lang === 'ar' ? 'إضافة' : 'Add')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
