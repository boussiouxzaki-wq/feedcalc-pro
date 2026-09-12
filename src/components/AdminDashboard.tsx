import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Key, 
  Copy, 
  Check, 
  Clock, 
  User, 
  Calendar, 
  Smartphone, 
  Share2, 
  Lock, 
  LogOut, 
  Trash2, 
  RefreshCw,
  ExternalLink,
  Phone,
  Sparkles,
  ChevronLeft
} from 'lucide-react';
import { generateClientKey, activateMasterAdmin, resetToVisitorMode, LOCKABLE_SERVICES, getServiceByCode } from '../utils/license';
import { isMasterAdminPassword } from '../utils/adminSecret';

interface GeneratedKeyRecord {
  id: string;
  clientName: string;
  key: string;
  durationMonths: number;
  serviceCode: string;
  serviceNameAr: string;
  createdAt: string;
  expiresAt: string;
  note?: string;
}

interface AdminDashboardProps {
  onBackToApp?: () => void;
  onSwitchToVisitor?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBackToApp, onSwitchToVisitor }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [visitorMsg, setVisitorMsg] = useState('');

  // Key generation form
  const [clientName, setClientName] = useState('');
  const [durationMonths, setDurationMonths] = useState<number>(1);
  const [selectedServiceCode, setSelectedServiceCode] = useState<string>('LAY');
  const [clientPhone, setClientPhone] = useState('');
  const [lastGeneratedKey, setLastGeneratedKey] = useState<string | null>(null);
  const [lastGeneratedExpiry, setLastGeneratedExpiry] = useState<string | null>(null);
  const [lastGeneratedServiceName, setLastGeneratedServiceName] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);

  // History storage
  const [history, setHistory] = useState<GeneratedKeyRecord[]>(() => {
    try {
      const saved = localStorage.getItem('fc_admin_keys_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Check if admin is already logged in session
  useEffect(() => {
    const adminSession = sessionStorage.getItem('fc_admin_auth');
    if (adminSession === 'authorized_zaki') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (isMasterAdminPassword(passwordInput.trim())) {
      setIsAuthenticated(true);
      sessionStorage.setItem('fc_admin_auth', 'authorized_zaki');
      setAuthError('');
    } else {
      setAuthError('كلمة المرور غير صحيحة، الوصول مقتصر على المهندس زكريا فقط.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('fc_admin_auth');
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    const name = clientName.trim() || 'مشترك جديد';
    const totalDays = durationMonths * 30;
    const service = getServiceByCode(selectedServiceCode);
    const serviceName = service ? service.nameAr : 'الخدمة';

    const generated = generateClientKey(name, totalDays, selectedServiceCode);
    const expDateStr = generated.formattedExpiry || generated.expiryDate.toISOString().split('T')[0];

    setLastGeneratedKey(generated.key);
    setLastGeneratedExpiry(expDateStr);
    setLastGeneratedServiceName(serviceName);

    const newRecord: GeneratedKeyRecord = {
      id: Date.now().toString(),
      clientName: name,
      key: generated.key,
      durationMonths,
      serviceCode: generated.serviceCode,
      serviceNameAr: serviceName,
      createdAt: new Date().toISOString().split('T')[0],
      expiresAt: expDateStr,
      note: clientPhone.trim() || undefined
    };

    const updated = [newRecord, ...history];
    setHistory(updated);
    try {
      localStorage.setItem('fc_admin_keys_history', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleCopyKey = () => {
    if (!lastGeneratedKey) return;
    navigator.clipboard.writeText(lastGeneratedKey).then(() => {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    });
  };

  const getWhatsAppMessage = () => {
    if (!lastGeneratedKey || !lastGeneratedExpiry) return '';
    const currentUrl = window.location.origin;
    const name = clientName.trim() || 'عزيزي المشترك';
    const service = getServiceByCode(selectedServiceCode);
    const serviceText = service ? `${service.emoji} ${service.nameAr}` : 'الخدمة';

    return `مرحباً ${name} 🌾

يسرنا تفعيل اشتراكك في تطبيق FeedCalc Pro لحساب تركيبات الأعلاف الاحترافية:

🔑 كود التفعيل الخاص بك:
${lastGeneratedKey}

📌 الأيقونة / الخدمة المرخصة: ${serviceText}
(تنبيه: هذا الكود مخصص لفتح أيقونة ${serviceText} فقط).

📅 مدة الاشتراك: ${durationMonths === 12 ? 'سنة كاملة' : durationMonths + ' شهر'}
⏳ صالح لغاية: ${lastGeneratedExpiry}

🌐 رابط التطبيق:
${currentUrl}

خطوات الاستخدام:
1. افتح الرابط أعلاه على هاتفك أو حاسوبك.
2. اضغط على أيقونة (${serviceText}) المقفلة في التطبيق.
3. ألصق كود التفعيل واضغط "تفعيل الاشتراك".

بالتوفيق في مشروعك ومزرعتك!
المهندس زكريا بسيود (0655870392)`;
  };

  const handleCopyWhatsApp = () => {
    const msg = getWhatsAppMessage();
    navigator.clipboard.writeText(msg).then(() => {
      setCopiedMsg(true);
      setTimeout(() => setCopiedMsg(false), 2500);
    });
  };

  const handleActivateThisDevice = () => {
    activateMasterAdmin();
    setVisitorMsg('تم تفعيل جهازك بنجاح بترخيص المطور الدائم (VIP Master) ✨');
    setTimeout(() => setVisitorMsg(''), 4000);
  };

  const handleTestVisitorMode = () => {
    if (confirm('هل تريد قفل التفعيل والتحويل فوراً لوضع الزائر (دجاج اللحم فقط مفتوح وباقي السلالات مقفلة للتجربة)؟')) {
      resetToVisitorMode();
      if (onSwitchToVisitor) {
        onSwitchToVisitor();
      } else if (onBackToApp) {
        onBackToApp();
      }
    }
  };

  const handleDeleteHistoryItem = (id: string) => {
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
    localStorage.setItem('fc_admin_keys_history', JSON.stringify(updated));
  };

  // If not logged in, show Secure Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4" dir="rtl">
        <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-emerald-500/40 p-6 sm:p-8 shadow-2xl text-white">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="size-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3 shadow-inner">
              <ShieldCheck className="size-8" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              لوحة تحكم المهندس زكريا
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              نظام إدارة الاشتراكات وتوليد الأكواد لـ FeedCalc Pro
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                كلمة المرور السرية للإدارة:
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setAuthError('');
                  }}
                  placeholder="أدخل كلمة السر الخاصة بك..."
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  dir="ltr"
                  autoFocus
                />
              </div>
            </div>

            {authError && (
              <div className="p-3 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-medium">
                {authError}
              </div>
            )}

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 py-3 px-4 text-sm font-bold text-slate-950 hover:text-white transition shadow-lg shadow-emerald-950/40 cursor-pointer"
            >
              <Key className="size-4" />
              <span>دخول إلى لوحة التحكم</span>
            </button>
          </form>

          {onBackToApp && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={onBackToApp}
                className="text-xs text-slate-500 hover:text-slate-300 transition flex items-center justify-center gap-1 mx-auto cursor-pointer"
              >
                <span>العودة للتطبيق الرئيسي</span>
                <ChevronLeft className="size-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Admin Dashboard Content
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8" dir="rtl">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header Bar */}
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-slate-900/90 border border-slate-800 p-4 sm:p-5 shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="size-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <span>لوحة التحكم وتوليد الأكواد</span>
                <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                  المهندس زكريا
                </span>
              </h1>
              <p className="text-xs text-slate-400">توليد أكواد الاشتراكات الشهرية وتصدير رسائل الواتساب للزبائن</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestVisitorMode}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/15 px-3 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/25 transition cursor-pointer"
              title="تجربة التطبيق كزائر بدون أي تفعيل (دجاج اللحم فقط والباقي مقفل)"
            >
              <Lock className="size-3.5 text-amber-400" />
              <span>🔒 تجربة وضع الزائر</span>
            </button>
            {onBackToApp && (
              <button
                type="button"
                onClick={onBackToApp}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition cursor-pointer"
              >
                <span>فتح التطبيق الرئيسي</span>
                <ExternalLink className="size-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition cursor-pointer"
            >
              <LogOut className="size-3.5" />
              <span>خروج</span>
            </button>
          </div>
        </header>

        {/* Grid: Generator & Result */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Form (7 cols) */}
          <div className="lg:col-span-7 rounded-2xl bg-slate-900 border border-slate-800 p-5 sm:p-6 shadow-xl space-y-5">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-base border-b border-slate-800 pb-3">
              <Sparkles className="size-5" />
              <span>توليد كود اشتراك جديد</span>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  الأيقونة / الخدمة المراد فتحها للزبون بهذا الكود (كود أحادي الخدمة):
                </label>
                <select
                  value={selectedServiceCode}
                  onChange={(e) => setSelectedServiceCode(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-emerald-500/50 px-3.5 py-2.5 text-sm text-emerald-300 font-bold focus:border-emerald-400 focus:outline-none cursor-pointer"
                >
                  {LOCKABLE_SERVICES.map((s) => (
                    <option key={s.code} value={s.code} className="bg-slate-950 text-white font-medium">
                      {s.emoji} {s.nameAr} {s.code === 'ALL' ? '— (VIP كافة الأيقونات معاً)' : '— [أيقونة واحدة فقط]'}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-amber-400/90 mt-1 flex items-center gap-1">
                  <span>💡</span>
                  <span>هذا الكود مخصص لفتح الأيقونة المختارة أعلاه ولن يقوم بفتح أي خدمات أو أيقونات أخرى.</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  اسم الزبون أو اسم المزرعة:
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="مثال: مزرعة البركة للدواجن - سطيف"
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    مدة الاشتراك:
                  </label>
                  <select
                    value={durationMonths}
                    onChange={(e) => setDurationMonths(Number(e.target.value))}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none cursor-pointer"
                  >
                    <option value={1}>شهر واحد (1 شهر)</option>
                    <option value={2}>شهران (2 شهر)</option>
                    <option value={3}>3 أشهر (فصلي)</option>
                    <option value={6}>6 أشهر (نصف سنوي)</option>
                    <option value={12}>سنة كاملة (12 شهر - VIP)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    رقم هاتف الزبون (اختياري للتدوين):
                  </label>
                  <input
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="مثال: 0655..."
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 py-3 px-4 text-sm font-extrabold text-slate-950 hover:text-white transition shadow-lg shadow-emerald-950/40 cursor-pointer mt-2"
              >
                <Key className="size-4" />
                <span>توليد كود التفعيل المخصص لهذه الأيقونة</span>
              </button>
            </form>

            {/* If key was generated */}
            {lastGeneratedKey && (
              <div className="mt-5 rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-4 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-300">الكود المولد بنجاح:</span>
                  <span className="text-[11px] text-slate-400">صالح لغاية: {lastGeneratedExpiry}</span>
                </div>

                <div className="flex items-center gap-2 bg-slate-950/90 rounded-lg p-3 border border-emerald-500/30">
                  <code className="text-emerald-300 font-mono font-bold text-sm tracking-widest flex-1 text-center select-all" dir="ltr">
                    {lastGeneratedKey}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyKey}
                    className="p-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-slate-950 transition cursor-pointer"
                    title="نسخ الكود"
                  >
                    {copiedKey ? <Check className="size-4" /> : <Copy className="size-4" />}
                  </button>
                </div>

                {/* Service confirmation badge */}
                <div className="flex items-center gap-2 bg-amber-500/15 border border-amber-500/30 rounded-lg p-2.5 text-xs text-amber-200">
                  <span className="text-amber-400 font-bold">🔒 مقفل على أيقونة:</span>
                  <span className="font-bold underline text-white">{lastGeneratedServiceName}</span>
                  <span className="text-[11px] text-slate-400 mr-auto">(لا يفتح أي خدمة أخرى)</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCopyWhatsApp}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2 px-3 text-xs transition cursor-pointer"
                  >
                    <Share2 className="size-3.5" />
                    <span>{copiedMsg ? 'تم نسخ رسالة الواتساب!' : 'نسخ رسالة الواتساب كاملة للزبون'}</span>
                  </button>

                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(getWhatsAppMessage())}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 font-bold py-2 px-3 text-xs transition cursor-pointer"
                  >
                    <span>فتح WhatsApp مباشرة</span>
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Permanent Master VIP License & Instructions (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl space-y-3.5">
              <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-400" />
                <span>رخصة المطور الدائمة المعتمدة (VIP Master)</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                حساب الإدارة الخاص بك محمي ومشفر بالكامل. يمكنك تفعيل هذا الجهاز فورياً بنقرة واحدة، أو تجربة وضع الزائر لمعاينة التطبيق كما يراه الزبون الجديد:
              </p>

              {visitorMsg && (
                <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center animate-fade-in">
                  {visitorMsg}
                </div>
              )}

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleActivateThisDevice}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold py-2.5 px-3 text-xs transition cursor-pointer shadow-md shadow-emerald-950/40"
                >
                  <Sparkles className="size-4 text-amber-300" />
                  <span>⚡ تفعيل هذا الجهاز برخصة المطور الدائمة (VIP)</span>
                </button>

                <button
                  type="button"
                  onClick={handleTestVisitorMode}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold py-2.5 px-3 text-xs transition cursor-pointer"
                >
                  <Lock className="size-4" />
                  <span>🔒 تجربة وضع الزائر (قفل التفعيل ومعاينة الزبون)</span>
                </button>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl space-y-3 text-xs text-slate-400 leading-relaxed">
              <h4 className="font-bold text-slate-200 flex items-center gap-2">
                <Smartphone className="size-4 text-emerald-400" />
                <span>كيفية الاستخدام مع الزبائن:</span>
              </h4>
              <ol className="list-decimal list-inside space-y-2 text-slate-300">
                <li>يتصل بك الزبون أو يراسلك على الواتساب طالباً الاشتراك.</li>
                <li>تدخل هنا وتكتب اسمه وتحدد المدة (مثلاً 1 شهر أو 3 أشهر).</li>
                <li>تضغط على "توليد كود التفعيل" ثم "نسخ رسالة الواتساب".</li>
                <li>تلصق الرسالة في محادثته على الواتساب.</li>
                <li>بمجرد إدخاله الكود، يفتح التطبيق معه ويعمل بكفاءة حتى تاريخ الانتهاء!</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Generated Keys History */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="size-4 text-emerald-400" />
              <span>سجل الأكواد التي قمت بتوليدها ({history.length})</span>
            </h3>
            {history.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('هل أنت متأكد من مسح سجل الأكواد من هذا الجهاز؟')) {
                    setHistory([]);
                    localStorage.removeItem('fc_admin_keys_history');
                  }
                }}
                className="text-[11px] text-slate-500 hover:text-rose-400 transition flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="size-3" />
                <span>مسح السجل</span>
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">
              لم تقم بتوليد أي أكواد بعد في هذا الجهاز. عند توليد أول كود سيظهر هنا تلقائياً.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-2 font-semibold">المشترك</th>
                    <th className="pb-2 font-semibold">الخدمة / الأيقونة</th>
                    <th className="pb-2 font-semibold">الكود</th>
                    <th className="pb-2 font-semibold">المدة</th>
                    <th className="pb-2 font-semibold">تاريخ التوليد</th>
                    <th className="pb-2 font-semibold">تاريخ الانتهاء</th>
                    <th className="pb-2 font-semibold">ملاحظة</th>
                    <th className="pb-2 font-semibold text-center">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {history.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 font-bold text-white">{item.clientName}</td>
                      <td className="py-3">
                        <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold px-2 py-0.5 rounded text-[11px]">
                          {item.serviceNameAr || 'كافة الخدمات'}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-emerald-400 select-all" dir="ltr">{item.key}</td>
                      <td className="py-3 text-slate-300">{item.durationMonths} شهر</td>
                      <td className="py-3 text-slate-400">{item.createdAt}</td>
                      <td className="py-3 text-amber-300">{item.expiresAt}</td>
                      <td className="py-3 text-slate-400">{item.note || '-'}</td>
                      <td className="py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(item.key);
                              alert('تم نسخ الكود: ' + item.key);
                            }}
                            className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-emerald-400 transition cursor-pointer"
                            title="نسخ الكود"
                          >
                            <Copy className="size-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteHistoryItem(item.id)}
                            className="p-1.5 rounded-md bg-slate-800 hover:bg-rose-900/40 text-rose-400 transition cursor-pointer"
                            title="حذف من السجل"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
