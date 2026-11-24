import { Species, FeedType, CalculationInput, CalculationResult, Language } from '../types';
import { normalizeDigits } from './translations';

export function getFeedingSchedule(species: Species, lang: Language = 'ar'): {
  feedingFrequency: number;
  feedingTimes: string[];
} {
  if (species.id === 'honeybee') {
    const times: Record<Language, string[]> = {
      ar: ['المساء قبل الغروب (17:30 - منعاً للسرقة بين الخلايا)'],
      en: ['Late Afternoon / Sunset (5:30 PM - prevents robbing)'],
      fr: ['Fin d\'après-midi (17:30 - évite le pillage)'],
      es: ['Tarde / Puesta de sol (17:30 - evita el pillaje)'],
      de: ['Spätnachmittag vor Sonnenuntergang (17:30 - Räuberei vorbeugen)'],
      zh: ['傍晚日落前 (17:30 - 避免盗蜂发生)'],
    };
    return {
      feedingFrequency: 1,
      feedingTimes: times[lang] || times.en,
    };
  }

  if (species.category === 'aquatic') {
    if (species.id === 'seabass') {
      const times: Record<Language, string[]> = {
        ar: ['الصباح (7:00)', 'المساء (17:00)'],
        en: ['Morning (7:00 AM)', 'Evening (5:00 PM)'],
        fr: ['Matin (07:00)', 'Soir (17:00)'],
        es: ['Mañana (07:00)', 'Tarde (17:00)'],
        de: ['Morgens (07:00)', 'Abends (17:00)'],
        zh: ['早晨 (07:00)', '傍晚 (17:00)'],
      };
      return {
        feedingFrequency: 2,
        feedingTimes: times[lang] || times.en,
      };
    }
    const times: Record<Language, string[]> = {
      ar: ['الصباح (7:00)', 'الظهيرة (12:00)', 'المساء (17:00)'],
      en: ['Morning (7:00 AM)', 'Noon (12:00 PM)', 'Evening (5:00 PM)'],
      fr: ['Matin (07:00)', 'Midi (12:00)', 'Soir (17:00)'],
      es: ['Mañana (07:00)', 'Mediodía (12:00)', 'Tarde (17:00)'],
      de: ['Morgens (07:00)', 'Mittags (12:00)', 'Abends (17:00)'],
      zh: ['早晨 (07:00)', '中午 (12:00)', '傍晚 (17:00)'],
    };
    return {
      feedingFrequency: 3,
      feedingTimes: times[lang] || times.en,
    };
  }

  if (species.id === 'broiler') {
    const times: Record<Language, string[]> = {
      ar: ['الصباح (6:00)', 'الظهيرة (11:00)', 'العصر (15:00)', 'المساء (19:00)'],
      en: ['Morning (6:00 AM)', 'Midday (11:00 AM)', 'Afternoon (3:00 PM)', 'Evening (7:00 PM)'],
      fr: ['Matin (06:00)', 'Midi (11:00)', 'Après-midi (15:00)', 'Soir (19:00)'],
      es: ['Mañana (06:00)', 'Mediodía (11:00)', 'Tarde (15:00)', 'Noche (19:00)'],
      de: ['Morgens (06:00)', 'Vormittags (11:00)', 'Nachmittags (15:00)', 'Abends (19:00)'],
      zh: ['清晨 (06:00)', '上午 (11:00)', '下午 (15:00)', '傍晚 (19:00)'],
    };
    return {
      feedingFrequency: 4,
      feedingTimes: times[lang] || times.en,
    };
  }

  if (species.id === 'swine') {
    const times: Record<Language, string[]> = {
      ar: ['الصباح (7:00)', 'الظهيرة (12:30)', 'المساء (18:00)'],
      en: ['Morning (7:00 AM)', 'Midday (12:30 PM)', 'Evening (6:00 PM)'],
      fr: ['Matin (07:00)', 'Midi (12:30)', 'Soir (18:00)'],
      es: ['Mañana (07:00)', 'Mediodía (12:30)', 'Tarde (18:00)'],
      de: ['Morgens (07:00)', 'Mittags (12:30)', 'Abends (18:00)'],
      zh: ['早晨 (07:00)', '中午 (12:30)', '傍晚 (18:00)'],
    };
    return {
      feedingFrequency: 3,
      feedingTimes: times[lang] || times.en,
    };
  }

  if (species.id === 'dairy_goat') {
    const times: Record<Language, string[]> = {
      ar: ['الصباح مع الحلب (6:00)', 'الظهيرة (12:30)', 'المساء بعد الحلب (18:30)'],
      en: ['Morning Milking (6:00 AM)', 'Midday (12:30 PM)', 'Evening Milking (6:30 PM)'],
      fr: ['Matin à la traite (06:00)', 'Midi (12:30)', 'Soir après la traite (18:30)'],
      es: ['Mañana con el ordeño (06:00)', 'Mediodía (12:30)', 'Tarde tras el ordeño (18:30)'],
      de: ['Morgens beim Melken (06:00)', 'Mittags (12:30)', 'Abends nach dem Melken (18:30)'],
      zh: ['晨间挤奶配合饲喂 (06:00)', '中午加饲 (12:30)', '傍晚挤奶后饲喂 (18:30)'],
    };
    return {
      feedingFrequency: 3,
      feedingTimes: times[lang] || times.en,
    };
  }

  if (species.id === 'camel') {
    const times: Record<Language, string[]> = {
      ar: ['الصباح الباكر بعد الشروق (6:30)', 'العصر قبل الغروب (17:30)'],
      en: ['Early Morning (6:30 AM)', 'Late Afternoon / Sunset (5:30 PM)'],
      fr: ['Tôt le matin (06:30)', 'Fin d\'après-midi (17:30)'],
      es: ['Temprano en la mañana (06:30)', 'Tarde antes del anochecer (17:30)'],
      de: ['Frühmorgens nach Sonnenaufgang (06:30)', 'Spätnachmittags (17:30)'],
      zh: ['清晨日出后 (06:30)', '傍晚日落前 (17:30)'],
    };
    return {
      feedingFrequency: 2,
      feedingTimes: times[lang] || times.en,
    };
  }

  if (species.id === 'dairy_cow') {
    const times: Record<Language, string[]> = {
      ar: ['الصباح (5:00)', 'الظهيرة (12:00)', 'المساء (18:00)'],
      en: ['Morning (5:00 AM)', 'Noon (12:00 PM)', 'Evening (6:00 PM)'],
      fr: ['Matin (05:00)', 'Midi (12:00)', 'Soir (18:00)'],
      es: ['Mañana (05:00)', 'Mediodía (12:00)', 'Tarde (18:00)'],
      de: ['Morgens (05:00)', 'Mittags (12:00)', 'Abends (18:00)'],
      zh: ['清晨 (05:00)', '中午 (12:00)', '傍晚 (18:00)'],
    };
    return {
      feedingFrequency: 3,
      feedingTimes: times[lang] || times.en,
    };
  }

  if (species.id === 'mushroom') {
    const times: Record<Language, string[]> = {
      ar: ['الصباح: ترطيب وتهوية (07:00)', 'الظهيرة: فحص رطوبة 85-92% وCO₂ (13:00)', 'المساء: رذاذ مائي ناعم وإغلاق الإضاءة (19:00)'],
      en: ['Morning Misting & Fresh Air (7:00 AM)', 'Midday 85-92% RH & CO₂ Check (1:00 PM)', 'Evening Mist & Cycle Check (7:00 PM)'],
      fr: ['Matin : Brumisation & Aération (07:00)', 'Midi : Contrôle HR 85-92% & CO₂ (13:00)', 'Soir : Brouillard fin & Ventilation (19:00)'],
      es: ['Mañana: Nebulización y Aire (07:00)', 'Mediodía: Control HR 85-92% y CO₂ (13:00)', 'Tarde: Riego fino y Ventilación (19:00)'],
      de: ['Morgens: Sprühnebel & Frischluft (07:00)', 'Mittags: 85-92% LF & CO₂-Check (13:00)', 'Abends: Feinbefeuchtung (19:00)'],
      zh: ['清晨：喷雾保湿与换气 (07:00)', '午间：85-92%湿度与CO₂检测 (13:00)', '傍晚：微雾补湿巡检 (19:00)'],
    };
    return {
      feedingFrequency: 3,
      feedingTimes: times[lang] || times.en,
    };
  }

  if (species.id === 'azolla') {
    const times: Record<Language, string[]> = {
      ar: ['الصباح: قشط وحصاد 25-30% من الحوض (07:00)', 'المساء: فحص مستوى الماء 5-15 سم والتسميد الفوسفاتي (17:30)'],
      en: ['Morning Skim & 25-30% Biomass Harvest (7:00 AM)', 'Evening Water Depth (5-15 cm) & P-Nutrient Check (5:30 PM)'],
      fr: ['Matin : Récolte 25-30% de la biomasse (07:00)', 'Soir : Niveau d\'eau 5-15 cm & Apport P/SSP (17:30)'],
      es: ['Mañana: Cosecha diaria 25-30% (07:00)', 'Tarde: Nivel 5-15 cm y Control de Fósforo (17:30)'],
      de: ['Morgens: 25-30% Biomasse ernten (07:00)', 'Abends: Wasserstand 5-15 cm & P-Check (17:30)'],
      zh: ['清晨：打捞采收25-30%鲜萍 (07:00)', '傍晚：检查5-15厘米水深与磷肥营养液 (17:30)'],
    };
    return {
      feedingFrequency: 2,
      feedingTimes: times[lang] || times.en,
    };
  }

  if (species.id === 'alfalfa') {
    const times: Record<Language, string[]> = {
      ar: ['الصباح الباكر: ري وفحص رطوبة التربة قبل الحرارة (06:30)', 'المساء: فحص التسميد البوتاسي/الفوسفاتي والآفات (18:00)'],
      en: ['Early Morning Irrigation & Soil Moisture Check (6:30 AM)', 'Evening P-K Nutrient & Pest Inspection (6:00 PM)'],
      fr: ['Tôt le matin : Irrigation & Humidité du sol (06:30)', 'Soir : Suivi P-K & État sanitaire (18:00)'],
      es: ['Mañana temprano: Riego y Humedad del suelo (06:30)', 'Tarde: Revisión P-K y Plagas (18:00)'],
      de: ['Frühmorgens: Bewässerung & Bodenfeuchte (06:30)', 'Abends: P-K-Nährstoff- & Bestandskontrolle (18:00)'],
      zh: ['清晨：避高温灌溉与土壤墒情巡查 (06:30)', '傍晚：磷钾肥追施与病虫害监测 (18:00)'],
    };
    return {
      feedingFrequency: 2,
      feedingTimes: times[lang] || times.en,
    };
  }

  if (species.id === 'snail') {
    const times: Record<Language, string[]> = {
      ar: ['المساء عند الغروب: توزيع العلف الكلسي + ترطيب 75-85% RH (18:30)'],
      en: ['Sunset Feeding & Misting to 75–85% RH (6:30 PM — Nocturnal peak)'],
      fr: ['Crépuscule : Distribution farine calcique + brumisation 75-85% HR (18:30)'],
      es: ['Atardecer: Reparto pienso cálcico + nebulización 75-85% HR (18:30)'],
      de: ['Sonnenuntergang: Kalkfutter-Gabe & Befeuchtung 75-85% LF (18:30)'],
      zh: ['傍晚日落投喂高钙精料并喷雾保湿 75-85% RH (18:30 夜间采食高峰)'],
    };
    return {
      feedingFrequency: 1,
      feedingTimes: times[lang] || times.en,
    };
  }

  if (species.id === 'mariculture') {
    const times: Record<Language, string[]> = {
      ar: ['الصباح: فحص الملوحة 20-40 ppt والتيار المائي وتدفق N-P (07:00)', 'المساء: تقييم امتصاص المغذيات IMTA وتنظيف الطحالب العالقة (17:30)'],
      en: ['Morning Salinity (20–40 ppt) & Water Circulation Check (7:00 AM)', 'Evening IMTA Nutrient Uptake & Epiphyte Inspection (5:30 PM)'],
      fr: ['Matin : Contrôle salinité (20-40 ppt) & brassage d\'eau (07:00)', 'Soir : Suivi absorption N-P en IMTA & nettoyage (17:30)'],
      es: ['Mañana: Control de salinidad (20-40 ppt) y flujo marino (07:00)', 'Tarde: Absorción de nutrientes IMTA y limpieza de epífitos (17:30)'],
      de: ['Morgens: Salinität (20-40 ppt) & Strömungskontrolle (07:00)', 'Abends: IMTA-Nährstoffaufnahme & Epiphyten-Check (17:30)'],
      zh: ['清晨：盐度(20-40 ppt)与水体流动换水监测 (07:00)', '傍晚：IMTA氮磷吸收监测与杂藻清理 (17:30)'],
    };
    return {
      feedingFrequency: 2,
      feedingTimes: times[lang] || times.en,
    };
  }

  if (species.id === 'fruit_trees') {
    const times: Record<Language, string[]> = {
      ar: ['الصباح الباكر: تسميد بالتنقيط HFLC وضبط الري ETc = ETo×Kc (06:00)', 'المساء: فحص الأوراق والرش الورقي Ca-B دون رياح (18:30)'],
      en: ['Early Morning HFLC Drip Fertigation & ETc Run (6:00 AM)', 'Calm Evening Foliar Ca/B & Canopy Moisture Check (6:30 PM)'],
      fr: ['Tôt le matin : Fertigation HFLC & pilotage ETc (06:00)', 'Soir sans vent : Pulvérisation foliaire Ca-B & suivi hydrique (18:30)'],
      es: ['Mañana temprano: Fertirrigación HFLC y riego ETc (06:00)', 'Tarde sin viento: Aplicación foliar Ca-B y control hídrico (18:30)'],
      de: ['Frühmorgens: HFLC-Tropffertigation & ETc-Bewässerung (06:00)', 'Windstiller Abend: Blattdüngung Ca-B & Kronenkontrolle (18:30)'],
      zh: ['清晨：HFLC水肥一体化滴灌与ETc精准补水 (06:00)', '傍晚无风：叶面钙硼喷施及树冠墒情检查 (18:30)'],
    };
    return {
      feedingFrequency: 2,
      feedingTimes: times[lang] || times.en,
    };
  }

  // Default: sheep, beef, layers, rabbits
  const times: Record<Language, string[]> = {
    ar: ['الصباح (7:00)', 'المساء (17:00)'],
    en: ['Morning (7:00 AM)', 'Evening (5:00 PM)'],
    fr: ['Matin (07:00)', 'Soir (17:00)'],
    es: ['Mañana (07:00)', 'Tarde (17:00)'],
    de: ['Morgens (07:00)', 'Abends (17:00)'],
    zh: ['早晨 (07:00)', '傍晚 (17:00)'],
  };
  return {
    feedingFrequency: 2,
    feedingTimes: times[lang] || times.en,
  };
}

