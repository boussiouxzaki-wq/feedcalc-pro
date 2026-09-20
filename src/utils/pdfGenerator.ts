import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Species, FeedType, CalculationInput, CalculationResult, Language } from '../types';
import { formatNum } from './translations';

export interface PdfReportExportResult {
  success: boolean;
  method: 'direct_download' | 'opened_in_new_tab' | 'blob_ready';
  blobUrl: string;
  fileName: string;
}

interface ReportDictionary {
  dir: 'rtl' | 'ltr';
  fontFamily: string;
  brand: string;
  reportTitle: string;
  reportSubtitle: string;
  issuedAt: string;
  devLabel: string;
  devName: string;
  devPhone: string;
  devEmail: string;
  heroBadge: string;
  perDay: string;
  perUnitDaily: string;
  fcrLabel: string;
  efficiencyLabel: string;
  mealsLabel: string;
  mealsUnit: string;
  section1Title: string;
  section2Title: string;
  section3Title: string;
  colParameter: string;
  colValue: string;
  colDetails: string;
  speciesLabel: string;
  stockCountLabel: string;
  avgWeightLabel: string;
  biomassLabel: string;
  feedFormulaLabel: string;
  standardFormula: string;
  customFormula: string;
  fcrMetricLabel: string;
  fcrFormulaNote: string;
  totalDailyDemandLabel: string;
  singleUnitRationLabel: string;
  mealDistributionLabel: string;
  perMealAmountLabel: string;
  timingsLabel: string;
  nutritionalIntakeLabel: string;
  proteinUnit: string;
  energyUnit: string;
  estimatedCostLabel: string;
  dailyCostSuffix: string;
  monthlyCostSuffix: string;
  colNutrient: string;
  colNutrientVal: string;
  colBiologicalRole: string;
  crudeProtein: string;
  crudeProteinRole: string;
  metabolizableEnergy: string;
  metabolizableEnergyRole: string;
  crudeFat: string;
  crudeFatRole: string;
  crudeFiber: string;
  crudeFiberRole: string;
  moisture: string;
  moistureRole: string;
  mineralAsh: string;
  mineralAshRole: string;
  footerTagline: string;
  pageNumber: string;
}

