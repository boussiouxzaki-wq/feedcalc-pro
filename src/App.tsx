import { useState, useMemo, useEffect } from 'react';
import { Lock, KeyRound } from 'lucide-react';
import { CalculationInput, Language, FeedType } from './types';
import { SPECIES_LIST, FEEDS_BY_SPECIES, QuickPreset } from './data/speciesData';
import { calculateFeed } from './utils/calculator';
import { Header } from './components/Header';
import { SpeciesSelector } from './components/SpeciesSelector';
import { InputForm } from './components/InputForm';
import { ResultsView } from './components/ResultsView';
import { Footer } from './components/Footer';
import { ToastContainer, ToastMessage } from './components/Toast';
import { AppExportModal } from './components/AppExportModal';
import { GlobalPricingModal } from './components/GlobalPricingModal';
import { IntellectualPropertyModal } from './components/IntellectualPropertyModal';
import { ActivationModal } from './components/ActivationModal';
import { PaywallScreen } from './components/PaywallScreen';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminModal } from './components/AdminModal';
import { getLicenseStatus, resetToVisitorMode } from './utils/license';
import { isMasterAdminUrl } from './utils/adminSecret';

export default function App() {
  const [lang, setLang] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('feedcalc_lang') as Language;
      return saved && ['ar', 'en', 'fr', 'es', 'de', 'zh'].includes(saved) ? saved : 'ar';
    } catch {
      return 'ar';
    }
  });
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isIpModalOpen, setIsIpModalOpen] = useState(false);
  const [isActivationModalOpen, setIsActivationModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isAdminDirectMode, setIsAdminDirectMode] = useState(false);
  const [isAdminView, setIsAdminView] = useState(() => isMasterAdminUrl());
  const [isActivated, setIsActivated] = useState(() => getLicenseStatus().isActivated);

  // Default state initialized with an illustrative broiler setup
  const [input, setInput] = useState<CalculationInput>({
    speciesId: 'broiler',
    age: '35',
    weight: '2.0',
    count: '1000',
    feedTypeId: 'grower',
    customFcr: '',
    useCustomFcr: false,
    costPerKg: '0.85',
    currency: 'USD',
    weightUnit: 'kg',
    isCustomFeed: false,
    customFeedName: '',
    customProtein: '20.0',
    customEnergy: '3100',
    customFiber: '3.8',
    customFat: '4.5',
    customMoisture: '12.0',
    customAsh: '6.0',
  });

  // Keep dir and lang synced with DOM
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    try {
      localStorage.setItem('feedcalc_lang', lang);
    } catch {}
  }, [lang]);

  // فحص الرابط السري للمهندس زكريا للدخول الفوري للوحة الإدارة المستقلة
  useEffect(() => {
    if (isMasterAdminUrl()) {
      setIsAdminView(true);
    }

    const handleHashChange = () => {
      if (isMasterAdminUrl()) {
        setIsAdminView(true);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const selectedSpecies = useMemo(
    () => SPECIES_LIST.find((s) => s.id === input.speciesId) || null,
    [input.speciesId]
  );

  const availableFeeds = useMemo(() => {
    if (!input.speciesId) return [];
    return FEEDS_BY_SPECIES[input.speciesId] || [];
  }, [input.speciesId]);

  const selectedFeedType = useMemo(() => {
    return availableFeeds.find((f) => f.id === input.feedTypeId) || availableFeeds[0] || null;
  }, [availableFeeds, input.feedTypeId]);

  // Handle species change: automatically switch feed type to first available of new species
  const handleSelectSpecies = (speciesId: string) => {
    const feeds = FEEDS_BY_SPECIES[speciesId] || [];
    const firstFeed = feeds.length > 0 ? feeds[0] : null;
    setInput((prev) => ({
      ...prev,
      speciesId,
      feedTypeId: firstFeed ? firstFeed.id : '',
      customFcr: '',
      useCustomFcr: false,
      isCustomFeed: false,
      customFeedName: '',
      customProtein: firstFeed ? String(firstFeed.protein) : '20.0',
      customEnergy: firstFeed ? String(firstFeed.energy) : '3000',
      customFiber: firstFeed ? String(firstFeed.fiber) : '4.0',
      customFat: firstFeed && firstFeed.fat ? String(firstFeed.fat) : '4.5',
      customMoisture: firstFeed ? String(firstFeed.moisture) : '12.0',
      customAsh: firstFeed ? String(firstFeed.ash) : '6.0',
    }));
  };

  const handleInputChange = (key: keyof CalculationInput, value: string | boolean) => {
    setInput((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSelectPreset = (preset: QuickPreset) => {
    if (!isActivated) {
      setIsActivationModalOpen(true);
      return;
    }

    const feeds = FEEDS_BY_SPECIES[preset.speciesId] || [];
    const matchedFeed = feeds.find((f) => f.id === preset.feedTypeId) || (feeds.length > 0 ? feeds[0] : null);

    setInput((prev) => ({
      ...prev,
      speciesId: preset.speciesId,
      age: preset.age,
      weight: preset.weight,
      count: preset.count,
      feedTypeId: preset.feedTypeId,
      customFcr: '',
      useCustomFcr: false,
      costPerKg: prev.costPerKg || '0.85',
      isCustomFeed: false,
      customFeedName: '',
      customProtein: matchedFeed ? String(matchedFeed.protein) : '20.0',
      customEnergy: matchedFeed ? String(matchedFeed.energy) : '3000',
      customFiber: matchedFeed ? String(matchedFeed.fiber) : '4.0',
      customFat: matchedFeed && matchedFeed.fat ? String(matchedFeed.fat) : '4.5',
      customMoisture: matchedFeed ? String(matchedFeed.moisture) : '12.0',
      customAsh: matchedFeed ? String(matchedFeed.ash) : '6.0',
    }));

    const presetName =
      lang === 'fr'
        ? preset.nameFr
        : lang === 'es'
        ? preset.nameEs
        : lang === 'en'
        ? preset.nameEn
        : preset.name;

    const msg =
      lang === 'fr'
        ? `Modèle chargé : ${presetName}`
        : lang === 'es'
        ? `Plantilla cargada: ${presetName}`
        : lang === 'en'
        ? `Loaded preset: ${presetName}`
        : `تم تحميل نموذج: ${presetName}`;

    showToast(msg, 'success');
  };

  const handleCalculate = () => {
    if (!input.speciesId) {
      const err =
        lang === 'fr'
          ? 'Veuillez sélectionner une espèce'
          : lang === 'es'
          ? 'Por favor seleccione una especie'
          : lang === 'en'
          ? 'Please select a species'
          : 'الرجاء اختيار نوع الحيوان أو السمك';
      showToast(err, 'error');
      return;
    }
    const weightNum = parseFloat(input.weight);
    if (isNaN(weightNum) || weightNum <= 0) {
      const err =
        lang === 'fr'
          ? 'Veuillez indiquer un poids valide en kg'
          : lang === 'es'
          ? 'Por favor ingrese un peso válido en kg'
          : lang === 'en'
          ? 'Please enter a valid weight in kg'
          : 'الرجاء إدخال وزن صحيح للوحدة الواحدة (كجم)';
      showToast(err, 'error');
      return;
    }
    if (!input.feedTypeId) {
      const err =
        lang === 'fr'
          ? 'Veuillez sélectionner un type d\'aliment'
          : lang === 'es'
          ? 'Por favor seleccione un tipo de pienso'
          : lang === 'en'
          ? 'Please select a feed type'
          : 'الرجاء اختيار نوع العلف';
      showToast(err, 'error');
      return;
    }

    const successMsg =
      lang === 'fr'
        ? 'Ration et planning calculés avec succès'
        : lang === 'es'
        ? 'Ración y horario calculados con éxito'
        : lang === 'en'
        ? 'Feed rations calculated successfully'
        : 'تم حساب كمية الحصص الغذائية بنجاح';
    showToast(successMsg, 'success');
  };

  const handleReset = () => {
    setInput((prev) => ({
      speciesId: '',
      age: '',
      weight: '',
      count: '1',
      feedTypeId: '',
      customFcr: '',
      useCustomFcr: false,
      costPerKg: '',
      currency: prev.currency || 'USD',
      weightUnit: prev.weightUnit || 'kg',
      isCustomFeed: false,
      customFeedName: '',
      customProtein: '20.0',
      customEnergy: '3000',
      customFiber: '4.0',
      customFat: '4.5',
      customMoisture: '12.0',
      customAsh: '6.0',
    }));

    const resetMsg =
      lang === 'fr'
        ? 'Formulaire réinitialisé pour un nouveau calcul'
        : lang === 'es'
        ? 'Formulario restablecido para nuevo cálculo'
        : lang === 'en'
        ? 'Form reset for new calculation'
        : 'تم مسح البيانات والبدء بحساب جديد';
    showToast(resetMsg, 'info');
  };

  const effectiveFeedType = useMemo<FeedType | null>(() => {
    if (!selectedFeedType) return null;
    if (!input.isCustomFeed) {
      return selectedFeedType;
    }

    const p = parseFloat(input.customProtein);
    const e = parseFloat(input.customEnergy);
    const f = parseFloat(input.customFiber);
    const fat = parseFloat(input.customFat);
    const m = parseFloat(input.customMoisture);
    const a = parseFloat(input.customAsh);
    const customName = input.customFeedName.trim();

    return {
      ...selectedFeedType,
      name: customName || selectedFeedType.name,
      nameEn: customName || selectedFeedType.nameEn,
      nameFr: customName || selectedFeedType.nameFr,
      nameEs: customName || selectedFeedType.nameEs,
      protein: !isNaN(p) && p > 0 ? p : selectedFeedType.protein,
      energy: !isNaN(e) && e > 0 ? e : selectedFeedType.energy,
      fiber: !isNaN(f) && f >= 0 ? f : selectedFeedType.fiber,
      fat: !isNaN(fat) && fat >= 0 ? fat : (selectedFeedType.fat || 4.5),
      moisture: !isNaN(m) && m >= 0 ? m : selectedFeedType.moisture,
      ash: !isNaN(a) && a >= 0 ? a : selectedFeedType.ash,
      isCustom: true,
    };
  }, [
    selectedFeedType,
    input.isCustomFeed,
    input.customFeedName,
    input.customProtein,
    input.customEnergy,
    input.customFiber,
    input.customFat,
    input.customMoisture,
    input.customAsh,
  ]);

  const calculationResult = useMemo(() => {
    if (!selectedSpecies || !effectiveFeedType) return null;
    return calculateFeed(selectedSpecies, effectiveFeedType, input, lang);
  }, [selectedSpecies, effectiveFeedType, input, lang]);

  const handleSwitchToVisitor = () => {
    resetToVisitorMode();
    setIsAdminView(false);
    setIsAdminModalOpen(false);
    setIsActivationModalOpen(false);
    setIsActivated(false);
    showToast(
      lang === 'ar'
        ? '🔒 تم التحويل إلى وضع الزائر (المعاينة): دجاج اللحم متاح للتجربة، وباقي السلالات الـ 10 مقفلة.'
        : 'Switched to Visitor Trial Mode: Broiler is free, other 10 species locked.',
      'info'
    );
  };

  // إذا كان المهندس زكريا في وضع لوحة التحكم المستقلة
  if (isAdminView) {
    return (
      <AdminDashboard
        onBackToApp={() => {
          setIsAdminView(false);
          try {
            if (window.location.hash) {
              window.history.pushState('', document.title, window.location.pathname + window.location.search);
            }
          } catch {}
        }}
        onSwitchToVisitor={handleSwitchToVisitor}
      />
    );
  }

  return (
    <div
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      className="min-h-screen bg-slate-50/70 text-slate-900 font-sans flex flex-col justify-between selection:bg-emerald-500 selection:text-white"
    >
      <div>
        <Header
          lang={lang}
          onSelectLang={setLang}
          onSelectPreset={handleSelectPreset}
          onOpenExportModal={() => setIsExportModalOpen(true)}
          onOpenPricingModal={() => setIsPricingModalOpen(true)}
          onOpenIpModal={() => setIsIpModalOpen(true)}
          onOpenActivationModal={() => {
            setIsAdminDirectMode(false);
            setIsActivationModalOpen(true);
          }}
          onOpenAdmin={() => setIsAdminModalOpen(true)}
          isActivated={isActivated}
        />

        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Visitor trial banner when not activated */}
          {!isActivated && (
            <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50/95 p-4 text-amber-900 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 shrink-0">
                  <Lock className="size-4" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold flex items-center gap-2">
                    <span>{lang === 'ar' ? 'وضع الزائر (معاينة تجريبية مجانية)' : 'Visitor Trial Mode'}</span>
                    <span className="rounded-full bg-emerald-600 text-white text-[10px] px-2 py-0.5 font-bold">
                      {lang === 'ar' ? 'دجاج اللحم متاح' : 'Broiler Unlocked'}
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-amber-800/85 mt-0.5">
                    {lang === 'ar'
                      ? 'سلالة دجاج اللحم متاحة بالكامل للتجربة الحرة. باقي السلالات الـ 10 مقفلة وتتطلب كود تفعيل.'
                      : 'Broiler feed calculation is fully available for free trial. The other 10 species require activation key.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsActivationModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3.5 py-2 text-xs shadow-xs transition cursor-pointer shrink-0"
              >
                <KeyRound className="size-3.5" />
                <span>{lang === 'ar' ? 'تفعيل باقي السلالات 🔑' : 'Unlock All Species 🔑'}</span>
              </button>
            </div>
          )}

          {/* دجاج اللحم متاح دائماً ومجاناً للجميع للتجربة والمعاينة، وباقي الحيوانات تطلب التفعيل */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Species & Inputs (5 cols on lg) */}
            <div className="lg:col-span-5 space-y-6">
              <SpeciesSelector
                selectedSpeciesId={input.speciesId}
                onSelectSpecies={handleSelectSpecies}
                lang={lang}
                isActivated={isActivated}
                onRequireActivation={() => setIsActivationModalOpen(true)}
              />

              {selectedSpecies && (
                <InputForm
                  species={selectedSpecies}
                  input={input}
                  onChange={handleInputChange}
                  onCalculate={handleCalculate}
                  lang={lang}
                />
              )}
            </div>

            {/* Right Column: Calculations & Results (7 cols on lg) */}
            <div className="lg:col-span-7 space-y-6">
              <ResultsView
                species={selectedSpecies}
                feedType={effectiveFeedType}
                input={input}
                result={calculationResult}
                onReset={handleReset}
                lang={lang}
              />
            </div>
          </div>
        </main>
      </div>

      <Footer
        lang={lang}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenIpModal={() => setIsIpModalOpen(true)}
        onOpenAdmin={() => setIsAdminModalOpen(true)}
      />
      <AppExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        lang={lang}
        onOpenIpModal={() => setIsIpModalOpen(true)}
      />
      <GlobalPricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
        lang={lang}
      />
      <IntellectualPropertyModal
        isOpen={isIpModalOpen}
        onClose={() => setIsIpModalOpen(false)}
        lang={lang}
      />
      <ActivationModal
        isOpen={isActivationModalOpen}
        onClose={() => {
          setIsActivationModalOpen(false);
          setIsAdminDirectMode(false);
          setIsActivated(getLicenseStatus().isActivated);
        }}
        lang={lang}
        initialAdminMode={isAdminDirectMode}
        onActivationSuccess={() => {
          setIsActivated(true);
          showToast(
            lang === 'ar' ? 'تم تفعيل النسخة الاحترافية بنجاح! مبروك 🎉' : 'Pro License Activated Successfully! 🎉',
            'success'
          );
        }}
        onDeactivate={handleSwitchToVisitor}
      />
      <AdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onSwitchToVisitor={handleSwitchToVisitor}
        onActivationSuccess={() => {
          setIsActivated(true);
          showToast(
            lang === 'ar' ? 'تم تفعيل النسخة الاحترافية بنجاح! 🎉' : 'Activated Successfully! 🎉',
            'success'
          );
        }}
      />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
