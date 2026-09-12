import React from 'react';
import { X, Smartphone, CheckCircle2, ShieldCheck, Mail, Phone, ExternalLink, Sparkles } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface AppExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onOpenIpModal?: () => void;
}

export const AppExportModal: React.FC<AppExportModalProps> = ({ isOpen, onClose, lang, onOpenIpModal }) => {
  const t = TRANSLATIONS[lang];
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  if (!isOpen) return null;

  const currentAppUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ais-pre-i5xpkuc356ospvz5amaab7-66595829497.europe-west3.run.app';
  const pwabuilderUrl = `https://www.pwabuilder.com/?site=${encodeURIComponent(currentAppUrl)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-emerald-50 via-white to-slate-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <img
              src="/icon.svg"
              alt="FeedCalc Pro Icon"
              className="size-10 rounded-xl shadow-xs border border-emerald-600/20 object-cover"
            />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {t.apkZipModalTitle}
              </h2>
              <p className="text-xs text-slate-500">
                {t.apkZipModalSubtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Section 1: Android APK / Mobile App */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-xs">
                  <Smartphone className="size-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  {t.installAppTitle}
                </h3>
              </div>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                Android & iOS Ready
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {t.installAppDesc}
            </p>

            {/* Direct In-App Install Button if supported */}
            {isInstallable && !isInstalled && (
              <button
                type="button"
                onClick={install}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition cursor-pointer"
              >
                <Smartphone className="size-4" />
                <span>{t.installAppAction}</span>
              </button>
            )}

            {isInstalled && (
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-100/70 p-2.5 rounded-lg">
                <CheckCircle2 className="size-4 text-emerald-600" />
                <span>التطبيق مثبت ويعمل بالفعل بنجاح كـ App مستقل على جهازك!</span>
              </div>
            )}

            {/* Step-by-step instructions for Android */}
            <div className="rounded-lg bg-white p-3.5 border border-emerald-100 text-xs text-slate-700 space-y-1.5">
              <p className="font-bold text-emerald-900 flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-emerald-600" />
                {t.installAndroidDirectTitle}
              </p>
              <p className="text-slate-600 leading-relaxed">
                {t.installAndroidDirectDesc}
              </p>
              {isIOS && (
                <p className="text-slate-500 pt-1 border-t border-slate-100 text-[11px]">
                  (لمستخدمي آيفون / آيباد: افتح Safari ثم اضغط زر "مشاركة Share" ثم "إضافة للشاشة الرئيسية Add to Home Screen").
                </p>
              )}
            </div>

            {/* PWABuilder APK Generator link */}
            <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
              <span className="text-xs text-slate-500">
                {t.pwabuilderDesc}
              </span>
              <a
                href={pwabuilderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
              >
                <span>فتح PWABuilder لإنشاء APK</span>
                <ExternalLink className="size-3.5" />
              </a>
            </div>
          </div>

          {/* Section 2: Exclusive Creator Attribution & Contact */}
          <div className="rounded-xl border border-emerald-200/80 bg-gradient-to-br from-white via-emerald-50/30 to-white p-4 text-xs space-y-2.5">
            <div className="flex items-center gap-2 text-emerald-800 font-bold">
              <ShieldCheck className="size-4 text-emerald-600" />
              <span>{t.developerCreditTitle}</span>
            </div>

            <p className="text-slate-600 leading-relaxed">
              تم إزالة أي علامة تجارية أو إشارة ذكاء اصطناعي من الكود والمشروع، والفضل والملكية الفكرية منسوبة لك وحدك بنسبة 100%:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-medium">
              <div className="rounded-lg bg-white border border-slate-200 p-2 text-slate-800">
                <span className="text-[10px] text-slate-400 block font-normal">{t.devBy}</span>
                <span className="font-extrabold text-emerald-700">{t.devName}</span>
              </div>
              <div className="rounded-lg bg-white border border-slate-200 p-2 text-slate-800">
                <span className="text-[10px] text-slate-400 block font-normal">{t.call} / واتساب</span>
                <a href="tel:+213655870392" className="font-bold hover:text-emerald-600 dir-ltr inline-block">
                  +213655870392
                </a>
              </div>
              <div className="rounded-lg bg-white border border-slate-200 p-2 text-slate-800">
                <span className="text-[10px] text-slate-400 block font-normal">{t.emailLabel}</span>
                <a href="mailto:boussiouxzaki@gmail.com" className="font-bold hover:text-emerald-600 break-all">
                  boussiouxzaki@gmail.com
                </a>
              </div>
            </div>

            {onOpenIpModal && (
              <div className="pt-2 border-t border-emerald-100 flex items-center justify-between">
                <span className="text-slate-500 text-[11px]">
                  {t.ipCopyrightYear}
                </span>
                <button
                  type="button"
                  id="btn-export-view-ip-cert"
                  onClick={() => {
                    onClose();
                    onOpenIpModal();
                  }}
                  className="inline-flex items-center gap-1.5 font-bold text-emerald-800 bg-white border border-emerald-300 rounded-lg px-2.5 py-1 hover:bg-emerald-50 transition cursor-pointer text-xs"
                >
                  <ShieldCheck className="size-3.5 text-emerald-600" />
                  <span>{t.ipCertificateTitle}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 bg-slate-50 px-6 py-3.5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-300 transition cursor-pointer"
          >
            {t.closeBtn}
          </button>
        </div>
      </div>
    </div>
  );
};
