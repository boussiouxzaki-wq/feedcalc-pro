export type AnimalCategory = 'land' | 'aquatic' | 'specialty';

export type Language = 'en' | 'ar' | 'fr' | 'es' | 'de' | 'zh';

export type WeightUnit = 'kg' | 'lb';

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
}

export interface FeedType {
  id: string;
  name: string;
  nameEn: string;
  nameFr: string;
  nameEs: string;
  nameZh: string;
  nameDe?: string;
  description: string;
  descriptionEn: string;
  descriptionFr: string;
  descriptionEs: string;
  descriptionZh: string;
  descriptionDe?: string;
  protein: number; // percentage e.g. 22
  energy: number;  // kcal / kg e.g. 3000
  fiber: number;   // percentage e.g. 3.5
  moisture: number;// percentage e.g. 12
  ash: number;     // percentage e.g. 6
  fat?: number;    // percentage e.g. 4.5
  isCustom?: boolean;
}

export interface Species {
  id: string;
  name: string;
  nameEn: string;
  nameFr: string;
  nameEs: string;
  nameZh: string;
  nameDe?: string;
  iconName: 'bird' | 'egg' | 'wheat' | 'cow' | 'trending-up' | 'fish' | 'pig' | 'bee' | 'rabbit' | 'camel' | 'goat';
  unit: string;
  unitEn: string;
  unitFr: string;
  unitEs: string;
  unitZh: string;
  unitDe?: string;
  category: AnimalCategory;
  description: string;
  descriptionEn: string;
  descriptionFr: string;
  descriptionEs: string;
  descriptionZh: string;
  descriptionDe?: string;
  defaultFcr: number;
  feedingRate: number; // fraction of body weight per day (e.g., 0.1 for 10%)
  proteinRange: [number, number];
}

export interface BreedingSchedule {
  cycle: string;
  cycleEn: string;
  cycleFr: string;
  cycleEs: string;
  cycleZh: string;
  cycleDe?: string;
  optimalTime: string;
  optimalTimeEn: string;
  optimalTimeFr: string;
  optimalTimeEs: string;
  optimalTimeZh: string;
  optimalTimeDe?: string;
  gestation: string;
  gestationEn: string;
  gestationFr: string;
  gestationEs: string;
  gestationZh: string;
  gestationDe?: string;
  signs: string;
  signsEn: string;
  signsFr: string;
  signsEs: string;
  signsZh: string;
  signsDe?: string;
  advice: string;
  adviceEn: string;
  adviceFr: string;
  adviceEs: string;
  adviceZh: string;
  adviceDe?: string;
}

export interface CalculationInput {
  speciesId: string;
  age: string;
  weight: string;
  count: string;
  feedTypeId: string;
  customFcr: string;
  useCustomFcr: boolean;
  costPerKg: string;
  currency?: string;
  weightUnit?: WeightUnit;
  // Custom Feed Nutrients Override
  isCustomFeed: boolean;
  customFeedName: string;
  customProtein: string;
  customEnergy: string;
  customFiber: string;
  customFat: string;
  customMoisture: string;
  customAsh: string;
}

export interface CalculationResult {
  dailyFeedPerUnit: number; // kg
  dailyFeedTotal: number;   // kg
  totalFeedNeeded: number;  // kg
  fcr: number;
  dailyProtein: number;     // kg
  dailyEnergy: number;      // Mcal
  feedConversionEfficiency: number; // %
  feedingFrequency: number;
  feedingTimes: string[];
  feedPerMealTotal: number; // kg
  feedPerMealPerUnit: number; // kg
  dailyCost?: number;
  monthlyCost?: number;
}
