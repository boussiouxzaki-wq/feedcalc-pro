import React from 'react';
import {
  Calculator,
  Weight,
  Ruler,
  TrendingUp,
  FlaskConical,
  Coins,
  Calendar,
  Sparkles,
  SlidersHorizontal,
  RotateCcw,
} from 'lucide-react';
import { Species, CalculationInput, Language, FeedType } from '../types';
import { FEEDS_BY_SPECIES } from '../data/speciesData';
import { CURRENCIES } from '../data/currencies';
import { TRANSLATIONS } from '../utils/translations';

interface InputFormProps {
  species: Species;
  input: CalculationInput;
  onChange: (key: keyof CalculationInput, value: string | boolean) => void;
  onCalculate: () => void;
  lang: Language;
}

export const InputForm: React.FC<InputFormProps> = ({
  species,
  input,
  onChange,
  onCalculate,
  lang,
}) => {
  const t = TRANSLATIONS[lang];
  const availableFeeds = FEEDS_BY_SPECIES[species.id] || [];

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

  const getFeedName = (feed: FeedType) => {
    switch (lang) {
      case 'de':
        return feed.nameDe || feed.nameEn;
      case 'zh':
        return feed.nameZh || feed.nameEn;
      case 'fr':
        return feed.nameFr;
      case 'es':
        return feed.nameEs;
      case 'en':
        return feed.nameEn;
      case 'ar':
      default:
        return feed.name;
    }
  };

  const getFeedDesc = (feed: FeedType) => {
    switch (lang) {
      case 'de':
        return feed.descriptionDe || feed.descriptionEn;
      case 'zh':
        return feed.descriptionZh || feed.descriptionEn;
      case 'fr':
        return feed.descriptionFr;
      case 'es':
        return feed.descriptionEs;
      case 'en':
        return feed.descriptionEn;
      case 'ar':
      default:
        return feed.description;
    }
  };

  const handleFeedSelect = (feed: FeedType) => {
    onChange('feedTypeId', feed.id);
    if (input.isCustomFeed) {
      onChange('customProtein', String(feed.protein));
      onChange('customEnergy', String(feed.energy));
      onChange('customFiber', String(feed.fiber));
      onChange('customFat', String(feed.fat || 4.5));
      onChange('customMoisture', String(feed.moisture));
      onChange('customAsh', String(feed.ash));
    }
  };

  const handleToggleCustomFeed = (enabled: boolean) => {
    onChange('isCustomFeed', enabled);
    if (enabled) {
      const currentFeed = availableFeeds.find((f) => f.id === input.feedTypeId) || availableFeeds[0];
      if (currentFeed) {
        if (!input.customProtein) onChange('customProtein', String(currentFeed.protein));
        if (!input.customEnergy) onChange('customEnergy', String(currentFeed.energy));
        if (!input.customFiber) onChange('customFiber', String(currentFeed.fiber));
        if (!input.customFat) onChange('customFat', String(currentFeed.fat || 4.5));
        if (!input.customMoisture) onChange('customMoisture', String(currentFeed.moisture));
        if (!input.customAsh) onChange('customAsh', String(currentFeed.ash));
      }
    }
  };

  const handleResetToCurrentFeedDefaults = () => {
    const currentFeed = availableFeeds.find((f) => f.id === input.feedTypeId) || availableFeeds[0];
    if (currentFeed) {
      onChange('customFeedName', '');
      onChange('customProtein', String(currentFeed.protein));
      onChange('customEnergy', String(currentFeed.energy));
      onChange('customFiber', String(currentFeed.fiber));
      onChange('customFat', String(currentFeed.fat || 4.5));
      onChange('customMoisture', String(currentFeed.moisture));
      onChange('customAsh', String(currentFeed.ash));
    }
  };

  const speciesName = getSpeciesName(species);
  const speciesUnit = getSpeciesUnit(species);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
      <div className="border-b border-slate-100 pb-3">
        <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
          <Calculator className="size-4 text-emerald-600" />
          <span>{t.step2Title(speciesName)}</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          {t.step2Desc}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Weight input - Required */}
        <div className="space-y-1.5 sm:col-span-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="input-weight"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-800"
            >
              <Weight className="size-3.5 text-emerald-600" />
              <span>{t.weightLabel}</span>
              <span className="text-rose-600">*</span>
            </label>

            {/* Metric / Imperial Unit Switcher */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400 font-normal hidden sm:inline">
                {t.weightSub(speciesUnit)}
              </span>
              <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-[10px] font-bold">
                <button
                  type="button"
                  id="btn-unit-kg"
                  onClick={() => onChange('weightUnit', 'kg')}
                  className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                    input.weightUnit !== 'lb'
                      ? 'bg-white text-emerald-700 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  kg
                </button>
                <button
                  type="button"
                  id="btn-unit-lb"
                  onClick={() => onChange('weightUnit', 'lb')}
                  className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                    input.weightUnit === 'lb'
                      ? 'bg-white text-emerald-700 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  lb
                </button>
              </div>
            </div>
          </div>

          <div className="relative">
            <input
              id="input-weight"
              type="number"
              min="0.001"
              step="any"
              placeholder={species.category === 'aquatic' ? '0.35' : '2.0'}
              value={input.weight}
              onChange={(e) => onChange('weight', e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-3 focus:ring-emerald-500/15 transition-all"
            />
            <span className="pointer-events-none absolute inset-y-0 ltr:right-3.5 rtl:left-3.5 flex items-center text-xs font-bold text-slate-500">
              {input.weightUnit === 'lb' ? 'lb' : 'kg'}
            </span>
          </div>
        </div>

        {/* Count input */}
        <div className="space-y-1.5">
          <label
            htmlFor="input-count"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-800"
          >
            <Ruler className="size-3.5 text-emerald-600" />
            {t.countLabel(speciesUnit)}
          </label>
          <input
            id="input-count"
            type="number"
            min="1"
            step="1"
            placeholder="1"
            value={input.count}
            onChange={(e) => onChange('count', e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-3 focus:ring-emerald-500/15 transition-all"
          />
        </div>

        {/* Age input (Optional) */}
        <div className="space-y-1.5">
          <label
            htmlFor="input-age"
            className="flex items-center justify-between text-xs font-semibold text-slate-800"
          >
            <span className="flex items-center gap-1.5">
              <Calendar className="size-3.5 text-slate-500" />
              {t.ageLabel}
            </span>
            <span className="text-[10px] text-slate-400">
              {t.optional}
            </span>
          </label>
          <input
            id="input-age"
            type="number"
            min="1"
            step="1"
            placeholder="30"
            value={input.age}
            onChange={(e) => onChange('age', e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-3 focus:ring-emerald-500/15 transition-all"
          />
        </div>

        {/* Feed Type Selection */}
        <div className="space-y-2.5 sm:col-span-2">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
              <FlaskConical className="size-3.5 text-emerald-600" />
              {t.feedTypeLabel}
            </label>
            <span className="text-[10px] text-slate-400 font-medium">
              {availableFeeds.length} {lang === 'ar' ? 'أنواع متوفرة' : 'types'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {availableFeeds.map((feed) => {
              const isSelected = feed.id === input.feedTypeId;
              return (
                <button
                  key={feed.id}
                  type="button"
                  id={`feed-btn-${feed.id}`}
                  onClick={() => handleFeedSelect(feed)}
                  className={`flex flex-col items-start rounded-xl border p-2.5 text-start transition-all cursor-pointer ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/60 shadow-2xs ring-2 ring-emerald-600/15'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">
                      {getFeedName(feed)}
                    </span>
                    <span className="rounded bg-emerald-100/70 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                      {feed.protein}% P
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                    {getFeedDesc(feed)}
                  </span>
                  <div className="mt-2 flex w-full items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 pt-1">
                    <span>{feed.energy} kcal</span>
                    <span>{feed.fiber}% F</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Feed Nutrients Customization Panel */}
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-3 shadow-2xs transition-all">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div
                  className={`flex size-8 items-center justify-center rounded-lg transition-colors ${
                    input.isCustomFeed ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <SlidersHorizontal className="size-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      {t.customizeFeedNutrients}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        input.isCustomFeed
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {input.isCustomFeed ? t.customFeedBadge : t.standardFeedBadge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {t.customFeedDesc}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {input.isCustomFeed && (
                  <button
                    type="button"
                    onClick={handleResetToCurrentFeedDefaults}
                    className="flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 border border-slate-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    title={t.resetToDefault}
                  >
                    <RotateCcw className="size-3" />
                    <span>{t.resetToDefault}</span>
                  </button>
                )}

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="toggle-custom-feed"
                    checked={input.isCustomFeed}
                    onChange={(e) => handleToggleCustomFeed(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:start-[3px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </div>

            {input.isCustomFeed && (
              <div className="pt-3 border-t border-slate-100 space-y-3">
                {/* Optional Custom Feed Brand / Title */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    {t.customFeedNameLabel}
                  </label>
                  <input
                    type="text"
                    id="input-custom-feed-name"
                    placeholder={
                      lang === 'ar'
                        ? 'مثال: علف بادي سوبر 22% (تسمين محلي)'
                        : lang === 'fr'
                        ? 'ex. Aliment croissance 20% (sac du commerce)'
                        : 'e.g. Starter Feed 22% (commercial bag)'
                    }
                    value={input.customFeedName}
                    onChange={(e) => onChange('customFeedName', e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/15"
                  />
                </div>

                {/* 6 Nutrient Inputs Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {/* Crude Protein */}
                  <div className="space-y-1">
                    <label htmlFor="input-custom-protein" className="block text-[11px] font-semibold text-slate-700">
                      {t.crudeProtein} (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        id="input-custom-protein"
                        step="0.1"
                        min="1"
                        max="70"
                        value={input.customProtein}
                        onChange={(e) => onChange('customProtein', e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/15"
                      />
                      <span className="absolute end-2 top-1.5 text-[10px] text-slate-400 font-bold">%</span>
                    </div>
                  </div>

                  {/* Metabolizable Energy */}
                  <div className="space-y-1">
                    <label htmlFor="input-custom-energy" className="block text-[11px] font-semibold text-slate-700 truncate">
                      {t.metabolizableEnergy} (kcal)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        id="input-custom-energy"
                        step="10"
                        min="500"
                        max="5000"
                        value={input.customEnergy}
                        onChange={(e) => onChange('customEnergy', e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/15"
                      />
                      <span className="absolute end-2 top-1.5 text-[10px] text-slate-400 font-bold">kcal</span>
                    </div>
                  </div>

                  {/* Crude Fat */}
                  <div className="space-y-1">
                    <label htmlFor="input-custom-fat" className="block text-[11px] font-semibold text-slate-700">
                      {t.crudeFat} (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        id="input-custom-fat"
                        step="0.1"
                        min="0.1"
                        max="35"
                        value={input.customFat}
                        onChange={(e) => onChange('customFat', e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/15"
                      />
                      <span className="absolute end-2 top-1.5 text-[10px] text-slate-400 font-bold">%</span>
                    </div>
                  </div>

                  {/* Crude Fiber */}
                  <div className="space-y-1">
                    <label htmlFor="input-custom-fiber" className="block text-[11px] font-semibold text-slate-700">
                      {t.crudeFiber} (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        id="input-custom-fiber"
                        step="0.1"
                        min="0.1"
                        max="50"
                        value={input.customFiber}
                        onChange={(e) => onChange('customFiber', e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/15"
                      />
                      <span className="absolute end-2 top-1.5 text-[10px] text-slate-400 font-bold">%</span>
                    </div>
                  </div>

                  {/* Moisture */}
                  <div className="space-y-1">
                    <label htmlFor="input-custom-moisture" className="block text-[11px] font-semibold text-slate-700">
                      {t.moisture} (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        id="input-custom-moisture"
                        step="0.1"
                        min="1"
                        max="85"
                        value={input.customMoisture}
                        onChange={(e) => onChange('customMoisture', e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/15"
                      />
                      <span className="absolute end-2 top-1.5 text-[10px] text-slate-400 font-bold">%</span>
                    </div>
                  </div>

                  {/* Total Ash */}
                  <div className="space-y-1">
                    <label htmlFor="input-custom-ash" className="block text-[11px] font-semibold text-slate-700">
                      {t.totalAsh} (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        id="input-custom-ash"
                        step="0.1"
                        min="0.1"
                        max="30"
                        value={input.customAsh}
                        onChange={(e) => onChange('customAsh', e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/15"
                      />
                      <span className="absolute end-2 top-1.5 text-[10px] text-slate-400 font-bold">%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Advanced Options accordion / toggle */}
        <div className="sm:col-span-2 rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 space-y-3">
          <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <TrendingUp className="size-3.5 text-slate-500" />
            {t.advancedOptions}
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Custom FCR toggle */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="input-custom-fcr"
                  className="text-xs font-medium text-slate-700"
                >
                  {t.customFcrToggle}
                </label>
                <input
                  id="checkbox-use-custom-fcr"
                  type="checkbox"
                  checked={input.useCustomFcr}
                  onChange={(e) => onChange('useCustomFcr', e.target.checked)}
                  className="size-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
              </div>

              {input.useCustomFcr && (
                <input
                  id="input-custom-fcr"
                  type="number"
                  step="0.05"
                  min="0.5"
                  max="20"
                  placeholder={String(species.defaultFcr)}
                  value={input.customFcr}
                  onChange={(e) => onChange('customFcr', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              )}
            </div>

            {/* Optional Feed Cost Per Kg / Lb with Currency selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="input-cost-kg"
                  className="flex items-center gap-1 text-xs font-medium text-slate-700"
                >
                  <Coins className="size-3 text-slate-500" />
                  <span>{t.costLabel}</span>
                </label>
                <span className="text-[10px] text-slate-400 font-bold">
                  {t.currencyLabel}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <select
                  id="select-currency"
                  aria-label={t.currencyLabel}
                  value={input.currency || 'USD'}
                  onChange={(e) => onChange('currency', e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer shadow-2xs"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.symbol} ({c.code})
                    </option>
                  ))}
                </select>

                <div className="relative flex-1">
                  <input
                    id="input-cost-kg"
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0.00"
                    value={input.costPerKg}
                    onChange={(e) => onChange('costPerKg', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <span className="pointer-events-none absolute inset-y-0 ltr:right-3 rtl:left-3 flex items-center text-[10px] font-bold text-slate-400">
                    /{input.weightUnit === 'lb' ? 'lb' : 'kg'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calculate Button */}
      <button
        type="button"
        id="btn-calculate"
        onClick={onCalculate}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-sm shadow-emerald-600/20 hover:bg-emerald-700 active:scale-[0.99] transition-all cursor-pointer"
      >
        <Sparkles className="size-4" />
        <span>{t.calculateBtn}</span>
      </button>
    </div>
  );
};
