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
  ChevronLeft,
  Zap,
  Building2,
  Save,
  Download,
  FileText
} from 'lucide-react';
import { 
  generateClientKey, 
  generateBulkKeys,
  activateMasterAdmin, 
  resetToVisitorMode, 
  LOCKABLE_SERVICES, 
  getServiceByCode,
  getAutoOrdersHistory,
  clearAutoOrdersHistory,
  AutoOrderRecord,
  SINGLE_SERVICE_PRICE_USD
} from '../utils/license';
import { isMasterAdminPassword } from '../utils/adminSecret';
import { 
  getPaymentSettings, 
  savePaymentSettings, 
  DEFAULT_PAYMENT_SETTINGS, 
  PaymentSettings, 
  hasConfiguredPayment,
  hasBankOrCcp
} from '../utils/paymentSettings';

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
  const [selectedServiceCode, setSelectedServiceCode] = useState<string>('BRL');
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

  const [autoOrders, setAutoOrders] = useState<AutoOrderRecord[]>(() => getAutoOrdersHistory());

  // Developer manual payment settings (stored persistently in localStorage)
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(getPaymentSettings);
  const [savePaymentSuccess, setSavePaymentSuccess] = useState(false);

  // Bulk Keys Generator State
  const [bulkCount, setBulkCount] = useState<number>(50);
  const [bulkServiceCode, setBulkServiceCode] = useState<string>('BRL');
  const [bulkDurationMonths, setBulkDurationMonths] = useState<number>(1);
  const [bulkBatchTag, setBulkBatchTag] = useState<string>('Batch-1');
  const [bulkResult, setBulkResult] = useState<{ keys: string[]; csvContent: string; formattedList: string } | null>(null);

  const handleGenerateBulk = (e: React.FormEvent) => {
    e.preventDefault();
    const res = generateBulkKeys({
      count: bulkCount,
      serviceCode: bulkServiceCode,
      durationMonths: bulkDurationMonths,
      batchTag: bulkBatchTag.trim() || 'Store'
    });
    setBulkResult(res);
  };

  const handleDownloadBulkCsv = () => {
    if (!bulkResult) return;
    const blob = new Blob([bulkResult.csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `FeedCalc_Keys_${bulkServiceCode}_${bulkCount}_codes.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Check if admin is already logged in session
  useEffect(() => {
    const adminSession = sessionStorage.getItem('fc_admin_auth');
    if (adminSession === 'authorized_zaki') {
      setIsAuthenticated(true);
    }
    setAutoOrders(getAutoOrdersHistory());
    setPaymentSettings(getPaymentSettings());
  }, []);

  const handleSavePaymentSettings = (e: React.FormEvent) => {
    e.preventDefault();
    savePaymentSettings(paymentSettings);
    setSavePaymentSuccess(true);
    setTimeout(() => setSavePaymentSuccess(false), 3000);
  };

  const handleClearPaymentSettings = () => {
    if (window.confirm('هل أنت متأكد من تفريغ كافة بيانات الحسابات؟ ستبقى فارغة ولن يظهر أي رقم حساب للزبائن.')) {
      savePaymentSettings(DEFAULT_PAYMENT_SETTINGS);
      setPaymentSettings(DEFAULT_PAYMENT_SETTINGS);
      setSavePaymentSuccess(true);
      setTimeout(() => setSavePaymentSuccess(false), 3000);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (isMasterAdminPassword(passwordInput.trim())) {
      setIsAuthenticated(true);
      sessionStorage.setItem('fc_admin_auth', 'authorized_zaki');
      setAuthError('');
    } else {
      setAuthError('كلمة المرور غير صحيحة، الوصول مقتصر على مطور التطبيقات والبرامج زكريا فقط.');
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
مطور تطبيقات وبرامج حر: زكريا بسيود (0655870392)`;
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
              لوحة تحكم مطور التطبيقات والبرامج زكريا بسيود
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
                  مطور تطبيقات وبرامج حر: زكريا
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

        {/* Controlled Code Generation Banner */}
        <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="size-11 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="size-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-extrabold text-white">
                  بوابة إصدار وتوليد أكواد الاشتراكات للزبائن (3$ / 650 دج) 🔑
                </h3>
                <span className="bg-emerald-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full uppercase">
                  تحكم يدوي آمن 100%
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                أنت المتحكم الحصري في إصدار التراخيص: عندما يرسل لك الزبون وصل التحويل عبر بريدي موب أو واتساب، اكتب اسمه هنا وولّد له الكود وانسخ له رسالة الواتساب بنقرة واحدة!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400">سعر الأيقونة:</span>
            <span className="font-extrabold text-emerald-400 text-sm">$3.00 USD (650 دج)</span>
          </div>
        </div>

        {/* Payment Account Settings (BaridiMob / CCP / Bank) */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
                <Building2 className="size-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  <span>إعدادات الحسابات البنكية والبريدية (BaridiMob / CCP) - محمي للمطور فقط</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                    خاص بزكريا بسيود
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  🔒 هذا المكان محمي ولا يمكن لأي زبون الوصول إليه إلا عبر لوحة تحكمك السرية. طالما بقيت الحقول فارغة، تكون مخفية تماماً عن الزبائن دون أي رسائل. فور أن تملأها يدوياً هنا وتضغط «حفظ»، ستظهر تلقائياً للزبون في نافذة الاشتراك للتحويل المباشر.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {hasBankOrCcp(paymentSettings) ? (
                <span className="rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-3 py-1.5 text-xs font-bold text-emerald-300 flex items-center gap-1.5 shadow-xs">
                  <Check className="size-3.5" />
                  <span>الحسابات معبأة وتظهر حالياً للزبائن للتحويل</span>
                </span>
              ) : (
                <span className="rounded-lg bg-amber-500/15 border border-amber-500/30 px-3 py-1.5 text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Lock className="size-3.5" />
                  <span>فارغة ومخفية تماماً عن الزبائن حالياً</span>
                </span>
              )}
            </div>
          </div>

          <form onSubmit={handleSavePaymentSettings} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  اسم صاحب الحساب (Nom du Titulaire):
                </label>
                <input
                  type="text"
                  value={paymentSettings.accountHolderName}
                  onChange={(e) => setPaymentSettings({ ...paymentSettings, accountHolderName: e.target.value })}
                  placeholder="مثال: بسيود زكريا (BESSIOUD ZAKARYA)"
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  رقم RIP لتطبيق بريدي موب (BaridiMob RIP):
                </label>
                <input
                  type="text"
                  value={paymentSettings.baridiMobRip}
                  onChange={(e) => setPaymentSettings({ ...paymentSettings, baridiMobRip: e.target.value })}
                  placeholder="أدخل رقم الـ RIP المكون من 20 رقماً"
                  dir="ltr"
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-xs text-teal-300 font-mono placeholder-slate-600 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  رقم الحساب البريدي الجاري (Numéro CCP):
                </label>
                <input
                  type="text"
                  value={paymentSettings.ccpNumber}
                  onChange={(e) => setPaymentSettings({ ...paymentSettings, ccpNumber: e.target.value })}
                  placeholder="رقم حساب الـ CCP"
                  dir="ltr"
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-xs text-white font-mono placeholder-slate-600 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  مفتاح الحساب الجاري (Clé CCP):
                </label>
                <input
                  type="text"
                  value={paymentSettings.ccpKey}
                  onChange={(e) => setPaymentSettings({ ...paymentSettings, ccpKey: e.target.value })}
                  placeholder="المفتاح (Clé)"
                  dir="ltr"
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-xs text-white font-mono placeholder-slate-600 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  اسم البنك (اختياري):
                </label>
                <input
                  type="text"
                  value={paymentSettings.bankName}
                  onChange={(e) => setPaymentSettings({ ...paymentSettings, bankName: e.target.value })}
                  placeholder="مثال: BNA / CPA / BEA / BADR"
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  رقم الحساب البنكي / RIB / IBAN (اختياري):
                </label>
                <input
                  type="text"
                  value={paymentSettings.bankRibIban}
                  onChange={(e) => setPaymentSettings({ ...paymentSettings, bankRibIban: e.target.value })}
                  placeholder="مثال: 001XXXXXXXXXXXXX"
                  dir="ltr"
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-xs text-white font-mono placeholder-slate-600 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>رابط الدفع الآلي لـ Chargily Pay (بريدي موب / البطاقة الذهبية):</span>
                  <span className="text-[10px] text-teal-400 font-normal">اختياري للأتمتة الكاملة</span>
                </label>
                <input
                  type="url"
                  value={paymentSettings.chargilyPaymentUrl}
                  onChange={(e) => setPaymentSettings({ ...paymentSettings, chargilyPaymentUrl: e.target.value })}
                  placeholder="مثال: https://pay.chargily.net/..."
                  dir="ltr"
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-xs text-white font-mono placeholder-slate-600 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>رابط الدفع بالبطاقات الدولية (Stripe Payment Link):</span>
                  <span className="text-[10px] text-indigo-400 font-normal">اختياري لزبائن الخارج ($3)</span>
                </label>
                <input
                  type="url"
                  value={paymentSettings.stripePaymentUrl}
                  onChange={(e) => setPaymentSettings({ ...paymentSettings, stripePaymentUrl: e.target.value })}
                  placeholder="مثال: https://buy.stripe.com/..."
                  dir="ltr"
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-xs text-white font-mono placeholder-slate-600 focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                تعليمات أو ملاحظات إضافية للمشترك عند الدفع (اختياري):
              </label>
              <input
                type="text"
                value={paymentSettings.customInstructions}
                onChange={(e) => setPaymentSettings({ ...paymentSettings, customInstructions: e.target.value })}
                placeholder="مثال: يرجى كتابة اسمك في وصف التحويل"
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold px-4 py-2.5 text-xs transition cursor-pointer shadow-md shadow-teal-950/40"
                >
                  <Save className="size-4" />
                  <span>حفظ معلومات الحسابات</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearPaymentSettings}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-semibold px-3 py-2 text-xs transition cursor-pointer"
                >
                  <Trash2 className="size-3.5" />
                  <span>تفريغ الحسابات ومسحها</span>
                </button>
              </div>

              {savePaymentSuccess && (
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-lg">
                  <Check className="size-3.5" />
                  <span>تم حفظ الإعدادات بنجاح!</span>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Bulk Keys Batch Generator (For massive volumes / selling in batch) */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <FileText className="size-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  <span>توليد دفعات كبرى من الأكواد (50، 100، 200 كود) وتصديرها Excel / CSV</span>
                  <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full font-bold">
                    للأتمتة الكبرى والموزعين
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  حل فوري للتعامل مع كميات ضخمة من الطلبات: ولّد مئات الأكواد المشفرة مسبقاً بنقرة واحدة، وقم ببيعها عبر متاجرك الإلكترونية (WooCommerce/Gumroad) أو وزعها لمصانع الأعلاف والصيدليات البيطرية.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleGenerateBulk} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  عدد الأكواد المراد توليدها:
                </label>
                <select
                  value={bulkCount}
                  onChange={(e) => setBulkCount(Number(e.target.value))}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-xs text-amber-300 font-bold focus:border-amber-400 focus:outline-none cursor-pointer"
                >
                  <option value={10}>10 أكواد</option>
                  <option value={25}>25 كوداً</option>
                  <option value={50}>50 كوداً</option>
                  <option value={100}>100 كود</option>
                  <option value={200}>200 كود</option>
                  <option value={500}>500 كود</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  الخدمة / الأيقونة:
                </label>
                <select
                  value={bulkServiceCode}
                  onChange={(e) => setBulkServiceCode(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-xs text-white font-bold focus:border-emerald-400 focus:outline-none cursor-pointer"
                >
                  {LOCKABLE_SERVICES.map((s) => (
                    <option key={s.code} value={s.code} className="bg-slate-950 text-white font-medium">
                      {s.emoji} {s.nameAr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  مدة الصلاحية لكل كود:
                </label>
                <select
                  value={bulkDurationMonths}
                  onChange={(e) => setBulkDurationMonths(Number(e.target.value))}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-xs text-white focus:border-emerald-400 focus:outline-none cursor-pointer"
                >
                  <option value={1}>شهر واحد (30 يوماً)</option>
                  <option value={2}>شهران (60 يوماً)</option>
                  <option value={3}>3 أشهر (فصلي)</option>
                  <option value={6}>6 أشهر</option>
                  <option value={12}>سنة كاملة (12 شهر)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  وسم الدفعة (Tag):
                </label>
                <input
                  type="text"
                  value={bulkBatchTag}
                  onChange={(e) => setBulkBatchTag(e.target.value)}
                  placeholder="مثال: OnlineStore-Nov"
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black px-4 py-2.5 text-xs transition cursor-pointer shadow-md"
              >
                <Sparkles className="size-4" />
                <span>توليد الدفعة ({bulkCount} كود مشفر) الآن</span>
              </button>

              {bulkResult && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadBulkCsv}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-2 text-xs transition cursor-pointer shadow-sm"
                  >
                    <Download className="size-3.5" />
                    <span>تحميل ملف Excel / CSV ({bulkResult.keys.length} كود)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(bulkResult.formattedList);
                      alert(`تم نسخ ${bulkResult.keys.length} كود إلى الحافظة بنجاح!`);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3 py-2 text-xs transition cursor-pointer"
                  >
                    <Copy className="size-3.5" />
                    <span>نسخ كقائمة نصوص</span>
                  </button>
                </div>
              )}
            </div>

            {bulkResult && (
              <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-bold text-emerald-400">✓ تم توليد {bulkResult.keys.length} كود بنجاح:</span>
                  <span className="text-[11px]">جاهزة للتوزيع الآلي أو البيع المباشر</span>
                </div>
                <div className="max-h-28 overflow-y-auto font-mono text-[11px] text-slate-300 space-y-1 select-all bg-slate-900/60 p-2.5 rounded-lg border border-slate-800" dir="ltr">
                  {bulkResult.keys.slice(0, 15).map((k, idx) => (
                    <div key={idx} className="flex justify-between text-emerald-400">
                      <span>{idx + 1}. {k}</span>
                      <span className="text-slate-500">[{bulkServiceCode}]</span>
                    </div>
                  ))}
                  {bulkResult.keys.length > 15 && (
                    <div className="text-slate-500 text-center text-[10px] pt-1">
                      ... و {bulkResult.keys.length - 15} كوداً إضافياً (حمل ملف CSV لعرض الجميع)
                    </div>
                  )}
                </div>
              </div>
            )}
          </form>
        </div>

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

        {/* Automated Orders & Key Generations List ($3 USD) */}
        <div className="rounded-2xl bg-slate-900 border border-emerald-500/30 p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="size-4 text-amber-300" />
              <span>سجل عمليات الدفع الآلية وتوليد الأكواد فوراً ($3) ({autoOrders.length})</span>
            </h3>
            {autoOrders.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('هل أنت متأكد من مسح سجل العمليات الآلية؟')) {
                    clearAutoOrdersHistory();
                    setAutoOrders([]);
                  }
                }}
                className="text-[11px] text-slate-500 hover:text-rose-400 transition flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="size-3" />
                <span>مسح السجل</span>
              </button>
            )}
          </div>

          {autoOrders.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-xs text-slate-500">
              لا توجد عمليات دفع آلية مسجلة بعد على هذا الجهاز. عندما يقوم زبون بالشراء بـ $3 من واجهة التطبيق، ستُدرج عمليته هنا تلقائياً مع الكود وتاريخ التفعيل!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-2 font-semibold">المشتري</th>
                    <th className="pb-2 font-semibold">الخدمة</th>
                    <th className="pb-2 font-semibold">المبلغ</th>
                    <th className="pb-2 font-semibold">طريقة الدفع</th>
                    <th className="pb-2 font-semibold">كود التفعيل المولد</th>
                    <th className="pb-2 font-semibold">تاريخ الانتهاء</th>
                    <th className="pb-2 text-center font-semibold">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {autoOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 font-bold text-white">{order.clientName}</td>
                      <td className="py-3 text-emerald-300 font-bold">{order.serviceNameAr}</td>
                      <td className="py-3 font-extrabold text-amber-400">${order.amountUsd} ({order.amountDzd} دج)</td>
                      <td className="py-3 text-slate-400 uppercase text-[11px]">{order.paymentMethod}</td>
                      <td className="py-3 font-mono text-emerald-400 select-all" dir="ltr">{order.generatedKey}</td>
                      <td className="py-3 text-slate-400">{new Date(order.expiresAt).toLocaleDateString('ar-u-nu-latn')}</td>
                      <td className="py-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(order.generatedKey);
                            alert('تم نسخ الكود: ' + order.generatedKey);
                          }}
                          className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-emerald-400 transition cursor-pointer"
                          title="نسخ الكود"
                        >
                          <Copy className="size-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