const REPORT_I18N: Record<Language, ReportDictionary> = {
  ar: {
    dir: 'rtl',
    fontFamily: '"Segoe UI", Tahoma, Arial, "Noto Sans Arabic", sans-serif',
    brand: 'FeedCalc Pro',
    reportTitle: 'تقرير الحسابات الغذائية ومقننات العلف اليومية',
    reportSubtitle: 'وثيقة فنية حسابية رسمية معتمدة على معادلات معدل التحويل الغذائي القياسية (FCR)',
    issuedAt: 'تاريخ وتوقيت الإصدار:',
    devLabel: 'إعداد وتطوير المهندس:',
    devName: 'ZAKARYA Bessioud',
    devPhone: '+213655870392',
    devEmail: 'boussiouxzaki@gmail.com',
    heroBadge: 'إجمالي الحصة اليومية للقطيع بالكامل',
    perDay: 'يومياً',
    perUnitDaily: 'حصة الرأس اليومية:',
    fcrLabel: 'معامل التحويل (FCR):',
    efficiencyLabel: 'كفاءة التحويل:',
    mealsLabel: 'عدد الوجبات:',
    mealsUnit: 'وجبات/يوم',
    section1Title: '1. بيانات ومعايير القطيع / الحوض المائي',
    section2Title: '2. جدول المقننات الغذائية وتوزيع الحصص اليومية',
    section3Title: '3. التحليل الغذائي المعتمد لتركيبة العلف',
    colParameter: 'المعيار / البند',
    colValue: 'القيمة المحسوبة',
    colDetails: 'البيان الفني / الملاحظات',
    speciesLabel: 'نوع وصنف الحيوان',
    stockCountLabel: 'العدد الإجمالي للقطيع',
    avgWeightLabel: 'متوسط وزن الرأس / الوحدة',
    biomassLabel: 'إجمالي الكتلة الحية (Biomass)',
    feedFormulaLabel: 'تركيبة العلف المعتمدة',
    standardFormula: 'تركيبة قياسية',
    customFormula: 'تركيبة مخصصة',
    fcrMetricLabel: 'معامل التحويل الغذائي (FCR)',
    fcrFormulaNote: 'كجم علف مطلوب لإنتاج 1 كجم كتلة حية',
    totalDailyDemandLabel: 'إجمالي استهلاك المزرعة اليومي',
    singleUnitRationLabel: 'الحصة اليومية لكل رأس / وحدة',
    mealDistributionLabel: 'توزيع الوجبات اليومية',
    perMealAmountLabel: 'حصة الوجبة الواحدة للقطيع',
    timingsLabel: 'مواعيد التغذية الموصى بها',
    nutritionalIntakeLabel: 'المدخول الغذائي اليومي للقطيع',
    proteinUnit: 'كجم بروتين خام',
    energyUnit: 'ميجا كالوري طاقة استقلابية',
    estimatedCostLabel: 'التكلفة المالية التقديرية',
    dailyCostSuffix: 'يومياً',
    monthlyCostSuffix: 'شهرياً (تقدير 30 يوم)',
    colNutrient: 'العنصر الغذائي',
    colNutrientVal: 'النسبة / القيمة في العلف',
    colBiologicalRole: 'الوظيفة الحيوية والأهمية الإنتاجية',
    crudeProtein: 'البروتين الخام (Crude Protein)',
    crudeProteinRole: 'بناء الأنسجة والكتلة العضلية وتخليق الإنزيمات الحيوية',
    metabolizableEnergy: 'الطاقة الاستقلابية (ME)',
    metabolizableEnergyRole: 'تأمين طاقة الحركة والتمثيل الغذائي والتنظيم الحراري',
    crudeFat: 'الدهون والزيوت الخام (Fat / Lipids)',
    crudeFatRole: 'مصدر طاقة مركز وتوفير الأحماض الدهنية الأساسية والفيتامينات الذائبة',
    crudeFiber: 'الألياف الخام (Crude Fiber)',
    crudeFiberRole: 'تنشيط الحركة الدودية للأمعاء وتوازن بيئة الهضم والكرش',
    moisture: 'نسبة الرطوبة (Moisture)',
    moistureRole: 'حفظ واستقرار العلف وتحديد تركيز المادة الجافة الفعالة',
    mineralAsh: 'الرماد المعدني الكلي (Total Ash)',
    mineralAshRole: 'بناء الهيكل العظمي وضبط التوازن الشاردي والإلكتروليتي',
    footerTagline: 'FeedCalc Pro  |  نظام الحسابات الغذائية الذكي  |  المطور: ZAKARYA Bessioud (+213655870392)',
    pageNumber: 'صفحة 1 من 1',
  },
  en: {
    dir: 'ltr',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
    brand: 'FeedCalc Pro',
    reportTitle: 'Daily Feeding Allocation & Nutritional Calculation Report',
    reportSubtitle: 'Official technical calculation document based on Feed Conversion Ratio (FCR) standards',
    issuedAt: 'Issued on:',
    devLabel: 'Author & Lead Engineer:',
    devName: 'ZAKARYA Bessioud',
    devPhone: '+213655870392',
    devEmail: 'boussiouxzaki@gmail.com',
    heroBadge: 'TOTAL DAILY HERD FEED ALLOCATION',
    perDay: 'per day',
    perUnitDaily: 'Single Unit Daily Ration:',
    fcrLabel: 'Feed Conversion (FCR):',
    efficiencyLabel: 'Conversion Efficiency:',
    mealsLabel: 'Feeding Frequency:',
    mealsUnit: 'meals/day',
    section1Title: '1. Herd & Aquaculture Stock Parameters',
    section2Title: '2. Daily Feeding Allocation & Meal Schedule',
    section3Title: '3. Feed Nutritional Analysis (Guaranteed Profile)',
    colParameter: 'Parameter / Metric',
    colValue: 'Calculated Value',
    colDetails: 'Technical Description',
    speciesLabel: 'Species / Classification',
    stockCountLabel: 'Total Stock Population',
    avgWeightLabel: 'Average Unit Weight',
    biomassLabel: 'Total Live Biomass',
    feedFormulaLabel: 'Feed Formula & Profile',
    standardFormula: 'Standard Formula',
    customFormula: 'Custom Formula',
    fcrMetricLabel: 'Feed Conversion Ratio (FCR)',
    fcrFormulaNote: 'Feed mass needed per 1 kg live weight gain',
    totalDailyDemandLabel: 'Total Daily Herd Consumption',
    singleUnitRationLabel: 'Individual Unit Daily Ration',
    mealDistributionLabel: 'Daily Feeding Frequency',
    perMealAmountLabel: 'Herd Ration per Single Meal',
    timingsLabel: 'Recommended Feeding Times',
    nutritionalIntakeLabel: 'Daily Nutritional Ingestion',
    proteinUnit: 'kg crude protein',
    energyUnit: 'Mcal metabolizable energy',
    estimatedCostLabel: 'Estimated Feed Expense',
    dailyCostSuffix: 'daily',
    monthlyCostSuffix: 'monthly (30-day projection)',
    colNutrient: 'Nutrient / Component',
    colNutrientVal: 'Guaranteed Content',
    colBiologicalRole: 'Biological Function & Productivity Role',
    crudeProtein: 'Crude Protein (CP)',
    crudeProteinRole: 'Tissue accretion, muscle synthesis, and vital metabolic enzymes',
    metabolizableEnergy: 'Metabolizable Energy (ME)',
    metabolizableEnergyRole: 'Cellular metabolism, physical movement, and thermoregulation',
    crudeFat: 'Crude Fat / Lipids',
    crudeFatRole: 'Dense caloric source, essential fatty acids, and lipid-soluble vitamins',
    crudeFiber: 'Crude Fiber (CF)',
    crudeFiberRole: 'Gastrointestinal motility, rumen function, and digestive balance',
    moisture: 'Moisture Content',
    moistureRole: 'Storage shelf-stability and effective dry matter concentration',
    mineralAsh: 'Total Mineral Ash',
    mineralAshRole: 'Skeletal ossification and systemic electrolyte balance',
    footerTagline: 'FeedCalc Pro  |  Smart Nutrition System  |  Developer: ZAKARYA Bessioud (+213655870392)',
    pageNumber: 'Page 1 of 1',
  },
  fr: {
    dir: 'ltr',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
    brand: 'FeedCalc Pro',
    reportTitle: 'Rapport de Calcul Nutritionnel et Rations Quotidiennes',
    reportSubtitle: "Document officiel de calcul basé sur l'indice de consommation alimentaire (IC / FCR)",
    issuedAt: 'Date et heure :',
    devLabel: 'Ingénieur Concepteur :',
    devName: 'ZAKARYA Bessioud',
    devPhone: '+213655870392',
    devEmail: 'boussiouxzaki@gmail.com',
    heroBadge: 'ALLOCATION ALIMENTAIRE QUOTIDIENNE TOTALE DU CHEPTEL',
    perDay: 'par jour',
    perUnitDaily: 'Ration quotidienne par unité :',
    fcrLabel: 'Indice de Consommation (IC) :',
    efficiencyLabel: 'Efficacité de Conversion :',
    mealsLabel: 'Fréquence des Repas :',
    mealsUnit: 'repas/jour',
    section1Title: '1. Paramètres du Cheptel / Bassin Aquacole',
    section2Title: '2. Rations Alimentaires et Calendrier des Repas',
    section3Title: "3. Analyse Nutritionnelle de l'Aliment (Garantie)",
    colParameter: 'Paramètre / Indicateur',
    colValue: 'Valeur Calculée',
    colDetails: 'Spécifications Techniques',
    speciesLabel: 'Espèce / Catégorie',
    stockCountLabel: 'Effectif Total du Cheptel',
    avgWeightLabel: 'Poids Moyen Unitaire',
    biomassLabel: 'Biomasse Totale en Vif',
    feedFormulaLabel: "Formule d'Aliment Utilisée",
    standardFormula: 'Formule Standard',
    customFormula: 'Formule Personnalisée',
    fcrMetricLabel: 'Indice de Consommation (IC / FCR)',
    fcrFormulaNote: 'Aliment nécessaire pour 1 kg de gain de poids',
    totalDailyDemandLabel: 'Consommation Quotidienne Totale',
    singleUnitRationLabel: 'Ration Quotidienne par Sujet',
    mealDistributionLabel: 'Répartition des Repas',
    perMealAmountLabel: 'Quantité par Repas pour le Cheptel',
    timingsLabel: 'Horaires Recommandés',
    nutritionalIntakeLabel: 'Apports Nutritionnels Quotidiens',
    proteinUnit: 'kg de protéine brute',
    energyUnit: 'Mcal énergie métabolisable',
    estimatedCostLabel: 'Coût Estimé de l’Alimentation',
    dailyCostSuffix: 'par jour',
    monthlyCostSuffix: 'par mois (projection 30 jours)',
    colNutrient: 'Composant Nutritionnel',
    colNutrientVal: 'Teneur Garantie',
    colBiologicalRole: 'Rôle Métabolique et Zootechnique',
    crudeProtein: 'Protéine Brute (PB)',
    crudeProteinRole: 'Croissance tissulaire, masse musculaire et synthèse enzymatique',
    metabolizableEnergy: 'Énergie Métabolisable (EM)',
    metabolizableEnergyRole: 'Métabolisme basal, locomotion et thermorégulation',
    crudeFat: 'Matières Grasses Brutes',
    crudeFatRole: 'Énergie concentrée, acides gras essentiels et vitamines liposolubles',
    crudeFiber: 'Cellulose Brute (CB)',
    crudeFiberRole: 'Motricité digestive, rumination et équilibre du microbiote',
    moisture: 'Teneur en Eau / Humidité',
    moistureRole: 'Conservation, stabilité du stockage et matière sèche',
    mineralAsh: 'Cendres Brutes Totales',
    mineralAshRole: 'Minéralisation squelettique et homéostasie électrolytique',
    footerTagline: 'FeedCalc Pro  |  Calculateur Nutritionnel  |  Développeur : ZAKARYA Bessioud (+213655870392)',
    pageNumber: 'Page 1 sur 1',
  },
  es: {
    dir: 'ltr',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
    brand: 'FeedCalc Pro',
    reportTitle: 'Informe de Asignación y Cálculo Nutricional Diario',
    reportSubtitle: 'Documento técnico oficial basado en el índice de conversión alimenticia (FCR)',
    issuedAt: 'Fecha y hora de emisión:',
    devLabel: 'Ingeniero Desarrollador:',
    devName: 'ZAKARYA Bessioud',
    devPhone: '+213655870392',
    devEmail: 'boussiouxzaki@gmail.com',
    heroBadge: 'ASIGNACIÓN DIARIA TOTAL DE PIENSO DEL LOTE',
    perDay: 'por día',
    perUnitDaily: 'Ración Diaria Individual:',
    fcrLabel: 'Conversión (FCR):',
    efficiencyLabel: 'Eficiencia de Conversión:',
    mealsLabel: 'Frecuencia de Tomas:',
    mealsUnit: 'tomas/día',
    section1Title: '1. Parámetros del Lote y Población Ganadera/Acuícola',
    section2Title: '2. Raciones Diarias y Plan de Distribución',
    section3Title: '3. Análisis Nutricional del Pienso Utilizado',
    colParameter: 'Parámetro / Métrica',
    colValue: 'Valor Calculado',
    colDetails: 'Detalle Técnico',
    speciesLabel: 'Especie / Clasificación',
    stockCountLabel: 'Censo / Población Total',
    avgWeightLabel: 'Peso Medio por Unidad',
    biomassLabel: 'Biomasa Viva Total',
    feedFormulaLabel: 'Fórmula de Pienso',
    standardFormula: 'Fórmula Estándar',
    customFormula: 'Fórmula Personalizada',
    fcrMetricLabel: 'Índice de Conversión (FCR)',
    fcrFormulaNote: 'Alimento consumido por cada 1 kg de ganancia',
    totalDailyDemandLabel: 'Consumo Diario Total del Lote',
    singleUnitRationLabel: 'Ración Diaria por Animal / Unidad',
    mealDistributionLabel: 'Distribución de Tomas Diarias',
    perMealAmountLabel: 'Cantidad por Toma para el Lote',
    timingsLabel: 'Horarios de Alimentación Sugeridos',
    nutritionalIntakeLabel: 'Aporte Nutricional Diario Total',
    proteinUnit: 'kg de proteína bruta',
    energyUnit: 'Mcal de energía metabolizable',
    estimatedCostLabel: 'Coste Financiero Estimado',
    dailyCostSuffix: 'al día',
    monthlyCostSuffix: 'al mes (proyección 30 días)',
    colNutrient: 'Nutriente / Componente',
    colNutrientVal: 'Contenido Garantizado',
    colBiologicalRole: 'Función Biológica y Productiva',
    crudeProtein: 'Proteína Bruta (PB)',
    crudeProteinRole: 'Crecimiento de tejido muscular y síntesis enzimática',
    metabolizableEnergy: 'Energía Metabolizable (EM)',
    metabolizableEnergyRole: 'Mantenimiento, actividad y termorregulación',
    crudeFat: 'Grasa Bruta / Lípidos',
    crudeFatRole: 'Fuente energética densa, ácidos grasos esenciales y vitaminas',
    crudeFiber: 'Fibra Bruta (FB)',
    crudeFiberRole: 'Motilidad gastrointestinal y salud del microbioma',
    moisture: 'Contenido de Humedad',
    moistureRole: 'Estabilidad de almacenamiento y materia seca disponible',
    mineralAsh: 'Cenizas Totales',
    mineralAshRole: 'Estructura ósea y equilibrio electrolítico orgánico',
    footerTagline: 'FeedCalc Pro  |  Herramienta Nutricional  |  Desarrollador: ZAKARYA Bessioud (+213655870392)',
    pageNumber: 'Página 1 de 1',
  },
  de: {
    dir: 'ltr',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
    brand: 'FeedCalc Pro',
    reportTitle: 'Tagesfutter- und Nährwertberechnungsbericht',
    reportSubtitle: 'Offizielles Berechnungsdokument basierend auf dem Futterverwertungsquotienten (FCR)',
    issuedAt: 'Erstellungsdatum:',
    devLabel: 'Leitender Entwicklungsingenieur:',
    devName: 'ZAKARYA Bessioud',
    devPhone: '+213655870392',
    devEmail: 'boussiouxzaki@gmail.com',
    heroBadge: 'TÄGLICHE GESAMTFUTTERRATION DES BESTANDS',
    perDay: 'pro Tag',
    perUnitDaily: 'Tagesration Einzeltier:',
    fcrLabel: 'Futterverwertung (FCR):',
    efficiencyLabel: 'Verwertungseffizienz:',
    mealsLabel: 'Mahlzeitenhäufigkeit:',
    mealsUnit: 'Mahlzeiten/Tag',
    section1Title: '1. Bestands- und Parzellenparameter',
    section2Title: '2. Tägliche Rationen und Fütterungszeiten',
    section3Title: '3. Nährwertanalyse des Futters',
    colParameter: 'Parameter / Kennzahl',
    colValue: 'Berechneter Wert',
    colDetails: 'Technische Beschreibung',
    speciesLabel: 'Tierart / Klassifizierung',
    stockCountLabel: 'Gesamtbestand',
    avgWeightLabel: 'Durchschnittsgewicht',
    biomassLabel: 'Gesamte Lebendbiomasse',
    feedFormulaLabel: 'Verwendete Futterformel',
    standardFormula: 'Standardmischung',
    customFormula: 'Individuelle Mischung',
    fcrMetricLabel: 'Futterverwertung (FCR)',
    fcrFormulaNote: 'Futtermenge für 1 kg Gewichtszunahme',
    totalDailyDemandLabel: 'Gesamter Tagesverbrauch des Bestands',
    singleUnitRationLabel: 'Tagesration pro Einzeltier',
    mealDistributionLabel: 'Aufteilung der Tagesmahlzeiten',
    perMealAmountLabel: 'Menge pro Einzelfütterung',
    timingsLabel: 'Empfohlene Fütterungszeiten',
    nutritionalIntakeLabel: 'Tägliche Nährstoffaufnahme',
    proteinUnit: 'kg Rohprotein',
    energyUnit: 'Mcal Umsetzbare Energie',
    estimatedCostLabel: 'Geschätzte Futterkosten',
    dailyCostSuffix: 'pro Tag',
    monthlyCostSuffix: 'pro Monat (30 Tage Prognose)',
    colNutrient: 'Nährstoff / Komponente',
    colNutrientVal: 'Garantierter Gehalt',
    colBiologicalRole: 'Biologische Funktion & Nutzwert',
    crudeProtein: 'Rohprotein (XP)',
    crudeProteinRole: 'Gewebeaufbau, Muskelmasse und Proteinsynthese',
    metabolizableEnergy: 'Umsetzbare Energie (ME)',
    metabolizableEnergyRole: 'Zellstoffwechsel, Vitalität und Thermoregulation',
    crudeFat: 'Rohfett / Lipide',
    crudeFatRole: 'Konzentrierte Energiequelle und fettlösliche Vitamine',
    crudeFiber: 'Rohfaser (XF)',
    crudeFiberRole: 'Pansenfunktion, Darmperistaltik und Verdauungsgesundheit',
    moisture: 'Feuchtigkeitsgehalt',
    moistureRole: 'Lagerfähigkeit und Trockensubstanzkonzentration',
    mineralAsh: 'Rohasche (XA)',
    mineralAshRole: 'Skelettmineralisierung und Elektrolythaushalt',
    footerTagline: 'FeedCalc Pro  |  Präzisionsernährung  |  Entwickler: ZAKARYA Bessioud (+213655870392)',
    pageNumber: 'Seite 1 von 1',
  },
  zh: {
    dir: 'ltr',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
    brand: 'FeedCalc Pro',
    reportTitle: '每日饲料投喂配给与营养计算报告',
    reportSubtitle: '基于料肉比 (FCR) 科学养殖标准的官方数据测算技术报告',
    issuedAt: '报告生成时间:',
    devLabel: '系统研发工程师:',
    devName: 'ZAKARYA Bessioud',
    devPhone: '+213655870392',
    devEmail: 'boussiouxzaki@gmail.com',
    heroBadge: '全群每日投喂饲料总量',
    perDay: '每日',
    perUnitDaily: '单只/单尾日投喂量:',
    fcrLabel: '饲料转化比 (FCR):',
    efficiencyLabel: '转化效率:',
    mealsLabel: '每日投喂频次:',
    mealsUnit: '次/天',
    section1Title: '一、群体与养殖池塘基本参数',
    section2Title: '二、每日投喂定额与批次分配时间表',
    section3Title: '三、饲料营养成分分析保证值',
    colParameter: '指标参数',
    colValue: '测算数值',
    colDetails: '技术说明与备注',
    speciesLabel: '养殖品种 / 物种类别',
    stockCountLabel: '群体存栏总数量',
    avgWeightLabel: '单只 / 单尾平均体重',
    biomassLabel: '全群总生物量 (Biomass)',
    feedFormulaLabel: '选定投喂饲料配方',
    standardFormula: '标准生产配方',
    customFormula: '用户定制配方',
    fcrMetricLabel: '饲料转化率 (FCR)',
    fcrFormulaNote: '每增重1公斤所需消耗的饲料量',
    totalDailyDemandLabel: '全场全群日消耗总量',
    singleUnitRationLabel: '单只/单尾个体日配给量',
    mealDistributionLabel: '每日投喂批次分配',
    perMealAmountLabel: '全群单次投喂分配量',
    timingsLabel: '建议投喂定时安排',
    nutritionalIntakeLabel: '全群日摄入营养总额',
    proteinUnit: '公斤粗蛋白',
    energyUnit: '兆卡代谢能',
    estimatedCostLabel: '预估饲料成本支出',
    dailyCostSuffix: '每天',
    monthlyCostSuffix: '每月 (30天测算)',
    colNutrient: '营养组分',
    colNutrientVal: '保证含量分析值',
    colBiologicalRole: '生物学功能与生产学意义',
    crudeProtein: '粗蛋白质 (Crude Protein)',
    crudeProteinRole: '肌肉组织生长、体蛋白沉积与生化酶合成',
    metabolizableEnergy: '代谢能 (ME)',
    metabolizableEnergyRole: '维持基础代谢、游动运动与机体体温调节',
    crudeFat: '粗脂肪 (Crude Fat)',
    crudeFatRole: '高浓度能量贮备、必需脂肪酸与脂溶性维生素吸收',
    crudeFiber: '粗纤维 (Crude Fiber)',
    crudeFiberRole: '促进胃肠道蠕动、瘤胃发酵与消化道微生态平衡',
    moisture: '水分含量 (Moisture)',
    moistureRole: '饲料储存稳定性与有效干物质浓度保证',
    mineralAsh: '粗灰分 / 矿物质 (Ash)',
    mineralAshRole: '骨骼骨质矿化与体内渗透压电解质平衡',
    footerTagline: 'FeedCalc Pro  |  智能饲料营养计算系统  |  开发者: ZAKARYA Bessioud (+213655870392)',
    pageNumber: '第 1 页，共 1 页',
  },
};

