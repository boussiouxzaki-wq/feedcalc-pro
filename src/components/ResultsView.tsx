import React, { useState } from 'react';
import {
  Scale,
  Wheat,
  Droplets,
  TrendingUp,
  Leaf,
  FlaskConical,
  Clock,
  Coins,
  Copy,
  Check,
  Printer,
  RotateCcw,
  AlertCircle,
  Phone,
  FileText,
  Loader2,
  CalendarClock,
  Sparkles,
  Stethoscope,
  ShieldAlert,
  Download,
  ExternalLink,
  X,
  Globe,
  Share2,
} from 'lucide-react';
import { Species, FeedType, CalculationInput, CalculationResult, Language } from '../types';
import { TRANSLATIONS, formatNum } from '../utils/translations';
import { generatePdfReport } from '../utils/pdfGenerator';
import { generateFeedOfflineHtmlReport } from '../utils/offlineReportGenerator';
import { universalSaveOrShare, universalDownloadText } from '../utils/universalDownloader';
import { getCurrencySymbol } from '../data/currencies';
import { getBreedingSchedule } from '../data/breedingData';

interface ResultsViewProps {
  species: Species | null;
  feedType: FeedType | null;
  input: CalculationInput;
  result: CalculationResult | null;
  onReset: () => void;
  lang: Language;
  onToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  species,
  feedType,
  input,
  result,
  onReset,
  lang,
  onToast,
}) => {
  const [copied, setCopied] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfReportData, setPdfReportData] = useState<{
    blobUrl: string;
    blob?: Blob;
    fileName: string;
    previewImageUrl?: string;
    file?: File;
  } | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const t = TRANSLATIONS[lang];

  if (!result || !species || !feedType) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white/60 p-8 sm:p-12 text-center flex flex-col items-center justify-center min-h-[420px]">
        <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <Scale className="size-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">
          {t.resultsEmptyTitle}
        </h3>
        <p className="mt-1.5 max-w-md text-xs sm:text-sm text-slate-500 leading-relaxed">
          {t.resultsEmptyDesc}
        </p>
      </div>
    );
  }

  const getSpeciesName = (s: Species) => {
    switch (lang) {
      case 'de':
        return s.nameDe || s.nameEn;
      case 'zh':
        return s.nameZh || s.nameEn;
      case 'fr':
        return s.nameFr;
      case 'es':
        return s.nameEs;
      case 'en':
        return s.nameEn;
      case 'ar':
      default:
        return s.name;
    }
  };

  const getSpeciesUnit = (s: Species) => {
    switch (lang) {
      case 'de':
        return s.unitDe || s.unitEn;
      case 'zh':
        return s.unitZh || s.unitEn;
      case 'fr':
        return s.unitFr;
      case 'es':
        return s.unitEs;
      case 'en':
        return s.unitEn;
      case 'ar':
      default:
        return s.unit;
    }
  };

  const getFeedName = (f: FeedType) => {
    switch (lang) {
      case 'de':
        return f.nameDe || f.nameEn;
      case 'zh':
        return f.nameZh || f.nameEn;
      case 'fr':
        return f.nameFr;
      case 'es':
        return f.nameEs;
      case 'en':
        return f.nameEn;
      case 'ar':
      default:
        return f.name;
    }
  };

  const getFeedDesc = (f: FeedType) => {
    switch (lang) {
      case 'de':
        return f.descriptionDe || f.descriptionEn;
      case 'zh':
        return f.descriptionZh || f.descriptionEn;
      case 'fr':
        return f.descriptionFr;
      case 'es':
        return f.descriptionEs;
      case 'en':
        return f.descriptionEn;
      case 'ar':
      default:
        return f.description;
    }
  };

  const speciesName = getSpeciesName(species);
  const speciesUnit = getSpeciesUnit(species);
  const feedName = getFeedName(feedType);
  const currencySymbol = getCurrencySymbol(input.currency || 'USD');
  const weightUnitStr = input.weightUnit === 'lb' ? 'lb' : 'kg';
  const feedRateUnitStr = input.weightUnit === 'lb' ? 'lb / day' : t.feedPerDayUnit;

  const breeding = species ? getBreedingSchedule(species.id) : null;

  const getBreedingField = (key: 'cycle' | 'optimalTime' | 'gestation' | 'signs' | 'advice') => {
    if (!breeding) return '';
    switch (lang) {
      case 'de':
        return breeding[`${key}De` as keyof typeof breeding] || breeding[`${key}En` as keyof typeof breeding] || breeding[key];
      case 'zh':
        return breeding[`${key}Zh` as keyof typeof breeding] || breeding[`${key}En` as keyof typeof breeding] || breeding[key];
      case 'fr':
        return breeding[`${key}Fr` as keyof typeof breeding] || breeding[`${key}En` as keyof typeof breeding] || breeding[key];
      case 'es':
        return breeding[`${key}Es` as keyof typeof breeding] || breeding[`${key}En` as keyof typeof breeding] || breeding[key];
      case 'en':
        return breeding[`${key}En` as keyof typeof breeding] || breeding[key];
      case 'ar':
      default:
        return breeding[key];
    }
  };

  const handleCopySummary = () => {
    let report = '';
    const devLine = `Dev: ${t.devName} (${t.devPhone})`;

    if (lang === 'ar') {
      report = `📊 تقرير حاسبة الأعلاف الذكية (FeedCalc Pro)
----------------------------------------
🔹 النوع: ${species.name} (${species.category === 'aquatic' ? 'استزراع مائي وأسماك' : species.category === 'specialty' ? 'مناحل وإنتاج عسل' : 'دواجن وإنتاج حيواني'})
🔹 العدد: ${formatNum(input.count, 0)} ${species.unit} | متوسط الوزن: ${formatNum(input.weight, 2)} ${weightUnitStr}
🔹 نوع العلف: ${feedName} (بروتين: ${formatNum(feedType.protein, 1)}% | طاقة: ${formatNum(feedType.energy, 0)} ك.كال/كجم)
🔹 معامل التحويل (FCR): ${formatNum(result.fcr, 2)}
----------------------------------------
📌 الحصة اليومية الإجمالية: ${formatNum(result.dailyFeedTotal, 3)} ${feedRateUnitStr}
📌 الحصة لكل ${species.unit}: ${formatNum(result.dailyFeedPerUnit, 3)} ${weightUnitStr} / يوم (~${formatNum(Math.round(result.dailyFeedPerUnit * (input.weightUnit === 'lb' ? 16 : 1000)), 0)} ${input.weightUnit === 'lb' ? 'أونصة' : 'غرام'})
📌 عدد الوجبات: ${result.feedingFrequency} وجبات (${formatNum(result.feedPerMealTotal, 3)} ${weightUnitStr} لكل وجبة)
📌 مواعيد التغذية: ${result.feedingTimes.join(' | ')}
📌 البروتين اليومي: ${formatNum(result.dailyProtein, 2)} ${weightUnitStr}
📌 الطاقة اليومية: ${formatNum(result.dailyEnergy, 2)} ميجا كال
📌 كفاءة التحويل الغذائي: ${formatNum(result.feedConversionEfficiency, 1)}%
${result.dailyCost ? `💰 التكلفة اليومية التقديرية: ${currencySymbol} ${formatNum(result.dailyCost, 2)}` : ''}
${result.monthlyCost ? `💰 التكلفة الشهرية (تقدير 30 يوماً): ${currencySymbol} ${formatNum(result.monthlyCost, 2)}` : ''}
----------------------------------------
تطوير: ${t.devName} | هاتف: ${t.devPhone}`;
    } else if (lang === 'fr') {
      report = `📊 Rapport FeedCalc Pro
----------------------------------------
🔹 Espèce : ${species.nameFr} (${species.category === 'aquatic' ? 'Pisciculture' : 'Élevage'})
🔹 Effectif : ${formatNum(input.count, 0)} ${species.unitFr} | Poids moyen : ${formatNum(input.weight, 2)} ${weightUnitStr}
🔹 Aliment : ${feedName} (Protéines ${formatNum(feedType.protein, 1)}% - Énergie ${formatNum(feedType.energy, 0)} kcal/kg)
🔹 Indice de conversion (IC) : ${formatNum(result.fcr, 2)}
----------------------------------------
📌 Ration journalière totale : ${formatNum(result.dailyFeedTotal, 3)} ${feedRateUnitStr}
📌 Par ${species.unitFr} : ${formatNum(result.dailyFeedPerUnit, 3)} ${weightUnitStr}/jour
📌 Fréquence : ${result.feedingFrequency} repas/jour (${formatNum(result.feedPerMealTotal, 3)} ${weightUnitStr} par repas)
📌 Horaires : ${result.feedingTimes.join(' | ')}
📌 Protéines journalières : ${formatNum(result.dailyProtein, 2)} ${weightUnitStr}
📌 Énergie consommée : ${formatNum(result.dailyEnergy, 2)} Mcal
📌 Efficacité de conversion : ${formatNum(result.feedConversionEfficiency, 1)}%
${result.dailyCost ? `💰 Coût quotidien estimé : ${currencySymbol} ${formatNum(result.dailyCost, 2)}` : ''}
${result.monthlyCost ? `💰 Coût mensuel (30 jours) : ${currencySymbol} ${formatNum(result.monthlyCost, 2)}` : ''}
----------------------------------------
Développé par : ${t.devName} | Tél : ${t.devPhone}`;
    } else if (lang === 'es') {
      report = `📊 Informe FeedCalc Pro
----------------------------------------
🔹 Especie: ${species.nameEs} (${species.category === 'aquatic' ? 'Acuicultura' : 'Ganadería'})
🔹 Cantidad: ${formatNum(input.count, 0)} ${species.unitEs} | Peso promedio: ${formatNum(input.weight, 2)} ${weightUnitStr}
🔹 Pienso: ${feedName} (Proteína ${formatNum(feedType.protein, 1)}% - Energía ${formatNum(feedType.energy, 0)} kcal/kg)
🔹 Índice FCR: ${formatNum(result.fcr, 2)}
----------------------------------------
📌 Pienso diario total: ${formatNum(result.dailyFeedTotal, 3)} ${feedRateUnitStr}
📌 Por ${species.unitEs}: ${formatNum(result.dailyFeedPerUnit, 3)} ${weightUnitStr}/día
📌 Tomas diarias: ${result.feedingFrequency} tomas (${formatNum(result.feedPerMealTotal, 3)} ${weightUnitStr} por toma)
📌 Horarios: ${result.feedingTimes.join(' | ')}
📌 Proteína diaria: ${formatNum(result.dailyProtein, 2)} ${weightUnitStr}
📌 Energía diaria: ${formatNum(result.dailyEnergy, 2)} Mcal
📌 Eficiencia de conversión: ${formatNum(result.feedConversionEfficiency, 1)}%
${result.dailyCost ? `💰 Coste diario estimado: ${currencySymbol} ${formatNum(result.dailyCost, 2)}` : ''}
${result.monthlyCost ? `💰 Coste mensual (30 días): ${currencySymbol} ${formatNum(result.monthlyCost, 2)}` : ''}
----------------------------------------
Desarrollado por: ${t.devName} | Tel: ${t.devPhone}`;
    } else if (lang === 'zh') {
      report = `📊 智能饲料配比与投喂计算报告 (FeedCalc Pro)
----------------------------------------
🔹 养殖物种: ${species.nameZh || species.nameEn} (${species.category === 'aquatic' ? '水产养殖' : species.category === 'specialty' ? '特种/蜜蜂养殖' : '畜禽养殖'})
🔹 饲养规模: ${formatNum(input.count, 0)} ${species.unitZh || species.unitEn} | 平均体重: ${formatNum(input.weight, 2)} ${weightUnitStr}
🔹 饲料配方: ${feedName} (粗蛋白 ${formatNum(feedType.protein, 1)}% - 代谢能 ${formatNum(feedType.energy, 0)} kcal/kg)
🔹 料肉比 / 转化系数 (FCR): ${formatNum(result.fcr, 2)}
----------------------------------------
📌 全群每日饲料总量: ${formatNum(result.dailyFeedTotal, 3)} ${feedRateUnitStr}
📌 单体每日均投喂量: ${formatNum(result.dailyFeedPerUnit, 3)} ${weightUnitStr}/天 (~${formatNum(Math.round(result.dailyFeedPerUnit * (input.weightUnit === 'lb' ? 16 : 1000)), 0)} ${input.weightUnit === 'lb' ? '盎司' : '克'})
📌 投喂频次: 全天 ${result.feedingFrequency} 次 (每次分摊 ${formatNum(result.feedPerMealTotal, 3)} ${weightUnitStr})
📌 建议投喂时间: ${result.feedingTimes.join(' | ')}
📌 全群日摄入粗蛋白: ${formatNum(result.dailyProtein, 2)} ${weightUnitStr}
📌 全群日消耗代谢能: ${formatNum(result.dailyEnergy, 2)} 兆卡 (Mcal)
📌 饲料转化效率: ${formatNum(result.feedConversionEfficiency, 1)}%
${result.dailyCost ? `💰 每日预估饲料成本: ${currencySymbol} ${formatNum(result.dailyCost, 2)}` : ''}
${result.monthlyCost ? `💰 每月预估成本 (30天): ${currencySymbol} ${formatNum(result.monthlyCost, 2)}` : ''}
----------------------------------------
首席开发者: ${t.devName} | 咨询电话: ${t.devPhone}`;
    } else if (lang === 'de') {
      report = `📊 FeedCalc Pro Berechnungsbericht
----------------------------------------
🔹 Tierart: ${species.nameDe || species.nameEn} (${species.category === 'aquatic' ? 'Aquakultur' : species.category === 'specialty' ? 'Spezialform / Imkerei' : 'Nutztiere / Geflügel'})
🔹 Bestand: ${formatNum(input.count, 0)} ${species.unitDe || species.unitEn} | Durchschn. Gewicht: ${formatNum(input.weight, 2)} ${weightUnitStr}
🔹 Futter: ${feedName} (Rohprotein ${formatNum(feedType.protein, 1)}% - Energie ${formatNum(feedType.energy, 0)} kcal/kg)
🔹 Futterverwertung (FCR): ${formatNum(result.fcr, 2)}
----------------------------------------
📌 Tagesfutterbedarf gesamt: ${formatNum(result.dailyFeedTotal, 3)} ${feedRateUnitStr}
📌 Pro ${species.unitDe || species.unitEn}: ${formatNum(result.dailyFeedPerUnit, 3)} ${weightUnitStr}/Tag (~${formatNum(Math.round(result.dailyFeedPerUnit * (input.weightUnit === 'lb' ? 16 : 1000)), 0)} ${input.weightUnit === 'lb' ? 'oz' : 'g'})
📌 Fütterungsrhythmus: ${result.feedingFrequency} Mahlzeiten (${formatNum(result.feedPerMealTotal, 3)} ${weightUnitStr} pro Fütterung)
📌 Fütterungszeiten: ${result.feedingTimes.join(' | ')}
📌 Tägliches Rohprotein: ${formatNum(result.dailyProtein, 2)} ${weightUnitStr}
📌 Tägliche Energie: ${formatNum(result.dailyEnergy, 2)} Mcal
📌 Futterverwertungseffizienz: ${formatNum(result.feedConversionEfficiency, 1)}%
${result.dailyCost ? `💰 Geschätzte Tageskosten: ${currencySymbol} ${formatNum(result.dailyCost, 2)}` : ''}
${result.monthlyCost ? `💰 Monatliche Kosten (30 Tage): ${currencySymbol} ${formatNum(result.monthlyCost, 2)}` : ''}
----------------------------------------
Entwickelt von: ${t.devName} | Tel: ${t.devPhone}`;
    } else {
      report = `📊 FeedCalc Pro Calculation Report
----------------------------------------
🔹 Species: ${species.nameEn} (${species.category === 'aquatic' ? 'Aquaculture' : 'Farm'})
🔹 Count: ${formatNum(input.count, 0)} ${species.unitEn} | Avg Weight: ${formatNum(input.weight, 2)} ${weightUnitStr}
🔹 Feed: ${feedName} (${formatNum(feedType.protein, 1)}% Protein, ${formatNum(feedType.energy, 0)} kcal/kg)
🔹 FCR: ${formatNum(result.fcr, 2)}
----------------------------------------
📌 Total Daily Feed: ${formatNum(result.dailyFeedTotal, 3)} ${feedRateUnitStr}
📌 Per ${species.unitEn}: ${formatNum(result.dailyFeedPerUnit, 3)} ${weightUnitStr}/day
📌 Schedule: ${result.feedingFrequency} meals (${formatNum(result.feedPerMealTotal, 3)} ${weightUnitStr} per meal)
📌 Feeding Times: ${result.feedingTimes.join(' | ')}
📌 Daily Protein: ${formatNum(result.dailyProtein, 2)} ${weightUnitStr}
📌 Daily Energy: ${formatNum(result.dailyEnergy, 2)} Mcal
📌 Efficiency: ${formatNum(result.feedConversionEfficiency, 1)}%
${result.dailyCost ? `💰 Estimated Daily Cost: ${currencySymbol} ${formatNum(result.dailyCost, 2)}` : ''}
${result.monthlyCost ? `💰 30-Day Monthly Cost: ${currencySymbol} ${formatNum(result.monthlyCost, 2)}` : ''}
----------------------------------------
${devLine}`;
    }

    navigator.clipboard.writeText(report).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!species || !feedType || !result || isGeneratingPdf) return;
    try {
      setIsGeneratingPdf(true);
      const res = await generatePdfReport({
        species,
        feedType,
        input,
        result,
        lang,
      });

      setPdfReportData({
        blobUrl: res.blobUrl,
        blob: res.blob,
        fileName: res.fileName,
        previewImageUrl: res.previewImageUrl,
        file: res.file,
      });
      setIsPdfModalOpen(true);

      if (onToast) {
        const msg = res.actionMessage || (lang === 'ar' ? 'تم تجهيز وحفظ / مشاركة ملف التقرير بنجاح!' : 'Report generated and saved / shared successfully!');
        onToast(msg, res.success ? 'success' : 'info');
      }
    } catch (err) {
      console.error('Failed to generate PDF report:', err);
      if (onToast) {
        onToast(
          lang === 'ar'
            ? 'تعذر إنشاء الـ PDF. يمكنك استخدام زر "تقرير HTML مستقل" المضمون 100%!'
            : 'Download blocked. You can use the Standalone HTML Report or Print.',
          'error'
        );
      }
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadOfflineFeedHtml = async () => {
    if (!species || !feedType || !result) return;
    try {
      const htmlContent = generateFeedOfflineHtmlReport(species, feedType, input, result, lang);
      const cleanSpecies = species.id.replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `FeedCalc_Report_${cleanSpecies}_${Date.now()}.html`;
      const res = await universalDownloadText(filename, htmlContent);
      if (onToast) {
        onToast(
          res.message || (lang === 'ar' ? 'تم تنزيل تقرير HTML المستقل بنجاح! يفتح على أي هاتف بدون نت.' : 'Standalone HTML report downloaded!'),
          'success'
        );
      }
    } catch (err) {
      console.error('HTML feed report error:', err);
    }
  };

  const handleModalShare = async () => {
    if (!pdfReportData) return;
    if (pdfReportData.file && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          files: [pdfReportData.file],
          title: 'FeedCalc Pro Report',
          text: 'FeedCalc Pro Technical Nutritional Report - Freelance Developer ZAKARYA Bessioud',
        });
        if (onToast) onToast(lang === 'ar' ? 'تم الحفظ والمشاركة بنجاح!' : 'Shared successfully!', 'success');
        return;
      } catch (e: unknown) {
        const err = e as { name?: string };
        if (err?.name === 'AbortError' || err?.name === 'CancelError') return;
        console.warn('Modal share error:', e);
      }
    }
    handleModalDownloadAgain();
  };

  const handleDirectAnchorDownload = () => {
    if (!pdfReportData) return;
    const a = document.createElement('a');
    a.href = pdfReportData.blobUrl;
    a.download = pdfReportData.fileName;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      try {
        if (document.body.contains(a)) document.body.removeChild(a);
      } catch {}
    }, 500);
    if (onToast) onToast(lang === 'ar' ? 'تم بدء التنزيل المباشر!' : 'Download started!', 'success');
  };

  const handleModalDownloadAgain = async () => {
    if (!pdfReportData) return;
    if (pdfReportData.blob) {
      const res = await universalSaveOrShare({
        blob: pdfReportData.blob,
        filename: pdfReportData.fileName,
        title: 'FeedCalc Pro Report',
      });
      if (onToast && res.message) {
        onToast(res.message, res.success ? 'success' : 'info');
      }
    } else {
      handleDownloadPdf();
    }
  };

  const nutritionalMetrics = [
    {
      label: t.crudeProtein,
      value: feedType.protein,
      max: 50,
      unit: '%',
      color: 'bg-emerald-600',
    },
    {
      label: t.metabolizableEnergy,
      value: feedType.energy,
      max: 4000,
      unit: 'kcal/kg',
      color: 'bg-amber-500',
    },
    ...(feedType.fat !== undefined
      ? [
          {
            label: t.crudeFat,
            value: feedType.fat,
            max: 30,
            unit: '%',
            color: 'bg-yellow-500',
          },
        ]
      : []),
    {
      label: t.crudeFiber,
      value: feedType.fiber,
      max: 35,
      unit: '%',
      color: 'bg-orange-500',
    },
    {
      label: t.moisture,
      value: feedType.moisture,
      max: 70,
      unit: '%',
      color: 'bg-sky-500',
    },
    {
      label: t.totalAsh,
      value: feedType.ash,
      max: 15,
      unit: '%',
      color: 'bg-slate-400',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Primary Result Banner Card */}
      <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-50/70 via-white to-white p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-emerald-950/5">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <Scale className="size-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {t.resultsCardTitle}
              </h2>
              <p className="text-xs text-slate-500">
                {species.category === 'aquatic' ? t.aquacultureTank : t.farmLot}
                {' — '}
                <span className="tabular-nums">{input.count}</span> {speciesUnit} {t.atWeight}{' '}
                <span className="tabular-nums">{input.weight}</span> {weightUnitStr}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-download-pdf-top"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700 disabled:opacity-60 transition-colors cursor-pointer"
              title={t.downloadPdfReport}
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span className="hidden sm:inline">{t.downloadingPdf}</span>
                </>
              ) : (
                <>
                  <FileText className="size-3.5" />
                  <span className="hidden sm:inline">{t.downloadPdfReport}</span>
                  <span className="sm:hidden">PDF</span>
                </>
              )}
            </button>

            <button
              type="button"
              id="btn-download-feed-offline-html"
              onClick={handleDownloadOfflineFeedHtml}
              className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-white hover:bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-800 shadow-2xs transition-colors cursor-pointer"
              title={lang === 'ar' ? 'تقرير مستقل يفتح على أي هاتف بدون نت' : 'Offline HTML Report'}
            >
              <Globe className="size-3.5 text-emerald-600" />
              <span className="hidden md:inline">{lang === 'ar' ? 'تقرير HTML للمزرعة' : 'Offline HTML'}</span>
            </button>

            <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
              {speciesName}
            </span>
          </div>
        </div>

        {/* Big Feed Total Highlight - Strictly in 123 numerals */}
        <div className="my-5 rounded-xl border border-emerald-200/60 bg-white p-6 text-center shadow-xs">
          <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1.5">
            {t.totalDailyFeed}
          </div>
          <div className="flex items-baseline justify-center gap-2 text-4xl sm:text-5xl font-black text-emerald-700 tracking-tight">
            <span className="tabular-nums">{formatNum(result.dailyFeedTotal, 3)}</span>
            <span className="text-lg sm:text-xl font-bold text-slate-500">
              {feedRateUnitStr}
            </span>
          </div>
          <div className="mt-2 text-xs sm:text-sm font-medium text-slate-600">
            <span className="tabular-nums font-bold">{formatNum(result.dailyFeedPerUnit, 3)}</span>{' '}
            {t.perUnitDaily(
              speciesUnit,
              Math.round(result.dailyFeedPerUnit * (input.weightUnit === 'lb' ? 16 : 1000))
            )}{' '}
            {input.weightUnit === 'lb' && <span className="text-[11px] text-slate-400 font-bold">(oz)</span>}
          </div>
        </div>

        {/* 4 Key Indicators Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="flex flex-col items-center gap-1 rounded-xl border border-slate-200 bg-white p-3 text-center shadow-2xs">
            <Wheat className="size-4 text-emerald-600 mb-0.5" />
            <span className="text-[11px] font-medium text-slate-500">
              {t.dailyProtein}
            </span>
            <span className="text-sm font-bold text-slate-900 tabular-nums">
              {formatNum(result.dailyProtein, 3)} {weightUnitStr}
            </span>
          </div>

          <div className="flex flex-col items-center gap-1 rounded-xl border border-slate-200 bg-white p-3 text-center shadow-2xs">
            <Droplets className="size-4 text-sky-600 mb-0.5" />
            <span className="text-[11px] font-medium text-slate-500">
              {t.dailyEnergy}
            </span>
            <span className="text-sm font-bold text-slate-900 tabular-nums">
              {formatNum(result.dailyEnergy, 2)} {t.energyUnit}
            </span>
          </div>

          <div className="flex flex-col items-center gap-1 rounded-xl border border-slate-200 bg-white p-3 text-center shadow-2xs">
            <TrendingUp className="size-4 text-emerald-600 mb-0.5" />
            <span className="text-[11px] font-medium text-slate-500">
              {t.fcr}
            </span>
            <span className="text-sm font-bold text-slate-900 tabular-nums">
              {formatNum(result.fcr, 2)}
            </span>
          </div>

          <div className="flex flex-col items-center gap-1 rounded-xl border border-slate-200 bg-white p-3 text-center shadow-2xs">
            <Leaf className="size-4 text-emerald-600 mb-0.5" />
            <span className="text-[11px] font-medium text-slate-500">
              {t.conversionEff}
            </span>
            <span className="text-sm font-bold text-slate-900 tabular-nums">
              {formatNum(result.feedConversionEfficiency, 1)}%
            </span>
          </div>
        </div>

        {/* Cost Projection (if costPerKg provided) */}
        {result.dailyCost !== undefined && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-amber-900 font-semibold">
              <Coins className="size-4 text-amber-600 shrink-0" />
              <span>{t.economicValuation}</span>
            </div>
            <div className="flex items-center gap-4 text-amber-950 font-bold">
              <span>
                {t.dailyCost}{' '}
                <span className="text-sm tabular-nums">{currencySymbol}{formatNum(result.dailyCost, 2)}</span>
              </span>
              <span>
                {t.monthlyCost}{' '}
                <span className="text-sm text-emerald-800 tabular-nums">
                  {currencySymbol}{formatNum(result.monthlyCost || 0, 2)}
                </span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Nutritional Composition Breakdown */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <FlaskConical className="size-4 text-emerald-600" />
              <span>{t.nutritionalTitle(feedName)}</span>
            </h3>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                feedType.isCustom
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}
            >
              {feedType.isCustom ? t.customFeedBadge : t.standardFeedBadge}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {feedType.isCustom ? t.customFeedDesc : getFeedDesc(feedType)}
          </p>
        </div>

        <div className="space-y-3">
          {nutritionalMetrics.map((item) => {
            const percentage = Math.min((item.value / item.max) * 100, 100);
            return (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">{item.label}</span>
                  <span className="font-bold text-slate-900 tabular-nums">
                    {item.value} {item.unit}
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommended Feeding Schedule & Practical Advice */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Clock className="size-4 text-emerald-600" />
            <span>{t.scheduleTitle}</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {t.scheduleSubtitle(result.feedingFrequency, result.feedPerMealTotal)}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {result.feedingTimes.map((time, idx) => (
            <div
              key={time}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-xs shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <div className="flex size-5 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white tabular-nums">
                  {idx + 1}
                </div>
                <span className="font-semibold text-slate-800">{time}</span>
              </div>
              <span className="font-bold text-emerald-700 tabular-nums">
                {formatNum(result.feedPerMealTotal, 3)} {weightUnitStr}
              </span>
            </div>
          ))}
        </div>

        {/* Practical Farming Advisory & Herd Management Recommendations */}
        <div className="space-y-3">
          {/* General Husbandry & Water Advisory Note */}
          <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/40 p-3.5 text-xs text-slate-600 leading-relaxed space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-emerald-900">
              <AlertCircle className="size-3.5 text-emerald-600 shrink-0" />
              <span>{t.advisoryTitle}</span>
            </div>
            <p>
              {species.category === 'aquatic' ? t.advisoryAquatic : t.advisoryLand}
            </p>
          </div>

          {/* Species-Specific Breeding & Insemination Alert Card */}
          {breeding && (
            <div
              id="breeding-schedule-alert"
              className="rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50/60 via-white to-orange-50/40 p-4 text-xs shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between gap-2 border-b border-amber-100 pb-2">
                <div className="flex items-center gap-2 font-bold text-amber-950 text-xs sm:text-sm">
                  <div className="p-1.5 bg-amber-100/90 text-amber-800 rounded-lg shrink-0">
                    <CalendarClock className="size-4" />
                  </div>
                  <span>{t.breedingAlertTitle}</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200/60 shrink-0">
                  {speciesName}
                </span>
              </div>

              {/* Grid of Key Breeding Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* Cycle Interval */}
                <div className="p-2.5 rounded-lg bg-white/90 border border-amber-100 shadow-2xs space-y-1">
                  <span className="text-[10px] font-semibold text-amber-800 block">
                    {t.breedingCycleLabel}
                  </span>
                  <p className="text-[11px] font-bold text-slate-800 leading-snug">
                    {getBreedingField('cycle')}
                  </p>
                </div>

                {/* Optimal Insemination Time */}
                <div className="p-2.5 rounded-lg bg-amber-50/80 border border-amber-200/80 shadow-2xs space-y-1 sm:col-span-2">
                  <span className="text-[10px] font-semibold text-amber-900 flex items-center gap-1">
                    <Sparkles className="size-3 text-amber-600 shrink-0" />
                    {t.breedingOptimalTimeLabel}
                  </span>
                  <p className="text-[11px] font-bold text-amber-950 leading-snug">
                    {getBreedingField('optimalTime')}
                  </p>
                </div>
              </div>

              {/* Gestation / Incubation & Signs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                <div className="p-2.5 rounded-lg bg-white/80 border border-slate-200/70 space-y-1">
                  <span className="text-[10px] font-semibold text-slate-500 block">
                    {t.breedingGestationLabel}
                  </span>
                  <p className="text-[11px] font-medium text-slate-800 leading-snug">
                    {getBreedingField('gestation')}
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-white/80 border border-slate-200/70 space-y-1">
                  <span className="text-[10px] font-semibold text-slate-500 block">
                    {t.breedingSignsLabel}
                  </span>
                  <p className="text-[11px] font-medium text-slate-700 leading-snug">
                    {getBreedingField('signs')}
                  </p>
                </div>
              </div>

              {/* Technical Advisory & Fertility Tip */}
              <div className="pt-1 text-[11px] text-amber-900/90 leading-relaxed border-t border-amber-100/80 flex items-start gap-1.5">
                <span className="font-bold text-amber-900 shrink-0">💡 {t.breedingAdviceLabel}</span>
                <span>{getBreedingField('advice')}</span>
              </div>
            </div>
          )}

          {/* Veterinary Consultation & Liability Disclaimer Callout */}
          <div
            id="veterinary-disclaimer-box"
            className="rounded-xl border border-rose-200 bg-rose-50/50 p-3.5 text-xs text-rose-950 leading-relaxed space-y-1.5 shadow-2xs"
          >
            <div className="flex items-center gap-2 font-bold text-rose-900">
              <div className="p-1 rounded-md bg-rose-100 text-rose-700 shrink-0">
                <Stethoscope className="size-3.5" />
              </div>
              <span className="text-xs sm:text-[13px]">{t.veterinaryDisclaimerTitle}</span>
            </div>
            <p className="text-[11px] sm:text-xs text-rose-900/90 leading-relaxed">
              {t.veterinaryDisclaimerText}
            </p>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-slate-100 no-print">
          <button
            type="button"
            id="btn-copy-report"
            onClick={handleCopySummary}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="size-3.5 text-emerald-600" />
                <span className="text-emerald-700">{t.copied}</span>
              </>
            ) : (
              <>
                <Copy className="size-3.5 text-slate-500" />
                <span>{t.copyReport}</span>
              </>
            )}
          </button>

          <button
            type="button"
            id="btn-download-pdf-toolbar"
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 disabled:opacity-60 transition-colors cursor-pointer shadow-2xs"
            title={t.downloadPdfReport}
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="size-3.5 animate-spin text-emerald-600" />
                <span>{t.downloadingPdf}</span>
              </>
            ) : (
              <>
                <FileText className="size-3.5 text-emerald-700" />
                <span>{t.downloadPdfReport}</span>
              </>
            )}
          </button>

          <button
            type="button"
            id="btn-print-report"
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <Printer className="size-3.5 text-slate-500" />
            <span>{t.print}</span>
          </button>

          <button
            type="button"
            id="btn-reset"
            onClick={onReset}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
          >
            <RotateCcw className="size-3.5 text-rose-600" />
            <span>{t.newCalculation}</span>
          </button>
        </div>
      </div>

      {/* PDF Report Preview & Download Modal */}
      {isPdfModalOpen && pdfReportData && (
        <div
          id="pdf-download-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs"
        >
          <div className="relative w-full max-w-2xl rounded-2xl bg-white p-5 sm:p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
                  <FileText className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    {lang === 'ar' ? 'تقرير التغذية والحسابات (ملف PDF)' : 'Feeding & Nutrition PDF Report'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono truncate max-w-[240px] sm:max-w-md">
                    {pdfReportData.fileName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                id="btn-close-pdf-modal"
                onClick={() => setIsPdfModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Body / Info & preview */}
            <div className="py-3 space-y-2.5 flex-1 overflow-hidden flex flex-col">
              <div className="rounded-lg bg-emerald-50/90 border border-emerald-200/90 p-2.5 sm:p-3 text-xs text-emerald-950 flex items-start gap-2">
                <Check className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  {lang === 'ar'
                    ? 'تم تجهيز التقرير بنجاح! إذا منع متصفحك التنزيل التلقائي بسبب قيود الأمان أو إطار المعاينة، يمكنك النقر على زر "تنزيل ملف PDF" أدناه أو استخدام خيار "طباعة / حفظ كـ PDF".'
                    : 'Report generated successfully! If automatic download was blocked by browser sandbox policies, use the direct Download PDF button below or Print / Save as PDF.'}
                </span>
              </div>

              {/* Visual Report Preview Container */}
              <div className="flex-1 min-h-[260px] max-h-[52vh] sm:max-h-[58vh] overflow-y-auto rounded-xl border border-slate-200 bg-slate-100/90 p-2 shadow-inner flex items-center justify-center">
                {pdfReportData.previewImageUrl ? (
                  <img
                    src={pdfReportData.previewImageUrl}
                    alt="FeedCalc Report Preview"
                    className="max-w-full h-auto max-h-full rounded shadow-sm border border-slate-300 object-contain mx-auto"
                  />
                ) : (
                  <iframe
                    src={pdfReportData.blobUrl}
                    title="PDF Preview"
                    className="w-full h-full min-h-[260px] sm:min-h-[320px] border-0"
                  />
                )}
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  id="btn-modal-share-pdf"
                  onClick={handleModalShare}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-2 text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  <Share2 className="size-3.5" />
                  <span>{lang === 'ar' ? '📱 حفظ في الملفات / مشاركة' : 'Save to Files / Share'}</span>
                </button>

                <button
                  type="button"
                  id="btn-modal-direct-download"
                  onClick={handleDirectAnchorDownload}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  <Download className="size-3.5" />
                  <span>{lang === 'ar' ? '💾 تنزيل PDF' : 'Download PDF'}</span>
                </button>

                <button
                  type="button"
                  id="btn-modal-offline-html"
                  onClick={handleDownloadOfflineFeedHtml}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-600 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 px-3 py-2 text-xs font-bold transition cursor-pointer"
                >
                  <Globe className="size-3.5 text-emerald-600" />
                  <span>{lang === 'ar' ? '🌐 تقرير HTML للمزرعة' : 'Offline HTML'}</span>
                </button>

                <a
                  href={pdfReportData.blobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  id="btn-modal-open-new-tab"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3 py-2 text-xs font-semibold transition cursor-pointer"
                >
                  <ExternalLink className="size-3.5 text-slate-500" />
                  <span>{lang === 'ar' ? 'عرض في نافذة مستقلة' : 'Open in New Window'}</span>
                </a>

                <button
                  type="button"
                  id="btn-modal-print-pdf"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3 py-2 text-xs font-semibold transition cursor-pointer"
                >
                  <Printer className="size-3.5 text-slate-500" />
                  <span>{lang === 'ar' ? 'طباعة / حفظ كـ PDF' : 'Print / Save as PDF'}</span>
                </button>
              </div>

              <button
                type="button"
                id="btn-modal-dismiss-pdf"
                onClick={() => setIsPdfModalOpen(false)}
                className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                {lang === 'ar' ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
