import React from 'react';
import { X, Check, Star, ShieldCheck, Sparkles, Phone, Mail, Globe, ArrowRight, Building2 } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';

interface GlobalPricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const GlobalPricingModal: React.FC<GlobalPricingModalProps> = ({ isOpen, onClose, lang }) => {
  const t = TRANSLATIONS[lang];

  if (!isOpen) return null;

  const handleInquire = (planName: string) => {
    const text = encodeURIComponent(
      `Hello Eng. ZAKARYA Bessioud, I am interested in FeedCalc Pro Global Commercial License (${planName}). Please send details.`
    );
    window.open(`https://wa.me/213655870392?text=${text}`, '_blank');
  };

  const isRtl = lang === 'ar';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-emerald-100 bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 px-5 sm:px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-xs text-white shadow-inner">
              <Globe className="size-5 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold tracking-tight">
                  {t.pricingModalTitle}
                </h2>
                <span className="rounded-full bg-amber-400/90 text-slate-950 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide">
                  Global
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 line-clamp-1">
                {t.pricingModalSubtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Subheading Intro */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-700">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="size-5 text-emerald-600 shrink-0" />
              <span>
                {lang === 'ar'
                  ? 'نموذج الترخيص التجاري المعتمد للاستخدام في المزارع الكبرى، مصانع الأعلاف، والمهندسين الاستشاريين عالمياً.'
                  : lang === 'zh'
                  ? '面向全球大型规模化养殖场、饲料加工工业企业及动物营养专家的商业授权体系。'
                  : lang === 'fr'
                  ? 'Modèle de licence commerciale pour élevages industriels, meuneries et consultants en nutrition.'
                  : lang === 'es'
                  ? 'Modelo de licencia comercial para granjas industriales, fábricas de pienso y nutricionistas.'
                  : 'Commercial licensing model for industrial livestock farms, feed mills, and nutritional consultants worldwide.'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 font-bold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
              <Star className="size-3.5 text-amber-500 fill-amber-500" />
              <span>Google Play Ready</span>
            </div>
          </div>

          {/* 3 Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tier 1: Starter */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col justify-between space-y-4 hover:border-slate-300 transition shadow-2xs">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {lang === 'ar' ? 'النسخة الحرة' : 'Community'}
                </span>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-900">$0</span>
                  <span className="text-xs text-slate-500">
                    {lang === 'ar' ? 'مجاناً مدى الحياة' : 'Free Forever'}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-600">
                  {lang === 'ar'
                    ? 'الحسابات الأساسية لدواجن اللحم والأسماك مع الجداول القياسية'
                    : 'Standard calculations for broilers & aquaculture with default FCR tables.'}
                </p>

                <ul className="mt-4 space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <li className="flex items-center gap-2">
                    <Check className="size-3.5 text-emerald-600 shrink-0" />
                    <span>{lang === 'ar' ? 'تشغيل 100% بدون إنترنت' : '100% Offline operation'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-3.5 text-emerald-600 shrink-0" />
                    <span>{lang === 'ar' ? 'دواجن، مواشي وأسماك' : 'Core livestock formulas'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-3.5 text-emerald-600 shrink-0" />
                    <span>{lang === 'ar' ? 'تصدير تقرير PDF علمي' : 'Standard PDF exports'}</span>
                  </li>
                </ul>
              </div>

              <div className="rounded-lg bg-slate-100 py-2 text-center text-xs font-bold text-slate-700">
                {lang === 'ar' ? 'مفعّل حالياً' : 'Current Active Plan'}
              </div>
            </div>

            {/* Tier 2: Pro Global (Highlighted) */}
            <div className="relative rounded-xl border-2 border-emerald-500 bg-gradient-to-b from-emerald-50/50 via-white to-white p-4 flex flex-col justify-between space-y-4 shadow-md">
              <div className="absolute -top-2.5 end-4">
                <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-black text-white uppercase tracking-wide shadow-xs">
                  {lang === 'ar' ? 'الأكثر طلباً' : 'Most Popular'}
                </span>
              </div>

              <div>
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="size-3 text-emerald-600" />
                  {lang === 'ar' ? 'الترخيص الاحترافي' : 'Pro Global'}
                </span>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-900">$9.99</span>
                  <span className="text-xs text-slate-500">
                    {lang === 'ar' ? '/ شهر أو $79 سنوياً' : '/ mo or $79/yr'}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-600">
                  {lang === 'ar'
                    ? 'للمزارع ومربي الثروة الحيوانية والمهندسين الزراعيين الراغبين في أقصى دقة وتوفير.'
                    : 'For commercial farms & nutritionists requiring customized nutrients & multi-currency.'}
                </p>

                <ul className="mt-4 space-y-2 text-xs text-slate-700 border-t border-emerald-100 pt-3">
                  <li className="flex items-center gap-2 font-medium">
                    <Check className="size-3.5 text-emerald-600 shrink-0" />
                    <span>{lang === 'ar' ? 'تخصيص مكونات العلف الستة' : 'Custom 6-Nutrient Feed Builder'}</span>
                  </li>
                  <li className="flex items-center gap-2 font-medium">
                    <Check className="size-3.5 text-emerald-600 shrink-0" />
                    <span>{lang === 'ar' ? 'دعم جميع العملات ($ / € / £ / DA)' : 'All Currencies ($ / € / £ / etc.)'}</span>
                  </li>
                  <li className="flex items-center gap-2 font-medium">
                    <Check className="size-3.5 text-emerald-600 shrink-0" />
                    <span>{lang === 'ar' ? 'تقارير باسم وشعار مزرعتك' : 'Custom Farm Logo on PDF'}</span>
                  </li>
                  <li className="flex items-center gap-2 font-medium">
                    <Check className="size-3.5 text-emerald-600 shrink-0" />
                    <span>{lang === 'ar' ? 'دعم التحويل (kg / lbs)' : 'Metric & Imperial (kg / lbs)'}</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => handleInquire('Pro Global - $9.99/mo')}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition cursor-pointer"
              >
                <span>{lang === 'ar' ? 'طلب ترخيص Pro' : 'Inquire / Order License'}</span>
                <ArrowRight className={`size-3.5 ${isRtl ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Tier 3: Enterprise & Feed Mills */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col justify-between space-y-4 hover:border-slate-300 transition shadow-2xs">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Building2 className="size-3 text-slate-500" />
                  {lang === 'ar' ? 'المصانع والشركات' : 'Feed Mills (B2B)'}
                </span>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-900">$299</span>
                  <span className="text-xs text-slate-500">
                    {lang === 'ar' ? 'ترخيص كامل لمرة واحدة' : 'One-time fee'}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-600">
                  {lang === 'ar'
                    ? 'نسخة خاصة باسم مصنعك وشعارك وعلامتك التجارية مع قاعدة بيانات أعلافك الخاصة.'
                    : 'White-label custom app branded for your feed brand or veterinary group.'}
                </p>

                <ul className="mt-4 space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <li className="flex items-center gap-2">
                    <Check className="size-3.5 text-emerald-600 shrink-0" />
                    <span>{lang === 'ar' ? 'علامتك التجارية وشعارك الخاص' : 'Full White-labeling & Branding'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-3.5 text-emerald-600 shrink-0" />
                    <span>{lang === 'ar' ? 'إضافة تركيبات أعلاف مصنعك' : 'Pre-loaded company feed catalog'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-3.5 text-emerald-600 shrink-0" />
                    <span>{lang === 'ar' ? 'استشارة هندسية خاصة مباشرة' : 'Direct consultation with author'}</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => handleInquire('Feed Mill Enterprise - $299')}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50 transition cursor-pointer"
              >
                <span>{lang === 'ar' ? 'تواصل للاتفاق' : 'Contact for Enterprise'}</span>
                <Phone className="size-3 text-emerald-600" />
              </button>
            </div>
          </div>

          {/* Direct Developer Contact Box */}
          <div className="rounded-xl border border-emerald-900/15 bg-gradient-to-r from-emerald-50 via-teal-50/70 to-slate-50 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-start">
              <h4 className="text-sm font-bold text-slate-900">
                {lang === 'ar'
                  ? 'مطور ومالك حقوق التطبيق: المهندس زكريا بسيود'
                  : 'Sole Developer & Intellectual Property Owner: Eng. ZAKARYA Bessioud'}
              </h4>
              <p className="text-xs text-slate-600">
                {lang === 'ar'
                  ? 'للاتفاق التجاري المباشر، عقود الرعاية الدولية، أو تفعيل رخص التوزيع.'
                  : 'For commercial licensing, international sponsorship, or distribution keys.'}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href="https://wa.me/213655870392?text=Hello%20Eng.%20ZAKARYA%20Bessioud,%20I%20am%20interested%20in%20FeedCalc%20Pro%20License"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
              >
                <Phone className="size-3.5" />
                <span>WhatsApp</span>
              </a>
              <a
                href="mailto:boussiouxzaki@gmail.com?subject=FeedCalc%20Pro%20Commercial%20License"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                <Mail className="size-3.5 text-slate-500" />
                <span>Email</span>
              </a>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-100 bg-slate-50/70 px-6 py-3 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            FeedCalc Pro © 2026 — All international rights reserved
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-200/80 px-4 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-300 transition cursor-pointer"
          >
            {t.closeBtn}
          </button>
        </div>
      </div>
    </div>
  );
};
