import { useState } from 'react';
import { ArrowRight, ArrowLeft, Check, FileText, Calendar, Shield, Info } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useCatalog } from '../CatalogContext';
import { getCategoryById, getBrandById, getModelById } from '../catalogApi';
import { rentalPeriods } from '../types';
import type { EquipmentVariant } from '../types';

export default function DetailsPage() {
  const { lang, dir } = useApp();
  const { route, navigate, setRequestItem, setShowRequestModal, categories, brands, models, loading } = useCatalog();

  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('daily');
  [selectedPeriod]; // suppress unused warning

  if (loading || !route.categoryId || !route.brandId || !route.modelId) return null;
  const category = getCategoryById(categories, route.categoryId);
  const brand = getBrandById(brands, route.brandId);
  const model = getModelById(models, route.modelId);
  if (!category || !brand || !model) return null;

  const publishedVariants = model.variants.filter((v) => v.published);
  const sortedVariants = [...publishedVariants].sort((a, b) => a.displayOrder - b.displayOrder);
  const selectedVariant: EquipmentVariant | undefined =
    sortedVariants.find((v) => v.id === selectedVariantId) || sortedVariants[0];

  const handleRequestRental = () => {
    if (!selectedVariant) return;
    setRequestItem({
      categoryId: category.id,
      brandId: brand.id,
      modelId: model.id,
      variantId: selectedVariant.id,
    });
    setShowRequestModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
      <Breadcrumbs />

      {/* Back button */}
      <button
        onClick={() => navigate({ level: 'models', categoryId: route.categoryId!, brandId: route.brandId! })}
        className="flex items-center gap-2 text-sm text-base-muted hover:text-yellow-accent transition-colors mb-6"
      >
        {dir === 'rtl' ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
        {lang === 'ar' ? `العودة لموديلات ${brand.nameAr}` : `Back to ${brand.nameEn} Models`}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Gallery */}
        <div className="animate-fade-in">
          {/* Main image */}
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-black mb-4">
            <SafeImage
              src={model.image}
              alt={lang === 'ar' ? model.nameAr : model.nameEn}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 ltr:right-4 rtl:left-4 px-3 py-1.5 rounded-lg bg-yellow-accent text-black text-sm font-bold">
              {lang === 'ar' ? brand.nameAr : brand.nameEn}
            </div>
          </div>

          {/* Gallery thumbnails */}
          {model.gallery.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {model.gallery.slice(0, 4).map((img, i) => (
                <div
                  key={i}
                  className="relative aspect-square rounded-lg overflow-hidden bg-black border border-base hover:border-yellow-accent cursor-pointer transition-all"
                >
                  <SafeImage src={img} alt="" loading="lazy" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="animate-fade-in-up">
          {/* Category + Brand */}
          <div className="flex items-center gap-2 mb-3">
            <span className="px-3 py-1 rounded-md bg-elevated border border-base text-xs font-semibold text-base-muted">
              {lang === 'ar' ? category.nameAr : category.nameEn}
            </span>
            <span className="text-base-muted text-xs">•</span>
            <span className="px-3 py-1 rounded-md bg-elevated border border-base text-xs font-semibold text-base-muted">
              {lang === 'ar' ? brand.nameAr : brand.nameEn}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl lg:text-4xl font-black text-base-primary mb-3">
            {lang === 'ar' ? model.nameAr : model.nameEn}
          </h1>
          <p className="text-base-muted text-lg leading-relaxed mb-6">
            {lang === 'ar' ? model.descriptionAr : model.descriptionEn}
          </p>

          {/* Variant selector */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-base-primary uppercase tracking-wider mb-3">
              {lang === 'ar' ? 'اختر الحجم / السعة' : 'Select Size / Capacity'}
            </h3>
            {sortedVariants.length === 0 && (
              <p className="text-sm text-base-muted p-3 rounded-lg border border-dashed border-base">
                {lang === 'ar'
                  ? 'لم تُحدَّد أحجام هذه المعدة بعد. تواصل مع فريق سحاب لطلبها.'
                  : 'Sizes for this model are not listed yet. Contact the SAHAB team to request it.'}{' '}
                <a href="#contact" className="font-bold text-yellow-accent hover:underline">{lang === 'ar' ? 'تواصل معنا' : 'Contact us'}</a>
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {sortedVariants.map((variant) => (
                <button
                  key={variant.id}
                  onClick={() => setSelectedVariantId(variant.id)}
                  className={`px-4 py-2.5 rounded-lg border-2 text-sm font-semibold transition-all ${
                    selectedVariant?.id === variant.id
                      ? 'border-yellow-accent bg-yellow-accent/10 text-yellow-accent'
                      : 'border-base text-base-muted hover:border-yellow-accent/50'
                  }`}
                >
                  {lang === 'ar' ? variant.sizeLabelAr : variant.sizeLabelEn}
                </button>
              ))}
            </div>
          </div>

          {/* Specifications */}
          {selectedVariant && (
            <div className="card-industrial p-5 mb-6">
              <h3 className="text-sm font-bold text-base-primary uppercase tracking-wider mb-4 flex items-center gap-2">
                <Info size={16} className="text-yellow-accent" />
                {lang === 'ar' ? 'المواصفات الفنية' : 'Technical Specifications'}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {category.specFields.map((field) => {
                  const value = selectedVariant.specs[field.key];
                  if (!value) return null;
                  const unit = lang === 'ar' ? field.unitAr : field.unitEn;
                  return (
                    <div key={field.key}>
                      <div className="text-xs text-base-muted mb-1">
                        {lang === 'ar' ? field.labelAr : field.labelEn}
                      </div>
                      <div className="text-lg font-bold text-base-primary">
                        {value}
                        {unit && <span className="text-sm font-normal text-base-muted ms-1">{unit}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Rental periods */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-base-primary uppercase tracking-wider mb-3 flex items-center gap-2">
              <Calendar size={16} className="text-yellow-accent" />
              {lang === 'ar' ? 'فترات الإيجار' : 'Rental Periods'}
            </h3>
            <div className="flex flex-wrap gap-2">
              {rentalPeriods.map((period) => (
                <span
                  key={period.id}
                  className="px-3.5 py-2 rounded-lg bg-elevated border border-base text-sm font-medium text-base-muted"
                >
                  {lang === 'ar' ? period.labelAr : period.labelEn}
                </span>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-base-primary uppercase tracking-wider mb-3">
              {lang === 'ar' ? 'المميزات' : 'Features'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(lang === 'ar' ? model.featuresAr : model.featuresEn).map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-base-muted">
                  <Check size={16} className="text-yellow-accent flex-shrink-0" />
                  {feature}
                </div>
              ))}
            </div>
          </div>

          {/* Rental terms */}
          <div className="card-industrial p-5 mb-6">
            <h3 className="text-sm font-bold text-base-primary uppercase tracking-wider mb-2 flex items-center gap-2">
              <Shield size={16} className="text-yellow-accent" />
              {lang === 'ar' ? 'شروط الإيجار' : 'Rental Terms'}
            </h3>
            <p className="text-sm text-base-muted leading-relaxed">
              {lang === 'ar' ? model.rentalTermsAr : model.rentalTermsEn}
            </p>
          </div>

          {/* CTA */}
          <div className="space-y-3">
            <button
              onClick={handleRequestRental}
              className="btn-primary w-full justify-center group"
              disabled={!selectedVariant}
            >
              <FileText size={18} />
              {lang === 'ar' ? 'طلب تأجير المعدة' : 'Request Rental'}
              <ArrowRight
                size={18}
                className={`transition-transform group-hover:translate-x-1 ${dir === 'rtl' ? 'rotate-180 group-hover:-translate-x-1' : ''}`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import Breadcrumbs from './Breadcrumbs';
import SafeImage from '@/components/SafeImage';
