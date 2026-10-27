import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { SolarPumpCalculationResult, PumpMotorType, SolarPanelType, InverterType } from '../components/SolarPumpCalculator';
import { Language } from '../types';
import { formatNum } from './translations';
import { universalSaveOrShare } from './universalDownloader';

export interface SolarPdfExportResult {
  success: boolean;
  blob?: Blob;
  blobUrl: string;
  previewImageUrl?: string;
  fileName: string;
  method: 'direct_download' | 'blob_ready' | 'shared' | 'downloaded' | 'opened_in_new_tab' | 'blob_url_created' | 'cancelled';
  actionMessage?: string;
}

export async function exportSolarPumpPdfReport(
  result: SolarPumpCalculationResult,
  lang: Language = 'ar'
): Promise<SolarPdfExportResult> {
  const isAr = lang === 'ar';
  const now = new Date();
  const dateFormatted = now.toLocaleDateString(isAr ? 'ar-DZ' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeFormatted = now.toLocaleTimeString(isAr ? 'ar-DZ' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const refCode = `SOL-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

  // Translation helpers
  const getPumpName = (type: PumpMotorType) => {
    switch (type) {
      case 'ac_3phase':
        return isAr ? 'مضخة تيار متناوب 380V ثلاثية الطور (AC 3-Phase)' : 'AC 3-Phase 380V Submersible Pump';
      case 'dc_bldc':
        return isAr ? 'مضخة تيار مستمر فائقة الكفاءة (DC BLDC عديمة الفحمات)' : 'DC BLDC Brushless High-Efficiency Pump';
      case 'ac_1phase':
        return isAr ? 'مضخة تيار متناوب 220V أحادية الطور (AC 1-Phase)' : 'AC 1-Phase 220V Submersible Pump';
    }
  };

  const getPanelName = (type: SolarPanelType) => {
    switch (type) {
      case 'mono_black':
        return isAr ? 'ألواح سوداء أحادية البلورة (Monocrystalline Black - كفاءة 22%)' : 'Monocrystalline Black Panels (22% Eff)';
      case 'poly_blue':
        return isAr ? 'ألواح زرقاء متعددة البلورات (Polycrystalline Blue - كفاءة 17%)' : 'Polycrystalline Blue Panels (17% Eff)';
      case 'topcon_n':
        return isAr ? 'ألواح N-Type TOPCon مزدوجة الوجه (Bifacial - كفاءة 24%)' : 'N-Type TOPCon Bifacial Panels (24% Eff)';
    }
  };

  const getInverterName = (type: InverterType) => {
    switch (type) {
      case 'solar_vfd':
        return isAr ? 'مغير تردد شمسي VFD مستقل ذكي (Solar VFD MPPT)' : 'Solar VFD MPPT Dedicated Inverter';
      case 'hybrid':
        return isAr ? 'عاكس هجين ذكي مزدوج المصدر (Hybrid: شمسي + شبكة / مولد)' : 'Hybrid Dual Source Inverter (Solar + Grid/Gen)';
      case 'dc_mppt':
        return isAr ? 'محكم تيار مستمر ذكي (DC MPPT Controller)' : 'DC MPPT Intelligent Controller';
    }
  };

  const fileName = `Solar_Pump_Report_FeedCalc_${refCode}.pdf`;

  // Host container positioned in-bounds behind the application
  const host = document.createElement('div');
  host.id = 'solar-pdf-render-host-container';
  host.style.position = 'fixed';
  host.style.top = '0';
  host.style.left = '0';
  host.style.width = '794px';
  host.style.zIndex = '-9999';
  host.style.pointerEvents = 'none';
  host.style.overflow = 'hidden';
  host.style.backgroundColor = '#ffffff';

  const reportEl = document.createElement('div');
  reportEl.style.width = '794px';
  reportEl.style.minHeight = '1120px';
  reportEl.style.padding = '28px 32px';
  reportEl.style.boxSizing = 'border-box';
  reportEl.style.fontFamily = "'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif";
  reportEl.style.direction = isAr ? 'rtl' : 'ltr';
  reportEl.style.textAlign = isAr ? 'right' : 'left';
  reportEl.style.color = '#1e293b';
  reportEl.style.backgroundColor = '#ffffff';
  reportEl.style.lineHeight = '1.45';

  // Build high-res crisp report template
  reportEl.innerHTML = `
    <!-- Header Banner -->
    <div style="border-bottom: 2px solid #059669; padding-bottom: 12px; margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between;">
      <div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="background: #059669; color: #ffffff; padding: 5px 12px; border-radius: 7px; font-weight: 800; font-size: 13px; letter-spacing: 0.5px;">
            FeedCalc Pro Solar
          </div>
          <div style="font-size: 11px; background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; padding: 4px 10px; border-radius: 6px; font-weight: 700;">
            ${isAr ? 'معايير جامعة كامبردج و FAO 56' : 'Cambridge & FAO 56 Standards'}
          </div>
        </div>
        <h1 style="font-size: 17px; font-weight: 900; color: #064e3b; margin: 6px 0 2px 0;">
          ${isAr ? 'تقرير التصميم الفني لمنظومة الضخ الشمسي للآبار الفلاحية' : 'Solar Water Pumping System Technical Engineering Report'}
        </h1>
        <p style="font-size: 10px; color: #64748b; margin: 0;">
          ${isAr ? 'وثيقة حسابية رسمية لتحديد قدرة المضخة، عدد الألواح، مواصفات العاكس، والتوصيل الكهربائي' : 'Official engineering sizing document for submersible pump, PV array, and solar inverter'}
        </p>
      </div>

      <div style="text-align: ${isAr ? 'left' : 'right'}; font-size: 9.5px; color: #475569; line-height: 1.5;">
        <div><strong>${isAr ? 'رقم التقرير:' : 'Ref:'}</strong> <span style="color: #059669; font-weight: 700;">${refCode}</span></div>
        <div><strong>${isAr ? 'تاريخ الإصدار:' : 'Date:'}</strong> ${dateFormatted}</div>
        <div><strong>${isAr ? 'الوقت:' : 'Time:'}</strong> ${timeFormatted}</div>
      </div>
    </div>

    <!-- Engineer Attribution Strip -->
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 7px; padding: 7px 12px; margin-bottom: 14px; font-size: 10.5px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <span style="color: #64748b;">${isAr ? 'إعداد وتصميم المهندس:' : 'Engineered by:'}</span>
        <strong style="color: #0f172a; margin: 0 4px;">ZAKARYA Bessioud (زكريا بسيود)</strong>
      </div>
      <div>
        <span style="color: #64748b;">${isAr ? 'هاتف التواصل / واتساب:' : 'Contact Phone / WhatsApp:'}</span>
        <strong style="color: #059669; direction: ltr; display: inline-block;">+213 655 87 03 92</strong>
      </div>
    </div>

    <!-- Hero KPI Summary Cards -->
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 16px;">
      <!-- Card 1: Pump Rating -->
      <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 8px 10px; text-align: center;">
        <div style="font-size: 9.5px; font-weight: 700; color: #065f46; margin-bottom: 2px;">
          ${isAr ? 'قدرة المضخة المقترحة' : 'Submersible Pump Rating'}
        </div>
        <div style="font-size: 16px; font-weight: 900; color: #047857;">
          ${formatNum(result.pumpPowerKw, 2)} kW
        </div>
        <div style="font-size: 10.5px; font-weight: 700; color: #0f766e;">
          (${formatNum(result.pumpPowerHp, 1)} ${isAr ? 'حصان HP' : 'HP'})
        </div>
      </div>

      <!-- Card 2: Panels Count -->
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 8px 10px; text-align: center;">
        <div style="font-size: 9.5px; font-weight: 700; color: #166534; margin-bottom: 2px;">
          ${isAr ? 'عدد الألواح الشمسية' : 'Solar Panels Count'}
        </div>
        <div style="font-size: 16px; font-weight: 900; color: #15803d;">
          ${result.panelCount} ${isAr ? 'لوح' : 'Panels'}
        </div>
        <div style="font-size: 10.5px; font-weight: 700; color: #166534;">
          ${formatNum(result.totalPvKw, 2)} kWp (${result.panelWatt}W)
        </div>
      </div>

      <!-- Card 3: Inverter Rating -->
      <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 8px 10px; text-align: center;">
        <div style="font-size: 9.5px; font-weight: 700; color: #92400e; margin-bottom: 2px;">
          ${isAr ? 'استطاعة العاكس (Inverter)' : 'Inverter Minimum Size'}
        </div>
        <div style="font-size: 16px; font-weight: 900; color: #b45309;">
          ${formatNum(result.inverterKw, 1)} kW
        </div>
        <div style="font-size: 10.5px; font-weight: 700; color: #92400e;">
          (${formatNum(result.recommendedInverterHp, 1)} ${isAr ? 'حصان HP' : 'HP'})
        </div>
      </div>

      <!-- Card 4: Water Flow -->
      <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 8px 10px; text-align: center;">
        <div style="font-size: 9.5px; font-weight: 700; color: #075985; margin-bottom: 2px;">
          ${isAr ? 'التدفق اليومي والعمق' : 'Daily Output & Depth'}
        </div>
        <div style="font-size: 16px; font-weight: 900; color: #0284c7;">
          ${formatNum(result.waterQ, 1)} m³/day
        </div>
        <div style="font-size: 10.5px; font-weight: 700; color: #0369a1;">
          TDH: ${formatNum(result.totalHead, 0)} ${isAr ? 'متر' : 'm'}
        </div>
      </div>
    </div>

    <!-- Section 1: Inputs & Decision Table -->
    <div style="margin-bottom: 12px;">
      <div style="font-size: 11.5px; font-weight: 800; color: #047857; margin-bottom: 5px; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px;">
        ${isAr ? '1. معطيات البئر وقرارات التصميم الأساسية (الأسئلة الـ 3)' : '1. Well Operating Criteria & Sizing Inputs'}
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
        <tbody>
          <tr style="background: #f8fafc; border: 1px solid #e2e8f0;">
            <td style="padding: 5px 8px; font-weight: 700; width: 30%; color: #334155;">${isAr ? 'الربط بالشبكة الكهربائية' : 'Grid Connection Status'}</td>
            <td style="padding: 5px 8px; font-weight: 800; width: 35%; color: #0f172a;">
              ${result.gridStatus === 'yes' ? (isAr ? 'نعم (مربوط بالشبكة أو يتوفر مولد)' : 'Connected / Generator Available') : (isAr ? 'لا (مزرعة معزولة تماماً Off-Grid)' : 'Isolated Off-Grid')}
            </td>
            <td style="padding: 5px 8px; color: #64748b; width: 35%;">
              ${result.gridStatus === 'yes' ? (isAr ? 'تم اعتماد عاكس هجين (Hybrid) للري المتواصل 24/7' : 'Hybrid system selected for 24/7 pumping') : (isAr ? 'تم اعتماد مغير تردد شمسي VFD مستقل' : 'Dedicated solar VFD MPPT selected')}
            </td>
          </tr>
          <tr style="background: #ffffff; border: 1px solid #e2e8f0;">
            <td style="padding: 5px 8px; font-weight: 700; color: #334155;">${isAr ? 'فئة الجودة والاستثمار' : 'Quality & Investment Tier'}</td>
            <td style="padding: 5px 8px; font-weight: 800; color: #0f172a;">
              ${result.qualityTier === 'premium' ? (isAr ? 'نوعية رفيعة ممتازة (Premium Tier)' : 'Premium High-Efficiency Tier') : (isAr ? 'خيار اقتصادي (Economic Tier)' : 'Economic Budget Tier')}
            </td>
            <td style="padding: 5px 8px; color: #64748b;">
              ${result.qualityTier === 'premium' ? (isAr ? 'ألواح سوداء مونوكريستالين عالية الكفاءة ومقاومة للحرارة' : 'Black Monocrystalline high temperature resilience') : (isAr ? 'ألواح زرقاء متعددة البلورات بتكلفة استثمار أولية أقل' : 'Blue Polycrystalline budget-friendly panels')}
            </td>
          </tr>
          <tr style="background: #f8fafc; border: 1px solid #e2e8f0;">
            <td style="padding: 5px 8px; font-weight: 700; color: #334155;">${isAr ? 'كمية المياه المطلوبة يومياً' : 'Daily Water Requirement'}</td>
            <td style="padding: 5px 8px; font-weight: 800; color: #047857;">${formatNum(result.waterQ, 1)} m³/day</td>
            <td style="padding: 5px 8px; color: #64748b;">${isAr ? `تعادل قرابة ${formatNum(result.hourlyFlow, 1)} متر مكعب/ساعة خلال ساعات السطوع` : `~${formatNum(result.hourlyFlow, 1)} m³/hour average`}</td>
          </tr>
          <tr style="background: #ffffff; border: 1px solid #e2e8f0;">
            <td style="padding: 5px 8px; font-weight: 700; color: #334155;">${isAr ? 'الارتفاع الهيدروليكي الكلي (TDH)' : 'Total Dynamic Head (TDH)'}</td>
            <td style="padding: 5px 8px; font-weight: 800; color: #047857;">${formatNum(result.totalHead, 0)} ${isAr ? 'متر' : 'meters'}</td>
            <td style="padding: 5px 8px; color: #64748b;">${isAr ? 'يشمل العمق الديناميكي + الرفع السطحي + فواقد احتكاك الأنابيب' : 'Dynamic drawdown + elevation + pipe friction loss'}</td>
          </tr>
          <tr style="background: #f8fafc; border: 1px solid #e2e8f0;">
            <td style="padding: 5px 8px; font-weight: 700; color: #334155;">${isAr ? 'ساعات الذروة الشمسية (PSH)' : 'Peak Sun Hours (PSH)'}</td>
            <td style="padding: 5px 8px; font-weight: 800; color: #0f172a;">${formatNum(result.peakSunHours, 1)} ${isAr ? 'ساعات / يوم' : 'hours/day'}</td>
            <td style="padding: 5px 8px; color: #64748b;">${isAr ? 'معدل الإشعاع القياسي المعتمد (1000 W/m²)' : 'Standard reference irradiance (1000 W/m²)'}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Section 2: Submersible Pump Sizing -->
    <div style="margin-bottom: 12px;">
      <div style="font-size: 11.5px; font-weight: 800; color: #047857; margin-bottom: 5px; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px;">
        ${isAr ? '2. المواصفات الميكانيكية والكهربائية للمضخة الغاطسة' : '2. Submersible Pump Mechanical & Electrical Sizing'}
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
        <tbody>
          <tr style="background: #ffffff; border: 1px solid #e2e8f0;">
            <td style="padding: 5px 8px; font-weight: 700; width: 30%; color: #334155;">${isAr ? 'نوع المحرك ومصدر التيار' : 'Pump Motor Topology'}</td>
            <td style="padding: 5px 8px; font-weight: 800; color: #0f172a;" colspan="2">${getPumpName(result.pumpType)}</td>
          </tr>
          <tr style="background: #f8fafc; border: 1px solid #e2e8f0;">
            <td style="padding: 5px 8px; font-weight: 700; color: #334155;">${isAr ? 'قدرة المحرك المقترحة' : 'Rated Motor Power'}</td>
            <td style="padding: 5px 8px; font-weight: 800; color: #047857;">${formatNum(result.pumpPowerKw, 2)} kW  (${formatNum(result.pumpPowerHp, 1)} HP)</td>
            <td style="padding: 5px 8px; color: #64748b;">${isAr ? 'محسوبة وفق معادلة الطاقة الهيدروليكية القياسية E_h' : 'Sized according to standard hydraulic energy equations'}</td>
          </tr>
          <tr style="background: #ffffff; border: 1px solid #e2e8f0;">
            <td style="padding: 5px 8px; font-weight: 700; color: #334155;">${isAr ? 'كفاءة المنظومة الإجمالية' : 'Wire-to-Water Efficiency'}</td>
            <td style="padding: 5px 8px; font-weight: 800; color: #0f172a;">${result.pumpEfficiency}%</td>
            <td style="padding: 5px 8px; color: #64748b;">${isAr ? 'تشمل فواقد التوربين، الانزلاق الحثي، وكفاءة المحرك' : 'Includes hydraulic impeller, slip, and motor losses'}</td>
          </tr>
          <tr style="background: #f8fafc; border: 1px solid #e2e8f0;">
            <td style="padding: 5px 8px; font-weight: 700; color: #334155;">${isAr ? 'الطاقة الهيدروليكية اليومية المنجزة' : 'Daily Hydraulic Work'}</td>
            <td style="padding: 5px 8px; font-weight: 800; color: #0f172a;">${formatNum(result.dailyHydraulicEnergy, 2)} kWh/day</td>
            <td style="padding: 5px 8px; color: #64748b;">${isAr ? `لرفع ${formatNum(result.waterQ, 1)} م³ على عمق ${formatNum(result.totalHead, 0)} متر` : `To lift ${formatNum(result.waterQ, 1)} m³ through ${formatNum(result.totalHead, 0)}m TDH`}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Section 3: Solar PV Array & String Wiring -->
    <div style="margin-bottom: 12px;">
      <div style="font-size: 11.5px; font-weight: 800; color: #047857; margin-bottom: 5px; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px;">
        ${isAr ? '3. مواصفات حقل الألواح الشمسية وتوصيل السلاسل (PV Array & Strings)' : '3. Solar PV Array Configuration & String Wiring'}
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
        <tbody>
          <tr style="background: #ffffff; border: 1px solid #e2e8f0;">
            <td style="padding: 5px 8px; font-weight: 700; width: 30%; color: #334155;">${isAr ? 'إجمالي قدرة حقل الألواح' : 'Total PV Array Capacity'}</td>
            <td style="padding: 5px 8px; font-weight: 800; color: #047857; width: 35%;">${formatNum(result.totalPvKw, 2)} kWp  (${formatNum(result.totalPvWatts, 0)} W)</td>
            <td style="padding: 5px 8px; color: #64748b; width: 35%;">${isAr ? 'معامل أمان إضافي لتغطية فواقد الغبار والكوابل' : 'Sized with safety margin for cable & thermal loss'}</td>
          </tr>
          <tr style="background: #f8fafc; border: 1px solid #e2e8f0;">
            <td style="padding: 5px 8px; font-weight: 700; color: #334155;">${isAr ? 'عدد الألواح وقدرة اللوح' : 'Panels Count & Rating'}</td>
            <td style="padding: 5px 8px; font-weight: 800; color: #0f172a;">${result.panelCount} ${isAr ? 'لوح' : 'Panels'}  @  ${result.panelWatt} W</td>
            <td style="padding: 5px 8px; color: #64748b;">${getPanelName(result.panelType)}</td>
          </tr>
          <tr style="background: #ffffff; border: 1px solid #e2e8f0;">
            <td style="padding: 5px 8px; font-weight: 700; color: #334155;">${isAr ? 'التوصيل الكهربائي للسلاسل (Strings)' : 'Electrical String Wiring'}</td>
            <td style="padding: 5px 8px; font-weight: 800; color: #065f46;" colspan="2">${result.stringConfig}</td>
          </tr>
          <tr style="background: #f8fafc; border: 1px solid #e2e8f0;">
            <td style="padding: 5px 8px; font-weight: 700; color: #334155;">${isAr ? 'السلوك الحراري في الصيف' : 'Summer Thermal Derating'}</td>
            <td style="padding: 5px 8px; font-weight: 700; color: #0f172a;">~${result.tempDeratingPercent}% ${isAr ? 'فقد حراري متوقع' : 'derating'}</td>
            <td style="padding: 5px 8px; color: #64748b;">
              ${result.panelType === 'poly_blue' ? (isAr ? 'تم احتساب +15% ألواح إضافية لتعويض الفقد' : '+15% extra panels added') : (isAr ? 'مقاومة عالية واستقرار إنتاجي ممتاز في القيظ' : 'Superior heat tolerance in hot desert climates')}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Section 4: Inverter & Backup Generator -->
    <div style="margin-bottom: 12px;">
      <div style="font-size: 11.5px; font-weight: 800; color: #047857; margin-bottom: 5px; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px;">
        ${isAr ? '4. نظام العاكس الشمسي والمولد الاحتياطي (Inverter & Backup)' : '4. Solar Inverter Sizing & Backup Generator'}
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
        <tbody>
          <tr style="background: #ffffff; border: 1px solid #e2e8f0;">
            <td style="padding: 5px 8px; font-weight: 700; width: 30%; color: #334155;">${isAr ? 'نوع العاكس ومحول التردد' : 'Inverter System Topology'}</td>
            <td style="padding: 5px 8px; font-weight: 800; color: #0f172a;" colspan="2">${getInverterName(result.inverterType)}</td>
          </tr>
          <tr style="background: #f8fafc; border: 1px solid #e2e8f0;">
            <td style="padding: 5px 8px; font-weight: 700; color: #334155;">${isAr ? 'الاستطاعة الصغرى للعاكس' : 'Minimum Inverter Power'}</td>
            <td style="padding: 5px 8px; font-weight: 800; color: #047857;">${formatNum(result.inverterKw, 1)} kW  (${formatNum(result.recommendedInverterHp, 1)} HP)</td>
            <td style="padding: 5px 8px; color: #64748b;">${isAr ? 'يتحمل تيار البدء الحثي وعزم الدوران العالي للمضخة' : 'Handles motor inductive inrush current'}</td>
          </tr>
          ${
            result.backupGeneratorKva
              ? `
          <tr style="background: #fffbeb; border: 1px solid #fde68a;">
            <td style="padding: 5px 8px; font-weight: 800; color: #92400e;">${isAr ? 'توصية المولد الاحتياطي للعاكس الهجين' : 'Hybrid Generator Recommendation'}</td>
            <td style="padding: 5px 8px; font-weight: 900; color: #b45309;">${result.backupGeneratorKva} kVA ${isAr ? 'ديزل' : 'Diesel'}</td>
            <td style="padding: 5px 8px; color: #78350f; font-weight: 600;">${isAr ? 'لتأمين تيار الإقلاع الحثي والري الليلي المتواصل 24/7' : 'For 24/7 night irrigation without pump stall'}</td>
          </tr>`
              : ''
          }
        </tbody>
      </table>
    </div>

    <!-- Section 5: Engineering Recommendations Strip -->
    <div style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 7px; padding: 8px 12px; margin-bottom: 12px; font-size: 9.5px; color: #475569; line-height: 1.5;">
      <div style="font-weight: 800; color: #0f172a; margin-bottom: 3px;">
        ${isAr ? '📌 إرشادات التركيب الهندسية لضمان أقصى كفاءة وحماية:' : '📌 Engineering Installation Recommendations:'}
      </div>
      <ul style="margin: 0; padding-${isAr ? 'right' : 'left'}: 14px;">
        <li>${isAr ? 'استخدام كوابل شمسية نحاسية مزدوجة العزل (Solar DC Cables) بمقطع لا يقل عن 6 ملم² لتقليل هبوط الجهد دون 3%.' : 'Use double-insulated DC solar copper cables (minimum 6mm²) ensuring voltage drop < 3%.'}</li>
        <li>${isAr ? 'تثبيت مستشعر حماية ضد التشغيل الجاف (Dry Run Sensor) وصمام عدم رجوع (Non-Return Valve) لمنع المطرقة المائية.' : 'Install dry-run protection sensors and check valves to avoid water hammer on shutdown.'}</li>
        <li>${isAr ? 'التأريض الوقائي الصارم (Earthing Protection < 5 Ohm) مع قواطع حماية من الصواعق (Surge Protection Device - SPD).' : 'Mandatory low-impedance grounding (< 5 Ohm) with DC and AC Surge Protection Devices (SPD).'}</li>
      </ul>
    </div>

    <!-- Footer Sign-off -->
    <div style="border-top: 2px solid #e2e8f0; padding-top: 10px; display: flex; align-items: flex-end; justify-content: space-between; font-size: 10px;">
      <div>
        <div style="font-weight: 800; color: #047857; font-size: 11px;">FeedCalc Pro — Solar Water Pumping Module</div>
        <div style="color: #64748b; font-size: 9px; margin-top: 2px;">
          ${isAr ? 'حقوق التصميم والبرمجة محفوظة © المهندس زكريا بسيود ZAKARYA Bessioud' : 'Designed & engineered by Eng. ZAKARYA Bessioud — All Rights Reserved'}
        </div>
      </div>

      <div style="text-align: center; border: 1px solid #cbd5e1; border-radius: 6px; padding: 5px 12px; background: #ffffff;">
        <div style="font-size: 8.5px; color: #64748b; margin-bottom: 2px;">${isAr ? 'ختم واعتماد المهندس المصمم' : 'Engineering Approval Seal'}</div>
        <div style="font-size: 11.5px; font-weight: 900; color: #047857; letter-spacing: 0.5px;">ENG. ZAKARYA BESSIOUD</div>
        <div style="font-size: 8px; color: #0f172a; font-weight: 700;">+213 655 87 03 92</div>
      </div>
    </div>
  `;

  host.appendChild(reportEl);
  document.body.appendChild(host);

  try {
    // Timeout race: if canvas takes > 3200ms (common on slow phones), drop immediately to vector PDF
    const renderCanvas = html2canvas(reportEl, {
      scale: 1.8,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: 794,
      windowWidth: 794,
      x: 0,
      y: 0,
      scrollX: 0,
      scrollY: 0,
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Canvas render timeout on mobile device')), 3200)
    );

    const canvas = await Promise.race([renderCanvas, timeoutPromise]);

    if (document.body.contains(host)) {
      document.body.removeChild(host);
    }

    if (!canvas || !canvas.width || !canvas.height) {
      throw new Error('Canvas render failed to produce valid dimensions');
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const imgHeight = (canvas.height * pageWidth) / canvas.width;

    doc.addImage(imgData, 'JPEG', 0, 0, pageWidth, Math.min(imgHeight, pageHeight));

    const blob = doc.output('blob');
    const blobUrl = URL.createObjectURL(blob);

    // Call universal cross-device downloader (Web Share API on mobile, direct download on PC)
    const exportRes = await universalSaveOrShare({
      blob,
      filename: fileName,
      title: isAr ? 'تقرير منظومة الضخ الشمسي للآبار الفلاحية' : 'Solar Well Pumping Engineering Report',
      text: isAr ? 'تقرير التصميم الفني لمنظومة الضخ الشمسي - المهندس زكريا بسيود' : 'Solar Pumping System Report - Eng. ZAKARYA Bessioud',
      mimeType: 'application/pdf',
    });

    return {
      success: true,
      blob,
      blobUrl,
      previewImageUrl: imgData,
      fileName,
      method: exportRes.actionTaken,
      actionMessage: exportRes.message,
    };
  } catch (err) {
    console.warn('html2canvas unavailable or timed out, generating instant vector PDF report:', err);
    if (document.body.contains(host)) {
      document.body.removeChild(host);
    }

    // High-speed vector PDF fallback generated directly by jsPDF in 15ms
    const fallbackDoc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });
    const pw = fallbackDoc.internal.pageSize.getWidth();

    // Header banner
    fallbackDoc.setFillColor(5, 150, 105);
    fallbackDoc.rect(10, 10, pw - 20, 24, 'F');
    fallbackDoc.setTextColor(255, 255, 255);
    fallbackDoc.setFontSize(14);
    fallbackDoc.text('FeedCalc Pro Solar Engineering Report', 15, 20);
    fallbackDoc.setFontSize(9);
    fallbackDoc.text(`Cambridge University & FAO 56 Standards | Ref: ${refCode}`, 15, 28);

    // Author
    fallbackDoc.setTextColor(51, 65, 85);
    fallbackDoc.setFontSize(8.5);
    fallbackDoc.text(`Lead Engineer: ZAKARYA Bessioud (+213655870392) | ${dateFormatted} ${timeFormatted}`, 15, 40);

    // Highlight Box
    fallbackDoc.setFillColor(240, 253, 244);
    fallbackDoc.setDrawColor(134, 239, 172);
    fallbackDoc.roundedRect(10, 46, pw - 20, 28, 2, 2, 'FD');
    fallbackDoc.setTextColor(5, 150, 105);
    fallbackDoc.setFontSize(15);
    fallbackDoc.text(`Pump: ${formatNum(result.pumpPowerKw, 2)} kW (${formatNum(result.pumpPowerHp, 1)} HP)  |  PV Array: ${formatNum(result.totalPvKw, 2)} kWp`, 15, 58);
    fallbackDoc.setFontSize(9);
    fallbackDoc.setTextColor(71, 85, 105);
    fallbackDoc.text(`Daily Output: ${formatNum(result.waterQ, 1)} m3/day at ${formatNum(result.totalHead, 0)}m TDH | Inverter: >= ${formatNum(result.inverterKw, 1)} kW`, 15, 67);

    // Section 1: Inputs
    fallbackDoc.setTextColor(15, 118, 110);
    fallbackDoc.setFontSize(10.5);
    fallbackDoc.text('1. Well Site & Hydraulic Criteria (Guiding Questions)', 10, 83);
    fallbackDoc.setTextColor(30, 41, 59);
    fallbackDoc.setFontSize(8.5);
    fallbackDoc.text(`- Grid Connection Status: ${result.gridStatus === 'yes' ? 'Connected / Hybrid Inverter 24/7' : 'Off-Grid / Solar VFD'}`, 12, 90);
    fallbackDoc.text(`- Quality & Budget Tier: ${result.qualityTier === 'premium' ? 'Premium Tier (Black Monocrystalline 22%)' : 'Economic Tier (Blue Polycrystalline 17%)'}`, 12, 96);
    fallbackDoc.text(`- Daily Water Flow (Q): ${formatNum(result.waterQ, 1)} m3/day (~${formatNum(result.hourlyFlow, 1)} m3/hour average)`, 12, 102);
    fallbackDoc.text(`- Total Dynamic Head (TDH): ${formatNum(result.totalHead, 0)} meters (Depth + Pipe Friction)`, 12, 108);
    fallbackDoc.text(`- Peak Sun Hours (PSH): ${formatNum(result.peakSunHours, 1)} hours/day (1000 W/m2 standard)`, 12, 114);

    // Section 2: Pump Sizing
    fallbackDoc.setTextColor(15, 118, 110);
    fallbackDoc.setFontSize(10.5);
    fallbackDoc.text('2. Submersible Pump Mechanical & Electrical Sizing', 10, 127);
    fallbackDoc.setTextColor(30, 41, 59);
    fallbackDoc.setFontSize(8.5);
    fallbackDoc.text(`- Recommended Motor Power: ${formatNum(result.pumpPowerKw, 2)} kW (${formatNum(result.pumpPowerHp, 1)} HP)`, 12, 134);
    fallbackDoc.text(`- Motor Topology: ${result.pumpType === 'ac_3phase' ? 'AC 3-Phase 380V Submersible' : result.pumpType === 'dc_bldc' ? 'DC BLDC Brushless High Efficiency' : 'AC 1-Phase 220V'}`, 12, 140);
    fallbackDoc.text(`- Wire-to-Water Efficiency: ${result.pumpEfficiency}% (Turbine, Induction Slip & Motor)`, 12, 146);
    fallbackDoc.text(`- Daily Hydraulic Energy: ${formatNum(result.dailyHydraulicEnergy, 2)} kWh/day`, 12, 152);

    // Section 3: PV Array
    fallbackDoc.setTextColor(15, 118, 110);
    fallbackDoc.setFontSize(10.5);
    fallbackDoc.text('3. Solar PV Array & String Configuration', 10, 165);
    fallbackDoc.setTextColor(30, 41, 59);
    fallbackDoc.setFontSize(8.5);
    fallbackDoc.text(`- Total PV Array Capacity: ${formatNum(result.totalPvKw, 2)} kWp (${formatNum(result.totalPvWatts, 0)} Watts peak)`, 12, 172);
    fallbackDoc.text(`- Panels Quantity: ${result.panelCount} panels @ ${result.panelWatt}W each`, 12, 178);
    fallbackDoc.text(`- Panel Type: ${result.panelType === 'mono_black' ? 'Black Monocrystalline' : result.panelType === 'poly_blue' ? 'Blue Polycrystalline (+15% derating margin)' : 'TOPCon Bifacial'}`, 12, 184);
    fallbackDoc.text(`- String Wiring Layout: ${result.stringConfig}`, 12, 190);

    // Section 4: Inverter & Backup
    fallbackDoc.setTextColor(15, 118, 110);
    fallbackDoc.setFontSize(10.5);
    fallbackDoc.text('4. Inverter System & Backup Generation', 10, 203);
    fallbackDoc.setTextColor(30, 41, 59);
    fallbackDoc.setFontSize(8.5);
    fallbackDoc.text(`- Inverter Topology: ${result.inverterType === 'hybrid' ? 'Hybrid Solar Inverter (Dual Grid/Generator)' : result.inverterType === 'solar_vfd' ? 'Dedicated Solar VFD MPPT' : 'DC MPPT Controller'}`, 12, 210);
    fallbackDoc.text(`- Minimum Rated Power: ${formatNum(result.inverterKw, 1)} kW (${formatNum(result.recommendedInverterHp, 1)} HP)`, 12, 216);
    if (result.backupGeneratorKva) {
      fallbackDoc.text(`- Hybrid Backup Generator: ${result.backupGeneratorKva} kVA Diesel for 24/7 duty`, 12, 222);
    }

    // Footer
    fallbackDoc.setDrawColor(226, 232, 240);
    fallbackDoc.line(10, 275, pw - 10, 275);
    fallbackDoc.setTextColor(148, 163, 184);
    fallbackDoc.setFontSize(7.5);
    fallbackDoc.text('FeedCalc Pro Solar | Cambridge & FAO 56 Standards | Designer: Eng. ZAKARYA Bessioud (+213655870392)', 10, 281);

    const fallbackBlob = fallbackDoc.output('blob');
    const fallbackBlobUrl = URL.createObjectURL(fallbackBlob);

    const exportRes = await universalSaveOrShare({
      blob: fallbackBlob,
      filename: fileName,
      title: isAr ? 'تقرير منظومة الضخ الشمسي' : 'Solar Pump Report',
      mimeType: 'application/pdf',
    });

    return {
      success: true,
      blob: fallbackBlob,
      blobUrl: fallbackBlobUrl,
      fileName,
      method: exportRes.actionTaken,
      actionMessage: exportRes.message,
    };
  }
}