function getLocalizedSpeciesName(species: Species, lang: Language): string {
  if (lang === 'ar') return species.name;
  if (lang === 'fr') return species.nameFr || species.nameEn || species.name;
  if (lang === 'es') return species.nameEs || species.nameEn || species.name;
  if (lang === 'zh') return species.nameZh || species.nameEn || species.name;
  if (lang === 'de') return species.nameDe || species.nameEn || species.name;
  return species.nameEn || species.name;
}

function getLocalizedSpeciesUnit(species: Species, lang: Language): string {
  if (lang === 'ar') return species.unit;
  if (lang === 'fr') return species.unitFr || species.unitEn || species.unit;
  if (lang === 'es') return species.unitEs || species.unitEn || species.unit;
  if (lang === 'zh') return species.unitZh || species.unitEn || species.unit;
  if (lang === 'de') return species.unitDe || species.unitEn || species.unit;
  return species.unitEn || species.unit;
}

function getLocalizedFeedName(feedType: FeedType, lang: Language): string {
  if (lang === 'ar') return feedType.name;
  if (lang === 'fr') return feedType.nameFr || feedType.nameEn || feedType.name;
  if (lang === 'es') return feedType.nameEs || feedType.nameEn || feedType.name;
  if (lang === 'zh') return feedType.nameZh || feedType.nameEn || feedType.name;
  if (lang === 'de') return (feedType as any).nameDe || feedType.nameEn || feedType.name;
  return feedType.nameEn || feedType.name;
}

