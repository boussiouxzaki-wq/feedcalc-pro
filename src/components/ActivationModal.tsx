import React, { useState, useEffect } from 'react';
import { 
  KeyRound, 
  ShieldCheck, 
  CheckCircle2, 
  Phone, 
  MessageSquare, 
  Sparkles, 
  Lock, 
  AlertCircle,
  X,
  Copy,
  Check,
  Award,
  Calendar,
  Clock,
  RefreshCw
} from 'lucide-react';
import { Language } from '../types';
import { getLicenseStatus, activateApp, deactivateApp, resetToVisitorMode, generateClientKey } from '../utils/license';
import { isMasterAdminPassword } from '../utils/adminSecret';

interface ActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onActivationSuccess?: () => void;
  onDeactivate?: () => void;
  initialAdminMode?: boolean;
}

export const ActivationModal: React.FC<ActivationModalProps> = ({
  isOpen,
  onClose,
  lang,
  onActivationSuccess,
  onDeactivate,
  initialAdminMode = false
}) => {
  const [licenseStatus, setLicenseStatus] = useState(getLicenseStatus());
  const [inputKey, setInputKey] = useState('');
  const [clientName, setClientName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Admin generator mode (for Eng. Zakarya)
  const [showAdminGenerator, setShowAdminGenerator] = useState(initialAdminMode);
  const [newClientName, setNewClientName] = useState('');
  const [selectedDurationDays, setSelectedDurationDays] = useState<number>(30); // Default: 30 days monthly
  const [generatedInfo, setGeneratedInfo] = useState<{
    key: string;
    expiryDate: Date;
    days: number;
    formattedExpiry: string;
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);

  useEffect(() => {
    if (isOpen && initialAdminMode) {
      // تفعيل التطبيق للمهندس زكريا تلقائياً بترخيص دائم VIP Master
      activateApp('FC-MASTER-UNLIMITED', 'المهندس زكريا بسيود (المطور)');
      setLicenseStatus(getLicenseStatus());
      if (onActivationSuccess) onActivationSuccess();

      setShowAdminGenerator(true);
      setSuccessMsg('مرحباً بك يا مهندس زكريا! تم تفعيل نسختك بالكامل كـ VIP Master وفتح لوحة توليد الاشتراكات لزبائنك.');
    }
  }, [isOpen, initialAdminMode]);

  if (!isOpen) return null;

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!inputKey.trim()) {
      setErrorMsg(lang === 'ar' ? 'يرجى إدخال مفتاح التفعيل' : 'Please enter an activation key');
      return;
    }

    // Special secret code to unlock developer key generator for Eng. Zakarya
    if (isMasterAdminPassword(inputKey)) {
      // تفعيل التطبيق للمهندس زكريا تلقائياً بترخيص دائم VIP Master حتى لا يتعامل معه كتجريبي أو زبون أبداً
      activateApp('FC-MASTER-UNLIMITED', 'المهندس زكريا بسيود (المطور)');
      setLicenseStatus(getLicenseStatus());
      if (onActivationSuccess) onActivationSuccess();

      setShowAdminGenerator(true);
      setInputKey('');
      setSuccessMsg('مرحباً بك يا مهندس زكريا! تم تفعيل نسختك بالكامل كـ VIP Master وفتح لوحة توليد الاشتراكات لزبائنك.');
      return;
    }

    const result = activateApp(inputKey, clientName);
    if (result.success) {
      setLicenseStatus(getLicenseStatus());
      setSuccessMsg(result.message);
      if (onActivationSuccess) onActivationSuccess();
      setTimeout(() => {
        onClose();
      }, 2000);
    } else {
      setErrorMsg(result.message);
    }
  };

  const handleDeactivate = () => {
    if (confirm(lang === 'ar' ? 'هل أنت متأكد من رغبتك في إلغاء التفعيل وقفل التطبيق وتجربة وضع الزائر؟' : 'Are you sure you want to deactivate and lock the app?')) {
      resetToVisitorMode();
      const updated = getLicenseStatus();
      setLicenseStatus(updated);
      setSuccessMsg(lang === 'ar' ? 'تم إلغاء التفعيل وقفل التطبيق بنجاح' : 'Deactivated successfully');
      if (onDeactivate) onDeactivate();
      setTimeout(() => {
        onClose();
      }, 400);
    }
  };

  const handleGenerateKey = () => {
    const info = generateClientKey(newClientName, selectedDurationDays);
    setGeneratedInfo(info);
    setCopiedKey(false);
    setCopiedMessage(false);
  };

  const copyToClipboard = (text: string, type: 'key' | 'msg') => {
    navigator.clipboard.writeText(text);
    if (type === 'key') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2000);
    }
  };

  const getWhatsAppClientTemplate = () => {
    if (!generatedInfo) return '';
    const name = newClientName ? `السيد/مزرعة: ${newClientName}` : 'عزيزي المربي';
    return `السلام عليكم ورحمة الله وبركاته،
${name}،
شكراً لاشتراكك في تطبيق حاسبة الأعلاف الذكية FeedCalc Pro 🌾

🔑 كود التفعيل الشهري الخاص بك:
${generatedInfo.key}

⏳ مدة الاشتراك: ${generatedInfo.days} يوماً
📅 تاريخ انتهاء الصلاحية: ${generatedInfo.formattedExpiry}

طريقة التفعيل:
1. افتح التطبيق، واضغط على زر "تفعيل الترخيص 🔑" في الأعلى.
2. الصق الكود أعلاه واضغط "تفعيل النسخة الآن".

لأي استفسار أو تجديد الاشتراك القادم، يسعدنا تواصلكم:
المهندس زكريا بسيود | هاتف: +213 655 870 392`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        dir={lang === 'ar' ? 'rtl' : 'ltr'} 
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200 text-slate-800"
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-900 px-6 py-5 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 end-4 rounded-lg bg-white/10 p-1.5 text-white hover:bg-white/20 transition cursor-pointer"
            title="إغلاق"
          >
            <X className="size-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-amber-400 text-slate-950 font-black shadow-inner">
              <KeyRound className="size-6" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                {lang === 'ar' ? 'نظام الاشتراكات والترخيص الشهري' : 'FeedCalc Pro Subscription & License'}
                {licenseStatus.isActivated && (
                  <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                    PRO المفعل
                  </span>
                )}
              </h3>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                {lang === 'ar' ? 'اشتراك شهري متجدد للدواجن والمواشي' : 'Recurring Monthly Commercial License'}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Current Status Card */}
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${
            licenseStatus.isActivated 
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950' 
              : licenseStatus.isExpired
              ? 'bg-red-50/80 border-red-300 text-red-950'
              : 'bg-amber-50/80 border-amber-200 text-amber-950'
          }`}>
            {licenseStatus.isActivated ? (
              <ShieldCheck className="size-6 text-emerald-600 shrink-0 mt-0.5" />
            ) : licenseStatus.isExpired ? (
              <AlertCircle className="size-6 text-red-600 shrink-0 mt-0.5" />
            ) : (
              <Lock className="size-6 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm">
                  {licenseStatus.isActivated 
                    ? (lang === 'ar' ? 'الاشتراك سارٍ ونشط ✅' : 'Active Subscription ✅')
                    : licenseStatus.isExpired
                    ? (lang === 'ar' ? '⚠️ انتهت صلاحية اشتراكك الشهري!' : '⚠️ Monthly Subscription Expired!')
                    : (lang === 'ar' ? 'نسخة تجريبية محدودة (Free Trial)' : 'Free Demo / Trial Mode')}
                </span>
                {licenseStatus.isActivated && (
                  <button 
                    type="button"
                    onClick={handleDeactivate} 
                    className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-100 hover:bg-red-200 border border-red-300 px-2.5 py-1 rounded-lg transition cursor-pointer shadow-2xs"
                    title="إلغاء التفعيل للرجوع إلى وضع القفل والتجربة كزائر"
                  >
                    <span>🔒</span>
                    <span>{lang === 'ar' ? 'إلغاء التفعيل وقفل التطبيق' : 'Deactivate & Lock'}</span>
                  </button>
                )}
              </div>

              {/* Remaining Days Counter */}
              {licenseStatus.isActivated && licenseStatus.daysRemaining !== null && (
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-emerald-100/80 px-2.5 py-1 text-xs font-bold text-emerald-900">
                  <Clock className="size-3.5 text-emerald-700" />
                  <span>
                    {licenseStatus.daysRemaining > 365 
                      ? 'ترخيص دائم مفتوح' 
                      : `متبقي في اشتراكك: ${licenseStatus.daysRemaining} يوماً`}
                  </span>
                </div>
              )}

              <p className="text-xs opacity-85 mt-1.5 leading-relaxed">
                {licenseStatus.isActivated
                  ? (lang === 'ar' 
                      ? `الكود: ${licenseStatus.licenseKey} ${licenseStatus.clientName ? `| العميل: ${licenseStatus.clientName}` : ''}`
                      : `Key: ${licenseStatus.licenseKey}`)
                  : licenseStatus.isExpired
                  ? (lang === 'ar' 
                      ? 'انتهت فترة الـ 30 يوماً لهذا الشهر. لتجديد الاشتراك واستمرار حسابات الأعلاف لمزرعتك، تواصل مع المهندس زكريا بسيود.'
                      : 'Your 30-day subscription has ended. Contact Eng. Zakarya to renew.')
                  : (lang === 'ar' 
                      ? 'لفتح حسابات كافة الـ 13 كائناً حياً (أغنام، أبقار، دواجن، أسماك) وتصدير التقارير، يرجى تفعيل اشتراكك الشهري.'
                      : 'To unlock all 13 species and advanced PDF exports, please activate your monthly license.')}
              </p>
            </div>
          </div>

          {/* Activation Form */}
          {(!licenseStatus.isActivated || showAdminGenerator) && (
            <form onSubmit={handleActivate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {showAdminGenerator 
                    ? 'إدخال كود ترخيص آخر أو كلمة السر:'
                    : (lang === 'ar' ? 'كود الاشتراك الشهري (Activation Key):' : 'Activation / License Key:')
                  }
                </label>
                <input
                  type="text"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  placeholder="مثال: FCM30-XXXXXX-XXXX-ZB"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-mono tracking-wider font-bold text-slate-900 uppercase focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {lang === 'ar' ? 'اسم صاحب المزرعة أو العميل (اختياري):' : 'Farm / Owner Name (Optional):'}
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder={lang === 'ar' ? 'مثال: مزرعة البركة للدواجن' : 'e.g. Green Valley Farm'}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500"
                />
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 text-xs font-bold text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                  <CheckCircle2 className="size-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="size-4" />
                <span>{lang === 'ar' ? 'تفعيل الاشتراك الآن' : 'Activate Subscription Now'}</span>
              </button>
            </form>
          )}

          {/* Contact Developer for Monthly Renewal / Purchase */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Award className="size-4 text-emerald-700" />
                {lang === 'ar' ? 'طلب كود التفعيل / تجديد الاشتراك الشهري:' : 'Request Monthly Key / Renewal:'}
              </span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                المهندس زكريا بسيود
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {lang === 'ar' 
                ? 'للحصول على كود الاشتراك الشهري أو تجديد باقتك، تواصل مباشرة مع المهندس زكريا عبر الهاتف أو واتساب:'
                : 'To get your monthly activation key or renew your subscription, contact the developer directly:'}
            </p>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <a
                href="https://wa.me/213655870392?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%20%D9%85%D9%87%D9%86%D8%AF%D8%B3%20%D8%B2%D9%83%D8%B1%D9%8A%D8%A7%D8%8C%20%D8%A3%D8%B1%D9%8A%D8%AF%20%D8%A7%D9%84%D8%A7%D8%B4%D8%AA%D8%B1%D8%A7%D9%83%20%D8%A7%D9%84%D8%B4%D9%87%D8%B1%D9%8A%20%D9%81%D9%8A%20%D8%AA%D8%B7%D8%A8%D9%8A%D9%82%20FeedCalc%20Pro"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <MessageSquare className="size-4" />
                <span>واتساب فوري</span>
              </a>

              <a
                href="tel:+213655870392"
                className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white p-2.5 text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Phone className="size-4" />
                <span>اتصال: 0655870392</span>
              </a>
            </div>
          </div>

          {/* Admin Generator Section (Special Access for Eng. Zakarya) */}
          {showAdminGenerator && (
            <div className="rounded-xl border-2 border-emerald-600 bg-emerald-50/60 p-4 space-y-3.5 animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                <h4 className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                  <span>🛠️</span> لوحة المهندس زكريا لتوليد اشتراكات الزبائن
                </h4>
                <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                  Admin Master
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    اسم الزبون أو المزرعة:
                  </label>
                  <input
                    type="text"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="مثال: مزرعة أحمد - سطيف"
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs bg-white focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    مدة الاشتراك المطلوب:
                  </label>
                  <select
                    value={selectedDurationDays}
                    onChange={(e) => setSelectedDurationDays(parseInt(e.target.value, 10))}
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs bg-white font-bold text-emerald-900 focus:border-emerald-600"
                  >
                    <option value={30}>⭐ اشتراك شهري (30 يوماً - المعتاد)</option>
                    <option value={60}>اشتراك شهرين (60 يوماً)</option>
                    <option value={90}>اشتراك فصلي (3 أشهر / 90 يوماً)</option>
                    <option value={180}>اشتراك نصف سنوي (6 أشهر)</option>
                    <option value={365}>اشتراك سنوي كامل (365 يوماً)</option>
                    <option value={7}>تجربة مجانية للزبون (7 أيام فقط)</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerateKey}
                className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <RefreshCw className="size-3.5" />
                <span>توليد كود الاشتراك الشهري المحدد</span>
              </button>

              {/* Generated Result Box */}
              {generatedInfo && (
                <div className="p-3.5 bg-white rounded-xl border border-emerald-300 space-y-2.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block">كود التفعيل الشهري:</span>
                      <span className="font-mono font-black text-sm text-emerald-800 tracking-wider">
                        {generatedInfo.key}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(generatedInfo.key, 'key')}
                      className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                    >
                      {copiedKey ? <Check className="size-3.5 text-emerald-700" /> : <Copy className="size-3.5" />}
                      <span>{copiedKey ? 'تم نسخ الكود' : 'نسخ الكود'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 border-t border-slate-100 pt-2">
                    <Calendar className="size-3.5 text-emerald-600" />
                    <span>صالح لمدة <strong>{generatedInfo.days} يوماً</strong> حتى: <strong>{generatedInfo.formattedExpiry}</strong></span>
                  </div>

                  <button
                    type="button"
                    onClick={() => copyToClipboard(getWhatsAppClientTemplate(), 'msg')}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <MessageSquare className="size-3.5 text-emerald-400" />
                    <span>{copiedMessage ? '✅ تم نسخ رسالة الواتساب الجاهزة!' : '📋 نسخ رسالة الواتساب الجاهزة لإرسالها للزبون'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
