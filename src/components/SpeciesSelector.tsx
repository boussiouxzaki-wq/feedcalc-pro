import React, { useState } from 'react';
import { Bird, Egg, Wheat, Milestone, TrendingUp, Fish, PiggyBank, Hexagon, Sparkles, Sun, Milk, Lock } from 'lucide-react';
import { Species, Language, AnimalCategory } from '../types';
import { SPECIES_LIST } from '../data/speciesData';
import { TRANSLATIONS } from '../utils/translations';

interface SpeciesSelectorProps {
  selectedSpeciesId: string;
  onSelectSpecies: (speciesId: string) => void;
  lang: Language;
  isActivated?: boolean;
  onRequireActivation?: () => void;
}

export const SpeciesSelector: React.FC<SpeciesSelectorProps> = ({
  selectedSpeciesId,
  onSelectSpecies,
  lang,
  isActivated = false,
  onRequireActivation,
}) => {
  const [filter, setFilter] = useState<'all' | 'land' | 'aquatic' | 'specialty'>('all');
  const t = TRANSLATIONS[lang];

  const filteredSpecies = SPECIES_LIST.filter((s) => {
    if (filter === 'all') return true;
    return s.category === filter;
  });

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

  const getSpeciesDesc = (s: Species) => {
    switch (lang) {
      case 'de':
        return s.descriptionDe || s.descriptionEn;
      case 'zh':
        return s.descriptionZh || s.descriptionEn;
      case 'fr':
        return s.descriptionFr;
      case 'es':
        return s.descriptionEs;
      case 'en':
        return s.descriptionEn;
      case 'ar':
      default:
        return s.description;
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

  const getSpeciesIcon = (iconName: Species['iconName'], className: string) => {
    switch (iconName) {
      case 'bird':
        return <Bird className={className} />;
      case 'egg':
        return <Egg className={className} />;
      case 'wheat':
        return <Wheat className={className} />;
      case 'cow':
        return <Milestone className={className} />;
      case 'trending-up':
        return <TrendingUp className={className} />;
      case 'fish':
        return <Fish className={className} />;
      case 'pig':
        return <PiggyBank className={className} />;
      case 'bee':
        return <Hexagon className={className} />;
      case 'rabbit':
        return <Sparkles className={className} />;
      case 'camel':
        return <Sun className={className} />;
      case 'goat':
        return <Milk className={className} />;
      default:
        return <Wheat className={className} />;
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
            <Wheat className="size-4 text-emerald-600" />
            <span>{t.step1Title}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t.step1Desc}
          </p>
        </div>

        {/* Filter categories */}
        <div className="flex flex-wrap items-center rounded-lg bg-slate-100 p-1 text-xs">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`rounded-md px-2.5 py-1 font-semibold transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.filterAll}
          </button>
          <button
            type="button"
            onClick={() => setFilter('land')}
            className={`rounded-md px-2.5 py-1 font-semibold transition-all cursor-pointer ${
              filter === 'land'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.filterLand}
          </button>
          <button
            type="button"
            onClick={() => setFilter('aquatic')}
            className={`rounded-md px-2.5 py-1 font-semibold transition-all cursor-pointer ${
              filter === 'aquatic'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.filterAquatic}
          </button>
          <button
            type="button"
            onClick={() => setFilter('specialty')}
            className={`rounded-md px-2.5 py-1 font-semibold transition-all cursor-pointer ${
              filter === 'specialty'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.filterSpecialty}
          </button>
        </div>
      </div>

      {/* Grid of species options */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
        {filteredSpecies.map((species) => {
          const isSelected = species.id === selectedSpeciesId;
          // دجاج اللحم متاح دائماً ومجاناً للجميع للتجربة والمعاينة، وباقي الحيوانات مقفلة حتى التفعيل
          const isBroiler = species.id === 'broiler';
          const isLocked = !isActivated && !isBroiler;

          const handleClick = () => {
            if (isLocked && onRequireActivation) {
              onRequireActivation();
              return;
            }
            onSelectSpecies(species.id);
          };

          return (
            <button
              key={species.id}
              type="button"
              id={`species-btn-${species.id}`}
              onClick={handleClick}
              className={`group relative flex flex-col items-start rounded-xl border p-3 text-start transition-all cursor-pointer ${
                isSelected
                  ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-2 ring-emerald-600/20'
                  : isLocked
                  ? 'border-slate-200 bg-slate-50/60 hover:border-amber-400 hover:bg-amber-50/20'
                  : 'border-slate-200 bg-white hover:border-emerald-400 hover:bg-slate-50/70'
              }`}
            >
              {isLocked && (
                <div className="absolute top-2.5 end-2.5 flex items-center gap-1 rounded-md bg-amber-100/90 text-amber-900 border border-amber-300 px-1.5 py-0.5 text-[10px] font-black shadow-2xs">
                  <Lock className="size-2.5" />
                  <span>PRO</span>
                </div>
              )}

              <div className="flex w-full items-center justify-between mb-2">
                <div
                  className={`flex size-9 items-center justify-center rounded-lg transition-colors ${
                    isSelected
                      ? 'bg-emerald-600 text-white'
                      : isLocked
                      ? 'bg-slate-200/80 text-slate-500'
                      : 'bg-slate-100 text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-700'
                  }`}
                >
                  {getSpeciesIcon(species.iconName, 'size-5')}
                </div>
                {!isLocked && (
                  <span className="text-[11px] font-medium text-slate-400">
                    {getSpeciesUnit(species)}
                  </span>
                )}
              </div>

              <div className="font-bold text-sm text-slate-900 line-clamp-1">
                {getSpeciesName(species)}
              </div>

              <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                {getSpeciesDesc(species)}
              </div>

              <div className="mt-2.5 flex w-full items-center justify-between border-t border-slate-100/80 pt-1.5 text-[10px] text-slate-400">
                <span>FCR: {species.defaultFcr}</span>
                <span>{species.proteinRange[0]}-{species.proteinRange[1]}% P</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
