import React, { useState, useEffect } from 'react';
import {
  Sun,
  Droplets,
  Zap,
  Gauge,
  Copy,
  Check,
  RotateCcw,
  X,
  Info,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Layers,
  Cpu,
  BookOpen,
  ArrowRightLeft,
  Flame,
  Award,
  HelpCircle,
  CheckCircle2,
  Sliders,
  DollarSign,
  Power,
  Download,
  ExternalLink,
  Printer,
  FileText,
  Globe,
  Share2,
  Loader2,
  FileCheck
} from 'lucide-react';
import { Language } from '../types';
import { formatNum, normalizeDigits } from '../utils/translations';
import { exportSolarPumpPdfReport } from '../utils/solarPdfGenerator';
import { generateSolarOfflineHtmlReport } from '../utils/offlineReportGenerator';
import { universalDownloadText, detectDevice } from '../utils/universalDownloader';

interface SolarPumpCalculatorProps {
  lang: Language;
  isModal?: boolean;
  onClose?: () => void;
  onToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export type PumpMotorType = 'ac_3phase' | 'dc_bldc' | 'ac_1phase';
export type SolarPanelType = 'mono_black' | 'poly_blue' | 'topcon_n';
export type InverterType = 'solar_vfd' | 'hybrid' | 'dc_mppt';
export type GridStatus = 'yes' | 'no';
export type QualityTier = 'economic' | 'premium';

export interface SolarPumpCalculationResult {
  waterQ: number;
  totalHead: number;
  peakSunHours: number;
  pumpEfficiency: number;
  pumpPowerKw: number;
  pumpPowerHp: number;
  totalPvWatts: number;
  totalPvKw: number;
  panelWatt: number;
  panelCount: number;
  inverterKw: number;
  hourlyFlow: number;
  dailyHydraulicEnergy: number;
  recommendedInverterHp: number;
  pumpType: PumpMotorType;
  panelType: SolarPanelType;
  inverterType: InverterType;
  stringConfig: string;
  backupGeneratorKva?: number;
  tempDeratingPercent: number;
  gridStatus: GridStatus;
  qualityTier: QualityTier;
}

export const SolarPumpCalculator: React.FC<SolarPumpCalculatorProps> = ({
  lang,
  isModal = false,
  onClose,
  onToast,
}) => {
  // Three core guided questions state
  const [gridStatus, setGridStatus] = useState<GridStatus>('no');
  const [qualityTier, setQualityTier] = useState<QualityTier>('premium');
  const [waterQ, setWaterQ] = useState('50');
  const [totalHead, setTotalHead] = useState('70');

  // Engineering selectors (synced with the 3 questions, but can be fine-tuned)
  const [pumpType, setPumpType] = useState<PumpMotorType>('ac_3phase');
  const [panelType, setPanelType] = useState<SolarPanelType>('mono_black');
  const [inverterType, setInverterType] = useState<InverterType>('solar_vfd');
  const [panelWatt, setPanelWatt] = useState('550');
  const [peakSunHours, setPeakSunHours] = useState('5');

  // UI state
  const [activeTab, setActiveTab] = useState<'wizard' | 'custom'>('wizard');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [result, setResult] = useState<SolarPumpCalculationResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [downloadFeedback, setDownloadFeedback] = useState('');
  const [preparedPdf, setPreparedPdf] = useState<{ blob?: Blob; blobUrl: string; file?: File; fileName: string; dataUrl?: string } | null>(null);
  const device = detectDevice();

  // Synchronize Question 1 (Grid connection) with Inverter Type
  const handleGridChange = (status: GridStatus) => {
    setGridStatus(status);
    if (status === 'yes') {
      setInverterType('hybrid');
    } else {
      setInverterType(pumpType === 'dc_bldc' ? 'dc_mppt' : 'solar_vfd');
    }
  };

  // Synchronize Question 2 (Quality Tier) with Panel Type
  const handleTierChange = (tier: QualityTier) => {
    setQualityTier(tier);
    if (tier === 'economic') {
      setPanelType('poly_blue');
    } else {
      setPanelType('mono_black');
    }
  };

  // Auto-sync inverter recommendation when pump type changes
  useEffect(() => {
    if (pumpType === 'dc_bldc') {
      setInverterType('dc_mppt');
    } else if (inverterType === 'dc_mppt') {
      setInverterType(gridStatus === 'yes' ? 'hybrid' : 'solar_vfd');
    }
  }, [pumpType, gridStatus]);

  const calculateSolarPump = () => {
    setErrorMsg('');
    const cleanQ = normalizeDigits(waterQ);
    const cleanH = normalizeDigits(totalHead);
    const cleanP = normalizeDigits(panelWatt);
    const cleanHours = normalizeDigits(peakSunHours);

    const Q = parseFloat(cleanQ);
    const H = parseFloat(cleanH);
    const pWatt = parseFloat(cleanP) || 550;
    const psh = parseFloat(cleanHours) || 5;

    if (!Q || !H || isNaN(Q) || isNaN(H) || Q <= 0 || H <= 0) {
      const err =
        lang === 'ar'
          ? 'الرجاء إدخال قيم صحيحة وموجبة لكمية المياه والارتفاع الهيدروليكي (العمق).'
          : 'Please enter valid positive values for daily water flow and total head depth.';
      setErrorMsg(err);
      if (onToast) onToast(err, 'error');
      return;
    }

    // 1. Rigorous Hydraulic Energy Sizing (Cambridge University & FAO 56 standard):
    // E_hydraulic_daily = (rho * g * Q * TDH) / 3.6e6 = (Q * TDH) / 367  [kWh/day]
    // Hydraulic Electrical Power P_pump:
    // P_pump_kw = (Q * TDH) / (367 * PSH * eta_wire_to_water)
    let pumpEfficiency = 0.52; // Default AC 3-Phase induction (~52%)
    let pvOversizeRatio = 1.35; // Oversizing for AC surge, inverter loss, power factor

    if (pumpType === 'dc_bldc') {
      pumpEfficiency = 0.78; // BLDC brushless permanent magnet motor: high ~78% efficiency
      pvOversizeRatio = 1.15; // Low starting surge, direct DC bus MPPT
    } else if (pumpType === 'ac_1phase') {
      pumpEfficiency = 0.46; // AC Single Phase has lower power factor and capacitor losses
      pvOversizeRatio = 1.45;
    }

    const P_pump_kw = (Q * H) / (367 * psh * pumpEfficiency);
    const P_pump_hp = P_pump_kw * 1.34102;

    // 2. Solar Panel Technology & Thermal Derating:
    // Cambridge Solar Engineering: Cell temperature in summer reaches 60°C - 68°C.
    // Monocrystalline (Black): gamma ~ -0.32%/°C -> Derating factor 1.00 (reference base)
    // Polycrystalline (Blue): gamma ~ -0.40%/°C -> Needs +15% extra PV capacity
    // N-Type TOPCon / Bifacial: gamma ~ -0.29%/°C + 8% albedo gain -> factor 0.94
    let panelDeratingFactor = 1.0;
    let tempDeratingPercent = 7.5;

    if (panelType === 'poly_blue') {
      panelDeratingFactor = 1.15; // +15% more wattage required to compensate thermal losses
      tempDeratingPercent = 16.0;
    } else if (panelType === 'topcon_n') {
      panelDeratingFactor = 0.94; // -6% thanks to high efficiency and rear albedo capture
      tempDeratingPercent = 5.0;
    }

    // Total PV array peak capacity (Wp)
    const total_pv_watts = P_pump_kw * 1000 * pvOversizeRatio * panelDeratingFactor;
    const total_pv_kw = total_pv_watts / 1000;

    // Solar panels count
    let panelCount = Math.ceil(total_pv_watts / pWatt);

    // Ensure balanced strings configuration:
    let stringConfig = '';
    if (pumpType === 'ac_3phase') {
      if (panelCount <= 18) {
        if (panelCount % 2 !== 0) panelCount++;
        stringConfig =
          lang === 'ar'
            ? `مصفوفة مفردة: ${panelCount} لوح موصولة كلها على التوالي (Series String) لتأمين جهد MPPT (~${Math.round(panelCount * 42)}V)`
            : `Single String: ${panelCount} panels in series for optimal MPPT (~${Math.round(panelCount * 42)}V)`;
      } else {
        const strings = 2;
        let perString = Math.ceil(panelCount / strings);
        if (perString % 2 !== 0) perString++;
        panelCount = perString * strings;
        stringConfig =
          lang === 'ar'
            ? `مصفوفتان متوازيتان (2 Strings in Parallel): كل مصفوفة تضم ${perString} لوح على التوالي (إجمالي ${panelCount} لوح)`
            : `2 Parallel Strings: ${perString} panels per string in series (Total ${panelCount} panels)`;
      }
    } else if (pumpType === 'ac_1phase') {
      if (panelCount % 2 !== 0) panelCount++;
      stringConfig =
        lang === 'ar'
          ? `مصفوفة ${panelCount} لوح (توصيل هجين توالي/توازي حسب جهد دخول VFD المعتمد 220V)`
          : `Array of ${panelCount} panels matched to 220V single-phase VFD MPPT window`;
    } else {
      if (panelCount % 2 !== 0) panelCount++;
      stringConfig =
        lang === 'ar'
          ? `توصيل منخفض الجهد (Low DC Bus): ${panelCount} لوح متوافقة مباشرة مع محكم DC MPPT`
          : `${panelCount} panels directly configured for the DC MPPT controller voltage`;
    }

    // 3. Inverter & Controller Sizing:
    let inverterMultiplier = 1.25;
    if (inverterType === 'hybrid') {
      inverterMultiplier = 1.30;
    } else if (inverterType === 'dc_mppt') {
      inverterMultiplier = 1.15;
    }

    const inverterKw = parseFloat((P_pump_kw * inverterMultiplier).toFixed(1));
    const recommendedInverterHp = parseFloat((P_pump_hp * inverterMultiplier).toFixed(1));

    // Hybrid Diesel Generator recommendation:
    let backupGeneratorKva: number | undefined;
    if (inverterType === 'hybrid') {
      backupGeneratorKva = Math.ceil((P_pump_kw * 1.55) / 0.8);
    }

    // Approximate average hourly flow during peak sunshine
    const hourlyFlow = Q / psh;

    // Daily Hydraulic Energy in kWh
    const dailyHydraulicEnergy = (Q * H) / (367 * pumpEfficiency);

    const calculated: SolarPumpCalculationResult = {
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

    setResult(calculated);

    if (onToast) {
      onToast(
        lang === 'ar'
          ? 'تم احتساب منظومة الضخ الشمسي بدقة هندسية عالية!'
          : 'Solar water pumping system sized with high engineering precision!',
        'success'
      );
    }
  };

  const handleReset = () => {
    setGridStatus('no');
    setQualityTier('premium');
    setWaterQ('50');
    setTotalHead('70');
    setPanelWatt('550');
    setPeakSunHours('5');
    setPumpType('ac_3phase');
    setPanelType('mono_black');
    setInverterType('solar_vfd');
    setResult(null);
    setPreparedPdf(null);
    setErrorMsg('');
    setDownloadFeedback('');
  };

  const getPumpLabel = (type: PumpMotorType) => {
    if (lang === 'ar') {
      switch (type) {
        case 'ac_3phase':
          return 'مضخة تيار متناوب ثلاثية الطور (AC 3-Phase 380V)';
        case 'dc_bldc':
          return 'مضخة تيار مستمر فائقة الكفاءة (DC BLDC عديمة الفحمات)';
        case 'ac_1phase':
          return 'مضخة تيار متناوب أحادية الطور (AC 1-Phase 220V)';
      }
    } else {
      switch (type) {
        case 'ac_3phase':
          return 'AC 3-Phase 380V Submersible Pump';
        case 'dc_bldc':
          return 'DC BLDC Brushless High-Efficiency Pump';
        case 'ac_1phase':
          return 'AC 1-Phase 220V Submersible Pump';
      }
    }
  };

  const getPanelLabel = (type: SolarPanelType) => {
    if (lang === 'ar') {
      switch (type) {
        case 'mono_black':
          return 'أحادي البلورة أسود (Monocrystalline Black) — كفاءة 22%';
        case 'poly_blue':
          return 'متعدد البلورات أزرق (Polycrystalline Blue) — كفاءة 17%';
        case 'topcon_n':
          return 'تقنية N-Type TOPCon مزدوج الوجه — كفاءة 24%';
      }
    } else {
      switch (type) {
        case 'mono_black':
          return 'Monocrystalline Black Panels (22% Eff)';
        case 'poly_blue':
          return 'Polycrystalline Blue Panels (17% Eff)';
        case 'topcon_n':
          return 'N-Type TOPCon Bifacial Panels (24% Eff)';
      }
    }
  };

  const getInverterLabel = (type: InverterType) => {
    if (lang === 'ar') {
      switch (type) {
        case 'solar_vfd':
          return 'مغير تردد شمسي VFD ذكي مستقل (Solar VFD MPPT)';
        case 'hybrid':
          return 'عاكس هجين ذكي مزدوج (Hybrid: شمسي + شبكة / مولد ديزل)';
        case 'dc_mppt':
          return 'محكم تيار مستمر ذكي (DC MPPT Controller)';
      }
    } else {
      switch (type) {
        case 'solar_vfd':
          return 'Solar VFD MPPT Inverter (Dedicated Off-Grid)';
        case 'hybrid':
          return 'Hybrid Solar Pump Inverter (Solar + Grid/Gen Blending)';
        case 'dc_mppt':
          return 'DC MPPT Pump Controller';
      }
    }
  };

  const handlePrint = () => {
    if (!result) return;
    window.print();
    if (onToast) {
      onToast(
        lang === 'ar'
          ? 'تم فتح نافذة الطباعة / الحفظ كـ PDF مباشرة. اختر "Save as PDF" للحفظ الفوري!'
          : 'Print dialog opened! Choose "Save as PDF" to save directly.',
        'success'
      );
    }
  };

  const handleOpenInNewTab = () => {
    window.open(getReportUrl(false), '_blank');
  };

  const getReportUrl = (autoDownload = true) => {
    if (!result) return '#';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
    const query = new URLSearchParams({
      solar_report: '1',
      q: String(result.waterQ),
      h: String(result.totalHead),
      pump: result.pumpType,
      panel: result.panelType,
      inv: result.inverterType,
      pKw: String(result.pumpPowerKw),
      pHp: String(result.pumpPowerHp),
      pCnt: String(result.panelCount),
      pWatt: String(result.panelWatt),
      invKw: String(result.inverterKw),
      grid: result.gridStatus,
      tier: result.qualityTier,
      psh: String(result.peakSunHours),
      auto: autoDownload ? '1' : '0'
    });
    return `${origin}${pathname}?${query.toString()}`;
  };

  const handleCopySummary = () => {
    if (!result) return;
    const isAr = lang === 'ar';
    const text = isAr
      ? `تقرير منظومة الطاقة الشمسية لضخ الآبار الفلاحية
المعايير الهندسية: جامعة كامبردج ومنظمة الأغذية والزراعة (FAO)
--------------------------------------------------
* خيارات القرار ومعطيات البئر:
  1. الربط بالكهرباء: ${result.gridStatus === 'yes' ? 'نعم (نظام هجين Hybrid يدمج الطاقة الشمسية مع الشبكة أو المولد 24/7)' : 'لا (نظام شمسي عادي مستقل Off-Grid)'}
  2. فئة الجودة والميزانية: ${result.qualityTier === 'premium' ? 'نوعية رفيعة ممتازة (ألواح سوداء مونوكريستالين عالية الكفاءة ومقاومة للحرارة)' : 'خيار اقتصادي (ألواح زرقاء متعددة البلورات بتكلفة أولية أقل)'}
  3. كمية المياه المطلوبة: ${formatNum(result.waterQ, 1)} متر مكعب في اليوم
  4. عمق البئر الكلي (TDH): ${formatNum(result.totalHead, 0)} متر
  5. ساعات الذروة الشمسية: ${formatNum(result.peakSunHours, 1)} ساعات في اليوم
  6. معدل التدفق الساعي التقديري: قرابة ${formatNum(result.hourlyFlow, 1)} متر مكعب في الساعة
--------------------------------------------------
* نتائج الحسابات والمواصفات المقترحة:
  - قدرة المضخة المقترحة: ${formatNum(result.pumpPowerKw, 2)} كيلوواط (${formatNum(result.pumpPowerHp, 1)} حصان)
  - نوع المحرك: ${getPumpLabel(result.pumpType)}
  - كفاءة المنظومة الإجمالية: ${result.pumpEfficiency}%
  - عدد الألواح الشمسية: ${result.panelCount} لوح (قدرة ${result.panelWatt} واط للوح)
  - إجمالي قدرة حقل الألواح: ${formatNum(result.totalPvKw, 2)} كيلوواط ذروة (${formatNum(result.totalPvWatts, 0)} واط)
  - نوع الألواح المعتمدة: ${getPanelLabel(result.panelType)}
  - التوصيل الكهربائي: ${result.stringConfig}
  - نوع العاكس ومحول التردد: ${getInverterLabel(result.inverterType)}
  - استطاعة العاكس الصغرى: ${formatNum(result.inverterKw, 1)} كيلوواط (${formatNum(result.recommendedInverterHp, 1)} حصان)${
    result.backupGeneratorKva
      ? `\n  - استطاعة المولد الاحتياطي المقترح: ${result.backupGeneratorKva} kVA ديزل للتشغيل الليلي 24/7`
      : ''
  }
--------------------------------------------------
إعداد وتصميم: مطور تطبيقات وبرامج حر: زكريا بسيود ZAKARYA Bessioud
هاتف / واتساب: 0655870392 (+213655870392)
البريد الإلكتروني: boussiouxzaki@gmail.com
FeedCalc Pro Solar — المنظومة الهندسية المعتمدة`
      : `Solar Water Pumping System Calculation Report
Engineering Standards: Cambridge University & FAO 56
--------------------------------------------------
* Decision & Field Inputs:
  1. Grid Connection: ${result.gridStatus === 'yes' ? 'Connected (Hybrid Solar Inverter 24/7)' : 'Off-Grid (Dedicated Solar VFD)'}
  2. Quality Tier: ${result.qualityTier === 'premium' ? 'Premium Tier (Black Monocrystalline)' : 'Economic Tier (Blue Polycrystalline)'}
  3. Total Dynamic Head (TDH): ${formatNum(result.totalHead, 0)} meters
  4. Daily Water Required: ${formatNum(result.waterQ, 1)} m3/day
  5. Peak Sun Hours: ${formatNum(result.peakSunHours, 1)} hours/day
  6. Estimated Hourly Flow: ~${formatNum(result.hourlyFlow, 1)} m3/hour
--------------------------------------------------
* Recommended System Sizing:
  - Submersible Pump: ${formatNum(result.pumpPowerKw, 2)} kW (${formatNum(result.pumpPowerHp, 1)} HP)
  - Motor Type: ${getPumpLabel(result.pumpType)}
  - System Efficiency: ${result.pumpEfficiency}%
  - Solar Panels Required: ${result.panelCount} panels (${result.panelWatt}W each)
  - Total PV Capacity: ${formatNum(result.totalPvKw, 2)} kWp (${formatNum(result.totalPvWatts, 0)} W)
  - Panel Type: ${getPanelLabel(result.panelType)}
  - String Configuration: ${result.stringConfig}
  - Inverter Rating: Minimum ${formatNum(result.inverterKw, 1)} kW (${formatNum(result.recommendedInverterHp, 1)} HP) - ${getInverterLabel(result.inverterType)}${
    result.backupGeneratorKva
      ? `\n  - Recommended Generator Backup: ${result.backupGeneratorKva} kVA Diesel for 24/7 duty`
      : ''
  }
--------------------------------------------------
Engineered by: ZAKARYA Bessioud | FeedCalc Pro Solar
Phone / WhatsApp: +213655870392
Email: boussiouxzaki@gmail.com`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      if (onToast) {
        onToast(
          lang === 'ar'
            ? 'تم نسخ التقرير كنص عربي واضح ومفهوم للحافظة!'
            : 'Specifications copied cleanly to clipboard!',
          'success'
        );
      }
    });
  };

