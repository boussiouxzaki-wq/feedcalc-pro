import { SolarPumpCalculationResult, PumpMotorType, SolarPanelType, InverterType } from '../components/SolarPumpCalculator';
import { Species, FeedType, CalculationInput, CalculationResult, Language } from '../types';
import { formatNum } from './translations';

/**
 * Generate a 100% self-contained, responsive, printable HTML report
 * that works completely offline on ANY device (Android, iOS, PC, tablet)
 * without requiring canvas, webfonts, or external dependencies.
 */
export function generateSolarOfflineHtmlReport(
  result: SolarPumpCalculationResult,
  lang: Language = 'ar'
): string {
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
  const refCode = `SOLAR-CAMB-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

  const getPumpLabel = (type: PumpMotorType) => {
    switch (type) {
      case 'ac_3phase':
        return isAr ? 'مضخة تيار متناوب 380V ثلاثية الطور (AC 3-Phase)' : 'AC 3-Phase 380V Submersible Pump';
      case 'dc_bldc':
        return isAr ? 'مضخة تيار مستمر فائقة الكفاءة (DC BLDC عديمة الفحمات)' : 'DC BLDC Brushless High-Efficiency Pump';
      case 'ac_1phase':
        return isAr ? 'مضخة تيار متناوب 220V أحادية الطور (AC 1-Phase)' : 'AC 1-Phase 220V Submersible Pump';
    }
  };

  const getPanelLabel = (type: SolarPanelType) => {
    switch (type) {
      case 'mono_black':
        return isAr ? 'ألواح سوداء أحادية البلورة (Monocrystalline Black - كفاءة 22%)' : 'Monocrystalline Black Panels (22% Eff)';
      case 'poly_blue':
        return isAr ? 'ألواح زرقاء متعددة البلورات (Polycrystalline Blue - كفاءة 17%)' : 'Polycrystalline Blue Panels (17% Eff)';
      case 'topcon_n':
        return isAr ? 'ألواح N-Type TOPCon مزدوجة الوجه (Bifacial - كفاءة 24%)' : 'N-Type TOPCon Bifacial Panels (24% Eff)';
    }
  };

  const getInverterLabel = (type: InverterType) => {
    switch (type) {
      case 'solar_vfd':
        return isAr ? 'مغير تردد شمسي VFD مستقل ذكي (Solar VFD MPPT)' : 'Solar VFD MPPT Dedicated Inverter';
      case 'hybrid':
        return isAr ? 'عاكس هجين ذكي مزدوج (Hybrid: شمسي + شبكة / مولد ديزل)' : 'Hybrid Dual Source Inverter (Solar + Grid/Gen)';
      case 'dc_mppt':
        return isAr ? 'محكم تيار مستمر ذكي (DC MPPT Controller)' : 'DC MPPT Intelligent Controller';
    }
  };

  return `<!DOCTYPE html>
<html lang="${lang}" dir="${isAr ? 'rtl' : 'ltr'}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isAr ? 'تقرير دراسة منظومة الضخ الشمسي - FeedCalc Pro' : 'Solar Pumping System Report - FeedCalc Pro'}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background-color: #f1f5f9;
      color: #0f172a;
      line-height: 1.5;
      padding: 16px;
    }
    .container {
      max-width: 820px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      overflow: hidden;
      border: 1px solid #e2e8f0;
    }
    .header-banner {
      background: linear-gradient(135deg, #065f46, #047857);
      color: #ffffff;
      padding: 24px;
    }
    .brand-strip {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      font-size: 12px;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 11px;
      background: rgba(255,255,255,0.2);
    }
    .title {
      font-size: 20px;
      font-weight: 800;
      margin-bottom: 6px;
    }
    .subtitle {
      font-size: 12px;
      opacity: 0.9;
    }
    .engineer-card {
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      padding: 12px 24px;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      gap: 8px;
    }
    .content-body {
      padding: 24px;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 12px;
      margin-bottom: 24px;
    }
    .kpi-card {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 12px;
      padding: 14px;
      text-align: center;
    }
    .kpi-title {
      font-size: 11px;
      color: #166534;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .kpi-value {
      font-size: 20px;
      font-weight: 800;
      color: #047857;
    }
    .kpi-sub {
      font-size: 11px;
      color: #15803d;
      margin-top: 2px;
      font-weight: 600;
    }
    .section-title {
      font-size: 14px;
      font-weight: 800;
      color: #065f46;
      border-bottom: 2px solid #059669;
      padding-bottom: 6px;
      margin: 20px 0 10px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
      font-size: 12px;
    }
    th, td {
      padding: 8px 12px;
      border: 1px solid #e2e8f0;
      text-align: ${isAr ? 'right' : 'left'};
    }
    tr:nth-child(even) { background-color: #f8fafc; }
    td.label { font-weight: 700; width: 35%; color: #334155; }
    td.value { font-weight: 800; color: #0f172a; }
    .footer-stamp {
      border-top: 2px solid #e2e8f0;
      padding-top: 16px;
      margin-top: 24px;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: #64748b;
      gap: 12px;
    }
    .seal-box {
      border: 2px dashed #059669;
      border-radius: 8px;
      padding: 8px 16px;
      background: #ecfdf5;
      text-align: center;
      font-weight: 700;
      color: #065f46;
    }
    .actions {
      display: flex;
      gap: 10px;
      margin-bottom: 16px;
    }
    .btn {
      flex: 1;
      padding: 10px 16px;
      background: #059669;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      font-weight: 700;
      cursor: pointer;
      text-align: center;
      text-decoration: none;
      font-size: 13px;
    }
    .btn:hover { background: #047857; }
    @media print {
      body { background: #ffffff; padding: 0; }
      .container { box-shadow: none; border: none; max-width: 100%; }
      .actions, .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="actions no-print" style="padding: 16px 24px 0 24px;">
      <button class="btn" onclick="window.print()">🖨️ ${isAr ? 'طباعة التقرير / حفظ كـ PDF' : 'Print / Save as PDF'}</button>
    </div>

    <div class="header-banner">
      <div class="brand-strip">
        <span class="badge">FeedCalc Pro Solar</span>
        <span>${isAr ? 'معايير كامبردج و FAO 56' : 'Cambridge & FAO 56 Standards'}</span>
      </div>
      <h1 class="title">${isAr ? 'تقرير التصميم الفني لمنظومة الضخ الشمسي للآبار الفلاحية' : 'Agricultural Solar Pumping System Engineering Report'}</h1>
      <p class="subtitle">${isAr ? 'وثيقة حسابية رسمية لتحديد قدرة المضخة، عدد الألواح، مواصفات العاكس، والتوصيل الكهربائي' : 'Official sizing specification for submersible pump, PV array, and inverter'}</p>
    </div>

    <div class="engineer-card">
      <div>
        <span>${isAr ? 'إعداد وبرمجة:' : 'Developed by:'}</span>
        <strong style="color: #0f172a;">${isAr ? 'مطور تطبيقات وبرامج حر: زكريا بسيود (ZAKARYA Bessioud)' : 'Freelance Developer ZAKARYA Bessioud'}</strong>
      </div>
      <div>
        <span>${isAr ? 'هاتف / واتساب:' : 'Contact:'}</span>
        <strong style="color: #059669;" dir="ltr">+213 655 87 03 92</strong>
      </div>
      <div>
        <span>${isAr ? 'المرجع:' : 'Ref:'}</span>
        <strong style="color: #059669;">${refCode}</strong>
      </div>
    </div>

    <div class="content-body">
      <!-- KPI Highlights -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-title">${isAr ? 'قدرة المضخة المقترحة' : 'Submersible Pump'}</div>
          <div class="kpi-value">${formatNum(result.pumpPowerKw, 2)} kW</div>
          <div class="kpi-sub">(${formatNum(result.pumpPowerHp, 1)} ${isAr ? 'حصان HP' : 'HP'})</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-title">${isAr ? 'عدد الألواح الشمسية' : 'Solar Panels'}</div>
          <div class="kpi-value">${result.panelCount} ${isAr ? 'لوح' : 'Panels'}</div>
          <div class="kpi-sub">${formatNum(result.totalPvKw, 2)} kWp (${result.panelWatt}W)</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-title">${isAr ? 'استطاعة العاكس (Inverter)' : 'Inverter Power'}</div>
          <div class="kpi-value">${formatNum(result.inverterKw, 1)} kW</div>
          <div class="kpi-sub">(${formatNum(result.recommendedInverterHp, 1)} ${isAr ? 'حصان HP' : 'HP'})</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-title">${isAr ? 'التدفق اليومي والعمق' : 'Daily Output & Depth'}</div>
          <div class="kpi-value">${formatNum(result.waterQ, 1)} m³/day</div>
          <div class="kpi-sub">TDH: ${formatNum(result.totalHead, 0)} ${isAr ? 'متر' : 'm'}</div>
        </div>
      </div>

      <!-- 1. Sizing inputs -->
      <h2 class="section-title">${isAr ? '1. معطيات البئر وقرارات التصميم (الأسئلة الـ 3)' : '1. Well Sizing & Guiding Decisions'}</h2>
      <table>
        <tbody>
          <tr>
            <td class="label">${isAr ? 'الربط بالشبكة الكهربائية' : 'Grid Connection'}</td>
            <td class="value">${result.gridStatus === 'yes' ? (isAr ? 'نعم (مربوط بالشبكة أو يتوفر مولد) — تم اعتماد عاكس هجين Hybrid 24/7' : 'Connected / Generator Available - Hybrid 24/7') : (isAr ? 'لا (مزرعة معزولة Off-Grid) — تم اعتماد VFD مستقل' : 'Isolated Off-Grid - Solar VFD')}</td>
          </tr>
          <tr>
            <td class="label">${isAr ? 'فئة الجودة والاستثمار' : 'Quality Tier'}</td>
            <td class="value">${result.qualityTier === 'premium' ? (isAr ? 'نوعية رفيعة ممتازة (ألواح سوداء مونوكريستالين عالية الكفاءة ومقاومة للحرارة)' : 'Premium Tier (Black Monocrystalline)') : (isAr ? 'خيار اقتصادي (ألواح زرقاء متعددة البلورات +15% ألواح تعويضية)' : 'Economic Tier (Blue Polycrystalline)')}</td>
          </tr>
          <tr>
            <td class="label">${isAr ? 'كمية المياه المطلوبة' : 'Water Demand'}</td>
            <td class="value">${formatNum(result.waterQ, 1)} m³/day (~${formatNum(result.hourlyFlow, 1)} m³/h)</td>
          </tr>
          <tr>
            <td class="label">${isAr ? 'الارتفاع الهيدروليكي الكلي (TDH)' : 'Total Dynamic Head (TDH)'}</td>
            <td class="value">${formatNum(result.totalHead, 0)} ${isAr ? 'متر (عمق التنزيل الديناميكي + فواقد الاحتكاك)' : 'meters'}</td>
          </tr>
          <tr>
            <td class="label">${isAr ? 'ساعات الذروة الشمسية (PSH)' : 'Peak Sun Hours'}</td>
            <td class="value">${formatNum(result.peakSunHours, 1)} ${isAr ? 'ساعات/يوم' : 'hours/day'}</td>
          </tr>
        </tbody>
      </table>

      <!-- 2. Pump Sizing -->
      <h2 class="section-title">${isAr ? '2. مواصفات المضخة ومحرك الرفع' : '2. Submersible Pump Mechanical & Electrical Specs'}</h2>
      <table>
        <tbody>
          <tr>
            <td class="label">${isAr ? 'طوبولوجيا ونوع المحرك' : 'Motor Topology'}</td>
            <td class="value">${getPumpLabel(result.pumpType)}</td>
          </tr>
          <tr>
            <td class="label">${isAr ? 'القدرة الميكانيكية المقترحة' : 'Rated Motor Power'}</td>
            <td class="value" style="color: #047857;">${formatNum(result.pumpPowerKw, 2)} kW (${formatNum(result.pumpPowerHp, 1)} HP)</td>
          </tr>
          <tr>
            <td class="label">${isAr ? 'كفاءة المنظومة المعتمدة' : 'Wire-to-Water Efficiency'}</td>
            <td class="value">${result.pumpEfficiency}%</td>
          </tr>
          <tr>
            <td class="label">${isAr ? 'الطاقة الهيدروليكية المنجزة' : 'Daily Hydraulic Work'}</td>
            <td class="value">${formatNum(result.dailyHydraulicEnergy, 2)} kWh/day</td>
          </tr>
        </tbody>
      </table>

      <!-- 3. Solar PV Array -->
      <h2 class="section-title">${isAr ? '3. مواصفات مصفوفة الألواح وتوصيل السلاسل (Strings)' : '3. Solar PV Array & String Wiring'}</h2>
      <table>
        <tbody>
          <tr>
            <td class="label">${isAr ? 'إجمالي قدرة حقل الألواح' : 'Total Array Power'}</td>
            <td class="value" style="color: #047857;">${formatNum(result.totalPvKw, 2)} kWp (${formatNum(result.totalPvWatts, 0)} W)</td>
          </tr>
          <tr>
            <td class="label">${isAr ? 'عدد الألواح وقدرة اللوح' : 'Panels Count & Rating'}</td>
            <td class="value">${result.panelCount} ${isAr ? 'لوح' : 'Panels'} @ ${result.panelWatt} W</td>
          </tr>
          <tr>
            <td class="label">${isAr ? 'تقنية الألواح' : 'Panel Technology'}</td>
            <td class="value">${getPanelLabel(result.panelType)}</td>
          </tr>
          <tr>
            <td class="label">${isAr ? 'التوصيل الكهربائي للسلاسل' : 'String Wiring'}</td>
            <td class="value" style="color: #065f46;">${result.stringConfig}</td>
          </tr>
        </tbody>
      </table>

      <!-- 4. Inverter & Generator -->
      <h2 class="section-title">${isAr ? '4. نظام العاكس الشمسي والمولد الاحتياطي' : '4. Inverter & Backup Generator'}</h2>
      <table>
        <tbody>
          <tr>
            <td class="label">${isAr ? 'طراز ونوع العاكس' : 'Inverter System'}</td>
            <td class="value">${getInverterLabel(result.inverterType)}</td>
          </tr>
          <tr>
            <td class="label">${isAr ? 'الاستطاعة الصغرى للعاكس' : 'Minimum Inverter Power'}</td>
            <td class="value" style="color: #047857;">${formatNum(result.inverterKw, 1)} kW (${formatNum(result.recommendedInverterHp, 1)} HP)</td>
          </tr>
          ${
            result.backupGeneratorKva
              ? `<tr>
            <td class="label">${isAr ? 'المولد الاحتياطي المقترح' : 'Backup Generator'}</td>
            <td class="value" style="color: #b45309;">${result.backupGeneratorKva} kVA Diesel</td>
          </tr>`
              : ''
          }
        </tbody>
      </table>

      <!-- Footer Stamp -->
      <div class="footer-stamp">
        <div>
          <strong>FeedCalc Pro Solar</strong> — ${isAr ? 'مطور تطبيقات وبرامج حر: زكريا بسيود ZAKARYA Bessioud' : 'Developed by Freelance Developer ZAKARYA Bessioud'}<br>
          ${isAr ? 'هاتف / واتساب: +213655870392 | البريد: boussiouxzaki@gmail.com' : 'Tel: +213655870392 | Email: boussiouxzaki@gmail.com'}
        </div>
        <div class="seal-box">
          ZAKARYA BESSIOUD<br>
          <span style="font-size: 8.5px; font-weight: normal;">${isAr ? 'مطور تطبيقات وبرامج حر' : 'Freelance App Developer'}</span><br>
          <span style="font-size: 9px; font-weight: normal;">★ CERTIFIED AGRICULTURAL DESIGN ★</span>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generate a 100% self-contained, responsive, printable HTML report
 * for animal and aquaculture feed calculations.
 */
export function generateFeedOfflineHtmlReport(
  species: Species,
  feedType: FeedType,
  input: CalculationInput,
  result: CalculationResult,
  lang: Language = 'ar'
): string {
  const isAr = lang === 'ar';
  const now = new Date();
  const dateFormatted = now.toLocaleDateString(isAr ? 'ar-DZ' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const refCode = `FEED-CALC-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

  const weightUnitStr = input.weightUnit === 'lb' ? 'lb' : 'kg';
  const speciesName = species.name;
  const feedName = feedType.name;

  return `<!DOCTYPE html>
<html lang="${lang}" dir="${isAr ? 'rtl' : 'ltr'}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isAr ? 'تقرير الحسابات الغذائية ومقننات العلف - FeedCalc Pro' : 'Feed Calculation Report - FeedCalc Pro'}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background-color: #f1f5f9;
      color: #0f172a;
      line-height: 1.5;
      padding: 16px;
    }
    .container {
      max-width: 820px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      overflow: hidden;
      border: 1px solid #e2e8f0;
    }
    .header-banner {
      background: linear-gradient(135deg, #059669, #047857);
      color: #ffffff;
      padding: 24px;
    }
    .title { font-size: 20px; font-weight: 800; margin-bottom: 4px; }
    .subtitle { font-size: 12px; opacity: 0.9; }
    .content-body { padding: 24px; }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 12px;
      margin-bottom: 24px;
    }
    .kpi-card {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      border-radius: 12px;
      padding: 14px;
      text-align: center;
    }
    .kpi-title { font-size: 11px; color: #065f46; font-weight: 600; }
    .kpi-value { font-size: 20px; font-weight: 800; color: #047857; }
    .kpi-sub { font-size: 11px; color: #0f766e; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 12px; }
    th, td { padding: 8px 12px; border: 1px solid #e2e8f0; text-align: ${isAr ? 'right' : 'left'}; }
    tr:nth-child(even) { background-color: #f8fafc; }
    .actions { padding: 16px 24px 0 24px; display: flex; gap: 10px; }
    .btn { flex: 1; padding: 10px; background: #059669; color: #fff; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; text-align: center; }
    @media print { .actions { display: none !important; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="actions">
      <button class="btn" onclick="window.print()">🖨️ ${isAr ? 'طباعة التقرير / حفظ كـ PDF' : 'Print / Save as PDF'}</button>
    </div>

    <div class="header-banner">
      <h1 class="title">${isAr ? 'تقرير الحسابات الغذائية ومقننات العلف اليومية' : 'Smart Feed Calculation Report'}</h1>
      <p class="subtitle">${isAr ? 'وثيقة فنية رسمية معتمدة على معادلات معدل التحويل الغذائي (FCR)' : 'Official FCR-based Nutritional Demand Specification'}</p>
    </div>

    <div class="content-body">
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-title">${isAr ? 'إجمالي العلف اليومي' : 'Total Daily Feed'}</div>
          <div class="kpi-value">${formatNum(result.dailyFeedTotal, 3)} ${weightUnitStr}</div>
          <div class="kpi-sub">${isAr ? 'لكل القطيع' : 'Entire stock'}</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-title">${isAr ? 'حصة الرأس اليومية' : 'Per Unit Ration'}</div>
          <div class="kpi-value">${formatNum(result.dailyFeedPerUnit, 3)} ${weightUnitStr}</div>
          <div class="kpi-sub">${result.feedingFrequency} ${isAr ? 'وجبات/يوم' : 'meals/day'}</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-title">${isAr ? 'معامل التحويل (FCR)' : 'Feed Conversion (FCR)'}</div>
          <div class="kpi-value">${formatNum(result.fcr, 2)}</div>
          <div class="kpi-sub">${formatNum(result.feedConversionEfficiency, 1)}% ${isAr ? 'كفاءة' : 'Eff'}</div>
        </div>
      </div>

      <table>
        <tbody>
          <tr><td>${isAr ? 'النوع / الصنف' : 'Species'}</td><td><strong>${speciesName}</strong></td></tr>
          <tr><td>${isAr ? 'العدد الكلي' : 'Count'}</td><td>${input.count}</td></tr>
          <tr><td>${isAr ? 'متوسط الوزن' : 'Average Weight'}</td><td>${input.weight} ${weightUnitStr}</td></tr>
          <tr><td>${isAr ? 'تركيبة العلف' : 'Feed Formula'}</td><td>${feedName} (${feedType.protein}% Protein)</td></tr>
          <tr><td>${isAr ? 'مواعيد الوجبات' : 'Feeding Schedule'}</td><td>${result.feedingTimes.join(' | ')}</td></tr>
          <tr><td>${isAr ? 'كمية الوجبة الواحدة' : 'Amount Per Meal'}</td><td>${formatNum(result.feedPerMealTotal, 3)} ${weightUnitStr}</td></tr>
        </tbody>
      </table>

      <div style="margin-top: 20px; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 12px; display: flex; justify-content: space-between;">
        <div>FeedCalc Pro — ${isAr ? 'مطور تطبيقات وبرامج حر: زكريا بسيود ZAKARYA Bessioud (+213655870392)' : 'Freelance Developer ZAKARYA Bessioud'}</div>
        <div>${refCode} | ${dateFormatted}</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}
