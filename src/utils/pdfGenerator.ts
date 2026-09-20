import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Species, FeedType, CalculationInput, CalculationResult, Language } from '../types';
import { TRANSLATIONS, formatNum } from './translations';

export interface PdfReportExportResult {
  success: boolean;
  method: 'direct_download' | 'opened_in_new_tab' | 'blob_ready';
  blobUrl: string;
  fileName: string;
}

export async function generatePdfReport(params: {
  species: Species;
  feedType: FeedType;
  input: CalculationInput;
  result: CalculationResult;
  lang: Language;
}): Promise<PdfReportExportResult> {
  const { species, feedType, input, result, lang } = params;
  const t = TRANSLATIONS[lang];
  const currencyCode = input.currency || 'USD';
  const weightUnitStr = input.weightUnit === 'lb' ? 'lb' : 'kg';

  // Initialize jsPDF document (A4 format, portrait)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Visual header banner with brand color
  doc.setFillColor(16, 149, 106); // Emerald 600
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Accent thin line
  doc.setFillColor(5, 122, 85); // Emerald 700
  doc.rect(0, 28, pageWidth, 1.5, 'F');

  // Title in Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('FeedCalc Pro', margin, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(230, 250, 240);
  doc.text('Smart Nutrition & Daily Feeding Calculation Report', margin, 18);
  doc.text(
    `Generated: ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`,
    pageWidth - margin,
    18,
    { align: 'right' }
  );

  // Subheader - Developer & Attribution bar
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(margin, 34, pageWidth - margin * 2, 13, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(31, 41, 55);
  doc.text(`Author / Developer: ${t.devName}`, margin + 4, 40);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  doc.text(`Phone: ${t.devPhone}  |  Email: boussiouxzaki@gmail.com`, pageWidth - margin - 4, 40, { align: 'right' });

  // Key Results Highlight Box (Big Total Daily Feed)
  doc.setFillColor(236, 253, 245); // Emerald 50
  doc.setDrawColor(167, 243, 208); // Emerald 200
  doc.setLineWidth(0.6);
  doc.roundedRect(margin, 51, pageWidth - margin * 2, 32, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(6, 95, 70); // Emerald 800
  doc.text('TOTAL DAILY FEED ALLOCATION', margin + 6, 58);

  doc.setFontSize(24);
  doc.setTextColor(5, 150, 105); // Emerald 600
  const feedNum = formatNum(result.dailyFeedTotal, 3);
  doc.text(`${feedNum} ${weightUnitStr} / day`, margin + 6, 70);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(55, 65, 81);
  const perUnitGrams = Math.round(result.dailyFeedPerUnit * (input.weightUnit === 'lb' ? 16 : 1000));
  doc.text(
    `Per Unit: ${formatNum(result.dailyFeedPerUnit, 4)} ${weightUnitStr}/day (~${formatNum(perUnitGrams, 0)} ${input.weightUnit === 'lb' ? 'oz' : 'g'}/unit/day)`,
    margin + 6,
    76
  );

  // Right side highlights in banner box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(31, 41, 55);
  doc.text(`FCR: ${result.fcr.toFixed(2)}`, pageWidth - margin - 6, 58, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Efficiency: ${result.feedConversionEfficiency.toFixed(1)}%`, pageWidth - margin - 6, 64, { align: 'right' });
  doc.text(`Daily Protein: ${result.dailyProtein.toFixed(2)} ${weightUnitStr}`, pageWidth - margin - 6, 70, { align: 'right' });
  doc.text(`Daily Energy: ${result.dailyEnergy.toFixed(2)} Mcal`, pageWidth - margin - 6, 76, { align: 'right' });

  // Table 1: Lot & Animal Profile
  autoTable(doc, {
    startY: 88,
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: {
      fillColor: [16, 149, 106],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [31, 41, 55],
      cellPadding: 2.2,
    },
    head: [['Parameter', 'Value', 'Details / Biological Context']],
    body: [
      [
        'Species',
        species.nameEn || species.id,
        `${species.category === 'aquatic' ? 'Aquaculture' : 'Livestock / Poultry'} (${species.nameEn || species.id})`,
      ],
      [
        'Herd / Stock Count',
        `${formatNum(Number(input.count), 0)} ${species.unitEn || 'heads'}`,
        'Total live stock population',
      ],
      [
        'Average Unit Weight',
        `${formatNum(Number(input.weight), 3)} ${weightUnitStr}`,
        `Estimated biomass: ${formatNum(Number(input.count) * Number(input.weight), 2)} ${weightUnitStr}`,
      ],
      [
        'Feed Formula',
        feedType.nameEn || feedType.name || 'Standard Formula',
        `Protein: ${feedType.protein}% | Energy: ${feedType.energy} kcal/kg ${feedType.isCustom ? '(Custom Formula)' : '(Standard Formula)'}`,
      ],
      [
        'Feed Conversion Ratio (FCR)',
        `${result.fcr.toFixed(2)}:1`,
        `${input.useCustomFcr ? 'Custom configured value' : 'Standard scientific guideline'}`,
      ],
    ],
  });

  // Table 2: Feeding Schedule & Rationing
  const finalY1 = (doc as any).lastAutoTable?.finalY || 135;

  autoTable(doc, {
    startY: finalY1 + 6,
    margin: { left: margin, right: margin },
    theme: 'striped',
    headStyles: {
      fillColor: [55, 65, 81], // Slate 700
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [31, 41, 55],
      cellPadding: 2.2,
    },
    head: [['Ration Metric', 'Daily Total', 'Per Meal / Unit']],
    body: [
      [
        'Total Feed Requirement',
        `${formatNum(result.dailyFeedTotal, 3)} ${weightUnitStr}/day`,
        `${formatNum(result.dailyFeedPerUnit, 4)} ${weightUnitStr} / animal (~${formatNum(perUnitGrams, 0)} ${input.weightUnit === 'lb' ? 'oz' : 'g'})`,
      ],
      [
        'Meal Distribution',
        `${result.feedingFrequency} meals / day`,
        `${formatNum(result.feedPerMealTotal, 3)} ${weightUnitStr} per meal for all animals`,
      ],
      [
        'Recommended Timings',
        result.feedingTimes.join('  -  '),
        'Balanced intervals for optimal digestion & conversion',
      ],
      [
        'Nutritional Intake',
        `${result.dailyProtein.toFixed(2)} kg crude protein`,
        `${result.dailyEnergy.toFixed(2)} Mcal metabolizable energy`,
      ],
      ...(result.dailyCost
        ? [
            [
              'Estimated Cost',
              `${currencyCode} ${result.dailyCost.toFixed(2)} daily`,
              `${result.monthlyCost ? `${currencyCode} ${result.monthlyCost.toFixed(2)}` : '-'} monthly (30-day projection)`,
            ],
          ]
        : []),
    ],
  });

  // Table 3: Feed Nutritional Analysis
  const finalY2 = (doc as any).lastAutoTable?.finalY || 185;

  autoTable(doc, {
    startY: finalY2 + 6,
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: {
      fillColor: [4, 120, 87], // Emerald 700
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [31, 41, 55],
      cellPadding: 2.2,
    },
    head: [['Nutrient / Component', feedType.isCustom ? 'Configured Value (Custom)' : 'Standard Value', 'Nutritional Role']],
    body: [
      ['Crude Protein', `${feedType.protein}%`, 'Tissue growth, enzyme synthesis, mass buildup'],
      ['Metabolizable Energy', `${feedType.energy} kcal/kg`, 'Metabolism, movement, thermoregulation'],
      ...(feedType.fat !== undefined
        ? [['Crude Fat / Lipids', `${feedType.fat}%`, 'Essential fatty acids, dense energy, fat-soluble vitamins']]
        : []),
      ['Crude Fiber', `${feedType.fiber}%`, 'Gut health, peristalsis, digestive tract balance'],
      ['Moisture Content', `${feedType.moisture}%`, 'Shelf stability, storage safety, dry matter concentration'],
      ['Total Mineral Ash', `${feedType.ash}%`, 'Skeletal mineralization, metabolic and electrolyte balance'],
    ],
  });

  // Footer bar on page
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.4);
  doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(156, 163, 175);
  doc.text(
    `FeedCalc Pro  |  Sole Developer: ${t.devName} (${t.devPhone})  |  Official Calculation Report`,
    margin,
    pageHeight - 7
  );
  doc.text('Page 1 of 1', pageWidth - margin, pageHeight - 7, { align: 'right' });

  // Generate clean ASCII filename
  const cleanSpeciesId = (species.nameEn || species.id).replace(/[^a-zA-Z0-9_-]/g, '_');
  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = `FeedCalc_Report_${cleanSpeciesId}_${dateStr}.pdf`;

  // Output as Blob
  const blob = doc.output('blob');
  const blobUrl = URL.createObjectURL(blob);

  let method: 'direct_download' | 'opened_in_new_tab' | 'blob_ready' = 'direct_download';

  // Strategy 1: Programmatic link click
  try {
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      try {
        document.body.removeChild(link);
      } catch {}
    }, 500);
  } catch (downloadErr) {
    console.warn('Direct file download link click failed, trying window.open fallback:', downloadErr);
    try {
      const newWin = window.open(blobUrl, '_blank');
      if (newWin) {
        method = 'opened_in_new_tab';
      } else {
        method = 'blob_ready';
      }
    } catch {
      method = 'blob_ready';
    }
  }

  return {
    success: true,
    method,
    blobUrl,
    fileName,
  };
}