  const handleDirectDownloadPdf = async () => {
    if (!result || isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    setDownloadFeedback(
      lang === 'ar'
        ? '⏳ جارٍ تجهيز ملف الـ PDF وحفظه بجهازك فوراً...'
        : '⏳ Preparing PDF report for your device...'
    );
    try {
      const res = await exportSolarPumpPdfReport(result, lang);
      if (res && res.success) {
        setPreparedPdf({
          blob: res.blob,
          blobUrl: res.blobUrl,
          file: res.file,
          fileName: res.fileName,
          dataUrl: res.dataUrl,
        });

        const msg =
          res.actionMessage ||
          (lang === 'ar'
            ? '✅ تم تجهيز ملف الـ PDF بنجاح وحفظه! يمكنك أيضاً استخدام خيارات الحفظ أدناه.'
            : '✅ PDF prepared and saved successfully! Additional save options are available below.');
        setDownloadFeedback(msg);
        if (onToast) onToast(msg, 'success');
      } else {
        const fallbackMsg =
          lang === 'ar'
            ? '⚠️ يمكنك أيضاً تنزيل تقرير HTML المستقل أو استخدام الطباعة للحفظ كـ PDF.'
            : '⚠️ You can also download the standalone HTML report or use Print to save as PDF.';
        setDownloadFeedback(fallbackMsg);
        if (onToast) onToast(fallbackMsg, 'info');
      }
    } catch (err) {
      console.error('Direct PDF export error:', err);
      const errMsg =
        lang === 'ar'
          ? 'تعذر حفظ الـ PDF مباشرة بسبب قيود المتصفح. استخدم زر "تقرير HTML مستقل" المضمون 100% أو زر فتح في نافذة مستقلة!'
          : 'Direct PDF save blocked by browser sandbox. Use 100% guaranteed Standalone HTML report!';
      setDownloadFeedback(errMsg);
      if (onToast) onToast(errMsg, 'error');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleSynchronousShare = async () => {
    if (!preparedPdf) return;
    if (preparedPdf.file && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          files: [preparedPdf.file],
          title: lang === 'ar' ? 'تقرير منظومة الضخ الشمسي' : 'Solar Pump System Report',
          text: lang === 'ar' ? 'تقرير التصميم الفني لمنظومة الضخ الشمسي - مطور تطبيقات وبرامج حر: زكريا بسيود' : 'Solar Pump System Report - Freelance Developer ZAKARYA Bessioud',
        });
        if (onToast) onToast(lang === 'ar' ? 'تم فتح الحفظ والمشاركة بنجاح!' : 'Shared successfully!', 'success');
        return;
      } catch (e: unknown) {
        const err = e as { name?: string };
        if (err?.name === 'AbortError' || err?.name === 'CancelError') return;
        console.warn('Sync share error:', e);
      }
    }
    // Fallback: Open in new tab or navigate
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
    if (onToast) onToast(lang === 'ar' ? 'تم إرسال أمر التنزيل المباشر!' : 'Direct download triggered!', 'success');
  };

