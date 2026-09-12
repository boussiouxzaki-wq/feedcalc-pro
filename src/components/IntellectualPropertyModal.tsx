import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Award,
  Lock,
  FileText,
  Copy,
  Check,
  Download,
  Phone,
  Mail,
  Scale,
  Building,
  Globe2,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { downloadTextAsFile } from '../utils/downloader';

interface IntellectualPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const IntellectualPropertyModal: React.FC<IntellectualPropertyModalProps> = ({
  isOpen,
  onClose,
  lang,
}) => {
  const [copied, setCopied] = useState(false);
  const t = TRANSLATIONS[lang];

  if (!isOpen) return null;

  const copyrightText = `================================================================================
OFFICIAL INTELLECTUAL PROPERTY & PROPRIETARY LICENSE DECLARATION
CERTIFICATE OF SOLE AUTHORSHIP AND EXCLUSIVE COPYRIGHT
================================================================================

PROJECT: FeedCalc Pro - Smart Livestock & Aquaculture Nutrition System
SOLE AUTHOR & EXCLUSIVE PROPRIETOR: Eng. ZAKARYA Bessioud (م. زكريا بسيود)
OFFICIAL CONTACT:
  - Phone / WhatsApp: +213655870392
  - Email: boussiouxzaki@gmail.com
  - Applet Digital Signature: 6a5be6c1-e700-4574-9bb7-8eaf0af216f5

COPYRIGHT NOTICE:
  Copyright (c) 2026 ZAKARYA Bessioud. All Rights Reserved.
  Tous droits réservés. Todos los derechos reservados. 版权所有.

1. SCOPE OF PROTECTED ASSETS:
  - Source Code & Software Architecture: All TypeScript, React, Vite, and CSS algorithms.
  - Nutritional Calculation Engines: Precision equations for daily dry matter intake,
    metabolizable energy, crude protein ratios, and dynamic Feed Conversion Ratio (FCR).
  - Scientific Database: Laboratory nutritional matrices and feeding schedules across
    13 species: Camels, Dairy Goats, Broiler Chickens, Layer Hens, Swine, Sheep,
    Dairy Cattle, Beef Cattle, Rabbits, Honeybees, Tilapia, Carp, and Seabass.
  - UI/UX & Brand Assets: "FeedCalc Pro" designation, vector iconography, layout designs,
    and six-language translation architecture (Arabic, English, French, Spanish, German, Chinese).

2. LEGAL BASIS & INTERNATIONAL TREATIES:
  - Berne Convention for the Protection of Literary and Artistic Works (WIPO).
  - WIPO Copyright Treaty (WCT).
  - National Intellectual Property Legislation (ONDA / INAPI).

3. LICENSE TERMS & PROHIBITED ACTIONS:
  - Personal & Farming Use: Farmers, livestock producers, and agricultural engineers
    are granted a non-exclusive license to use this software for on-farm ration calculations.
  - Reverse Engineering: Decompilation, disassembly, extraction of mathematical logic,
    or source tampering is strictly prohibited by international law.
  - Commercial Redistribution: No entity, company, or third party may resell, white-label,
    re-host, or repackage this software or its databases without explicit, written,
    and signed commercial authorization from Eng. ZAKARYA Bessioud.

SIGNED & ISSUED BY SOLE CREATOR:
Eng. ZAKARYA Bessioud
Algiers, 2026
================================================================================`;

  const handleCopyNotice = () => {
    navigator.clipboard.writeText(copyrightText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  const handleDownloadCertificate = () => {
    downloadTextAsFile(
      'FeedCalc-Pro-Intellectual-Property-Certificate-2026.txt',
      copyrightText,
      'text/plain;charset=utf-8'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Modal Top Banner */}
        <div className="flex items-center justify-between border-b border-emerald-800/20 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 px-5 sm:px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-inner">
              <ShieldCheck className="size-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  {t.ipModalTitle}
                </h2>
                <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold">
                  Official IP
                </span>
              </div>
              <p className="text-xs text-slate-300 line-clamp-1">
                {t.ipModalSubtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-ip-modal"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition cursor-pointer"
            title={t.closeBtn}
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="max-h-[75vh] overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Certificate Badge Banner */}
          <div className="rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50/80 via-white to-emerald-50/80 p-4 sm:p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Award className="size-5 text-emerald-700" />
                  <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-900">
                    {t.ipCertificateTitle}
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-900">
                  {t.ipSoleAuthorNotice}
                </p>
                <p className="text-xs text-slate-600 font-medium">
                  {t.ipCopyrightYear}
                </p>
              </div>

              <div className="shrink-0 flex sm:flex-col gap-2">
                <a
                  href="tel:+213655870392"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition shadow-2xs"
                >
                  <Phone className="size-3.5" />
                  <span className="dir-ltr tabular-nums">+213655870392</span>
                </a>
                <a
                  href="mailto:boussiouxzaki@gmail.com"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                >
                  <Mail className="size-3.5 text-emerald-600" />
                  <span>boussiouxzaki@gmail.com</span>
                </a>
              </div>
            </div>
          </div>

          {/* Section 1: Scope of Protected Assets */}
          <div className="space-y-3">
            <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Lock className="size-4 text-emerald-600" />
              <span>{t.ipScopeTitle}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-1.5">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-emerald-600" />
                  <span>الخوارزميات والحسابات</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  {t.ipScopeAlgorithms}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-1.5">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-teal-600" />
                  <span>قواعد البيانات العلمية</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  {t.ipScopeDatabase}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-1.5">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-blue-600" />
                  <span>الكود المصدر والتصميم</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  {t.ipScopeUi}
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Legal Treaties & Institutional Protection */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 text-xs">
            <h3 className="font-extrabold text-slate-900 flex items-center gap-2 text-xs sm:text-sm">
              <Scale className="size-4 text-emerald-600" />
              <span>{t.ipTreatiesTitle}</span>
            </h3>
            <p className="text-slate-600 leading-relaxed">
              {t.ipTreatiesBody}
            </p>
            <div className="flex flex-wrap gap-2 pt-2 text-[11px] font-semibold text-slate-600">
              <span className="rounded-md bg-slate-100 px-2.5 py-1 border border-slate-200">
                ONDA (حقوق المؤلف والحقوق المجاورة)
              </span>
              <span className="rounded-md bg-slate-100 px-2.5 py-1 border border-slate-200">
                INAPI (الملكية الصناعية والتجارية)
              </span>
              <span className="rounded-md bg-slate-100 px-2.5 py-1 border border-slate-200">
                Berne Convention (180+ Countries)
              </span>
              <span className="rounded-md bg-slate-100 px-2.5 py-1 border border-slate-200">
                WIPO Copyright Treaty (WCT)
              </span>
            </div>
          </div>

          {/* Section 3: License Terms and Restrictions */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-2 text-xs">
            <h3 className="font-extrabold text-amber-950 flex items-center gap-2 text-xs sm:text-sm">
              <AlertTriangle className="size-4 text-amber-600" />
              <span>{t.ipLegalNoticeTitle}</span>
            </h3>
            <p className="text-amber-900 leading-relaxed font-medium">
              {t.ipLegalNoticeBody}
            </p>
          </div>

          {/* Verification Hash & Signature */}
          <div className="rounded-lg bg-slate-100/90 p-3 font-mono text-[11px] text-slate-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border border-slate-200">
            <div>
              <span className="text-slate-400 block sm:inline">DIGITAL CERTIFICATE SIGNATURE:</span>{' '}
              <span className="font-bold text-slate-800">FEEDCALC-PRO-AUTH-6A5BE6C1-2026</span>
            </div>
            <div className="text-emerald-700 font-bold flex items-center gap-1">
              <ShieldCheck className="size-3.5" />
              <span>AUTHENTICATED BY CREATOR</span>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="border-t border-slate-200 bg-slate-50 px-5 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-copy-ip-license"
              onClick={handleCopyNotice}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition shadow-2xs cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="size-3.5 text-emerald-600" />
                  <span className="text-emerald-700">{t.ipCopySuccess}</span>
                </>
              ) : (
                <>
                  <Copy className="size-3.5 text-slate-500" />
                  <span>{t.ipCopyLicenseBtn}</span>
                </>
              )}
            </button>

            <button
              type="button"
              id="btn-download-ip-cert"
              onClick={handleDownloadCertificate}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition shadow-2xs cursor-pointer"
            >
              <Download className="size-3.5 text-emerald-700" />
              <span>{t.ipDownloadCertBtn}</span>
            </button>
          </div>

          <button
            type="button"
            id="btn-close-ip-bottom"
            onClick={onClose}
            className="rounded-xl bg-slate-800 px-5 py-2 text-xs font-bold text-white hover:bg-slate-900 transition shadow-2xs cursor-pointer"
          >
            {t.closeBtn}
          </button>
        </div>
      </div>
    </div>
  );
};
