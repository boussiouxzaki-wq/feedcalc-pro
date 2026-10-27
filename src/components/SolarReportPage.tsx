import React, { useState, useEffect } from 'react';
import {
  Download,
  Printer,
  Copy,
  Check,
  ArrowRight,
  Sun,
  Award,
  FileCode,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Globe
} from 'lucide-react';
import { Language } from '../types';
import { formatNum } from '../utils/translations';
import {
  SolarPumpCalculationResult,
  PumpMotorType,
  SolarPanelType,
  InverterType,
  GridStatus,
  QualityTier
} from './SolarPumpCalculator';
import { exportSolarPumpPdfReport } from '../utils/solarPdfGenerator';
import { generateSolarOfflineHtmlReport } from '../utils/offlineReportGenerator';
import { universalDownloadText } from '../utils/universalDownloader';

interface SolarReportPageProps {
  lang: Language;
}

export const SolarReportPage: React.FC<SolarReportPageProps> = ({ lang }) => {
  const isAr = lang === 'ar';
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [preparedPdf, setPreparedPdf] = useState<{ blob?: Blob; blobUrl: string; file?: File; fileName: string } | null>(null);

  // Parse URL parameters
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const Q = parseFloat(params.get('q') || '50') || 50;
  const H = parseFloat(params.get('h') || '70') || 70;
  const pumpType = (params.get('pump') || 'ac_3phase') as PumpMotorType;
  const panelType = (params.get('panel') || 'mono_black') as SolarPanelType;
  const inverterType = (params.get('inv') || 'solar_vfd') as InverterType;
  const gridStatus = (params.get('grid') || 'no') as GridStatus;
  const qualityTier = (params.get('tier') || 'premium') as QualityTier;
  const pWatt = parseFloat(params.get('pWatt') || '550') || 550;
  const psh = parseFloat(params.get('psh') || '5.0') || 5.0;

  // Compute sizing according to Cambridge & FAO 56 standards
  let pumpEfficiency = 0.52;
  let pvOversizeRatio = 1.35;
  if (pumpType === 'dc_bldc') {
    pumpEfficiency = 0.78;
    pvOversizeRatio = 1.15;
  } else if (pumpType === 'ac_1phase') {
    pumpEfficiency = 0.46;
    pvOversizeRatio = 1.45;
  }

  const P_pump_kw = (Q * H) / (367 * psh * pumpEfficiency);
  const P_pump_hp = P_pump_kw * 1.34102;

  let panelDeratingFactor = 1.0;
  let tempDeratingPercent = 7.5;
  if (panelType === 'poly_blue') {
    panelDeratingFactor = 1.15;
    tempDeratingPercent = 16.0;
  } else if (panelType === 'topcon_n') {
    panelDeratingFactor = 0.94;
    tempDeratingPercent = 5.0;
  }

  const total_pv_watts = P_pump_kw * 1000 * pvOversizeRatio * panelDeratingFactor;
  const total_pv_kw = total_pv_watts / 1000;
  let panelCount = Math.ceil(total_pv_watts / pWatt);

  let stringConfig = '';
  if (pumpType === 'ac_3phase') {
    if (panelCount <= 18) {
      if (panelCount % 2 !== 0) panelCount++;
      stringConfig = isAr
        ? `مصفوفة مفردة: ${panelCount} لوح موصولة كلها على التوالي (Series String) لتأمين جهد MPPT (~${Math.round(panelCount * 42)}V)`
        : `Single String: ${panelCount} panels in series for optimal MPPT (~${Math.round(panelCount * 42)}V)`;
    } else {
      const strings = 2;
      let perString = Math.ceil(panelCount / strings);
      if (perString % 2 !== 0) perString++;
      panelCount = perString * strings;
      stringConfig = isAr
        ? `مصفوفتان متوازيتان (2 Strings in Parallel): كل مصفوفة تضم ${perString} لوح على التوالي (إجمالي ${panelCount} لوح)`
        : `2 Parallel Strings: ${perString} panels per string in series (Total ${panelCount} panels)`;
    }
  } else if (pumpType === 'ac_1phase') {
    if (panelCount % 2 !== 0) panelCount++;
    stringConfig = isAr
      ? `مصفوفة ${panelCount} لوح (توصيل هجين توالي/توازي حسب جهد دخول VFD المعتمد 220V)`
      : `Array of ${panelCount} panels matched to 220V single-phase VFD MPPT window`;
  } else {
    if (panelCount % 2 !== 0) panelCount++;
    stringConfig = isAr
      ? `توصيل منخفض الجهد (Low DC Bus): ${panelCount} لوح متوافقة مباشرة مع محكم DC MPPT`
      : `${panelCount} panels directly configured for the DC MPPT controller voltage`;
  }

  let inverterMultiplier = 1.25;
  if (inverterType === 'hybrid') {
    inverterMultiplier = 1.30;
  } else if (inverterType === 'dc_mppt') {
    inverterMultiplier = 1.15;
  }

  const inverterKw = parseFloat((P_pump_kw * inverterMultiplier).toFixed(1));
  const recommendedInverterHp = parseFloat((P_pump_hp * inverterMultiplier).toFixed(1));

  let backupGeneratorKva: number | undefined;
  if (inverterType === 'hybrid') {
    backupGeneratorKva = Math.ceil((P_pump_kw * 1.55) / 0.8);
  }

  const hourlyFlow = Q / psh;
  const dailyHydraulicEnergy = (Q * H) / (367 * pumpEfficiency);

  const result: SolarPumpCalculationResult = {
    waterQ: Q,
    totalHead: H,
    peakSunHours: psh,
    pumpEfficiency: Math.round(pumpEfficiency * 100),
    pumpPowerKw: parseFloat(P_pump_kw.toFixed(2)),
    pumpPowerHp: parseFloat(P_pump_hp.toFixed(1)),
    totalPvWatts: Math.round(total_pv_watts),
    totalPvKw: parseFloat(total_pv_kw.toFixed(2)),
    panelWatt: pWatt,
    panelCount,
    inverterKw,
    hourlyFlow: parseFloat(hourlyFlow.toFixed(1)),
    dailyHydraulicEnergy: parseFloat(dailyHydraulicEnergy.toFixed(2)),
    recommendedInverterHp,
    pumpType,
    panelType,
    inverterType,
    stringConfig,
    backupGeneratorKva,
    tempDeratingPercent,
    gridStatus,
    qualityTier,
  };

  const getPumpLabel = (type: PumpMotorType) => {
    switch (type) {
      case 'ac_3phase':
        return isAr ? 'مضخة تيار متناوب ثلاثية الطور (AC 3-Phase 380V)' : 'AC 3-Phase 380V Submersible Pump';
      case 'dc_bldc':
        return isAr ? 'مضخة تيار مستمر فائقة الكفاءة (DC BLDC عديمة الفحمات)' : 'DC BLDC Brushless High-Efficiency Pump';
      case 'ac_1phase':
        return isAr ? 'مضخة تيار متناوب أحادية الطور (AC 1-Phase 220V)' : 'AC 1-Phase 220V Submersible Pump';
    }
  };

  const getPanelLabel = (type: SolarPanelType) => {
    switch (type) {
      case 'mono_black':
        return isAr ? 'أحادي البلورة أسود (Monocrystalline Black) — كفاءة 22%' : 'Monocrystalline Black Panels (22% Eff)';
      case 'poly_blue':
        return isAr ? 'متعدد البلورات أزرق (Polycrystalline Blue) — كفاءة 17%' : 'Polycrystalline Blue Panels (17% Eff)';
      case 'topcon_n':
        return isAr ? 'تقنية N-Type TOPCon مزدوج الوجه — كفاءة 24%' : 'N-Type TOPCon Bifacial Panels (24% Eff)';
    }
  };

  const getInverterLabel = (type: InverterType) => {
    switch (type) {
      case 'solar_vfd':
        return isAr ? 'مغير تردد شمسي VFD ذكي مستقل (Solar VFD MPPT)' : 'Solar VFD MPPT Dedicated Inverter';
      case 'hybrid':
        return isAr ? 'عاكس هجين ذكي مزدوج (Hybrid: شمسي + شبكة / مولد ديزل)' : 'Hybrid Solar Inverter (Solar + Grid/Gen)';
      case 'dc_mppt':
        return isAr ? 'محكم تيار مستمر ذكي (DC MPPT Controller)' : 'DC MPPT Intelligent Controller';
    }
  };

  // Trigger PDF download on standalone page
  const handleDownloadPdfFile = async () => {
    setIsDownloading(true);
    setStatusMessage(isAr ? 'جارٍ تنزيل ملف الـ PDF مباشرة إلى جهازك...' : 'Downloading PDF directly to your device...');
    try {
      const res = await exportSolarPumpPdfReport(result, lang);
      if (res && res.success) {
        setPreparedPdf({
          blob: res.blob,
          blobUrl: res.blobUrl,
          file: res.file,
          fileName: res.fileName,
        });
        setStatusMessage(res.actionMessage || (isAr ? 'تم حفظ / مشاركة ملف الـ PDF بنجاح!' : 'PDF saved / shared successfully!'));
      } else {
        setStatusMessage(isAr ? 'يمكنك تنزيل تقرير HTML المستقل أو استخدام الطباعة للحفظ كـ PDF.' : 'You can use the HTML report or Print to Save as PDF.');
      }
    } catch (err) {
      console.error('PDF error:', err);
      setStatusMessage(isAr ? 'تعذر إنشاء الـ PDF. يمكنك تنزيل تقرير HTML المستقل المضمون 100%!' : 'Use the guaranteed Standalone HTML report or Print.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSynchronousShare = async () => {
    if (!preparedPdf) return;
    if (preparedPdf.file && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          files: [preparedPdf.file],
          title: isAr ? 'تقرير منظومة الضخ الشمسي' : 'Solar Pump System Report',
          text: isAr ? 'تقرير التصميم الفني لمنظومة الضخ الشمسي - المهندس زكريا بسيود' : 'Solar Pump System Report - Eng. ZAKARYA Bessioud',
        });
        setStatusMessage(isAr ? 'تم فتح الحفظ والمشاركة بنجاح!' : 'Shared successfully!');
        return;
      } catch (e: unknown) {
        const err = e as { name?: string };
        if (err?.name === 'AbortError' || err?.name === 'CancelError') return;
      }
    }
    if (preparedPdf.blobUrl) {
      window.open(preparedPdf.blobUrl, '_blank');
    }
  };

  const handleDownloadDirectAnchor = () => {
    if (!preparedPdf) return;
    const a = document.createElement('a');
    a.href = preparedPdf.blobUrl;
    a.download = preparedPdf.fileName;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      try {
        if (document.body.contains(a)) document.body.removeChild(a);
      } catch {}
    }, 500);
    setStatusMessage(isAr ? 'تم بدء التنزيل المباشر!' : 'Direct download triggered!');
  };

  const handleDownloadOfflineHtml = async () => {
    try {
      const htmlContent = generateSolarOfflineHtmlReport(result, lang);
      const filename = `Solar_Well_Report_FeedCalc_${Math.round(result.totalHead)}m_${Math.round(result.waterQ)}m3.html`;
      const res = await universalDownloadText(filename, htmlContent);
      setStatusMessage(res.message || (isAr ? 'تم تنزيل تقرير HTML المستقل للمزرعة بنجاح! يعمل دون إنترنت.' : 'Standalone HTML report downloaded!'));
    } catch (err) {
      console.error(err);
    }
  };

  // Auto trigger download if ?auto=1 was passed
  useEffect(() => {
    if (params.get('auto') === '1') {
      const timer = setTimeout(() => {
        handleDownloadPdfFile();
      }, 700);
      return () => clearTimeout(timer);
    }
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    const text = isAr
      ? `تقرير منظومة الطاقة الشمسية لضخ الآبار الفلاحية
المعايير الهندسية: جامعة كامبردج ومنظمة الأغذية والزراعة (FAO 56)
--------------------------------------------------
* المعطيات:
  - كمية المياه المطلوبة: ${formatNum(result.waterQ, 1)} متر مكعب/يوم
  - الارتفاع الكلي TDH: ${formatNum(result.totalHead, 0)} متر
  - ساعات الذروة: ${formatNum(result.peakSunHours, 1)} ساعات/يوم
--------------------------------------------------
* النتائج الهندسية:
  - قدرة المضخة: ${formatNum(result.pumpPowerKw, 2)} kW (${formatNum(result.pumpPowerHp, 1)} حصان) - ${getPumpLabel(result.pumpType)}
  - عدد الألواح: ${result.panelCount} لوح (قدرة ${result.panelWatt}W للوح) - إجمالي ${formatNum(result.totalPvKw, 2)} kWp
  - نوع الألواح: ${getPanelLabel(result.panelType)}
  - التوصيل: ${result.stringConfig}
  - العاكس: ${getInverterLabel(result.inverterType)} (استطاعة لا تقل عن ${formatNum(result.inverterKw, 1)} kW)
--------------------------------------------------
إعداد وتصميم: المهندس زكريا بسيود ZAKARYA Bessioud
هاتف / واتساب: 0655870392 (+213655870392)
البريد الإلكتروني: boussiouxzaki@gmail.com
FeedCalc Pro Solar`
      : `Solar Water Pumping System Calculation Report
Engineering Standards: Cambridge University & FAO 56
--------------------------------------------------
* Inputs:
  - Daily Water: ${formatNum(result.waterQ, 1)} m3/day
  - Total Head: ${formatNum(result.totalHead, 0)} m
--------------------------------------------------
* Sizing:
  - Pump: ${formatNum(result.pumpPowerKw, 2)} kW (${formatNum(result.pumpPowerHp, 1)} HP)
  - Panels: ${result.panelCount} panels @ ${result.panelWatt}W (Total: ${formatNum(result.totalPvKw, 2)} kWp)
  - Inverter: Min ${formatNum(result.inverterKw, 1)} kW (${getInverterLabel(result.inverterType)})
--------------------------------------------------
Engineered by: ZAKARYA Bessioud (+213655870392) | boussiouxzaki@gmail.com`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleReturnToApp = () => {
    // Return to main app without query params
    window.location.href = window.location.origin + window.location.pathname;
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans p-3 sm:p-6 pb-20">
      {/* Top Floating Action Bar (Hidden during Print) */}
      <header className="no-print max-w-4xl mx-auto mb-6 bg-white rounded-2xl shadow-lg border border-emerald-100 p-4 sm:p-5 sticky top-3 z-50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs">
              <Sun className="size-5" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">
                {isAr ? 'صفحة تحميل تقرير الضخ الشمسي الرسمية' : 'Official Solar Pumping Report Download'}
              </h1>
              <p className="text-xs text-emerald-700 font-medium mt-0.5">
                {isAr ? 'صفحة مستقلة مخصصة للتنزيل المباشر بدون قيود المتصفح' : 'Standalone unrestricted download page'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleReturnToApp}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-semibold cursor-pointer transition"
          >
            <ArrowRight className="size-3.5 rtl:rotate-180" />
            <span>{isAr ? 'العودة للحاسبة' : 'Back to App'}</span>
          </button>
        </div>

        {/* Primary Download Buttons */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            id="btn-standalone-download-pdf"
            onClick={handleDownloadPdfFile}
            disabled={isDownloading}
            className="flex-1 min-w-[200px] inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-4 py-3 text-xs sm:text-sm font-extrabold shadow-md hover:shadow-lg transition cursor-pointer disabled:opacity-60"
          >
            {isDownloading ? (
              <>
                <Loader2 className="size-4.5 animate-spin" />
                <span>{isAr ? 'جارٍ التنزيل الآن...' : 'Downloading PDF...'}</span>
              </>
            ) : (
              <>
                <Download className="size-4.5 text-amber-300" />
                <span>{isAr ? '📥 تحميل ملف PDF إلى جهازك' : 'Download PDF File'}</span>
              </>
            )}
          </button>

          <button
            type="button"
            id="btn-standalone-offline-html"
            onClick={handleDownloadOfflineHtml}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border-2 border-emerald-600 bg-white hover:bg-emerald-50 text-emerald-800 px-4 py-3 text-xs sm:text-sm font-extrabold transition cursor-pointer shadow-2xs"
          >
            <Globe className="size-4 text-emerald-600" />
            <span>{isAr ? '🌐 تقرير HTML مستقل للمزرعة (مضمون 100%)' : '🌐 Offline HTML Report'}</span>
          </button>

          <button
            type="button"
            id="btn-standalone-print"
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 px-4 py-3 text-xs sm:text-sm font-bold transition cursor-pointer shadow-2xs"
          >
            <Printer className="size-4 text-emerald-600" />
            <span>{isAr ? 'طباعة / حفظ كـ PDF' : 'Print / Save PDF'}</span>
          </button>

          <button
            type="button"
            id="btn-standalone-copy"
            onClick={handleCopy}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 px-3.5 py-3 text-xs sm:text-sm font-bold transition cursor-pointer shadow-2xs"
          >
            {copied ? (
              <>
                <Check className="size-4 text-emerald-600" />
                <span className="text-emerald-700 font-bold">{isAr ? 'تم النسخ' : 'Copied'}</span>
              </>
            ) : (
              <>
                <Copy className="size-4 text-slate-500" />
                <span>{isAr ? 'نسخ النص' : 'Copy Text'}</span>
              </>
            )}
          </button>
        </div>

        {/* Prepared PDF Immediate Save Hub (Direct 1-tap user actions) */}
        {preparedPdf && (
          <div className="mt-3.5 p-3.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-400 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-emerald-950">
                {isAr ? '🎉 ملف الـ PDF جاهز! اختر طريقة الحفظ المباشرة لجهازك:' : '🎉 PDF is ready! Choose direct save method:'}
              </span>
              <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">
                {preparedPdf.fileName}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleSynchronousShare}
                className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                <span>📱 {isAr ? 'حفظ في الملفات / مشاركة' : 'Save to Files / Share'}</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadDirectAnchor}
                className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                <span>💾 {isAr ? 'تنزيل ملف PDF الآن' : 'Download PDF Now'}</span>
              </button>
              <a
                href={preparedPdf.blobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-emerald-600 bg-white hover:bg-emerald-50 text-emerald-800 text-xs font-bold shadow-2xs cursor-pointer"
              >
                <span>👁️ {isAr ? 'عرض في نافذة كاملة' : 'View in Full Tab'}</span>
              </a>
            </div>
          </div>
        )}

        {statusMessage && (
          <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}
      </header>

      {/* Main Printable Engineering Report Sheet */}
      <main className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-10">
        {/* Report Official Header */}
        <div className="border-b-2 border-emerald-800 pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-600 text-white font-black text-xs">
                FeedCalc Pro Solar
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs flex items-center gap-1">
                <Award className="size-3" />
                {isAr ? 'معايير جامعة كامبردج ودليل FAO 56' : 'Cambridge & FAO 56 Verified'}
              </span>
            </div>
            <h2 className="text-lg sm:text-2xl font-black text-emerald-950">
              {isAr ? 'تقرير التصميم الهندسي لمنظومة الضخ الشمسي للآبار الفلاحية' : 'Agricultural Solar Well Pumping System Engineering Report'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {isAr
                ? 'وثيقة حسابية معتمدة لتحديد مواصفات المضخة، حقل الألواح، نوع العاكس، والتوصيل الكهربائي'
                : 'Certified design document for pump power, solar PV array sizing, and inverter topology'}
            </p>
          </div>

          <div className="text-start sm:text-end text-xs text-slate-500 font-medium">
            <div><strong>{isAr ? 'التاريخ:' : 'Date:'}</strong> {new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            <div><strong>{isAr ? 'المرجع:' : 'Ref:'}</strong> <span className="font-mono text-emerald-700 font-bold">SOLAR-PUMP-{Math.round(result.totalHead)}-{Math.round(result.waterQ)}</span></div>
          </div>
        </div>

        {/* Top 4 KPI Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-center">
            <span className="block text-xs text-slate-600 font-bold mb-1">{isAr ? 'كمية المياه اليومية' : 'Daily Water Flow'}</span>
            <span className="text-xl font-black text-emerald-800 tabular-nums">{formatNum(result.waterQ, 1)} m³/day</span>
            <span className="block text-[11px] text-slate-500 mt-0.5">~{formatNum(result.hourlyFlow, 1)} m³/h</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="block text-xs text-slate-600 font-bold mb-1">{isAr ? 'العمق الكلي TDH' : 'Total Dynamic Head'}</span>
            <span className="text-xl font-black text-slate-900 tabular-nums">{formatNum(result.totalHead, 0)} m</span>
            <span className="block text-[11px] text-slate-500 mt-0.5">{isAr ? 'العمق + فواقد الاحتكاك' : 'Depth + Friction'}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-center">
            <span className="block text-xs text-slate-600 font-bold mb-1">{isAr ? 'قدرة المضخة' : 'Pump Rating'}</span>
            <span className="text-xl font-black text-emerald-800 tabular-nums">{formatNum(result.pumpPowerKw, 2)} kW</span>
            <span className="block text-[11px] text-slate-600 font-bold mt-0.5">({formatNum(result.pumpPowerHp, 1)} HP)</span>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-center">
            <span className="block text-xs text-amber-900 font-bold mb-1">{isAr ? 'حقل الألواح الشمسية' : 'PV Array Capacity'}</span>
            <span className="text-xl font-black text-amber-800 tabular-nums">{result.panelCount} {isAr ? 'لوح' : 'panels'}</span>
            <span className="block text-[11px] text-amber-950 font-bold mt-0.5">{formatNum(result.totalPvKw, 2)} kWp ({result.panelWatt}W)</span>
          </div>
        </div>

        {/* Section 1: Hydraulic & Operating Parameters */}
        <div className="mb-6">
          <h3 className="text-sm font-extrabold text-emerald-950 bg-emerald-50 px-3 py-1.5 rounded-lg border-s-4 border-emerald-600 mb-2">
            {isAr ? '1. المعطيات الهيدروليكية والمناخية للبئر (معايير كامبردج و FAO 56)' : '1. Hydraulic & Operating Parameters'}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse border border-slate-200 text-xs">
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="p-2.5 font-bold bg-slate-50 w-1/3">{isAr ? 'كمية المياه المطلوبة يومياً (Q):' : 'Daily Water Flow (Q):'}</td>
                  <td className="p-2.5 font-semibold">{formatNum(result.waterQ, 1)} m³/day</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="p-2.5 font-bold bg-slate-50">{isAr ? 'الارتفاع الهيدروليكي الكلي (TDH):' : 'Total Dynamic Head (TDH):'}</td>
                  <td className="p-2.5 font-semibold">{formatNum(result.totalHead, 0)} {isAr ? 'متر (عمق التنزيل الديناميكي + فواقد الاحتكاك)' : 'meters (depth + friction losses)'}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="p-2.5 font-bold bg-slate-50">{isAr ? 'ساعات الذروة الشمسية (PSH):' : 'Peak Sun Hours (PSH):'}</td>
                  <td className="p-2.5 font-semibold">{formatNum(result.peakSunHours, 1)} {isAr ? 'ساعات ذروة يومية معتمدة' : 'hours/day'}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="p-2.5 font-bold bg-slate-50">{isAr ? 'الطاقة الهيدروليكية اليومية الصافية:' : 'Net Hydraulic Energy:'}</td>
                  <td className="p-2.5 font-semibold">{formatNum(result.dailyHydraulicEnergy, 2)} kWh/day</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: Submersible Pump Sizing */}
        <div className="mb-6">
          <h3 className="text-sm font-extrabold text-emerald-950 bg-emerald-50 px-3 py-1.5 rounded-lg border-s-4 border-emerald-600 mb-2">
            {isAr ? '2. مواصفات المضخة ومحرك الرفع المقترح' : '2. Submersible Pump & Motor Sizing'}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse border border-slate-200 text-xs">
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="p-2.5 font-bold bg-slate-50 w-1/3">{isAr ? 'قدرة المضخة المقترحة:' : 'Pump Power:'}</td>
                  <td className="p-2.5 font-black text-emerald-800 text-sm">
                    {formatNum(result.pumpPowerKw, 2)} kW ({formatNum(result.pumpPowerHp, 1)} HP)
                  </td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="p-2.5 font-bold bg-slate-50">{isAr ? 'طوبولوجيا ونوع المحرك:' : 'Motor Topology:'}</td>
                  <td className="p-2.5 font-semibold">{getPumpLabel(result.pumpType)}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="p-2.5 font-bold bg-slate-50">{isAr ? 'كفاءة المنظومة المعتمدة (Wire-to-Water):' : 'System Efficiency:'}</td>
                  <td className="p-2.5 font-semibold">{result.pumpEfficiency}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Solar PV Array */}
        <div className="mb-6">
          <h3 className="text-sm font-extrabold text-emerald-950 bg-emerald-50 px-3 py-1.5 rounded-lg border-s-4 border-emerald-600 mb-2">
            {isAr ? '3. مواصفات مصفوفة وحقل الألواح الشمسية' : '3. Solar PV Array Specifications'}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse border border-slate-200 text-xs">
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="p-2.5 font-bold bg-slate-50 w-1/3">{isAr ? 'إجمالي قدرة حقل الألواح:' : 'Total PV Array Capacity:'}</td>
                  <td className="p-2.5 font-black text-emerald-800 text-sm">
                    {formatNum(result.totalPvKw, 2)} kWp ({formatNum(result.totalPvWatts, 0)} W)
                  </td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="p-2.5 font-bold bg-slate-50">{isAr ? 'عدد الألواح وقدرة اللوح الواحد:' : 'Panels Count & Rating:'}</td>
                  <td className="p-2.5 font-bold">
                    {result.panelCount} {isAr ? 'لوح' : 'panels'} × {result.panelWatt}W
                  </td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="p-2.5 font-bold bg-slate-50">{isAr ? 'فئة الألواح والتقنية المعتمدة:' : 'Panel Technology & Tier:'}</td>
                  <td className="p-2.5 font-semibold">
                    {getPanelLabel(result.panelType)}
                    {result.panelType === 'poly_blue'
                      ? (isAr ? ' — تم احتساب +15% ألواح إضافية لمقاومة الفقد الحراري صيفاً' : ' — +15% thermal derating margin included')
                      : (isAr ? ' — خلايا نقية ذات معامل حراري فائق ومقاومة للحرارة الصحراوية' : ' — High efficiency with low thermal coefficient')}
                  </td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="p-2.5 font-bold bg-slate-50">{isAr ? 'طريقة الربط الكهربائي (Strings):' : 'String Configuration:'}</td>
                  <td className="p-2.5 font-semibold">{result.stringConfig}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4: Inverter & Hybrid Integration */}
        <div className="mb-6">
          <h3 className="text-sm font-extrabold text-emerald-950 bg-emerald-50 px-3 py-1.5 rounded-lg border-s-4 border-emerald-600 mb-2">
            {isAr ? '4. نظام العاكس والتحكم ومصدر الطاقة الهجين' : '4. Inverter & Hybrid Power System'}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse border border-slate-200 text-xs">
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="p-2.5 font-bold bg-slate-50 w-1/3">{isAr ? 'نوع العاكس المعتمد:' : 'Inverter System:'}</td>
                  <td className="p-2.5 font-bold">{getInverterLabel(result.inverterType)}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="p-2.5 font-bold bg-slate-50">{isAr ? 'استطاعة العاكس الصغرى:' : 'Minimum Inverter Rating:'}</td>
                  <td className="p-2.5 font-bold text-emerald-800 text-sm">
                    {isAr ? 'لا تقل عن' : 'Min'} {formatNum(result.inverterKw, 1)} kW ({formatNum(result.recommendedInverterHp, 1)} HP)
                  </td>
                </tr>
                {result.backupGeneratorKva && (
                  <tr className="border-b border-slate-200">
                    <td className="p-2.5 font-bold bg-slate-50">{isAr ? 'المولد الاحتياطي المقترح:' : 'Backup Generator:'}</td>
                    <td className="p-2.5 text-amber-900 font-bold">
                      {result.backupGeneratorKva} kVA Diesel ({isAr ? 'للتشغيل الليلي 24/7 ودعم تيار البدء الحثي' : 'For 24/7 continuous duty'})
                    </td>
                  </tr>
                )}
                <tr className="border-b border-slate-200">
                  <td className="p-2.5 font-bold bg-slate-50">{isAr ? 'حماية التشغيل ومميزات الأمان:' : 'Protections:'}</td>
                  <td className="p-2.5 font-medium">
                    {isAr
                      ? 'إقلاع ناعم تدريجي (Soft Start) لمنع المطرقة المائية، وحساس إلكتروني للتشغيل الجاف (Dry-Run Guard) وحماية زيادة الجهد والحرارة.'
                      : 'Soft start to prevent water hammer, dry-run sensor protection, and thermal guard.'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 5: Engineer Attribution & Official Stamp */}
        <div className="pt-4 border-t-2 border-slate-300 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="text-xs text-slate-600 space-y-1">
            <div><strong>{isAr ? 'إعداد وتصميم:' : 'Engineered by:'}</strong> المهندس زكريا بسيود ZAKARYA Bessioud</div>
            <div><strong>{isAr ? 'رقم الهاتف / واتساب:' : 'Phone / WhatsApp:'}</strong> <span className="font-bold text-slate-800" dir="ltr">+213 655 87 03 92</span> (0655870392)</div>
            <div><strong>{isAr ? 'البريد الإلكتروني:' : 'Email:'}</strong> boussiouxzaki@gmail.com</div>
            <div><strong>{isAr ? 'المنصة الهندسية:' : 'Platform:'}</strong> FeedCalc Pro Solar — {isAr ? 'المنظومة الهندسية الفلاحية المعتمدة' : 'Certified Engineering Platform'}</div>
          </div>

          <div className="text-center p-3.5 border-2 border-dashed border-emerald-700 rounded-xl min-w-[190px] bg-emerald-50/40">
            <div className="text-xs font-bold text-emerald-900">المهندس زكريا بسيود</div>
            <div className="text-[10px] text-slate-500 font-mono">ZAKARYA Bessioud</div>
            <div className="text-[10px] text-emerald-700 font-black mt-1">★ معتمد فلاحياً وهندسياً ★</div>
          </div>
        </div>
      </main>
    </div>
  );
};
