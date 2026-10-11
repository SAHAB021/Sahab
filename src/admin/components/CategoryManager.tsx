import { useState } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, ArrowUp, ArrowDown, X } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useAdmin } from '../AdminContext';
import ImageUploader from '@/components/ImageUploader';
import SafeImage from '@/components/SafeImage';
import type { AdminCategoryRow } from '@/catalog/catalogApi';
import type { SpecField } from '@/catalog/types';

function createEmptyCategory(): AdminCategoryRow {
  return {
    id: '',
    name_ar: '',
    name_en: '',
    slug: '',
    image: '',
    icon: 'Truck',
    description_ar: '',
    description_en: '',
    spec_fields: [],
    display_order: 0,
    hidden: false,
  };
}

function createEmptySpecField(): SpecField {
  return { key: '', labelAr: '', labelEn: '', unitAr: '', unitEn: '' };
}

export default function CategoryManager() {
  const { lang, dir } = useApp();
  const {
    categories, models,
    addCategory, updateCategory, deleteCategory, toggleCategoryHidden, reorderCategory,
  } = useAdmin();

  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategoryRow | null>(null);
  const [form, setForm] = useState<AdminCategoryRow>(createEmptyCategory());
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const openAdd = () => { setEditingCategory(null); setForm(createEmptyCategory()); setError(''); setShowForm(true); };
  const openEdit = (cat: AdminCategoryRow) => { setEditingCategory(cat); setForm({ ...cat, spec_fields: [...(cat.spec_fields || [])] }); setError(''); setShowForm(true); };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const { id: _id, ...payload } = form;
      if (editingCategory) {
        await updateCategory(editingCategory.id, payload);
      } else {
        await addCategory(payload);
      }
      setShowForm(false);
    } catch (e: any) {
      setError(e?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const count = models.filter((m) => m.category_id === id).length;
    if (count > 0) {
      setError(lang === 'ar'
        ? `لا يمكن حذف هذه الفئة لأنها تحتوي على ${count} موديل. احذف الموديلات أو انقلها لفئة أخرى أولاً، أو استخدم زر الإخفاء لإخفائها من الموقع.`
        : `This category has ${count} models, so it can't be deleted. Delete or move its models first, or hide the category instead.`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!confirm(lang === 'ar' ? 'حذف هذه الفئة نهائياً؟' : 'Delete this category permanently?')) return;
    try {
      setError('');
      await deleteCategory(id);
    } catch (e: any) {
      setError(e?.message || 'Failed to delete');
    }
  };

  const handleToggleHidden = async (cat: AdminCategoryRow) => {
    try {
      setError('');
      await toggleCategoryHidden(cat.id, !cat.hidden);
    } catch (e: any) {
      setError(e?.message || 'Failed to toggle');
    }
  };

  const handleReorder = async (id: string, d: 'up' | 'down') => {
    try {
      setError('');
      await reorderCategory(id, d);
    } catch (e: any) {
      setError(e?.message || 'Failed to reorder');
    }
  };

  const update = <K extends keyof AdminCategoryRow>(key: K, value: AdminCategoryRow[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const addSpecField = () => {
    setForm((prev) => ({ ...prev, spec_fields: [...(prev.spec_fields || []), createEmptySpecField()] }));
  };
  const updateSpecField = (idx: number, key: string, value: string) =>
    setForm((prev) => ({
      ...prev,
      spec_fields: (prev.spec_fields || []).map((f, i) => (i === idx ? { ...f, [key]: value } : f)),
    }));
  const removeSpecField = (idx: number) =>
    setForm((prev) => ({ ...prev, spec_fields: (prev.spec_fields || []).filter((_, i) => i !== idx) }));

  const sorted = [...categories].sort((a, b) => a.display_order - b.display_order);
  const getModelCount = (catId: string) => models.filter((m) => m.category_id === catId).length;

  const inputClass = 'w-full px-3 py-2.5 rounded-lg bg-base border border-base text-sm text-base-primary focus:border-yellow-accent focus:outline-none transition-colors';
  const labelClass = 'block text-xs font-semibold text-base-muted mb-1.5';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-base-primary mb-1">{lang === 'ar' ? 'إدارة الفئات' : 'Category Management'}</h1>
          <p className="text-base-muted text-sm">{lang === 'ar' ? `${categories.length} فئة` : `${categories.length} categories`}</p>
          <p className="text-xs text-base-muted mt-1">{lang === 'ar' ? 'الفئة الجديدة تظهر في صفحة «تأجير المعدات» فوراً، وتُضاف في آخر القائمة (يمكنك ترتيبها بالأسهم).' : 'A new category shows on the equipment page right away, at the end of the list (reorder with the arrows).'}</p>
        </div>
        <button onClick={openAdd} className="btn-primary text-sm"><Plus size={16} /> {lang === 'ar' ? 'إضافة فئة' : 'Add Category'}</button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-500">{error}</div>
      )}

      {/* Category list */}
      <div className="space-y-2">
        {sorted.map((cat) => (
          <div key={cat.id} className="card-industrial p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-black flex-shrink-0">
              <SafeImage src={cat.image} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-base-primary text-sm">{lang === 'ar' ? cat.name_ar : cat.name_en}</div>
              <div className="text-xs text-base-muted">{lang === 'ar' ? cat.name_en : cat.name_ar} • {getModelCount(cat.id)} {lang === 'ar' ? 'موديل' : 'models'} • {(cat.spec_fields || []).length} {lang === 'ar' ? 'حقل مواصفات' : 'spec fields'}</div>
            </div>
            <div className={`px-2 py-1 rounded-md text-xs font-semibold ${cat.hidden ? 'bg-orange-500/10 text-orange-500' : 'bg-green-500/10 text-green-500'}`}>
              {cat.hidden ? (lang === 'ar' ? 'مخفي' : 'Hidden') : (lang === 'ar' ? 'ظاهر' : 'Visible')}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => openEdit(cat)} className="p-1.5 rounded-md hover:bg-yellow-accent/10 text-base-muted hover:text-yellow-accent"><Pencil size={14} /></button>
              <button onClick={() => handleToggleHidden(cat)} className="p-1.5 rounded-md hover:bg-yellow-accent/10 text-base-muted hover:text-yellow-accent">{cat.hidden ? <Eye size={14} /> : <EyeOff size={14} />}</button>
              <button onClick={() => handleReorder(cat.id, dir === 'rtl' ? 'down' : 'up')} className="p-1.5 rounded-md hover:bg-yellow-accent/10 text-base-muted hover:text-yellow-accent"><ArrowUp size={14} /></button>
              <button onClick={() => handleReorder(cat.id, dir === 'rtl' ? 'up' : 'down')} className="p-1.5 rounded-md hover:bg-yellow-accent/10 text-base-muted hover:text-yellow-accent"><ArrowDown size={14} /></button>
              <button onClick={() => handleDelete(cat.id)} className="p-1.5 rounded-md hover:bg-red-500/10 text-base-muted hover:text-red-500"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-4 animate-fade-in" onClick={() => setShowForm(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative w-full max-w-2xl max-h-[95vh] overflow-y-auto bg-elevated rounded-2xl border border-base shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-elevated border-b border-base p-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-base-primary">{editingCategory ? (lang === 'ar' ? 'تعديل فئة' : 'Edit Category') : (lang === 'ar' ? 'إضافة فئة' : 'Add Category')}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg border border-base text-base-muted hover:text-yellow-accent"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              {error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-500">{error}</div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className={labelClass}>{lang === 'ar' ? 'الاسم (عربي)' : 'Name (Arabic)'}</label><input className={inputClass} value={form.name_ar} onChange={(e) => update('name_ar', e.target.value)} /></div>
                <div><label className={labelClass}>{lang === 'ar' ? 'الاسم (إنجليزي)' : 'Name (English)'}</label><input className={inputClass} value={form.name_en} onChange={(e) => update('name_en', e.target.value)} /></div>
              </div>
              <div><label className={labelClass}>{lang === 'ar' ? 'الـ Slug' : 'Slug'}</label><input className={inputClass} value={form.slug} onChange={(e) => update('slug', e.target.value)} placeholder={lang === 'ar' ? 'اختياري — يُنشأ تلقائياً' : 'Optional — generated automatically'} /></div>
              <div><label className={labelClass}>{lang === 'ar' ? 'الأيقونة' : 'Icon'}</label><input className={inputClass} value={form.icon} onChange={(e) => update('icon', e.target.value)} placeholder="HardHat" /></div>
              <ImageUploader
                bucket="equipment-images"
                images={[]}
                mainImage={form.image}
                onMainImageChange={(url) => update('image', url)}
                onImagesChange={() => {}}
                maxImages={0}
                lang={lang}
                folder={`categories/${form.slug || 'temp'}`}
                label={lang === 'ar' ? 'صورة الفئة' : 'Category Image'}
              />
              <div><label className={labelClass}>{lang === 'ar' ? 'الوصف (عربي)' : 'Description (Arabic)'}</label><input className={inputClass} value={form.description_ar} onChange={(e) => update('description_ar', e.target.value)} /></div>
              <div><label className={labelClass}>{lang === 'ar' ? 'الوصف (إنجليزي)' : 'Description (English)'}</label><input className={inputClass} value={form.description_en} onChange={(e) => update('description_en', e.target.value)} /></div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.hidden} onChange={(e) => update('hidden', e.target.checked)} className="w-4 h-4 accent-yellow-accent" />
                  <span className="text-sm font-semibold text-base-primary">{lang === 'ar' ? 'مخفي' : 'Hidden'}</span>
                </label>
              </div>
              {/* Spec fields */}
              <div className="border-t border-base pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-base-primary">{lang === 'ar' ? 'حقول المواصفات' : 'Spec Fields'}</h3>
                  <button onClick={addSpecField} className="btn-secondary text-xs px-3 py-1.5"><Plus size={12} /> {lang === 'ar' ? 'إضافة حقل' : 'Add Field'}</button>
                </div>
                {(form.spec_fields || []).map((field, idx) => (
                  <div key={idx} className="card-industrial p-3 mb-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-base-muted">#{idx + 1}</span>
                      <button onClick={() => removeSpecField(idx)} className="p-1 rounded-md hover:bg-red-500/10 text-base-muted hover:text-red-500"><Trash2 size={12} /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input className={inputClass} placeholder={lang === 'ar' ? 'مفتاح (key)' : 'Key'} value={field.key} onChange={(e) => updateSpecField(idx, 'key', e.target.value)} />
                      <input className={inputClass} placeholder={lang === 'ar' ? 'تسمية عربي' : 'Label AR'} value={field.labelAr} onChange={(e) => updateSpecField(idx, 'labelAr', e.target.value)} />
                      <input className={inputClass} placeholder={lang === 'ar' ? 'تسمية إنجليزي' : 'Label EN'} value={field.labelEn} onChange={(e) => updateSpecField(idx, 'labelEn', e.target.value)} />
                      <input className={inputClass} placeholder={lang === 'ar' ? 'وحدة عربي' : 'Unit AR'} value={field.unitAr} onChange={(e) => updateSpecField(idx, 'unitAr', e.target.value)} />
                      <input className={inputClass} placeholder={lang === 'ar' ? 'وحدة إنجليزي' : 'Unit EN'} value={field.unitEn} onChange={(e) => updateSpecField(idx, 'unitEn', e.target.value)} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="sticky bottom-0 bg-elevated border-t border-base p-4 flex items-center justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="btn-secondary text-sm">{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
              <button onClick={save} disabled={saving} className="btn-primary text-sm disabled:opacity-50">{editingCategory ? (lang === 'ar' ? 'حفظ' : 'Save') : (lang === 'ar' ? 'إضافة' : 'Add')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
