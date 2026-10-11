import { useState } from 'react';
import { X, Plus, Trash2, Image as ImageIcon, ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useAdmin } from '../AdminContext';
import ImageUploader from '@/components/ImageUploader';
import type { AdminModelRow, AdminVariantRow } from '@/catalog/catalogApi';
import type { SpecField } from '@/catalog/types';

/** "+ New" next to a select: create a brand / category without leaving the form. */
function QuickAdd({ kind, onCreate, inputClass }: { kind: 'brand' | 'category'; onCreate: (nameAr: string, nameEn: string) => Promise<void>; inputClass: string }) {
  const { lang } = useApp();
  const ar = lang === 'ar';
  const [open, setOpen] = useState(false);
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const label = kind === 'brand' ? (ar ? 'ماركة جديدة' : 'New brand') : (ar ? 'فئة جديدة' : 'New category');

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="mt-1.5 text-xs font-bold text-yellow-accent hover:underline inline-flex items-center gap-1">
        <Plus size={12} /> {label}
      </button>
    );
  }
  const submit = async () => {
    if (!nameAr.trim() && !nameEn.trim()) {
      setErr(ar ? 'اكتب الاسم' : 'Enter a name');
      return;
    }
    setBusy(true);
    setErr('');
    try {
      await onCreate(nameAr, nameEn);
      setOpen(false);
      setNameAr('');
      setNameEn('');
    } catch (e) {
      setErr(e instanceof Error ? e.message : ar ? 'تعذر الإضافة' : 'Could not add');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="mt-2 p-3 rounded-lg border border-yellow-accent/30 bg-yellow-accent/5 space-y-2">
      <div className="text-xs font-bold text-base-primary">{label}</div>
      <input className={inputClass} placeholder={ar ? 'الاسم بالعربي' : 'Arabic name'} value={nameAr} onChange={(e) => setNameAr(e.target.value)} />
      <input className={inputClass} dir="ltr" placeholder={ar ? 'الاسم بالإنجليزي' : 'English name'} value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
      {err && <div className="text-xs text-red-500">{err}</div>}
      <div className="flex gap-2">
        <button type="button" onClick={submit} disabled={busy} className="btn-primary text-xs px-3 py-1.5 disabled:opacity-60">
          {busy ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} {ar ? 'إضافة' : 'Add'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-base-muted hover:text-base-primary px-2">{ar ? 'إلغاء' : 'Cancel'}</button>
      </div>
    </div>
  );
}

interface EquipmentFormProps {
  editingModel: AdminModelRow | null;
  onClose: () => void;
}

const emptyRentalInfo: Record<string, string> = {
  dailyPrice: '',
  weeklyPrice: '',
  monthlyPrice: '',
  sixMonthPrice: '',
  annualPrice: '',
  operator: 'without_operator',
  diesel: 'customer',
  transport: 'agreement',
  deposit: '',
  additionalTermsAr: '',
  additionalTermsEn: '',
};

function createEmptyModel(): AdminModelRow {
  return {
    id: '',
    category_id: '',
    brand_id: '',
    name_ar: '',
    name_en: '',
    description_ar: '',
    description_en: '',
    image: '',
    gallery: [],
    features_ar: [],
    features_en: [],
    rental_terms_ar: '',
    rental_terms_en: '',
    year: '',
    short_description_ar: '',
    short_description_en: '',
    rental_info: { ...emptyRentalInfo },
    published: false,
    hidden: false,
    archived: false,
    availability: 'available',
    display_order: 0,
  };
}

function createEmptyVariant(order: number): AdminVariantRow {
  return {
    id: `var-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    model_id: '',
    size_label_ar: '',
    size_label_en: '',
    specs: {},
    published: true,
    display_order: order,
  };
}

export default function EquipmentForm({ editingModel, onClose }: EquipmentFormProps) {
  const { lang } = useApp();
  const {
    categories, brands, variants,
    addModel, updateModel, setModelVariants, addBrand, addCategory,
  } = useAdmin();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Build initial form state from editing model or empty
  const existingVariants = editingModel
    ? variants.filter((v) => v.model_id === editingModel.id)
    : [];

  const [model, setModel] = useState<AdminModelRow>(
    editingModel
      ? {
          ...editingModel,
          rental_info: { ...emptyRentalInfo, ...(editingModel.rental_info || {}) },
          gallery: [...(editingModel.gallery || [])],
          features_ar: [...(editingModel.features_ar || [])],
          features_en: [...(editingModel.features_en || [])],
        }
      : createEmptyModel()
  );
  // A new model starts with one size row so it is never saved without a size.
  const [modelVariants, setModelVariantsState] = useState<AdminVariantRow[]>(() =>
    editingModel
      ? existingVariants.map((v) => ({ ...v, specs: { ...v.specs } }))
      : [createEmptyVariant(1)]
  );
  const [activeTab, setActiveTab] = useState<'basic' | 'variants' | 'gallery' | 'rental' | 'features'>('basic');

  const selectedCategory = categories.find((c) => c.id === model.category_id);

  const updateField = <K extends keyof AdminModelRow>(key: K, value: AdminModelRow[K]) =>
    setModel((prev) => ({ ...prev, [key]: value }));

  const updateRental = (key: string, value: string) =>
    setModel((prev) => ({ ...prev, rental_info: { ...prev.rental_info, [key]: value } }));


  // ─── Variant operations ─────────────────────────────────────
  const addVariant = () => {
    setModelVariantsState((prev) => [...prev, createEmptyVariant(prev.length + 1)]);
  };
  const updateVariant = (id: string, key: keyof AdminVariantRow, value: string | boolean) =>
    setModelVariantsState((prev) =>
      prev.map((v) => (v.id === id ? { ...v, [key]: value } : v))
    );
  const updateVariantSpec = (id: string, specKey: string, value: string) =>
    setModelVariantsState((prev) =>
      prev.map((v) => (v.id === id ? { ...v, specs: { ...v.specs, [specKey]: value } } : v))
    );
  const deleteVariant = (id: string) =>
    setModelVariantsState((prev) => prev.filter((v) => v.id !== id));
  const moveVariant = (id: string, d: 'up' | 'down') =>
    setModelVariantsState((prev) => {
      const sorted = [...prev].sort((a, b) => a.display_order - b.display_order);
      const idx = sorted.findIndex((v) => v.id === id);
      const swap = d === 'up' ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= sorted.length) return prev;
      [sorted[idx], sorted[swap]] = [sorted[swap], sorted[idx]];
      return sorted.map((v, i) => ({ ...v, display_order: i + 1 }));
    });

  // ─── Gallery operations ─────────────────────────────────────
  const removeGalleryImage = (idx: number) =>
    setModel((prev) => ({ ...prev, gallery: prev.gallery.filter((_, i) => i !== idx) }));
  const moveGalleryImage = (idx: number, d: 'up' | 'down') =>
    setModel((prev) => {
      const gal = [...prev.gallery];
      const swap = d === 'up' ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= gal.length) return prev;
      [gal[idx], gal[swap]] = [gal[swap], gal[idx]];
      return { ...prev, gallery: gal };
    });
  const setMainImage = (url: string) => updateField('image', url);

  // ─── Features operations ────────────────────────────────────
  const [featureAr, setFeatureAr] = useState('');
  const [featureEn, setFeatureEn] = useState('');
  const addFeature = () => {
    if (!featureAr.trim() && !featureEn.trim()) return;
    setModel((prev) => ({
      ...prev,
      features_ar: [...prev.features_ar, featureAr.trim()],
      features_en: [...prev.features_en, featureEn.trim()],
    }));
    setFeatureAr('');
    setFeatureEn('');
  };
  const removeFeature = (idx: number) =>
    setModel((prev) => ({
      ...prev,
      features_ar: prev.features_ar.filter((_, i) => i !== idx),
      features_en: prev.features_en.filter((_, i) => i !== idx),
    }));


  // ─── Save ───────────────────────────────────────────────────
  const save = async () => {
    setError('');
    // Customers pick a size before requesting, so at least one named size is required.
    const sizes = modelVariants
      .map((v) => {
        const ar = v.size_label_ar.trim();
        const en = v.size_label_en.trim();
        return { ...v, size_label_ar: ar || en, size_label_en: en || ar };
      })
      .filter((v) => v.size_label_ar);
    if (sizes.length === 0) {
      setError(lang === 'ar'
        ? 'أضف حجماً واحداً على الأقل (مثل «20 طن») في تبويب «الأحجام والمواصفات» — بدونه لا يستطيع العميل اختيار المعدة وطلبها.'
        : 'Add at least one size (e.g. "20 Ton") in the "Variants & Specs" tab — without it customers cannot choose and request this model.');
      if (modelVariants.length === 0) addVariant();
      setActiveTab('variants');
      return;
    }
    if (!sizes.some((v) => v.published)) {
      setError(lang === 'ar' ? 'اجعل حجماً واحداً على الأقل «منشوراً» ليظهر للعملاء.' : 'Mark at least one size as "Published" so customers can see it.');
      setActiveTab('variants');
      return;
    }
    setSaving(true);
    try {
      const { id: _id, ...payload } = model;
      if (editingModel) {
        await updateModel(editingModel.id, payload);
        await setModelVariants(editingModel.id, sizes);
      } else {
        const newId = await addModel(payload);
        await setModelVariants(newId, sizes);
      }
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'basic' as const, labelAr: 'المعلومات الأساسية', labelEn: 'Basic Info' },
    { id: 'variants' as const, labelAr: 'الأحجام والمواصفات', labelEn: 'Variants & Specs' },
    { id: 'gallery' as const, labelAr: 'الصور', labelEn: 'Gallery' },
    { id: 'rental' as const, labelAr: 'معلومات الإيجار', labelEn: 'Rental Info' },
    { id: 'features' as const, labelAr: 'المميزات', labelEn: 'Features' },
  ];

  const inputClass = 'w-full px-3 py-2.5 rounded-lg bg-base border border-base text-sm text-base-primary focus:border-yellow-accent focus:outline-none transition-colors';
  const labelClass = 'block text-xs font-semibold text-base-muted mb-1.5';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-4xl max-h-[95vh] overflow-y-auto bg-elevated rounded-2xl border border-base shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 z-10 bg-elevated border-b border-base p-4 lg:p-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-base-primary">
            {editingModel ? (lang === 'ar' ? 'تعديل المعدة' : 'Edit Model') : (lang === 'ar' ? 'إضافة معدة جديدة' : 'Add New Model')}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg border border-base text-base-muted hover:text-yellow-accent hover:border-yellow-accent transition-all">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="sticky top-[57px] z-10 bg-elevated border-b border-base px-4 lg:px-5 flex gap-1 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id ? 'border-yellow-accent text-yellow-accent' : 'border-transparent text-base-muted hover:text-base-primary'
              }`}
            >
              {lang === 'ar' ? tab.labelAr : tab.labelEn}
              {tab.id === 'variants' && (
                <span className={`ms-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${modelVariants.some((v) => (v.size_label_ar || v.size_label_en).trim()) ? 'bg-yellow-accent/10 text-yellow-accent' : 'bg-red-500/15 text-red-500'}`}>
                  {modelVariants.filter((v) => (v.size_label_ar || v.size_label_en).trim()).length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-4 lg:p-6 space-y-5">
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-500">{error}</div>
          )}

          {/* BASIC TAB */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>{lang === 'ar' ? 'اسم المعدة (عربي)' : 'Name (Arabic)'} *</label>
                  <input className={inputClass} value={model.name_ar} onChange={(e) => updateField('name_ar', e.target.value)} placeholder="CAT 320" />
                </div>
                <div>
                  <label className={labelClass}>{lang === 'ar' ? 'اسم المعدة (إنجليزي)' : 'Name (English)'} *</label>
                  <input className={inputClass} value={model.name_en} onChange={(e) => updateField('name_en', e.target.value)} placeholder="CAT 320" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>{lang === 'ar' ? 'الفئة' : 'Category'} *</label>
                  <select className={inputClass} value={model.category_id} onChange={(e) => updateField('category_id', e.target.value)}>
                    <option value="">{lang === 'ar' ? 'اختر فئة' : 'Select category'}</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{lang === 'ar' ? c.name_ar : c.name_en}</option>)}
                  </select>
                  <QuickAdd kind="category" inputClass={inputClass} onCreate={async (nameAr, nameEn) => updateField('category_id', await addCategory({ name_ar: nameAr, name_en: nameEn }))} />
                </div>
                <div>
                  <label className={labelClass}>{lang === 'ar' ? 'الماركة' : 'Brand'} *</label>
                  <select className={inputClass} value={model.brand_id} onChange={(e) => updateField('brand_id', e.target.value)}>
                    <option value="">{lang === 'ar' ? 'اختر ماركة' : 'Select brand'}</option>
                    {brands.map((b) => <option key={b.id} value={b.id}>{lang === 'ar' ? b.name_ar : b.name_en}</option>)}
                  </select>
                  <QuickAdd kind="brand" inputClass={inputClass} onCreate={async (nameAr, nameEn) => updateField('brand_id', await addBrand({ name_ar: nameAr, name_en: nameEn }))} />
                </div>
                <div>
                  <label className={labelClass}>{lang === 'ar' ? 'سنة الصنع' : 'Year'}</label>
                  <input className={inputClass} value={model.year} onChange={(e) => updateField('year', e.target.value)} placeholder="2024" />
                </div>
              </div>
              <div>
                <label className={labelClass}>{lang === 'ar' ? 'وصف مختصر (عربي)' : 'Short Description (Arabic)'}</label>
                <input className={inputClass} value={model.short_description_ar} onChange={(e) => updateField('short_description_ar', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>{lang === 'ar' ? 'وصف مختصر (إنجليزي)' : 'Short Description (English)'}</label>
                <input className={inputClass} value={model.short_description_en} onChange={(e) => updateField('short_description_en', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>{lang === 'ar' ? 'الوصف الكامل (عربي)' : 'Full Description (Arabic)'}</label>
                <textarea rows={3} className={`${inputClass} resize-none`} value={model.description_ar} onChange={(e) => updateField('description_ar', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>{lang === 'ar' ? 'الوصف الكامل (إنجليزي)' : 'Full Description (English)'}</label>
                <textarea rows={3} className={`${inputClass} resize-none`} value={model.description_en} onChange={(e) => updateField('description_en', e.target.value)} />
              </div>
              <div>
                <ImageUploader
                  bucket="equipment-images"
                  images={[]}
                  mainImage={model.image}
                  onMainImageChange={(url) => updateField('image', url)}
                  onImagesChange={() => {}}
                  maxImages={0}
                  lang={lang}
                  folder={model.id || `new-${Date.now()}`}
                  label={lang === 'ar' ? 'الصورة الرئيسية' : 'Main Image'}
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={model.published} onChange={(e) => updateField('published', e.target.checked)} className="w-4 h-4 accent-yellow-accent" />
                  <span className="text-sm font-semibold text-base-primary">{lang === 'ar' ? 'منشور' : 'Published'}</span>
                </label>
              </div>
            </div>
          )}

          {/* VARIANTS TAB */}
          {activeTab === 'variants' && (
            <div className="space-y-4">
              {!selectedCategory ? (
                <p className="text-sm text-base-muted text-center py-8">{lang === 'ar' ? 'اختر فئة أولاً من المعلومات الأساسية' : 'Select a category first in Basic Info'}</p>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-base-primary">{lang === 'ar' ? 'الأحجام / السعات' : 'Sizes / Capacities'}</h3>
                      <p className="text-xs text-base-muted">{lang === 'ar' ? `المواصفات مبنية على فئة: ${selectedCategory.name_ar}` : `Specs based on: ${selectedCategory.name_en}`}</p>
                    </div>
                    <button onClick={addVariant} className="btn-primary text-xs px-3 py-2">
                      <Plus size={14} /> {lang === 'ar' ? 'إضافة حجم' : 'Add Size'}
                    </button>
                  </div>
                  {modelVariants.length === 0 ? (
                    <p className="text-sm text-base-muted text-center py-8">{lang === 'ar' ? 'لا توجد أحجام. أضف حجماً جديداً.' : 'No variants. Add a new one.'}</p>
                  ) : (
                    [...modelVariants].sort((a, b) => a.display_order - b.display_order).map((variant) => (
                      <div key={variant.id} className="card-industrial p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-base-muted">#{variant.display_order}</span>
                          <div className="flex items-center gap-1">
                            <button onClick={() => moveVariant(variant.id, 'up')} className="p-1.5 rounded-md hover:bg-yellow-accent/10 text-base-muted hover:text-yellow-accent"><ChevronUp size={14} /></button>
                            <button onClick={() => moveVariant(variant.id, 'down')} className="p-1.5 rounded-md hover:bg-yellow-accent/10 text-base-muted hover:text-yellow-accent"><ChevronDown size={14} /></button>
                            <button onClick={() => deleteVariant(variant.id)} className="p-1.5 rounded-md hover:bg-red-500/10 text-base-muted hover:text-red-500"><Trash2 size={14} /></button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className={labelClass}>{lang === 'ar' ? 'الحجم (عربي)' : 'Size (Arabic)'}</label>
                            <input className={inputClass} value={variant.size_label_ar} onChange={(e) => updateVariant(variant.id, 'size_label_ar', e.target.value)} placeholder="20 طن" />
                          </div>
                          <div>
                            <label className={labelClass}>{lang === 'ar' ? 'الحجم (إنجليزي)' : 'Size (English)'}</label>
                            <input className={inputClass} value={variant.size_label_en} onChange={(e) => updateVariant(variant.id, 'size_label_en', e.target.value)} placeholder="20 Ton" />
                          </div>
                        </div>
                        {/* Category-specific specs */}
                        {(selectedCategory.spec_fields || []).length > 0 && (
                          <div className="border-t border-base pt-3">
                            <div className="text-xs font-bold text-base-muted mb-2">{lang === 'ar' ? 'المواصفات الفنية' : 'Technical Specifications'}</div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {(selectedCategory.spec_fields as SpecField[]).map((field) => (
                                <div key={field.key}>
                                  <label className={labelClass}>
                                    {lang === 'ar' ? field.labelAr : field.labelEn}
                                    {field.unitAr && ` (${lang === 'ar' ? field.unitAr : field.unitEn})`}
                                  </label>
                                  <input
                                    className={inputClass}
                                    value={variant.specs[field.key] || ''}
                                    onChange={(e) => updateVariantSpec(variant.id, field.key, e.target.value)}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={variant.published} onChange={(e) => updateVariant(variant.id, 'published', e.target.checked)} className="w-4 h-4 accent-yellow-accent" />
                          <span className="text-xs font-semibold text-base-primary">{lang === 'ar' ? 'منشور' : 'Published'}</span>
                        </label>
                      </div>
                    ))
                  )}
                </>
              )}
            </div>
          )}

          {/* GALLERY TAB */}
          {activeTab === 'gallery' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-base-primary">{lang === 'ar' ? 'معرض الصور' : 'Image Gallery'}</h3>
              <ImageUploader
                bucket="equipment-images"
                images={model.gallery}
                mainImage={model.image}
                onMainImageChange={(url) => updateField('image', url)}
                onImagesChange={(imgs) => updateField('gallery', imgs)}
                maxImages={4}
                lang={lang}
                folder={model.id || `new-${Date.now()}`}
                label={lang === 'ar' ? 'صور المعرض (حد أقصى 4)' : 'Gallery Images (max 4)'}
                sublabel={lang === 'ar' ? 'اسحب وأفلت أو اضغط للرفع — JPG, PNG, WEBP' : 'Drag & drop or click to upload — JPG, PNG, WEBP'}
              />
            </div>
          )}

          {/* RENTAL TAB */}
          {activeTab === 'rental' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-base-primary">{lang === 'ar' ? 'معلومات الإيجار' : 'Rental Information'}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>{lang === 'ar' ? 'السعر اليومي (ر.س)' : 'Daily Price (SAR)'}</label>
                  <input className={inputClass} value={model.rental_info?.dailyPrice || ''} onChange={(e) => updateRental('dailyPrice', e.target.value)} placeholder="500" />
                </div>
                <div>
                  <label className={labelClass}>{lang === 'ar' ? 'السعر الأسبوعي (ر.س)' : 'Weekly Price (SAR)'}</label>
                  <input className={inputClass} value={model.rental_info?.weeklyPrice || ''} onChange={(e) => updateRental('weeklyPrice', e.target.value)} placeholder="3000" />
                </div>
                <div>
                  <label className={labelClass}>{lang === 'ar' ? 'السعر الشهري (ر.س)' : 'Monthly Price (SAR)'}</label>
                  <input className={inputClass} value={model.rental_info?.monthlyPrice || ''} onChange={(e) => updateRental('monthlyPrice', e.target.value)} placeholder="10000" />
                </div>
                <div>
                  <label className={labelClass}>{lang === 'ar' ? 'سعر 6 أشهر (ر.س)' : '6-Month Price (SAR)'}</label>
                  <input className={inputClass} value={model.rental_info?.sixMonthPrice || ''} onChange={(e) => updateRental('sixMonthPrice', e.target.value)} placeholder="50000" />
                </div>
                <div>
                  <label className={labelClass}>{lang === 'ar' ? 'السعر السنوي (ر.س)' : 'Annual Price (SAR)'}</label>
                  <input className={inputClass} value={model.rental_info?.annualPrice || ''} onChange={(e) => updateRental('annualPrice', e.target.value)} placeholder="100000" />
                </div>
                <div>
                  <label className={labelClass}>{lang === 'ar' ? 'التأمين (ر.س)' : 'Deposit (SAR)'}</label>
                  <input className={inputClass} value={model.rental_info?.deposit || ''} onChange={(e) => updateRental('deposit', e.target.value)} placeholder="2000" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>{lang === 'ar' ? 'مع مشغل' : 'Operator'}</label>
                  <select className={inputClass} value={model.rental_info?.operator || 'without_operator'} onChange={(e) => updateRental('operator', e.target.value)}>
                    <option value="without_operator">{lang === 'ar' ? 'بدون مشغل' : 'Without Operator'}</option>
                    <option value="with_operator">{lang === 'ar' ? 'مع مشغل' : 'With Operator'}</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>{lang === 'ar' ? 'الديزل' : 'Diesel'}</label>
                  <select className={inputClass} value={model.rental_info?.diesel || 'customer'} onChange={(e) => updateRental('diesel', e.target.value)}>
                    <option value="customer">{lang === 'ar' ? 'على العميل' : 'Customer'}</option>
                    <option value="sahab">{lang === 'ar' ? 'على سحاب' : 'SAHAB'}</option>
                    <option value="agreement">{lang === 'ar' ? 'بالاتفاق' : 'Agreement'}</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>{lang === 'ar' ? 'النقل' : 'Transport'}</label>
                  <select className={inputClass} value={model.rental_info?.transport || 'agreement'} onChange={(e) => updateRental('transport', e.target.value)}>
                    <option value="agreement">{lang === 'ar' ? 'بالاتفاق' : 'Agreement'}</option>
                    <option value="available">{lang === 'ar' ? 'متاح' : 'Available'}</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelClass}>{lang === 'ar' ? 'شروط إضافية (عربي)' : 'Additional Terms (Arabic)'}</label>
                <textarea rows={2} className={`${inputClass} resize-none`} value={model.rental_info?.additionalTermsAr || ''} onChange={(e) => updateRental('additionalTermsAr', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>{lang === 'ar' ? 'شروط إضافية (إنجليزي)' : 'Additional Terms (English)'}</label>
                <textarea rows={2} className={`${inputClass} resize-none`} value={model.rental_info?.additionalTermsEn || ''} onChange={(e) => updateRental('additionalTermsEn', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>{lang === 'ar' ? 'شروط الإيجار (عربي)' : 'Rental Terms (Arabic)'}</label>
                <textarea rows={3} className={`${inputClass} resize-none`} value={model.rental_terms_ar} onChange={(e) => updateField('rental_terms_ar', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>{lang === 'ar' ? 'شروط الإيجار (إنجليزي)' : 'Rental Terms (English)'}</label>
                <textarea rows={3} className={`${inputClass} resize-none`} value={model.rental_terms_en} onChange={(e) => updateField('rental_terms_en', e.target.value)} />
              </div>
            </div>
          )}

          {/* FEATURES TAB */}
          {activeTab === 'features' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-base-primary">{lang === 'ar' ? 'المميزات' : 'Features'}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>{lang === 'ar' ? 'ميزة (عربي)' : 'Feature (Arabic)'}</label>
                  <input className={inputClass} value={featureAr} onChange={(e) => setFeatureAr(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addFeature(); }} />
                </div>
                <div>
                  <label className={labelClass}>{lang === 'ar' ? 'ميزة (إنجليزي)' : 'Feature (English)'}</label>
                  <input className={inputClass} value={featureEn} onChange={(e) => setFeatureEn(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addFeature(); }} />
                </div>
              </div>
              <button onClick={addFeature} className="btn-secondary text-sm px-3 py-2">
                <Plus size={14} /> {lang === 'ar' ? 'إضافة ميزة' : 'Add Feature'}
              </button>
              {model.features_ar.length > 0 && (
                <div className="space-y-2">
                  {model.features_ar.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-base border border-base">
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-base-primary">{feat}</div>
                        <div className="text-xs text-base-muted">{model.features_en[idx]}</div>
                      </div>
                      <button onClick={() => removeFeature(idx)} className="p-1.5 rounded-md hover:bg-red-500/10 text-base-muted hover:text-red-500">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-elevated border-t border-base p-4 flex items-center justify-end gap-3">
          <button onClick={onClose} className="btn-secondary text-sm">
            {lang === 'ar' ? 'إلغاء' : 'Cancel'}
          </button>
          <button onClick={save} disabled={saving} className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50">
            {saving && <Loader2 size={14} className="animate-spin" />}
            {editingModel ? (lang === 'ar' ? 'حفظ التغييرات' : 'Save Changes') : (lang === 'ar' ? 'إضافة' : 'Add')}
          </button>
        </div>
      </div>
    </div>
  );
}