export function calculateFeed(
  species: Species,
  feedType: FeedType,
  input: CalculationInput,
  lang: Language = 'ar'
): CalculationResult | null {
  const weight = parseFloat(normalizeDigits(input.weight));
  const count = parseInt(normalizeDigits(input.count), 10) || 1;
  const rawCustomFcr = normalizeDigits(input.customFcr);
  const fcr = input.useCustomFcr && rawCustomFcr
    ? parseFloat(rawCustomFcr)
    : species.defaultFcr;

  if (isNaN(weight) || weight <= 0 || isNaN(fcr) || fcr <= 0) {
    return null;
  }

  // dailyFeedPerUnit in selected unit (kg or lb)
  const dailyFeedPerUnit = weight * species.feedingRate;
  // dailyFeedTotal in selected unit (kg or lb)
  const dailyFeedTotal = dailyFeedPerUnit * count;
  // totalFeedNeeded for target lifecycle/growth (weight * FCR)
  const totalFeedNeeded = weight * fcr;
  // daily protein in selected unit
  const dailyProtein = dailyFeedTotal * (feedType.protein / 100);
  
  // daily energy in Mcal (MegaCalories) based on metric kg equivalent
  const dailyFeedTotalKg = input.weightUnit === 'lb' ? dailyFeedTotal * 0.45359237 : dailyFeedTotal;
  const dailyEnergy = dailyFeedTotalKg * (feedType.energy / 1000);
  
  // Feed conversion efficiency percentage (1 / FCR * 100)
  const feedConversionEfficiency = (1 / fcr) * 100;

  const schedule = getFeedingSchedule(species, lang);
  const feedPerMealTotal = dailyFeedTotal / schedule.feedingFrequency;
  const feedPerMealPerUnit = dailyFeedPerUnit / schedule.feedingFrequency;

  let dailyCost: number | undefined;
  let monthlyCost: number | undefined;
  if (input.costPerKg) {
    const costKg = parseFloat(input.costPerKg);
    if (!isNaN(costKg) && costKg > 0) {
      dailyCost = Math.round(dailyFeedTotal * costKg * 100) / 100;
      monthlyCost = Math.round(dailyCost * 30 * 100) / 100;
    }
  }

  return {
    dailyFeedPerUnit: Math.round(dailyFeedPerUnit * 1000) / 1000,
    dailyFeedTotal: Math.round(dailyFeedTotal * 1000) / 1000,
    totalFeedNeeded: Math.round(totalFeedNeeded * 1000) / 1000,
    fcr: Math.round(fcr * 100) / 100,
    dailyProtein: Math.round(dailyProtein * 1000) / 1000,
    dailyEnergy: Math.round(dailyEnergy * 100) / 100,
    feedConversionEfficiency: Math.round(feedConversionEfficiency * 100) / 100,
    feedingFrequency: schedule.feedingFrequency,
    feedingTimes: schedule.feedingTimes,
    feedPerMealTotal: Math.round(feedPerMealTotal * 1000) / 1000,
    feedPerMealPerUnit: Math.round(feedPerMealPerUnit * 1000) / 1000,
    dailyCost,
    monthlyCost,
  };
}
