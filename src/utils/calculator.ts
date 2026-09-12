import { Species, FeedType, CalculationInput, CalculationResult, Language } from '../types';

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
  const weight = parseFloat(input.weight);
  const count = parseInt(input.count, 10) || 1;
  const fcr = input.useCustomFcr && input.customFcr
    ? parseFloat(input.customFcr)
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
