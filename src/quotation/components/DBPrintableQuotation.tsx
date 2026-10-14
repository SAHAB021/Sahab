import { X, Printer } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import {
  SAHAB_INFO, dbQuotationStatusLabels, defaultQuotationTerms,
  PO_REQUIREMENT_AR, PO_REQUIREMENT_EN,
} from '@/quotation/types';
import type { QuotationWithItems } from '@/quotation/types';

interface Props {
  quotation: QuotationWithItems;
  onClose: () => void;
}

export default function DBPrintableQuotation({ quotation, onClose }: Props) {
  const { lang, dir } = useApp();
  const ar = lang === 'ar';

  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  const fmtDate = (d: string | null) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString(ar ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }); }
    catch { return d; }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-white overflow-y-auto">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 bg-elevated border-b border-base p-3 flex items-center justify-between print:hidden">
        <button onClick={onClose} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-base text-sm font-semibold text-base-muted hover:text-base-primary">
          <X size={16} /> {ar ? 'إغلاق' : 'Close'}
        </button>
        <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-accent text-black text-sm font-bold hover:opacity-90">
          <Printer size={16} /> {ar ? 'طباعة / حفظ كـ PDF' : 'Print / Save PDF'}
        </button>
      </div>

      {/* A4 Document */}
      <div className="mx-auto bg-white text-black" style={{ maxWidth: '210mm', minHeight: '297mm', padding: '20mm' }} dir={dir}>
        {/* Letterhead */}
        <div className="flex items-start justify-between border-b-2 border-yellow-accent pb-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <img src="/logo.png" alt="" aria-hidden="true" className="w-14 h-14 object-contain shrink-0" />
              <div>
                <h1 className="text-xl font-black">{ar ? SAHAB_INFO.nameAr : SAHAB_INFO.nameEn}</h1>
                <p className="text-xs text-gray-500">{ar ? SAHAB_INFO.addressAr : SAHAB_INFO.addressEn}</p>
              </div>
            </div>
            <div className="text-xs text-gray-500 space-y-0.5">
              <div>{ar ? 'الهاتف' : 'Phone'}: {SAHAB_INFO.phone}</div>
              <div>{ar ? 'البريد' : 'Email'}: {SAHAB_INFO.email}</div>
              <div>{ar ? 'الرقم الضريبي' : 'VAT'}: {SAHAB_INFO.vatNumber} • {ar ? 'سجل تجاري' : 'CR'}: {SAHAB_INFO.crNumber}</div>
            </div>
          </div>
          <div className="text-end">
            <div className="text-2xl font-black text-yellow-accent">{ar ? 'عرض سعر' : 'QUOTATION'}</div>
            <div className="text-sm font-mono font-bold text-black mt-1">{quotation.quotation_reference}</div>
            {quotation.version > 1 && <div className="text-xs text-gray-500">{ar ? `إصدار ${quotation.version}` : `Version ${quotation.version}`}</div>}
          </div>
        </div>

        {/* Meta */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div>
            <div className="text-xs text-gray-500 mb-0.5">{ar ? 'تاريخ الإصدار' : 'Issue Date'}</div>
            <div className="font-semibold">{fmtDate(quotation.issue_date)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-0.5">{ar ? 'تاريخ الانتهاء' : 'Expiry Date'}</div>
            <div className="font-semibold">{fmtDate(quotation.expiry_date)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-0.5">{ar ? 'الطلب المرتبط' : 'Related Request'}</div>
            <div className="font-semibold font-mono">{quotation.request_reference || '—'}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-0.5">{ar ? 'الحالة' : 'Status'}</div>
            <div className="font-semibold">{ar ? dbQuotationStatusLabels[quotation.status].ar : dbQuotationStatusLabels[quotation.status].en}</div>
          </div>
        </div>

        {/* Customer */}
        <div className="mb-6">
          <h2 className="text-sm font-bold text-yellow-accent uppercase mb-2 border-b border-gray-200 pb-1">{ar ? 'بيانات العميل' : 'Customer Information'}</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-500">{ar ? 'الاسم' : 'Name'}: </span><span className="font-semibold">{quotation.customer_name}</span></div>
            <div><span className="text-gray-500">{ar ? 'الشركة' : 'Company'}: </span><span className="font-semibold">{quotation.company_name || '—'}</span></div>
            <div><span className="text-gray-500">{ar ? 'الهاتف' : 'Phone'}: </span><span className="font-semibold" dir="ltr">{quotation.customer_phone}</span></div>
            <div><span className="text-gray-500">{ar ? 'البريد' : 'Email'}: </span><span className="font-semibold" dir="ltr">{quotation.customer_email || '—'}</span></div>
          </div>
        </div>

        {/* Items table */}
        <div className="mb-6">
          <h2 className="text-sm font-bold text-yellow-accent uppercase mb-2 border-b border-gray-200 pb-1">{ar ? 'البنود' : 'Items'}</h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-300 text-xs text-gray-500">
                <th className="py-2 px-2 text-start">#</th>
                <th className="py-2 px-2 text-start">{ar ? 'الوصف' : 'Description'}</th>
                <th className="py-2 px-2 text-center">{ar ? 'كمية' : 'Qty'}</th>
                <th className="py-2 px-2 text-center">{ar ? 'وحدة' : 'Unit'}</th>
                <th className="py-2 px-2 text-end">{ar ? 'سعر الوحدة' : 'Unit Price'}</th>
                <th className="py-2 px-2 text-end">{ar ? 'خصم' : 'Disc'}</th>
                <th className="py-2 px-2 text-end">{ar ? 'الإجمالي' : 'Total'}</th>
              </tr>
            </thead>
            <tbody>
              {quotation.items.map((it, i) => (
                <tr key={i} className="border-b border-gray-200">
                  <td className="py-2 px-2 text-gray-400">{i + 1}</td>
                  <td className="py-2 px-2">{it.description}</td>
                  <td className="py-2 px-2 text-center">{it.quantity}</td>
                  <td className="py-2 px-2 text-center">{it.unit}</td>
                  <td className="py-2 px-2 text-end">{fmt(it.unit_price)}</td>
                  <td className="py-2 px-2 text-end">{it.discount > 0 ? fmt(it.discount) : '—'}</td>
                  <td className="py-2 px-2 text-end font-semibold">{fmt(it.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-6">
          <div className="w-64 space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">{ar ? 'المجموع الفرعي' : 'Subtotal'}</span><span className="font-semibold">{fmt(quotation.subtotal)} {quotation.currency}</span></div>
            {quotation.discount_amount > 0 && (
              <div className="flex justify-between"><span className="text-gray-500">{ar ? 'خصم' : 'Discount'}</span><span className="font-semibold text-red-500">-{fmt(quotation.discount_amount)}</span></div>
            )}
            <div className="flex justify-between"><span className="text-gray-500">{ar ? `ضريبة ${quotation.vat_rate}%` : `Tax ${quotation.vat_rate}%`}</span><span className="font-semibold">{fmt(quotation.tax_amount)}</span></div>
            <div className="flex justify-between border-t-2 border-gray-300 pt-1.5 text-base font-black"><span>{ar ? 'الإجمالي' : 'Grand Total'}</span><span className="text-yellow-accent">{fmt(quotation.total)} {quotation.currency}</span></div>
          </div>
        </div>

        {/* Terms */}
        {Object.keys(quotation.terms || {}).length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-bold text-yellow-accent uppercase mb-2 border-b border-gray-200 pb-1">{ar ? 'الشروط والأحكام' : 'Terms & Conditions'}</h2>
            <div className="space-y-1.5 text-sm">
              {Object.entries(quotation.terms).filter(([, v]) => v).map(([key, value]) => (
                <div key={key} className="flex gap-2">
                  <span className="text-gray-500 font-semibold min-w-32">{defaultQuotationTerms[key] ? (ar ? defaultQuotationTerms[key].ar : defaultQuotationTerms[key].en) : key}:</span>
                  <span>{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PO requirement (rental only) */}
        {quotation.request_type === 'rental' && (
          <div className="mb-6 p-3 rounded-lg bg-yellow-50 border border-yellow-300 text-sm font-semibold text-yellow-800">
            {ar ? PO_REQUIREMENT_AR : PO_REQUIREMENT_EN}
          </div>
        )}

        {/* Notes */}
        {quotation.notes && (
          <div className="mb-6">
            <h2 className="text-sm font-bold text-yellow-accent uppercase mb-2 border-b border-gray-200 pb-1">{ar ? 'ملاحظات' : 'Notes'}</h2>
            <p className="text-sm">{quotation.notes}</p>
          </div>
        )}

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-8 mt-12 pt-6">
          <div className="text-center">
            <div className="border-t border-gray-400 pt-2 text-xs text-gray-500">
              {ar ? 'معدة بواسطة — سحاب' : 'Prepared by — SAHAB'}
            </div>
          </div>
          <div className="text-center">
            <div className="border-t border-gray-400 pt-2 text-xs text-gray-500">
              {ar ? 'موافقة العميل' : 'Customer Acceptance'}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          body { background: white; }
        }
      `}</style>
    </div>
  );
}
