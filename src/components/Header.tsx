import React, { useState, useRef, useEffect } from 'react';
import { Wheat, Globe, Sparkles, Phone, Check, ChevronDown, Smartphone, ShieldCheck, Download, ExternalLink, KeyRound } from 'lucide-react';
import { QUICK_PRESETS, QuickPreset } from '../data/speciesData';
import { Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { downloadFile } from '../utils/downloader';

interface HeaderProps {
  lang: Language;
  onSelectLang: (lang: Language) => void;
  onSelectPreset: (preset: QuickPreset) => void;
  onOpenExportModal?: () => void;
  onOpenPricingModal?: () => void;
  onOpenIpModal?: () => void;
  onOpenActivationModal?: () => void;
  onOpenAdmin?: () => void;
  isActivated?: boolean;
}

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ar', label: 'العربية', flag: '🇩🇿' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
];

export const Header: React.FC<HeaderProps> = ({
  lang,
  onSelectLang,
  onSelectPreset,
  onOpenExportModal,
  onOpenPricingModal,
  onOpenIpModal,
  onOpenActivationModal,
  onOpenAdmin,
  isActivated = false,
}) => {
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [adminClicks, setAdminClicks] = useState(0);
  const [isAdminSession, setIsAdminSession] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const t = TRANSLATIONS[lang];

  useEffect(() => {
    try {
      setIsAdminSession(sessionStorage.getItem('fc_admin_auth') === 'authorized_zaki');
    } catch {}
  }, []);

  const handleVersionClick = () => {
    const next = adminClicks + 1;
    setAdminClicks(next);
    if (next >= 5) {
      setAdminClicks(0);
      if (onOpenAdmin) onOpenAdmin();
    }
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setLangMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPresetName = (preset: QuickPreset) => {
    switch (lang) {
      case 'de':
        return preset.nameDe || preset.nameEn;
      case 'zh':
        return preset.nameZh || preset.nameEn;
      case 'fr':
        return preset.nameFr;
      case 'es':
        return preset.nameEs;
      case 'en':
        return preset.nameEn;
      case 'ar':
      default:
        return preset.name;
    }
  };

  const currentLangObj = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  return (
    <header className="relative overflow-hidden border-b border-emerald-900/10 bg-gradient-to-b from-emerald-50/80 via-slate-50 to-slate-50 dark:from-slate-900 dark:to-slate-950">
      {/* Subtle radial pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,rgba(16,185,129,0.12)_0%,transparent_70%)] pointer-events-none" />

      {/* Top utility bar */}
      <div className="relative mx-auto max-w-6xl px-4 pt-3.5 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/50 pb-3">
        {/* Brand logo */}
        <div className="flex items-center gap-2.5">
          <img
            src="/icon.svg"
            alt="FeedCalc Pro Icon"
            className="size-9 rounded-xl shadow-sm border border-emerald-600/20 object-cover shrink-0"
          />
          <div>
            <span className="font-extrabold text-lg tracking-tight text-slate-900">
              FeedCalc <span className="text-emerald-600">Pro</span>
            </span>
            <button
              type="button"
              onClick={handleVersionClick}
              className="hidden sm:inline-block text-[10px] font-medium text-slate-500 mx-2 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.5 rounded-sm hover:bg-emerald-100 transition cursor-pointer select-none"
              title="FeedCalc Pro v2.1"
            >
              v2.1
            </button>
          </div>
        </div>

        {/* Developer info badge & Language Selector */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Visitor Mode Indicator */}
          {!isActivated && (
            <span className="hidden md:inline-flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200/80 px-2.5 py-1 text-xs font-bold text-amber-800 shadow-2xs">
              <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
              <span>{lang === 'ar' ? 'وضع الزائر (تجريبي)' : 'Visitor Mode'}</span>
            </span>
          )}

          {/* Author info pill */}
          <div className="flex items-center gap-1.5 rounded-lg border border-emerald-200/80 bg-white/95 px-2.5 py-1 text-xs font-medium text-slate-700 shadow-2xs">
            <span className="text-[11px] text-slate-500 hidden md:inline">{t.devBy}</span>
            <span className="font-bold text-slate-900">
              {t.devName}
            </span>
            <a
              href="tel:+213655870392"
              className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-semibold transition-colors px-1 py-0.5 rounded hover:bg-emerald-50"
              title={`${t.call}: +213655870392`}
            >
              <Phone className="size-3 text-emerald-600" />
              <span className="text-[11px] dir-ltr tabular-nums">+213655870392</span>
            </a>
          </div>

          {/* Multilingual Selector */}
          <div className="relative" ref={langMenuRef}>
            <button
              type="button"
              id="btn-language-dropdown"
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white/95 px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
              title="Select Language / اختيار اللغة"
            >
              <Globe className="size-3.5 text-emerald-600" />
              <span className="text-xs">{currentLangObj.flag}</span>
              <span className="font-medium">{currentLangObj.label}</span>
              <ChevronDown className="size-3 text-slate-400" />
            </button>

            {langMenuOpen && (
              <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-1.5 w-36 rounded-xl border border-slate-200 bg-white p-1 shadow-lg z-50">
                {LANGUAGES.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => {
                      onSelectLang(item.code);
                      setLangMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium text-left rtl:text-right transition-colors cursor-pointer ${
                      lang === item.code
                        ? 'bg-emerald-50 text-emerald-800 font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{item.flag}</span>
                      <span>{item.label}</span>
                    </span>
                    {lang === item.code && (
                      <Check className="size-3.5 text-emerald-600" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Intellectual Property & Legal Protection button */}
          {onOpenIpModal && (
            <button
              type="button"
              id="btn-header-open-ip"
              onClick={onOpenIpModal}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300/80 bg-white/95 px-2.5 py-1.5 text-xs font-bold text-emerald-800 shadow-2xs hover:bg-emerald-50 hover:text-emerald-900 transition cursor-pointer"
              title={t.ipModalTitle}
            >
              <ShieldCheck className="size-3.5 text-emerald-600" />
              <span className="hidden sm:inline">{t.ipBtn}</span>
              <span className="sm:hidden">IP</span>
            </button>
          )}

          {/* Activation & Pro License Button */}
          {onOpenActivationModal && (
            <button
              type="button"
              id="btn-header-activation"
              onClick={onOpenActivationModal}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold shadow-xs transition cursor-pointer ${
                isActivated
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-amber-400 hover:bg-amber-500 text-slate-950 ring-2 ring-amber-300/60 animate-pulse'
              }`}
              title={isActivated ? 'النسخة الاحترافية مفعلة برقم ترخيص' : 'تفعيل ترخيص التطبيق / إدخال الكود'}
            >
              <KeyRound className="size-3.5" />
              <span>
                {isActivated 
                  ? (lang === 'ar' ? 'PRO مفعل' : 'PRO Active') 
                  : (lang === 'ar' ? 'تفعيل الترخيص 🔑' : 'Activate 🔑')}
              </span>
            </button>
          )}

          {/* Global Pro Commercial License button */}
          {onOpenPricingModal && (
            <button
              type="button"
              id="btn-global-pro-pricing"
              onClick={onOpenPricingModal}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-700 px-2.5 py-1.5 text-xs font-bold text-white shadow-xs hover:from-emerald-700 hover:to-teal-800 transition cursor-pointer"
              title="Global Commercial License / ترخيص النسخة العالمية"
            >
              <Sparkles className="size-3 text-amber-300 fill-amber-300" />
              <span>{t.goProBtn}</span>
            </button>
          )}

          {/* Direct APK / Mobile App button */}
          {onOpenExportModal && (
            <button
              type="button"
              id="btn-open-export-modal"
              onClick={onOpenExportModal}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white/95 px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
              title={t.apkZipModalTitle}
            >
              <Smartphone className="size-3.5 text-emerald-600" />
              <span>{t.apkZipBtn}</span>
            </button>
          )}

          {/* Secret Admin Portal Button - only visible if already logged into admin session */}
          {onOpenAdmin && isAdminSession && (
            <button
              type="button"
              id="btn-secret-admin"
              onClick={onOpenAdmin}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-700/80 bg-slate-900 px-2 py-1.5 text-xs font-bold text-emerald-400 shadow-2xs hover:bg-slate-800 hover:text-emerald-300 transition cursor-pointer"
              title="لوحة تحكم وتوليد الأكواد (المهندس زكريا)"
            >
              <ShieldCheck className="size-3.5" />
              <span className="hidden lg:inline text-[11px]">لوحة الإدارة</span>
            </button>
          )}
        </div>
      </div>

      {/* Hero content */}
      <div className="relative mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="flex flex-col items-center text-center gap-2.5">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-600/20 bg-emerald-50 px-4 py-1 text-xs font-medium text-emerald-800 shadow-2xs">
            <Wheat className="size-3.5 text-emerald-600" />
            <span>{t.appSubtitle}</span>
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
            {t.appName}
          </h1>

          {/* Quick presets row */}
          <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
            <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
              <Sparkles className="size-3 text-emerald-600" />
              {t.quickPresets}
            </span>
            {QUICK_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                id={`preset-${preset.id}`}
                onClick={() => onSelectPreset(preset)}
                className="rounded-full border border-slate-200 bg-white/90 px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-800 transition-all shadow-2xs cursor-pointer"
              >
                {getPresetName(preset)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};
