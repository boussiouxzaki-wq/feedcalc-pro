import React from 'react';
import { Wheat, ShieldCheck, Phone, MessageSquare, Mail } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';

interface FooterProps {
  lang: Language;
  onOpenExportModal?: () => void;
  onOpenIpModal?: () => void;
  onOpenAdmin?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ lang, onOpenIpModal, onOpenAdmin }) => {
  const t = TRANSLATIONS[lang];

  return (
    <footer className="mt-16 border-t border-slate-200 bg-white/70 py-10 text-center no-print">
      <div className="mx-auto max-w-5xl px-4">
        {/* Branding */}
        <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-slate-700">
          <img
            src="/icon.svg"
            alt="FeedCalc Pro Logo"
            className="size-5 rounded-md shadow-2xs inline-block"
          />
          <span>{t.footerTagline}</span>
        </div>

        {/* Disclaimer */}
        <p className="mt-2 text-[11px] sm:text-xs text-slate-500 max-w-xl mx-auto leading-relaxed">
          {t.footerDisclaimer}
        </p>

        {/* Author / Developer Contact Card */}
        <div className="mt-6 inline-flex flex-col sm:flex-row items-center gap-3 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50/70 via-white to-emerald-50/70 p-3.5 sm:px-6 shadow-xs">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">{t.devBy}</span>
            <span className="font-extrabold text-slate-900 text-sm">{t.devName}</span>
          </div>

          <div className="flex items-center flex-wrap justify-center gap-2">
            <a
              href="tel:+213655870392"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-emerald-700 transition-colors"
              title={`${t.call} +213655870392`}
            >
              <Phone className="size-3.5" />
              <span className="tabular-nums dir-ltr">+213655870392</span>
            </a>

            <a
              href="https://wa.me/213655870392"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 transition-colors shadow-2xs"
              title={`${t.whatsapp} +213655870392`}
            >
              <MessageSquare className="size-3.5 text-emerald-600" />
              <span>{t.whatsapp}</span>
            </a>

            <a
              href="mailto:boussiouxzaki@gmail.com"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
              title="Email: boussiouxzaki@gmail.com"
            >
              <Mail className="size-3.5 text-emerald-600" />
              <span className="dir-ltr">boussiouxzaki@gmail.com</span>
            </a>
          </div>
        </div>

        {/* Developer Admin Access Button */}
        {onOpenAdmin && (
          <div className="mt-5 pt-4 border-t border-slate-200/80 flex items-center justify-center">
            <button
              type="button"
              id="btn-footer-admin-panel"
              onClick={onOpenAdmin}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 hover:text-amber-200 px-4 py-2 text-xs font-extrabold transition shadow-sm cursor-pointer border border-slate-700"
              title="لوحة تحكم وتوليد أكواد الاشتراكات للزبائن"
            >
              <span className="text-amber-400">🔑</span>
              <span>لوحة التحكم وتوليد الأكواد (للمهندس زكريا)</span>
            </button>
          </div>
        )}

        {/* Standards and Intellectual Property Notice */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="size-3 text-emerald-600" />
            {t.scientificallyGrounded}
          </span>
          <span>•</span>
          {onOpenIpModal ? (
            <button
              type="button"
              id="btn-footer-ip-modal"
              onClick={onOpenIpModal}
              className="inline-flex items-center gap-1.5 text-slate-600 hover:text-emerald-700 hover:underline transition font-semibold cursor-pointer"
            >
              <span className="tabular-nums">FeedCalc Pro © 2026 — ZAKARYA Bessioud</span>
              <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold border border-emerald-200">
                {t.ipBtn}
              </span>
            </button>
          ) : (
            <span className="tabular-nums">FeedCalc Pro © 2026 — ZAKARYA Bessioud</span>
          )}
        </div>
      </div>
    </footer>
  );
};