  const handleEscapeIframe = () => {
    if (typeof window !== 'undefined') {
      window.open(window.location.href, '_blank');
    }
  };

  const handleDownloadOfflineHtml = async () => {
    if (!result) return;
    try {
      const htmlContent = generateSolarOfflineHtmlReport(result, lang);
      const filename = `Solar_Well_Report_FeedCalc_${Math.round(result.totalHead)}m_${Math.round(result.waterQ)}m3.html`;
      const res = await universalDownloadText(filename, htmlContent);
      const msg =
        res.message ||
        (lang === 'ar'
          ? '✅ تم تنزيل تقرير HTML المستقل للمزرعة! يفتح على أي جهاز وهاتف بدون إنترنت وبنقرة واحدة.'
          : '✅ Standalone offline HTML report downloaded! Opens on any device without internet.');
      setDownloadFeedback(msg);
      if (onToast) onToast(msg, 'success');
    } catch (err) {
      console.error('HTML report download error:', err);
    }
  };

  const cardContent = (
    <div className="bg-white p-5 sm:p-7 rounded-2xl shadow-xl max-w-2xl mx-auto my-4 border border-emerald-100 text-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-emerald-950/5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-amber-500 to-emerald-600 text-white rounded-xl shadow-xs">
            <Sun className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-extrabold text-gray-900 leading-tight">
                {lang === 'ar' ? 'حاسبة الطاقة الشمسية للآبار الفلاحية' : 'Solar Well Pumping Engineering Calculator'}
              </h3>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                <Award className="size-3" />
                {lang === 'ar' ? 'معايير كامبردج و FAO' : 'Cambridge & FAO'}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              {lang === 'ar'
                ? 'تصميم منظومة الضخ بالأسئلة الذكية الثلاثة وتبيين كافة المميزات الهندسية'
                : '3-Question Smart Pumping Design & Comprehensive Feature Comparison'}
            </p>
          </div>
        </div>

        {isModal && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="size-5" />
          </button>
        )}
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex items-center gap-2 mb-4 p-1 bg-slate-100 rounded-xl text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('wizard')}
          className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
            activeTab === 'wizard'
              ? 'bg-white text-emerald-800 shadow-2xs font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <HelpCircle className="size-4 text-emerald-600" />
          <span>{lang === 'ar' ? 'الأسئلة الذكية الـ 3 (موصى به للمزارع)' : 'Smart 3-Questions Wizard'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('custom')}
          className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
            activeTab === 'custom'
              ? 'bg-white text-emerald-800 shadow-2xs font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sliders className="size-4 text-emerald-600" />
          <span>{lang === 'ar' ? 'التخصيص الهندسي اليدوي' : 'Advanced Engineering Mode'}</span>
        </button>
      </div>

      {/* Main Form Body */}
      <div className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {/* ---------------- WIZARD MODE: 3 GUIDING QUESTIONS ---------------- */}
        {activeTab === 'wizard' ? (
          <div className="space-y-4">
            {/* Question 1: Grid Connection */}
            <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900">
                  <Power className="size-3.5" />
                  <span>{lang === 'ar' ? 'السؤال الأول (مصدر الطاقة):' : 'Question 1 (Power Grid):'}</span>
                </span>
                <span className="text-[11px] font-semibold text-emerald-700">
                  {gridStatus === 'yes'
                    ? lang === 'ar' ? 'تم اختيار: عاكس هجين (Hybrid)' : 'Selected: Hybrid Inverter'
                    : lang === 'ar' ? 'تم اختيار: خيار عادي (Solar VFD)' : 'Selected: Solar VFD Inverter'}
                </span>
              </div>

              <div className="text-sm font-bold text-slate-900">
                {lang === 'ar'
                  ? 'هل المزرعة مربوطة بشبكة الكهرباء العامة أو يتوفر لديك مولد ديزل؟'
                  : 'Is your farm connected to the power grid or do you have a diesel generator?'}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {/* Yes -> Hybrid */}
                <button
                  type="button"
                  onClick={() => handleGridChange('yes')}
                  className={`p-3 rounded-xl border text-start transition cursor-pointer flex flex-col justify-between ${
                    gridStatus === 'yes'
                      ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/20 shadow-2xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
                      <Zap className="size-4 text-amber-600" />
                      {lang === 'ar' ? 'نعم، مربوط بالشبكة أو يتوفر مولد' : 'Yes, Grid or Generator Available'}
                    </span>
                    {gridStatus === 'yes' && <CheckCircle2 className="size-4 text-amber-600 shrink-0" />}
                  </div>
                  <div className="text-[11px] text-amber-900/80 mt-1.5 leading-snug font-medium">
                    {lang === 'ar' ? '👈 خيار هجين (Hybrid Inverter):' : '👈 Hybrid Inverter Selection:'}
                  </div>
                  <ul className="text-[10.5px] text-slate-600 mt-1 space-y-0.5 list-disc list-inside leading-relaxed">
                    <li>{lang === 'ar' ? 'ري نهاري وليلي متواصل 24/7 دون توقف' : 'Continuous 24/7 day and night irrigation'}</li>
                    <li>{lang === 'ar' ? 'دمج فوري للطاقة الشمسية لتوفير 80% من الفاتورة/الديزل' : 'Instant solar blending saving up to 80% fuel'}</li>
                  </ul>
                </button>

                {/* No -> Standard Off-Grid */}
                <button
                  type="button"
                  onClick={() => handleGridChange('no')}
                  className={`p-3 rounded-xl border text-start transition cursor-pointer flex flex-col justify-between ${
                    gridStatus === 'no'
                      ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20 shadow-2xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
                      <Sun className="size-4 text-emerald-600" />
                      {lang === 'ar' ? 'لا، مزرعة معزولة تماماً (Off-Grid)' : 'No, Completely Off-Grid'}
                    </span>
                    {gridStatus === 'no' && <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />}
                  </div>
                  <div className="text-[11px] text-emerald-900/80 mt-1.5 leading-snug font-medium">
                    {lang === 'ar' ? '👈 خيار عادي (Solar VFD Inverter):' : '👈 Standard Solar VFD Selection:'}
                  </div>
                  <ul className="text-[10.5px] text-slate-600 mt-1 space-y-0.5 list-disc list-inside leading-relaxed">
                    <li>{lang === 'ar' ? 'استقلالية شمسية كاملة وصفر فواتير أو تكاليف وقود' : '100% solar independence with zero fuel costs'}</li>
                    <li>{lang === 'ar' ? 'مغير تردد متغير السرعة مع إقلاع سلس وحماية ضد الجفاف' : 'Variable MPPT speed with soft start & dry-run guard'}</li>
                  </ul>
                </button>
              </div>
            </div>

            {/* Question 2: Economic vs Premium Tier */}
            <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-900">
                  <DollarSign className="size-3.5" />
                  <span>{lang === 'ar' ? 'السؤال الثاني (فئة الجودة والميزانية):' : 'Question 2 (Budget & Tier):'}</span>
                </span>
                <span className="text-[11px] font-semibold text-indigo-700">
                  {qualityTier === 'premium'
                    ? lang === 'ar' ? 'تم اختيار: نوعية رفيعة ممتازة' : 'Selected: Premium Tier'
                    : lang === 'ar' ? 'تم اختيار: خيار اقتصادي' : 'Selected: Economic Tier'}
                </span>
              </div>

              <div className="text-sm font-bold text-slate-900">
                {lang === 'ar'
                  ? 'ما هو خيار الميزانية والجودة المفضل لديك في الألواح والمعدات؟'
                  : 'What is your preferred budget and quality tier for panels & equipment?'}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {/* Economic Tier */}
                <button
                  type="button"
                  onClick={() => handleTierChange('economic')}
                  className={`p-3 rounded-xl border text-start transition cursor-pointer flex flex-col justify-between ${
                    qualityTier === 'economic'
                      ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20 shadow-2xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
                      <span className="size-3 rounded-full bg-blue-600" />
                      {lang === 'ar' ? 'خيار اقتصادي (Economic Tier)' : 'Economic / Budget Tier'}
                    </span>
                    {qualityTier === 'economic' && <CheckCircle2 className="size-4 text-blue-600 shrink-0" />}
                  </div>
                  <div className="text-[11px] text-blue-900/80 mt-1.5 leading-snug font-medium">
                    {lang === 'ar' ? 'ألواح زرقاء (بولي كريستالين 550W):' : 'Blue Poly-Crystalline Panels (550W):'}
                  </div>
                  <ul className="text-[10.5px] text-slate-600 mt-1 space-y-0.5 list-disc list-inside leading-relaxed">
                    <li>{lang === 'ar' ? 'أقل تكلفة استثمارية أولية (وفر مالي فوري في رأس المال)' : 'Lowest upfront capital investment'}</li>
                    <li>{lang === 'ar' ? 'قطع غيار شائعة ومجربة للميزانيات الاقتصادية' : 'Widely available proven components'}</li>
                    <li className="text-amber-800 font-semibold">{lang === 'ar' ? '⚠️ تنبيه: يتطلب +15% ألواح إضافية لمقاومة حرارة الصيف' : '⚠️ Note: Requires +15% more panels for heat loss'}</li>
                  </ul>
                </button>

                {/* Premium Tier */}
                <button
                  type="button"
                  onClick={() => handleTierChange('premium')}
                  className={`p-3 rounded-xl border text-start transition cursor-pointer flex flex-col justify-between ${
                    qualityTier === 'premium'
                      ? 'border-slate-900 bg-slate-900 text-white ring-2 ring-slate-900/20 shadow-2xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs sm:text-sm flex items-center gap-1.5">
                      <Sparkles className="size-4 text-amber-400" />
                      {lang === 'ar' ? 'نوعية رفيعة ممتازة (Premium Tier)' : 'Premium Quality Tier'}
                    </span>
                    {qualityTier === 'premium' && <CheckCircle2 className="size-4 text-amber-400 shrink-0" />}
                  </div>
                  <div className={`text-[11px] mt-1.5 leading-snug font-medium ${qualityTier === 'premium' ? 'text-amber-300' : 'text-slate-800'}`}>
                    {lang === 'ar' ? 'ألواح سوداء مونوكريستالين فائقة الكفاءة (22-24%):' : 'Black Mono-Crystalline High Efficiency (22-24%):'}
                  </div>
                  <ul className={`text-[10.5px] mt-1 space-y-0.5 list-disc list-inside leading-relaxed ${qualityTier === 'premium' ? 'text-slate-300' : 'text-slate-600'}`}>
                    <li>{lang === 'ar' ? 'مقاومة قصوى لحرارة الصيف الصحراوي (معامل فقد حراري منخفض)' : 'Superior heat tolerance (-0.30%/°C) in hot summer'}</li>
                    <li>{lang === 'ar' ? 'إنتاجية ماء أعلى بـ 15-20% مع توفير بمساحة الهياكل' : '15-20% higher water yield & smaller mounting area'}</li>
                    <li>{lang === 'ar' ? 'عمر افتراضي أطول (25-30 سنة) وأداء ميكانيكي راقٍ' : 'Longest 25-30 year lifespan & premium durability'}</li>
                  </ul>
                </button>
              </div>
            </div>

            {/* Question 3: Well Depth & Water Requirements */}
            <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900">
                  <Droplets className="size-3.5" />
                  <span>{lang === 'ar' ? 'السؤال الثالث (احتياجات البئر والماء):' : 'Question 3 (Depth & Water Flow):'}</span>
                </span>
                <span className="text-[11px] font-semibold text-emerald-700">
                  {parseFloat(totalHead) > 80
                    ? lang === 'ar' ? 'بئر عميق: محرك AC 380V متناوب' : 'Deep Well: AC 3-Phase 380V'
                    : lang === 'ar' ? 'بئر متوسط/سطحي: خيار DC BLDC فائق الكفاءة متاح' : 'Shallow/Medium: DC BLDC available'}
                </span>
              </div>

              <div className="text-sm font-bold text-slate-900">
                {lang === 'ar'
                  ? 'ما هي كمية المياه اليومية المطلوبة والعمق الكلي للبئر؟'
                  : 'What is your required daily water volume and well total head?'}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Droplets className="size-3.5 text-emerald-600" />
                      <span>{lang === 'ar' ? 'كمية المياه المطلوبة يومياً (m³):' : 'Daily Water Flow (m³):'}</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal">
                      {lang === 'ar' ? 'متر مكعب / يوم' : 'm³/day'}
                    </span>
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    id="waterQ"
                    value={waterQ}
                    onChange={(e) => setWaterQ(normalizeDigits(e.target.value))}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-slate-900 font-bold tabular-nums text-base bg-white shadow-2xs"
                    placeholder={lang === 'ar' ? 'مثال: 50' : 'e.g. 50'}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Gauge className="size-3.5 text-emerald-600" />
                      <span>{lang === 'ar' ? 'الارتفاع الهيدروليكي الكلي (TDH متر):' : 'Total Dynamic Head (TDH m):'}</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal">
                      {lang === 'ar' ? 'العمق + فواقد الاحتكاك' : 'Depth + Friction'}
                    </span>
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    id="totalHead"
                    value={totalHead}
                    onChange={(e) => setTotalHead(normalizeDigits(e.target.value))}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-slate-900 font-bold tabular-nums text-base bg-white shadow-2xs"
                    placeholder={lang === 'ar' ? 'مثال: 70' : 'e.g. 70'}
                  />
                </div>
              </div>

              {/* Dynamic recommendation for motor type based on depth */}
              <div className="pt-1 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-500 font-medium">{lang === 'ar' ? 'نوع المضخة المعتمد:' : 'Pump Type Applied:'}</span>
                <button
                  type="button"
                  onClick={() => setPumpType('ac_3phase')}
                  className={`px-2.5 py-1 rounded-lg border font-bold transition cursor-pointer ${
                    pumpType === 'ac_3phase'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {lang === 'ar' ? 'AC 380V ثلاثي الطور (القياسي)' : 'AC 380V (Standard)'}
                </button>

                <button
                  type="button"
                  onClick={() => setPumpType('dc_bldc')}
                  className={`px-2.5 py-1 rounded-lg border font-bold transition cursor-pointer ${
                    pumpType === 'dc_bldc'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {lang === 'ar' ? 'DC BLDC فائق الكفاءة (للآبار ≤100م)' : 'DC BLDC (High Eff ≤100m)'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ---------------- CUSTOM / ADVANCED ENGINEERING MODE ---------------- */
          <div className="space-y-4">
            {/* Hydraulic Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Droplets className="size-4 text-emerald-600" />
                    <span>{lang === 'ar' ? 'كمية المياه اليومية (m³):' : 'Daily Water Flow (m³):'}</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    {lang === 'ar' ? 'متر مكعب / يوم' : 'm³/day'}
                  </span>
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={waterQ}
                  onChange={(e) => setWaterQ(normalizeDigits(e.target.value))}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-slate-900 font-bold tabular-nums text-base bg-white shadow-2xs"
                  placeholder={lang === 'ar' ? 'مثال: 50' : 'e.g. 50'}
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Gauge className="size-4 text-emerald-600" />
                    <span>{lang === 'ar' ? 'الارتفاع الهيدروليكي الكلي (TDH متر):' : 'Total Dynamic Head (TDH m):'}</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    {lang === 'ar' ? 'العمق + فواقد الاحتكاك' : 'Depth + Friction'}
                  </span>
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={totalHead}
                  onChange={(e) => setTotalHead(normalizeDigits(e.target.value))}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-slate-900 font-bold tabular-nums text-base bg-white shadow-2xs"
                  placeholder={lang === 'ar' ? 'مثال: 70' : 'e.g. 70'}
                />
              </div>
            </div>

            {/* Pump Selector */}
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1.5">
                {lang === 'ar' ? 'محرك المضخة (AC 380V / DC BLDC / AC 220V):' : 'Pump Motor Topology:'}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPumpType('ac_3phase')}
                  className={`p-2.5 rounded-xl border text-start transition cursor-pointer ${
                    pumpType === 'ac_3phase'
                      ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="font-bold text-xs text-slate-900">{lang === 'ar' ? 'AC 380V ثلاثي الطور' : 'AC 3-Phase 380V'}</div>
                  <div className="text-[10.5px] text-slate-500 mt-0.5">{lang === 'ar' ? 'للآبار العميقة والتدفقات الكبيرة' : 'Deep wells'}</div>
                </button>

                <button
                  type="button"
                  onClick={() => setPumpType('dc_bldc')}
                  className={`p-2.5 rounded-xl border text-start transition cursor-pointer ${
                    pumpType === 'dc_bldc'
                      ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="font-bold text-xs text-slate-900">{lang === 'ar' ? 'DC BLDC عديم الفحمات' : 'DC BLDC'}</div>
                  <div className="text-[10.5px] text-slate-500 mt-0.5">{lang === 'ar' ? 'كفاءة 78% للآبار حتى 100م' : '78% Eff'}</div>
                </button>

                <button
                  type="button"
                  onClick={() => setPumpType('ac_1phase')}
                  className={`p-2.5 rounded-xl border text-start transition cursor-pointer ${
                    pumpType === 'ac_1phase'
                      ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="font-bold text-xs text-slate-900">{lang === 'ar' ? 'AC 220V أحادي الطور' : 'AC 1-Phase 220V'}</div>
                  <div className="text-[10.5px] text-slate-500 mt-0.5">{lang === 'ar' ? 'للتطبيقات المنزلية' : 'Single Phase'}</div>
                </button>
              </div>
            </div>

            {/* Panels Selector */}
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1.5">
                {lang === 'ar' ? 'تقنية الألواح ولونها:' : 'Solar Panel Technology:'}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPanelType('mono_black')}
                  className={`p-2.5 rounded-xl border text-start transition cursor-pointer ${
                    panelType === 'mono_black'
                      ? 'border-slate-900 bg-slate-900 text-white ring-2 ring-slate-900/20 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800'
                  }`}
                >
                  <div className="font-bold text-xs">{lang === 'ar' ? 'أسود (مونو)' : 'Black Mono'}</div>
                  <div className={`text-[10.5px] mt-0.5 ${panelType === 'mono_black' ? 'text-slate-300' : 'text-slate-500'}`}>
                    {lang === 'ar' ? 'كفاءة 22% ومقاومة حرارة' : '22% Eff • Heat Proof'}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPanelType('poly_blue')}
                  className={`p-2.5 rounded-xl border text-start transition cursor-pointer ${
                    panelType === 'poly_blue'
                      ? 'border-blue-600 bg-blue-600 text-white ring-2 ring-blue-500/20 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800'
                  }`}
                >
                  <div className="font-bold text-xs">{lang === 'ar' ? 'أزرق (بولي)' : 'Blue Poly'}</div>
                  <div className={`text-[10.5px] mt-0.5 ${panelType === 'poly_blue' ? 'text-blue-100' : 'text-slate-500'}`}>
                    {lang === 'ar' ? 'اقتصادي (+15% ألواح)' : 'Economic (+15% panels)'}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPanelType('topcon_n')}
                  className={`p-2.5 rounded-xl border text-start transition cursor-pointer ${
                    panelType === 'topcon_n'
                      ? 'border-emerald-600 bg-emerald-700 text-white ring-2 ring-emerald-500/20 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800'
                  }`}
                >
                  <div className="font-bold text-xs">{lang === 'ar' ? 'TOPCon مزدوج' : 'TOPCon Bifacial'}</div>
                  <div className={`text-[10.5px] mt-0.5 ${panelType === 'topcon_n' ? 'text-emerald-100' : 'text-slate-500'}`}>
                    {lang === 'ar' ? 'كفاءة 24% استغلال الأرض' : '24% Eff Bifacial'}
                  </div>
                </button>
              </div>
            </div>

            {/* Inverter Selector */}
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1.5">
                {lang === 'ar' ? 'نوع العاكس ومحول التردد:' : 'Inverter System:'}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  disabled={pumpType === 'dc_bldc'}
                  onClick={() => setInverterType('solar_vfd')}
                  className={`p-2.5 rounded-xl border text-start transition cursor-pointer ${
                    pumpType === 'dc_bldc'
                      ? 'opacity-40 cursor-not-allowed bg-slate-50'
                      : inverterType === 'solar_vfd'
                      ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="font-bold text-xs text-slate-900">{lang === 'ar' ? 'VFD شمسي مستقل' : 'Solar VFD MPPT'}</div>
                  <div className="text-[10.5px] text-slate-500 mt-0.5">{lang === 'ar' ? 'مباشر بدون شبكة نهاراً' : 'Off-grid'}</div>
                </button>

                <button
                  type="button"
                  disabled={pumpType === 'dc_bldc'}
                  onClick={() => setInverterType('hybrid')}
                  className={`p-2.5 rounded-xl border text-start transition cursor-pointer ${
                    pumpType === 'dc_bldc'
                      ? 'opacity-40 cursor-not-allowed bg-slate-50'
                      : inverterType === 'hybrid'
                      ? 'border-amber-600 bg-amber-50/80 ring-2 ring-amber-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="font-bold text-xs text-slate-900">{lang === 'ar' ? 'انفرتر هجين (Hybrid)' : 'Hybrid Inverter'}</div>
                  <div className="text-[10.5px] text-slate-500 mt-0.5">{lang === 'ar' ? 'شمسي + شبكة / مولد 24/7' : 'Solar + Grid/Gen'}</div>
                </button>

                <button
                  type="button"
                  onClick={() => setInverterType('dc_mppt')}
                  className={`p-2.5 rounded-xl border text-start transition cursor-pointer ${
                    inverterType === 'dc_mppt'
                      ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="font-bold text-xs text-slate-900">{lang === 'ar' ? 'محكم DC MPPT' : 'DC MPPT'}</div>
                  <div className="text-[10.5px] text-slate-500 mt-0.5">{lang === 'ar' ? 'خاص بمضخات DC' : 'DC pumps only'}</div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Advanced Options Accordion */}
        <div>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer transition py-1"
            >
              <ChevronRight className={`size-3.5 transition-transform ${showAdvanced ? 'rotate-90' : 'rtl:rotate-180'}`} />
              <span>
                {lang === 'ar'
                  ? 'إعدادات هندسية دقيقة (واط اللوح وساعات الذروة PSH)'
                  : 'Advanced Fine-Tuning (Panel Watt & PSH Hours)'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer transition py-1"
            >
              <BookOpen className="size-3.5" />
              <span>{lang === 'ar' ? 'مقارنة المميزات الفنية' : 'Feature Comparison'}</span>
            </button>
          </div>

          {showAdvanced && (
            <div className="mt-2.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  {lang === 'ar' ? 'قدرة اللوح الشمسي الواحد (واط W):' : 'Individual Panel Rating (Watts):'}
                </label>
                <select
                  value={panelWatt}
                  onChange={(e) => setPanelWatt(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="450">450 W</option>
                  <option value="550">550 W (القياسي الزراعي المعتمد)</option>
                  <option value="600">600 W</option>
                  <option value="650">650 W</option>
                  <option value="700">700 W</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  {lang === 'ar' ? 'ساعات الذروة الشمسية (PSH ساعات/يوم):' : 'Peak Sun Hours (PSH):'}
                </label>
                <select
                  value={peakSunHours}
                  onChange={(e) => setPeakSunHours(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="4.0">4.0 ساعات (فصل الشتاء وأقسى ظروف)</option>
                  <option value="4.5">4.5 ساعات (شتاء معتدل)</option>
                  <option value="5.0">5.0 ساعات (متوسط قياسي معتمد هندسياً)</option>
                  <option value="5.5">5.5 ساعات (المناطق الصحراوية / الصيف)</option>
                  <option value="6.0">6.0 ساعات (أقصى سطوع صيفي)</option>
                </select>
              </div>
            </div>
          )}

          {/* Academic & Engineering Reference Guide */}
          {showGuide && (
            <div className="mt-3 p-4 rounded-xl bg-gradient-to-br from-slate-50 to-indigo-50/40 border border-indigo-100 text-xs text-slate-700 space-y-3">
              <div className="flex items-center gap-2 font-bold text-indigo-900 border-b border-indigo-100 pb-1.5">
                <BookOpen className="size-4 text-indigo-600" />
                <span>
                  {lang === 'ar'
                    ? 'جدول مقارنة المميزات والأسس الهندسية (جامعة كامبردج و FAO)'
                    : 'Engineering Features Comparison (Cambridge & FAO Standards)'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                  <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-slate-900" />
                    <span>{lang === 'ar' ? 'مميزات النوعية الرفيعة (الألواح السوداء):' : 'Premium Tier (Black Mono):'}</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    {lang === 'ar'
                      ? 'خلايا أحادية البلورة نقية، معامل فقد حراري ضئيل (-0.32%/°C)، إنتاجية مستقرة تماماً حتى تحت حرارة 65°C، توفر 15% من مساحة الهيكل الحديدي وعمر افتراضي 25-30 سنة.'
                      : 'Ultra-pure single crystal, minimal heat degradation (-0.32%/°C), stable output in extreme heat, saves 15% mounting footprint.'}
                  </p>
                </div>

                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                  <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-blue-600" />
                    <span>{lang === 'ar' ? 'مميزات الخيار الاقتصادي (الألواح الزرقاء):' : 'Economic Tier (Blue Poly):'}</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    {lang === 'ar'
                      ? 'وفر أولي بنسبة 20-25% في تكلفة الشراء، سرعة في استرداد رأس المال، لكنها تتطلب عدداً أكبر من الألواح (+15%) لتعويض الفقد الحراري أثناء ذروة الصيف.'
                      : 'Lower initial capital cost, faster payback for budget projects, but requires +15% more panels to compensate higher heat derating.'}
                  </p>
                </div>

                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                  <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-amber-500" />
                    <span>{lang === 'ar' ? 'مميزات العاكس الهجين (Hybrid):' : 'Hybrid Inverter Advantages:'}</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    {lang === 'ar'
                      ? 'دمج تلقائي فوري بين الشمس والشبكة أو المولد، لا توقف عند الغيوم، تشغيل ليلي 24/7 مع حماية المولد من صدمات الإقلاع الحثية.'
                      : 'Automatic real-time blending of solar + grid/generator, zero interruptions on cloudy days, allows 24/7 night irrigation.'}
                  </p>
                </div>

                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                  <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-emerald-600" />
                    <span>{lang === 'ar' ? 'مميزات العاكس العادي (Solar VFD):' : 'Solar VFD Advantages:'}</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    {lang === 'ar'
                      ? 'استقلالية كاملة عن الشبكات، صفر تكاليف وقود، حماية مدمجة ضد التشغيل الجاف وإقلاع سلس ناعم لحماية مواسير البئر من المطرقة المائية.'
                      : 'Zero fuel or electricity bills, built-in dry-run protection, soft-start algorithm protecting well pipes from water hammer.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Submit button */}
        <button
          type="button"
          id="btn-calculate-solar"
          onClick={calculateSolarPump}
          className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-extrabold py-3.5 rounded-xl transition duration-200 shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2"
        >
          <Sun className="size-5 text-amber-300" />
          <span>{lang === 'ar' ? 'احسب المنظومة المتكاملة واعرض المميزات' : 'Calculate Sizing & Display Features'}</span>
        </button>
      </div>

      {/* Result Card Box */}
      {result && (
        <div id="solarResult" className="mt-6 p-4 sm:p-6 bg-gradient-to-br from-slate-50 via-emerald-50/20 to-white rounded-2xl border border-emerald-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-emerald-500 animate-ping" />
              <h4 className="font-extrabold text-emerald-900 text-base sm:text-lg">
                {lang === 'ar' ? 'المواصفات والنتائج الهندسية المعتمدة:' : 'Certified Engineering Specifications:'}
              </h4>
            </div>
            <span className="text-[11px] bg-emerald-100 text-emerald-900 px-2.5 py-1 rounded-lg font-bold border border-emerald-300">
              {lang === 'ar' ? 'حسابات مطابقة لمعايير كامبردج' : 'Cambridge Verified'}
            </span>
          </div>

          {/* Decision Summary Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-white border border-emerald-100 shadow-2xs flex items-center justify-between">
              <span className="text-slate-600 font-medium">{lang === 'ar' ? 'نظام العاكس المعتمد:' : 'Inverter System:'}</span>
              <span className="font-bold text-emerald-800">
                {result.gridStatus === 'yes'
                  ? lang === 'ar' ? '⚡ عاكس هجين (Hybrid: شمسي + شبكة/مولد)' : '⚡ Hybrid Dual Source Inverter'
                  : lang === 'ar' ? '☀️ عاكس عادي (Solar VFD مستقل)' : '☀️ Off-Grid Solar VFD'}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-emerald-100 shadow-2xs flex items-center justify-between">
              <span className="text-slate-600 font-medium">{lang === 'ar' ? 'فئة الألواح المعتمدة:' : 'Panel Tier:'}</span>
              <span className="font-bold text-slate-900">
                {result.qualityTier === 'premium'
                  ? lang === 'ar' ? '✨ نوعية رفيعة (ألواح سوداء مونو)' : '✨ Premium Black Monocrystalline'
                  : lang === 'ar' ? '🔹 خيار اقتصادي (ألواح زرقاء بولي)' : '🔹 Economic Blue Polycrystalline'}
              </span>
            </div>
          </div>

          <div className="space-y-3 text-sm text-gray-800">
            {/* 1. Pump Power & Motor Type */}
            <div className="p-3.5 rounded-xl bg-white border border-emerald-100 shadow-2xs space-y-1">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold shrink-0">🔹</span>
                  <p id="resPump" className="text-sm font-bold text-slate-900">
                    {lang === 'ar' ? 'قدرة المضخة المقترحة:' : 'Recommended Submersible Pump:'}
                  </p>
                </div>
                <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold">
                  {lang === 'ar' ? `كفاءة ${result.pumpEfficiency}%` : `${result.pumpEfficiency}% Efficiency`}
                </span>
              </div>
              <div className="ps-6 flex flex-wrap items-baseline gap-2">
                <span className="text-emerald-700 font-extrabold text-lg tabular-nums">
                  {formatNum(result.pumpPowerKw, 2)} {lang === 'ar' ? 'كيلوواط (kW)' : 'kW'}
                </span>
                <span className="text-slate-700 font-bold text-base">
                  ({formatNum(result.pumpPowerHp, 1)} {lang === 'ar' ? 'حصان HP' : 'HP'})
                </span>
                <span className="text-xs text-slate-500">
                  — {getPumpLabel(result.pumpType)}
                </span>
              </div>
            </div>

            {/* 2. Solar Panels Count & Technology Difference */}
            <div className="p-3.5 rounded-xl bg-white border border-emerald-100 shadow-2xs space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold shrink-0">🔹</span>
                  <p id="resPanels" className="text-sm font-bold text-slate-900">
                    {lang === 'ar' ? 'عدد ومواصفات الألواح الشمسية:' : 'PV Array & Solar Panels Required:'}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                  result.panelType === 'mono_black'
                    ? 'bg-slate-900 text-white'
                    : result.panelType === 'poly_blue'
                    ? 'bg-blue-600 text-white'
                    : 'bg-emerald-700 text-white'
                }`}>
                  {result.panelType === 'mono_black'
                    ? lang === 'ar' ? 'أحادي البلورة أسود' : 'Black Mono'
                    : result.panelType === 'poly_blue'
                    ? lang === 'ar' ? 'متعدد البلورات أزرق' : 'Blue Poly'
                    : lang === 'ar' ? 'TOPCon مزدوج' : 'TOPCon Bifacial'}
                </span>
              </div>

              <div className="ps-6 space-y-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-emerald-700 font-black text-xl tabular-nums">
                    {result.panelCount} {lang === 'ar' ? 'لوح' : 'panels'}
                  </span>
                  <span className="text-slate-700 font-semibold text-sm">
                    ({lang === 'ar'
                      ? `بقدرة ${result.panelWatt} واط للوح — إجمالي ${formatNum(result.totalPvKw, 2)} kWp ذروة`
                      : `@ ${result.panelWatt}W each — Total ${formatNum(result.totalPvKw, 2)} kWp`})
                  </span>
                </div>

                {/* Explanation of panel color impact */}
                <p className="text-xs text-slate-500 leading-relaxed">
                  {result.panelType === 'poly_blue' ? (
                    <span className="text-amber-700 font-medium">
                      {lang === 'ar'
                        ? `⚠️ الخيار الاقتصادي: تم احتساب +15% ألواح إضافية (${result.panelCount} لوح) لتعويض معامل الفقد الحراري العالي للألواح الزرقاء أثناء قيظ الصيف.`
                        : `⚠️ Economic Tier: +15% extra panels added to mitigate high thermal derating in blue polycrystalline cells.`}
                    </span>
                  ) : result.panelType === 'mono_black' ? (
                    <span className="text-slate-600">
                      {lang === 'ar'
                        ? '✨ النوعية الرفيعة: الألواح السوداء Monocrystalline تضمن إنتاجية ثابتة ومقاومة عالية لدرجات الحرارة الصحراوية المرتفعة.'
                        : '✨ Premium Tier: Black Monocrystalline panels maintain steady power under elevated ambient temperatures.'}
                    </span>
                  ) : (
                    <span className="text-emerald-700">
                      {lang === 'ar'
                        ? '✨ تقنية TOPCon مزدوجة الوجه تحقق أقصى استغلال للطاقة مع استثمار انعكاس الأرضية (Albedo).'
                        : '✨ TOPCon Bifacial delivers maximum harvest via rear-side ground reflection.'}
                    </span>
                  )}
                </p>

                {/* String configuration */}
                <div className="text-[11.5px] bg-slate-50 border border-slate-200 p-2 rounded-lg text-slate-700 font-medium flex items-start gap-1.5 mt-1.5">
                  <span className="font-bold text-emerald-700">🔌</span>
                  <span>{result.stringConfig}</span>
                </div>
              </div>
            </div>

            {/* 3. Inverter / Controller Rating & Hybrid Generator */}
            <div className="p-3.5 rounded-xl bg-white border border-emerald-100 shadow-2xs space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold shrink-0">🔹</span>
                  <p id="resInverter" className="text-sm font-bold text-slate-900">
                    {lang === 'ar' ? 'العاكس ونظام التحكم (Inverter / Controller):' : 'Inverter & Controller System:'}
                  </p>
                </div>
                <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                  {inverterType === 'hybrid'
                    ? lang === 'ar' ? 'عاكس هجين مزدوج (Hybrid)' : 'Hybrid Dual Source'
                    : inverterType === 'solar_vfd'
                    ? lang === 'ar' ? 'VFD شمسي MPPT عادي' : 'Solar VFD'
                    : lang === 'ar' ? 'محكم DC MPPT' : 'DC Controller'}
                </span>
              </div>

              <div className="ps-6 space-y-1">
                <p className="text-sm leading-relaxed">
                  {lang === 'ar' ? 'قدرة العاكس المقترحة لا تقل عن:' : 'Minimum Inverter Rating:'}{' '}
                  <span className="text-emerald-700 font-black text-lg tabular-nums">
                    {formatNum(result.inverterKw, 1)} {lang === 'ar' ? 'كيلوواط (kW)' : 'kW'}
                  </span>{' '}
                  <span className="text-slate-600 font-bold text-sm">
                    ({formatNum(result.recommendedInverterHp, 1)} {lang === 'ar' ? 'حصان HP' : 'HP'})
                  </span>
                </p>

                {result.backupGeneratorKva && (
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-950 font-medium space-y-0.5 mt-1">
                    <div className="flex items-center gap-1.5 font-bold text-amber-900">
                      <Flame className="size-3.5 text-amber-600" />
                      <span>{lang === 'ar' ? 'توصية المولد الاحتياطي للعاكس الهجين:' : 'Hybrid Generator Sizing:'}</span>
                    </div>
                    <p>
                      {lang === 'ar'
                        ? `مولد ديزل باستطاعة لا تقل عن ${result.backupGeneratorKva} kVA لتأمين تيار بدء المحرك Inductive Surge والسماح بالري المتواصل ليلاً أو أثناء تقلبات الطقس.`
                        : `Diesel generator of at least ${result.backupGeneratorKva} kVA to handle pump inrush current and allow continuous 24/7 irrigation.`}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 4. Hydraulic flow & Energy summary */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-emerald-950 font-medium">
              <Info className="size-4.5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5 leading-relaxed">
                <div>
                  <strong>{lang === 'ar' ? 'معدل الضخ الساعي التقديري:' : 'Estimated Hourly Flow:'}</strong>{' '}
                  ~{formatNum(result.hourlyFlow, 1)} م³/ساعة خلال ساعات السطوع الشمسي ({formatNum(result.peakSunHours, 1)} ساعات PSH).
                </div>
                <div className="text-[11.5px] text-emerald-900/85">
                  {lang === 'ar'
                    ? `إجمالي الطاقة الهيدروليكية المنجزة: ${formatNum(result.dailyHydraulicEnergy, 2)} كيلوواط ساعي/يوم لرفع ${formatNum(result.waterQ, 1)} م³ على ارتفاع ${formatNum(result.totalHead, 0)} متر.`
                    : `Daily hydraulic energy: ${formatNum(result.dailyHydraulicEnergy, 2)} kWh/day delivering ${formatNum(result.waterQ, 1)} m³ at ${formatNum(result.totalHead, 0)}m TDH.`}
                </div>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="pt-2 space-y-3 border-t border-slate-200/70">
            {downloadFeedback && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs font-semibold flex items-center gap-2 animate-fade-in shadow-2xs">
                <CheckCircle2 className="size-4.5 text-emerald-600 shrink-0" />
                <span>{downloadFeedback}</span>
              </div>
            )}

            {/* Iframe Warning / Escape Button for Embedded Mode */}
            {device.isInIframe && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="text-base">🚀</span>
                  <span className="font-semibold">
                    {lang === 'ar'
                      ? 'أنت تعمل داخل إطار معاينة قد يقيد تنزيل الملفات التلقائي. افتح التطبيق مباشرة في نافذة مستقلة:'
                      : 'You are running inside a preview frame which may restrict downloads. Open in standalone tab:'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleEscapeIframe}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shadow-xs transition cursor-pointer shrink-0"
                >
                  <ExternalLink className="size-3.5" />
                  <span>{lang === 'ar' ? 'فتح في متصفح خارجي كامل' : 'Open Full Browser Window'}</span>
                </button>
              </div>
            )}

            {/* Prepared PDF Immediate Save Hub (Direct User-Click Avenue) */}
            {preparedPdf && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white border-2 border-emerald-500 shadow-sm space-y-2.5 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-xs">
                      PDF
                    </span>
                    <div>
                      <h4 className="text-xs sm:text-sm font-extrabold text-emerald-950">
                        {lang === 'ar' ? '🎉 ملف الـ PDF جاهز الآن! اضغط لحفظه فوراً في جهازك:' : '🎉 PDF is Ready! Click to Save Directly:'}
                      </h4>
                      <p className="text-[11px] text-emerald-800/80 font-medium">{preparedPdf.fileName}</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    {lang === 'ar' ? 'جاهز 100%' : '100% Ready'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  {/* Option 1: Mobile Share / Save to Files */}
                  <button
                    type="button"
                    onClick={handleSynchronousShare}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-2.5 text-xs font-black shadow-xs transition cursor-pointer"
                  >
                    <Share2 className="size-4" />
                    <span>{lang === 'ar' ? '📱 حفظ في الملفات / مشاركة' : '📱 Save to Files / Share'}</span>
                  </button>

                  {/* Option 2: Direct Anchor Download */}
                  <button
                    type="button"
                    onClick={handleDownloadDirectAnchor}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 text-xs font-black shadow-xs transition cursor-pointer"
                  >
                    <Download className="size-4" />
                    <span>{lang === 'ar' ? '💾 تنزيل ملف الـ PDF' : '💾 Direct PDF Download'}</span>
                  </button>

                  {/* Option 3: Open in New Window */}
                  <a
                    href={preparedPdf.blobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-600 bg-white hover:bg-emerald-50 text-emerald-800 px-3.5 py-2.5 text-xs font-bold shadow-2xs transition cursor-pointer"
                  >
                    <ExternalLink className="size-4 text-emerald-600" />
                    <span>{lang === 'ar' ? '👁️ فتح ومعاينة في نافذة جديدة' : '👁️ View in New Tab'}</span>
                  </a>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              {/* Primary Action: Direct 1-Click Universal PDF Download / Mobile Share */}
              <button
                type="button"
                id="btn-direct-download-solar-pdf"
                onClick={handleDirectDownloadPdf}
                disabled={isGeneratingPdf}
                className="flex-1 min-w-[220px] inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-5 py-3.5 text-xs sm:text-sm font-black shadow-md hover:shadow-lg transition cursor-pointer text-center disabled:opacity-60"
              >
                {isGeneratingPdf ? (
                  <>
                    <Loader2 className="size-5 animate-spin text-amber-300" />
                    <span>{lang === 'ar' ? 'جارٍ تحضير ملف الـ PDF وحفظه...' : 'Preparing PDF Report...'}</span>
                  </>
                ) : (
                  <>
                    <Download className="size-5 text-amber-300" />
                    <span>{lang === 'ar' ? '💾 حفظ / تنزيل PDF (مباشرة لجهازك)' : '💾 Save / Download PDF (Direct)'}</span>
                  </>
                )}
              </button>

              {/* Offline Standalone HTML Report (100% Guaranteed on any device without internet) */}
              <button
                type="button"
                id="btn-offline-html-solar"
                onClick={handleDownloadOfflineHtml}
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-emerald-600 bg-white hover:bg-emerald-50 text-emerald-800 px-4 py-3.5 text-xs sm:text-sm font-extrabold transition cursor-pointer shadow-2xs"
                title={lang === 'ar' ? 'تقرير مستقل يفتح في أي هاتف بدون إنترنت' : 'Standalone offline report'}
              >
                <Globe className="size-4.5 text-emerald-600" />
                <span>{lang === 'ar' ? '🌐 تقرير HTML مستقل للمزرعة (مضمون 100%)' : '🌐 Offline HTML Report (100% Works)'}</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Print / Save via Browser */}
              <button
                type="button"
                id="btn-print-solar"
                onClick={handlePrint}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 px-3.5 py-2.5 text-xs font-bold transition cursor-pointer shadow-2xs"
              >
                <Printer className="size-4 text-emerald-600" />
                <span>{lang === 'ar' ? 'طباعة' : 'Print'}</span>
              </button>

              {/* Copy Clean Plain Text */}
              <button
                type="button"
                id="btn-copy-solar"
                onClick={handleCopySummary}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 px-3.5 py-2.5 text-xs font-bold transition cursor-pointer shadow-2xs"
              >
                {copied ? (
                  <>
                    <Check className="size-4 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">{lang === 'ar' ? 'تم النسخ' : 'Copied'}</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-4 text-slate-500" />
                    <span>{lang === 'ar' ? 'نسخ نصي' : 'Copy Text'}</span>
                  </>
                )}
              </button>

              {/* Fullpage View in Standalone Tab */}
              <a
                href={getReportUrl(false)}
                target="_blank"
                rel="noopener noreferrer"
                id="btn-fullpage-solar"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-2.5 text-xs font-bold transition cursor-pointer shadow-2xs"
              >
                <ExternalLink className="size-4 text-slate-500" />
                <span>{lang === 'ar' ? 'صفحة كاملة' : 'Full Page'}</span>
              </a>

              {/* Reset */}
              <button
                type="button"
                id="btn-reset-solar"
                onClick={handleReset}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-700 px-3.5 py-2.5 text-xs font-bold transition cursor-pointer ms-auto"
              >
                <RotateCcw className="size-4 text-rose-600" />
                <span>{lang === 'ar' ? 'إعادة ضبط' : 'Reset'}</span>
              </button>
            </div>
          </div>

          {/* Universal Multi-Device Compatibility Guidance */}
          <div className="p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white border border-emerald-200 rounded-xl text-xs text-emerald-950 flex items-start gap-2.5 shadow-2xs">
            <CheckCircle2 className="size-4.5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1 leading-relaxed">
              <strong className="block text-emerald-900 font-extrabold text-xs sm:text-sm">
                {lang === 'ar'
                  ? '📱 متوافق 100% مع كافة الأجهزة (Android, iOS Safari, PC, WhatsApp):'
                  : '📱 100% Compatible with All Devices (Android, iOS Safari, PC, WebViews):'}
              </strong>
              <p className="text-[11.5px] text-emerald-900/90 leading-normal">
                {lang === 'ar'
                  ? 'على هواتف آيفون (iOS) وأندرويد يفتح زر "حفظ / تنزيل PDF" قائمة المشاركة والحفظ في ملفات جهازك أو الإرسال لواتساب مباشرة. كما يمكنك تنزيل "تقرير HTML مستقل للمزرعة" الذي يعمل دون إنترنت ويفتح بسلاسة على أي هاتف.'
                  : 'On iOS & Android, "Save / Download PDF" natively opens your device\'s Files / Share sheet. You can also download the Standalone HTML Report which works 100% offline on any phone.'}
              </p>
            </div>
          </div>

          {/* Engineer Attribution & Cambridge citation */}
          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-1 text-center sm:text-start">
            <div>
              {lang === 'ar'
                ? 'إعداد وتصميم: مطور تطبيقات وبرامج حر: زكريا بسيود ZAKARYA Bessioud | FeedCalc Pro Solar'
                : 'Developed by: Freelance Software & App Developer ZAKARYA Bessioud | FeedCalc Pro Solar'}
            </div>
            <div className="font-semibold text-emerald-700">
              {lang === 'ar' ? 'هاتف: +213655870392' : 'Tel: +213655870392'}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const printableSheet = result && (
    <div id="solar-printable-report" className="print-only bg-white text-slate-900 p-6 font-sans text-xs">
      {/* Printable Sheet Header */}
      <div className="border-b-2 border-emerald-800 pb-3 mb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-emerald-900">
              {lang === 'ar' ? 'تقرير دراسة منظومة الضخ الشمسي للآبار الفلاحية' : 'Agricultural Solar Well Pumping System Engineering Report'}
            </h1>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-300">
              {lang === 'ar' ? 'معتمد هندسياً' : 'Certified'}
            </span>
          </div>
          <p className="text-xs text-slate-600 font-medium mt-1">
            {lang === 'ar'
              ? 'الأسس الحسابية المعتمدة: قسم الهندسة الميكانيكية والحرارية بجامعة كامبردج (Cambridge University) ودليل FAO 56'
              : 'Design Criteria: Cambridge University Engineering Dept & FAO Irrigation Guidelines 56'}
          </p>
        </div>
        <div className="text-end">
          <div className="text-xs font-bold text-slate-800">FeedCalc Pro Solar</div>
          <div className="text-[10px] text-slate-500 font-mono">
            {new Date().toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </div>
      </div>

      {/* Project Key Figures Grid */}
      <div className="grid grid-cols-4 gap-2 mb-4 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-center">
        <div>
          <span className="block text-[10px] text-slate-500 font-semibold">{lang === 'ar' ? 'الاستهلاك اليومي' : 'Daily Water'}</span>
          <strong className="text-sm font-bold text-slate-900">{formatNum(result.waterQ, 1)} m³/day</strong>
        </div>
        <div>
          <span className="block text-[10px] text-slate-500 font-semibold">{lang === 'ar' ? 'الارتفاع الكلي TDH' : 'Total Dynamic Head'}</span>
          <strong className="text-sm font-bold text-slate-900">{formatNum(result.totalHead, 0)} m</strong>
        </div>
        <div>
          <span className="block text-[10px] text-slate-500 font-semibold">{lang === 'ar' ? 'قدرة المضخة' : 'Pump Power'}</span>
          <strong className="text-sm font-bold text-emerald-800">{formatNum(result.pumpPowerKw, 2)} kW ({formatNum(result.pumpPowerHp, 1)} HP)</strong>
        </div>
        <div>
          <span className="block text-[10px] text-slate-500 font-semibold">{lang === 'ar' ? 'مصفوفة الألواح' : 'Solar PV Array'}</span>
          <strong className="text-sm font-bold text-emerald-800">{result.panelCount} × {result.panelWatt}W ({formatNum(result.totalPvKw, 2)} kWp)</strong>
        </div>
      </div>

      {/* Table 1: Hydraulic & Solar Requirements */}
      <div className="mb-4">
        <h2 className="text-xs font-bold text-emerald-900 bg-emerald-50 px-2 py-1 rounded border-s-4 border-emerald-600 mb-1.5">
          {lang === 'ar' ? '1. المعطيات الهيدروليكية والمناخية للبئر (Hydraulic & Site Data)' : '1. Hydraulic & Site Data'}
        </h2>
        <table className="w-full text-start border-collapse border border-slate-200 text-xs">
          <tbody>
            <tr className="border-b border-slate-200">
              <td className="p-2 font-semibold bg-slate-50 w-1/3">{lang === 'ar' ? 'كمية المياه المطلوبة يومياً (Q):' : 'Daily Water Flow (Q):'}</td>
              <td className="p-2">{formatNum(result.waterQ, 1)} m³/day (~{formatNum(result.hourlyFlow, 1)} m³/h)</td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="p-2 font-semibold bg-slate-50">{lang === 'ar' ? 'الارتفاع الهيدروليكي الكلي (TDH):' : 'Total Dynamic Head (TDH):'}</td>
              <td className="p-2">{formatNum(result.totalHead, 0)} {lang === 'ar' ? 'متر (عمق التنزيل الديناميكي وفواقد الاحتكاك بالأنابيب)' : 'meters (well depth + friction)'}</td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="p-2 font-semibold bg-slate-50">{lang === 'ar' ? 'ساعات الذروة الشمسية (PSH):' : 'Peak Sun Hours (PSH):'}</td>
              <td className="p-2">{formatNum(result.peakSunHours, 1)} {lang === 'ar' ? 'ساعات ذروة يومية قياسية' : 'hours/day'}</td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="p-2 font-semibold bg-slate-50">{lang === 'ar' ? 'الطاقة الهيدروليكية اليومية الصافية:' : 'Net Daily Hydraulic Energy:'}</td>
              <td className="p-2">{formatNum(result.dailyHydraulicEnergy, 2)} kWh/day</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Table 2: Submersible Pump & Motor */}
      <div className="mb-4">
        <h2 className="text-xs font-bold text-emerald-900 bg-emerald-50 px-2 py-1 rounded border-s-4 border-emerald-600 mb-1.5">
          {lang === 'ar' ? '2. مواصفات المضخة ومحرك الرفع (Submersible Pump & Motor)' : '2. Submersible Pump & Motor'}
        </h2>
        <table className="w-full text-start border-collapse border border-slate-200 text-xs">
          <tbody>
            <tr className="border-b border-slate-200">
              <td className="p-2 font-semibold bg-slate-50 w-1/3">{lang === 'ar' ? 'قدرة المضخة المقترحة:' : 'Pump Power:'}</td>
              <td className="p-2 font-bold text-emerald-800">
                {formatNum(result.pumpPowerKw, 2)} kW ({formatNum(result.pumpPowerHp, 1)} HP)
              </td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="p-2 font-semibold bg-slate-50">{lang === 'ar' ? 'طوبولوجيا ونوع المحرك:' : 'Motor Topology:'}</td>
              <td className="p-2">{getPumpLabel(result.pumpType)}</td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="p-2 font-semibold bg-slate-50">{lang === 'ar' ? 'كفاءة المنظومة المعتمدة (Wire-to-Water):' : 'Overall System Efficiency:'}</td>
              <td className="p-2">{result.pumpEfficiency}%</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Table 3: Solar PV Array */}
      <div className="mb-4">
        <h2 className="text-xs font-bold text-emerald-900 bg-emerald-50 px-2 py-1 rounded border-s-4 border-emerald-600 mb-1.5">
          {lang === 'ar' ? '3. مواصفات مصفوفة وحقل الألواح الشمسية (Solar PV Array Sizing)' : '3. Solar PV Array Sizing'}
        </h2>
        <table className="w-full text-start border-collapse border border-slate-200 text-xs">
          <tbody>
            <tr className="border-b border-slate-200">
              <td className="p-2 font-semibold bg-slate-50 w-1/3">{lang === 'ar' ? 'إجمالي قدرة حقل الألواح:' : 'Total PV Array Capacity:'}</td>
              <td className="p-2 font-bold text-emerald-800">
                {formatNum(result.totalPvKw, 2)} kWp ({formatNum(result.totalPvWatts, 0)} W)
              </td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="p-2 font-semibold bg-slate-50">{lang === 'ar' ? 'عدد الألواح وقدرة اللوح الواحد:' : 'Panels Count & Rating:'}</td>
              <td className="p-2 font-bold">
                {result.panelCount} {lang === 'ar' ? 'لوح' : 'panels'} × {result.panelWatt}W
              </td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="p-2 font-semibold bg-slate-50">{lang === 'ar' ? 'فئة ونوعية الألواح المعتمدة:' : 'Panel Type & Quality Tier:'}</td>
              <td className="p-2">
                {getPanelLabel(result.panelType)}
                {result.panelType === 'poly_blue'
                  ? (lang === 'ar' ? ' — (تم تضمين +15% ألواح إضافية لمقاومة الفقد الحراري صيفاً)' : ' — (+15% thermal derating margin included)')
                  : (lang === 'ar' ? ' — (معامل حراري منخفض ومقاومة عالية لحرارة الصيف)' : ' — (Low thermal loss coefficient)')}
              </td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="p-2 font-semibold bg-slate-50">{lang === 'ar' ? 'طريقة التوصيل والربط (Strings):' : 'String Configuration:'}</td>
              <td className="p-2">{result.stringConfig}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Table 4: Inverter & Hybrid Integration */}
      <div className="mb-4">
        <h2 className="text-xs font-bold text-emerald-900 bg-emerald-50 px-2 py-1 rounded border-s-4 border-emerald-600 mb-1.5">
          {lang === 'ar' ? '4. نظام العاكس ومحول التردد الذكي (Inverter & VFD Control)' : '4. Inverter & VFD Control'}
        </h2>
        <table className="w-full text-start border-collapse border border-slate-200 text-xs">
          <tbody>
            <tr className="border-b border-slate-200">
              <td className="p-2 font-semibold bg-slate-50 w-1/3">{lang === 'ar' ? 'نوع العاكس ومحول السرعة:' : 'Inverter System:'}</td>
              <td className="p-2 font-bold">{getInverterLabel(result.inverterType)}</td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="p-2 font-semibold bg-slate-50">{lang === 'ar' ? 'استطاعة العاكس الصغرى المقترحة:' : 'Minimum Inverter Rating:'}</td>
              <td className="p-2 font-bold text-emerald-800">
                {lang === 'ar' ? 'لا تقل عن' : 'Min'} {formatNum(result.inverterKw, 1)} kW ({formatNum(result.recommendedInverterHp, 1)} HP)
              </td>
            </tr>
            {result.backupGeneratorKva && (
              <tr className="border-b border-slate-200">
                <td className="p-2 font-semibold bg-slate-50">{lang === 'ar' ? 'توصية المولد الاحتياطي (ديزل):' : 'Backup Generator:'}</td>
                <td className="p-2 text-amber-900 font-semibold">
                  {result.backupGeneratorKva} kVA Diesel ({lang === 'ar' ? 'للتشغيل الليلي 24/7 وتأمين تيار البدء الحثي' : 'For continuous 24/7 irrigation'})
                </td>
              </tr>
            )}
            <tr className="border-b border-slate-200">
              <td className="p-2 font-semibold bg-slate-50">{lang === 'ar' ? 'حماية التشغيل ومميزات الأمان:' : 'Protection & Safety:'}</td>
              <td className="p-2">
                {lang === 'ar'
                  ? 'إقلاع ناعم تدريجي (Soft Start) لمنع المطرقة المائية، وحساس إلكتروني للتشغيل الجاف (Dry-Run Guard) وحماية من زيادة الجهد والحرارة.'
                  : 'Soft start to prevent water hammer, dry-run sensor protection, overvoltage and thermal guard.'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Engineering Contact & Stamp Footer */}
      <div className="mt-4 pt-3 border-t-2 border-slate-300 flex items-end justify-between">
        <div className="text-[11px] text-slate-600 space-y-0.5">
          <div><strong>{lang === 'ar' ? 'إعداد وتصميم:' : 'Developed by:'}</strong> مطور تطبيقات وبرامج حر: زكريا بسيود ZAKARYA Bessioud</div>
          <div><strong>{lang === 'ar' ? 'هاتف / واتساب:' : 'Phone / WhatsApp:'}</strong> 0655870392 (+213655870392)</div>
          <div><strong>{lang === 'ar' ? 'البريد الإلكتروني:' : 'Email:'}</strong> boussiouxzaki@gmail.com</div>
          <div><strong>{lang === 'ar' ? 'المنصة:' : 'Platform:'}</strong> FeedCalc Pro Solar — {lang === 'ar' ? 'المنظومة الهندسية المعتمدة' : 'Certified Engineering Platform'}</div>
        </div>
        <div className="text-center p-3 border-2 border-dashed border-emerald-700 rounded-lg min-w-[170px]">
          <div className="text-[11px] font-bold text-emerald-800">زكريا بسيود</div>
          <div className="text-[9px] text-emerald-700 font-semibold">مطور تطبيقات وبرامج حر</div>
          <div className="text-[9px] text-slate-500 font-mono">ZAKARYA Bessioud</div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">★ معتمد فلاحياً وهندسياً ★</div>
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div
        id="solar-pump-modal"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto print:static print:p-0 print:m-0 print:bg-transparent print:overflow-visible"
      >
        <div className="relative w-full max-w-2xl max-h-[95vh] overflow-y-auto my-auto print:max-h-none print:overflow-visible print:max-w-none print:w-full print:m-0">
          <div className="print:hidden">
            {cardContent}
          </div>
          {printableSheet}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="print:hidden">
        {cardContent}
      </div>
      {printableSheet}
    </>
  );
};