export async function generatePdfReport(params: {
  species: Species;
  feedType: FeedType;
  input: CalculationInput;
  result: CalculationResult;
  lang: Language;
}): Promise<PdfReportExportResult> {
  const { species, feedType, input, result, lang } = params;
  const dict = REPORT_I18N[lang] || REPORT_I18N.ar;

  const speciesName = getLocalizedSpeciesName(species, lang);
  const speciesUnit = getLocalizedSpeciesUnit(species, lang);
  const feedName = getLocalizedFeedName(feedType, lang);

  const weightUnitStr = input.weightUnit === 'lb' ? 'lb' : 'kg';
  const smallWeightUnit = input.weightUnit === 'lb' ? 'oz' : 'g';
  const smallWeightVal = Math.round(result.dailyFeedPerUnit * (input.weightUnit === 'lb' ? 16 : 1000));
  const currencyCode = input.currency || 'USD';
  const totalBiomass = (Number(input.count) * Number(input.weight)).toFixed(1);

  const now = new Date();
  const dateFormatted = now.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeFormatted = now.toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Build the pure HTML element with strict inline CSS styles
  const reportEl = document.createElement('div');
  reportEl.id = 'print-rendered-pdf-container';
  reportEl.dir = dict.dir;
  reportEl.style.position = 'fixed';
  reportEl.style.top = '0';
  reportEl.style.left = '0';
  reportEl.style.zIndex = '-9999';
  reportEl.style.opacity = '1';
  reportEl.style.pointerEvents = 'none';
  reportEl.style.width = '794px'; // Standard A4 width at 96 DPI
  reportEl.style.backgroundColor = '#ffffff';
  reportEl.style.color = '#1f2937';
  reportEl.style.fontFamily = dict.fontFamily;
  reportEl.style.padding = '24px 28px';
  reportEl.style.boxSizing = 'border-box';
  reportEl.style.lineHeight = '1.45';

  reportEl.innerHTML = `
    <!-- Top Header Banner -->
    <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); border-radius: 10px; padding: 16px 20px; color: #ffffff; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.06);">
      <div>
        <div style="font-size: 24px; font-weight: 800; letter-spacing: -0.5px; line-height: 1.1;">
          ${dict.brand}
        </div>
        <div style="font-size: 14px; font-weight: 700; margin-top: 4px; color: #f0fdf4;">
          ${dict.reportTitle}
        </div>
        <div style="font-size: 10.5px; color: #d1fae5; margin-top: 2px;">
          ${dict.reportSubtitle}
        </div>
      </div>
      <div style="text-align: ${dict.dir === 'rtl' ? 'left' : 'right'}; font-size: 10px; color: #ecfdf5; border-left: ${dict.dir === 'rtl' ? 'none' : '1px solid rgba(255,255,255,0.2)'}; border-right: ${dict.dir === 'rtl' ? '1px solid rgba(255,255,255,0.2)' : 'none'}; padding-${dict.dir === 'rtl' ? 'right' : 'left'}: 14px;">
        <div style="font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.85;">${dict.issuedAt}</div>
        <div style="font-weight: 700; font-size: 11px; margin-top: 2px;">${dateFormatted}</div>
        <div style="font-size: 10px; opacity: 0.9;">${timeFormatted}</div>
      </div>
    </div>

    <!-- Developer & Engineering Attribution Bar -->
    <div style="margin-top: 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 7px; padding: 7px 14px; display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #475569;">
      <div>
        <span style="font-weight: 700; color: #1e293b;">${dict.devLabel}</span>
        <span style="font-weight: 600; color: #059669; margin: 0 4px;">${dict.devName}</span>
      </div>
      <div>
        <span style="margin: 0 6px;">📞 ${dict.devPhone}</span>
        <span style="margin: 0 6px;">✉️ ${dict.devEmail}</span>
      </div>
    </div>

    <!-- Hero Calculation Highlight Box -->
    <div style="margin-top: 12px; background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 10px; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <div style="font-size: 11px; font-weight: 800; color: #166534; letter-spacing: 0.5px;">
          ${dict.heroBadge}
        </div>
        <div style="font-size: 30px; font-weight: 900; color: #059669; line-height: 1.2; margin-top: 2px;">
          ${formatNum(result.dailyFeedTotal, 3)} <span style="font-size: 18px; font-weight: 700;">${weightUnitStr} / ${dict.perDay}</span>
        </div>
        <div style="font-size: 11px; color: #374151; margin-top: 3px; font-weight: 500;">
          ${dict.perUnitDaily} <strong style="color: #111827;">${formatNum(result.dailyFeedPerUnit, 4)} ${weightUnitStr}</strong> (~<strong>${formatNum(smallWeightVal, 0)} ${smallWeightUnit}</strong>)
        </div>
      </div>
      <div style="display: flex; gap: 12px; text-align: center;">
        <div style="background: #ffffff; border: 1px solid #bbf7d0; border-radius: 8px; padding: 8px 14px;">
          <div style="font-size: 9.5px; color: #64748b; font-weight: 600;">${dict.fcrLabel}</div>
          <div style="font-size: 16px; font-weight: 800; color: #047857; margin-top: 2px;">${formatNum(result.fcr, 2)}</div>
        </div>
        <div style="background: #ffffff; border: 1px solid #bbf7d0; border-radius: 8px; padding: 8px 14px;">
          <div style="font-size: 9.5px; color: #64748b; font-weight: 600;">${dict.efficiencyLabel}</div>
          <div style="font-size: 16px; font-weight: 800; color: #047857; margin-top: 2px;">${formatNum(result.feedConversionEfficiency, 1)}%</div>
        </div>
        <div style="background: #ffffff; border: 1px solid #bbf7d0; border-radius: 8px; padding: 8px 14px;">
          <div style="font-size: 9.5px; color: #64748b; font-weight: 600;">${dict.mealsLabel}</div>
          <div style="font-size: 16px; font-weight: 800; color: #047857; margin-top: 2px;">${result.feedingFrequency} ${dict.mealsUnit}</div>
        </div>
      </div>
    </div>

    <!-- Section 1: Lot & Stock Parameters Table -->
    <div style="margin-top: 14px;">
      <div style="font-size: 12px; font-weight: 800; color: #0f766e; margin-bottom: 6px;">
        ${dict.section1Title}
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 10.5px; text-align: ${dict.dir === 'rtl' ? 'right' : 'left'};">
        <thead>
          <tr style="background: #047857; color: #ffffff;">
            <th style="padding: 6px 10px; border: 1px solid #047857; width: 30%; font-weight: 700;">${dict.colParameter}</th>
            <th style="padding: 6px 10px; border: 1px solid #047857; width: 30%; font-weight: 700;">${dict.colValue}</th>
            <th style="padding: 6px 10px; border: 1px solid #047857; width: 40%; font-weight: 700;">${dict.colDetails}</th>
          </tr>
        </thead>
        <tbody>
          <tr style="background: #ffffff;">
            <td style="padding: 6px 10px; border: 1px solid #e5e7eb; font-weight: 600;">${dict.speciesLabel}</td>
            <td style="padding: 6px 10px; border: 1px solid #e5e7eb; font-weight: 700; color: #047857;">${speciesName}</td>
            <td style="padding: 6px 10px; border: 1px solid #e5e7eb; color: #4b5563;">${species.category === 'aquatic' ? 'Aquaculture' : 'Livestock / Poultry'}</td>
          </tr>
          <tr style="background: #f9fafb;">
            <td style="padding: 6px 10px; border: 1px solid #e5e7eb; font-weight: 600;">${dict.stockCountLabel}</td>
            <td style="padding: 6px 10px; border: 1px solid #e5e7eb; font-weight: 700;">${formatNum(Number(input.count), 0)} ${speciesUnit}</td>
            <td style="padding: 6px 10px; border: 1px solid #e5e7eb; color: #4b5563;">Total Population</td>
          </tr>
          <tr style="background: #ffffff;">
            <td style="padding: 6px 10px; border: 1px solid #e5e7eb; font-weight: 600;">${dict.avgWeightLabel}</td>
            <td style="padding: 6px 10px; border: 1px solid #e5e7eb; font-weight: 700;">${formatNum(Number(input.weight), 2)} ${weightUnitStr}</td>
            <td style="padding: 6px 10px; border: 1px solid #e5e7eb; color: #4b5563;">Live Unit Weight</td>
          </tr>
          <tr style="background: #f9fafb;">
            <td style="padding: 6px 10px; border: 1px solid #e5e7eb; font-weight: 600;">${dict.biomassLabel}</td>
            <td style="padding: 6px 10px; border: 1px solid #e5e7eb; font-weight: 700; color: #047857;">${formatNum(Number(totalBiomass), 1)} ${weightUnitStr}</td>
            <td style="padding: 6px 10px; border: 1px solid #e5e7eb; color: #4b5563;">Total Herd / Pond Biomass</td>
          </tr>
          <tr style="background: #ffffff;">
            <td style="padding: 6px 10px; border: 1px solid #e5e7eb; font-weight: 600;">${dict.feedFormulaLabel}</td>
            <td style="padding: 6px 10px; border: 1px solid #e5e7eb; font-weight: 700;">${feedName}</td>
            <td style="padding: 6px 10px; border: 1px solid #e5e7eb; color: #4b5563;">${feedType.isCustom ? dict.customFormula : dict.standardFormula} (${feedType.protein}% CP / ${feedType.energy} kcal)</td>
          </tr>
          <tr style="background: #f9fafb;">
            <td style="padding: 6px 10px; border: 1px solid #e5e7eb; font-weight: 600;">${dict.fcrMetricLabel}</td>
            <td style="padding: 6px 10px; border: 1px solid #e5e7eb; font-weight: 800; color: #059669;">${formatNum(result.fcr, 2)}</td>
            <td style="padding: 6px 10px; border: 1px solid #e5e7eb; color: #4b5563;">${dict.fcrFormulaNote}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Section 2: Daily Allocation & Schedule Table -->
    <div style="margin-top: 14px;">
      <div style="font-size: 12px; font-weight: 800; color: #0f766e; margin-bottom: 6px;">
        ${dict.section2Title}
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 10.5px; text-align: ${dict.dir === 'rtl' ? 'right' : 'left'};">
        <thead>
          <tr style="background: #047857; color: #ffffff;">
            <th style="padding: 6px 10px; border: 1px solid #047857; width: 30%; font-weight: 700;">${dict.colParameter}</th>
            <th style="padding: 6px 10px; border: 1px solid #047857; width: 30%; font-weight: 700;">${dict.colValue}</th>
            <th style="padding: 6px 10px; border: 1px solid #047857; width: 40%; font-weight: 700;">${dict.colDetails}</th>
          </tr>
        </thead>
        <tbody>
          <tr style="background: #ffffff;">
            <td style="padding: 6px 10px; border: 1px solid #e5e7eb; font-weight: 600;">${dict.totalDailyDemandLabel}</td>
            <td style="padding: 6px 10px; border: 1px solid #e5e7eb; font-weight: 800; color: #059669;">${formatNum(result.dailyFeedTotal, 3)} ${weightUnitStr}</td>
            <td style="padding: 6px 10px; border: 1px solid #e5e7eb; color: #4b5563;">Full Farm Daily Consumption</td>
          </tr>
          <tr style="background: #f9fafb;">
            <td style="padding: 6px 10px; border: 1px solid #e5e7eb; font-weight: 600;">${dict.singleUnitRationLabel}</td>
            <td style="padding: 6px 10px; border: 1px solid #e5e7eb; font-weight: 700;">${formatNum(result.dailyFeedPerUnit, 4)} ${weightUnitStr}</td>
            <td style="padding: 6px 10px; border: 1px solid #e5e7eb; color: #4b5563;">~${formatNum(smallWeightVal, 0)} ${smallWeightUnit} / unit / day</td>
          </tr>
          <tr style="background: #ffffff;">
            <td style="padding: 6px 10px; border: 1px solid #e5e7eb; font-weight: 600;">${dict.mealDistributionLabel}</td>
            <td style="padding: 6px 10px; border: 1px solid #e5e7eb; font-weight: 700;">${result.feedingFrequency} ${dict.mealsUnit}</td>
            <td style="padding: 6px 10px; border: 1px solid #e5e7eb; color: #4b5563;">${dict.perMealAmountLabel}: <strong>${formatNum(result.feedPerMealTotal, 2)} ${weightUnitStr}</strong></td>
          </tr>
          <tr style="background: #f9fafb;">
            <td style="padding: 6px 10px; border: 1px solid #e5e7eb; font-weight: 600;">${dict.timingsLabel}</td>
            <td style="padding: 6px 10px; border: 1px solid #e5e7eb; font-weight: 700; color: #0f766e;" colspan="2">
              ${result.feedingTimes.join('   •   ')}
            </td>
          </tr>
          <tr style="background: #ffffff;">
            <td style="padding: 6px 10px; border: 1px solid #e5e7eb; font-weight: 600;">${dict.nutritionalIntakeLabel}</td>
            <td style="padding: 6px 10px; border: 1px solid #e5e7eb; font-weight: 700;" colspan="2">
              ${formatNum(result.dailyProtein, 2)} ${dict.proteinUnit}   |   ${formatNum(result.dailyEnergy, 2)} ${dict.energyUnit}
            </td>
          </tr>
          ${
            result.dailyCost
              ? `
          <tr style="background: #ecfdf5;">
            <td style="padding: 6px 10px; border: 1px solid #bbf7d0; font-weight: 700; color: #166534;">${dict.estimatedCostLabel}</td>
            <td style="padding: 6px 10px; border: 1px solid #bbf7d0; font-weight: 800; color: #047857;">${currencyCode} ${formatNum(result.dailyCost, 2)} ${dict.dailyCostSuffix}</td>
            <td style="padding: 6px 10px; border: 1px solid #bbf7d0; color: #15803d; font-weight: 600;">
              ${result.monthlyCost ? `${currencyCode} ${formatNum(result.monthlyCost, 2)} ${dict.monthlyCostSuffix}` : ''}
            </td>
          </tr>`
              : ''
          }
        </tbody>
      </table>
    </div>

    <!-- Section 3: Feed Nutritional Analysis Table -->
    <div style="margin-top: 14px;">
      <div style="font-size: 12px; font-weight: 800; color: #0f766e; margin-bottom: 6px;">
        ${dict.section3Title}
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 10.5px; text-align: ${dict.dir === 'rtl' ? 'right' : 'left'};">
        <thead>
          <tr style="background: #047857; color: #ffffff;">
            <th style="padding: 6px 10px; border: 1px solid #047857; width: 30%; font-weight: 700;">${dict.colNutrient}</th>
            <th style="padding: 6px 10px; border: 1px solid #047857; width: 25%; font-weight: 700;">${dict.colNutrientVal}</th>
            <th style="padding: 6px 10px; border: 1px solid #047857; width: 45%; font-weight: 700;">${dict.colBiologicalRole}</th>
          </tr>
        </thead>
        <tbody>
          <tr style="background: #ffffff;">
            <td style="padding: 5px 10px; border: 1px solid #e5e7eb; font-weight: 600;">${dict.crudeProtein}</td>
            <td style="padding: 5px 10px; border: 1px solid #e5e7eb; font-weight: 700; color: #047857;">${feedType.protein}%</td>
            <td style="padding: 5px 10px; border: 1px solid #e5e7eb; color: #4b5563;">${dict.crudeProteinRole}</td>
          </tr>
          <tr style="background: #f9fafb;">
            <td style="padding: 5px 10px; border: 1px solid #e5e7eb; font-weight: 600;">${dict.metabolizableEnergy}</td>
            <td style="padding: 5px 10px; border: 1px solid #e5e7eb; font-weight: 700; color: #047857;">${feedType.energy} kcal/kg</td>
            <td style="padding: 5px 10px; border: 1px solid #e5e7eb; color: #4b5563;">${dict.metabolizableEnergyRole}</td>
          </tr>
          ${
            feedType.fat !== undefined
              ? `
          <tr style="background: #ffffff;">
            <td style="padding: 5px 10px; border: 1px solid #e5e7eb; font-weight: 600;">${dict.crudeFat}</td>
            <td style="padding: 5px 10px; border: 1px solid #e5e7eb; font-weight: 700; color: #047857;">${feedType.fat}%</td>
            <td style="padding: 5px 10px; border: 1px solid #e5e7eb; color: #4b5563;">${dict.crudeFatRole}</td>
          </tr>`
              : ''
          }
          <tr style="background: ${feedType.fat !== undefined ? '#f9fafb' : '#ffffff'};">
            <td style="padding: 5px 10px; border: 1px solid #e5e7eb; font-weight: 600;">${dict.crudeFiber}</td>
            <td style="padding: 5px 10px; border: 1px solid #e5e7eb; font-weight: 700;">${feedType.fiber}%</td>
            <td style="padding: 5px 10px; border: 1px solid #e5e7eb; color: #4b5563;">${dict.crudeFiberRole}</td>
          </tr>
          <tr style="background: ${feedType.fat !== undefined ? '#ffffff' : '#f9fafb'};">
            <td style="padding: 5px 10px; border: 1px solid #e5e7eb; font-weight: 600;">${dict.moisture}</td>
            <td style="padding: 5px 10px; border: 1px solid #e5e7eb; font-weight: 700;">${feedType.moisture}%</td>
            <td style="padding: 5px 10px; border: 1px solid #e5e7eb; color: #4b5563;">${dict.moistureRole}</td>
          </tr>
          <tr style="background: ${feedType.fat !== undefined ? '#f9fafb' : '#ffffff'};">
            <td style="padding: 5px 10px; border: 1px solid #e5e7eb; font-weight: 600;">${dict.mineralAsh}</td>
            <td style="padding: 5px 10px; border: 1px solid #e5e7eb; font-weight: 700;">${feedType.ash}%</td>
            <td style="padding: 5px 10px; border: 1px solid #e5e7eb; color: #4b5563;">${dict.mineralAshRole}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Bottom Footer Bar -->
    <div style="margin-top: 18px; padding-top: 10px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; font-size: 9.5px; color: #64748b;">
      <div>
        ${dict.footerTagline}
      </div>
      <div>
        ${dict.pageNumber}
      </div>
    </div>
  `;

  document.body.appendChild(reportEl);

  try {
    // Render using html2canvas with 2x resolution for crystal-clear text
    const canvas = await html2canvas(reportEl, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
      windowWidth: 794,
    });

    // Clean up temporary DOM element
    try {
      document.body.removeChild(reportEl);
    } catch {}

    // Create jsPDF A4 document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const imgData = canvas.toDataURL('image/jpeg', 0.96);
    const imgHeight = (canvas.height * pageWidth) / canvas.width;

    // Draw the high-res crisp image fitting perfectly onto the A4 page
    doc.addImage(imgData, 'JPEG', 0, 0, pageWidth, Math.min(imgHeight, pageHeight));

    // Generate clean filename
    const cleanSpecies = species.id.replace(/[^a-zA-Z0-9_-]/g, '_');
    const dateStr = now.toISOString().slice(0, 10);
    const fileName = `FeedCalc_Report_${cleanSpecies}_${lang}_${dateStr}.pdf`;

    const blob = doc.output('blob');
    const blobUrl = URL.createObjectURL(blob);

    let method: 'direct_download' | 'opened_in_new_tab' | 'blob_ready' = 'direct_download';

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
    } catch (err) {
      console.warn('Direct file download link click blocked, trying tab open:', err);
      try {
        const newTab = window.open(blobUrl, '_blank');
        if (newTab) {
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
  } catch (err) {
    // If html2canvas fails, remove element and rethrow
    try {
      if (document.body.contains(reportEl)) {
        document.body.removeChild(reportEl);
      }
    } catch {}
    throw err;
  }
}
