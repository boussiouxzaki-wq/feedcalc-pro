import React, { useState, useEffect } from 'react';
import { 
  X, 
  Key, 
  Copy, 
  Check, 
  Calendar, 
  Share2, 
  Lock, 
  Trash2, 
  ExternalLink,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { generateClientKey, activateMasterAdmin, resetToVisitorMode, LOCKABLE_SERVICES, getServiceByCode } from '../utils/license';
import { isMasterAdminPassword } from '../utils/adminSecret';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToVisitor?: () => void;
  onActivationSuccess?: () => void;
}

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

export const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose, onSwitchToVisitor, onActivationSuccess }) => {
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

  // History
  const [history, setHistory] = useState<GeneratedKeyRecord[]>(() => {
    try {
      const saved = localStorage.getItem('fc_admin_keys_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const adminSession = sessionStorage.getItem('fc_admin_auth');
    if (adminSession === 'authorized_zaki') {
      setIsAuthenticated(true);
    }
  }, []);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (isMasterAdminPassword(passwordInput.trim())) {
      setIsAuthenticated(true);
      sessionStorage.setItem('fc_admin_auth', 'authorized_zaki');
      setAuthError('');
      setPasswordInput('');
    } else {
      setAuthError('كلمة المرور غير صحيحة، الوصول مقتصر على المهندس زكريا فقط.');
    }
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
    } catch {}
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

يسرنا تفعيل اشتراكك في تطبيق FeedCalc Pro لحساب تركيبات الأعلاف:

🔑 كود التفعيل الخاص بك:
${lastGeneratedKey}

📌 الأيقونة / الخدمة المفتوحة: ${serviceText}
(تنبيه: هذا الكود مخصص لفتح أيقونة ${serviceText} فقط).

⏳ مدة الاشتراك: ${durationMonths === 12 ? 'سنة كاملة' : durationMonths + ' شهر'}
📅 تاريخ الانتهاء: ${lastGeneratedExpiry}

🌐 رابط التطبيق:
${currentUrl}

طريقة التفعيل:
1. افتح الرابط أعلاه.
2. اضغط على أيقونة (${serviceText}) المقفلة في التطبيق.
3. ألصق كود التفعيل واضغط "تفعيل".

بالتوفيق في مشروعك!
المهندس زكريا بسيود (0655870392)`;
  };

  const handleCopyWhatsApp = () => {
    const msg = getWhatsAppMessage();
    navigator.clipboard.writeText(msg).then(() => {
      setCopiedMsg(true);
      setTimeout(() => setCopiedMsg(false), 2500);
    });
  };

  const handleDeleteHistoryItem = (id: string) => {
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
    localStorage.setItem('fc_admin_keys_history', JSON.stringify(updated));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm" dir="rtl">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl bg-slate-900 border border-emerald-500/40 shadow-2xl text-slate-100 p-5 sm:p-6">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="size-5" />
        </button>

        {/* Not authenticated screen */}
        {!isAuthenticated ? (
          <div className="py-4 text-center max-w-sm mx-auto">
            <div className="size-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto mb-3 shadow-inner">
              <Lock className="size-7" />
            </div>
            <h2 className="text-lg font-black text-white">بوابة التحكم للمهندس زكريا</h2>
            <p className="text-xs text-slate-400 mt-1 mb-5">
              هذه النافذة مخصصة لك فقط لتوليد أكواد الاشتراكات للزبائن، أدخل كلمة السر للمتابعة:
            </p>

            <form onSubmit={handleLogin} className="space-y-3">
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setAuthError('');
                }}
                placeholder="أدخل كلمة المرور السرية..."
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none text-center"
                dir="ltr"
                autoFocus
              />

              {authError && (
                <div className="p-2.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-medium">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 py-2.5 px-4 text-sm font-bold text-slate-950 hover:text-white transition shadow-lg cursor-pointer"
              >
                <Key className="size-4" />
                <span>فتح لوحة التحكم</span>
              </button>
            </form>
          </div>
        ) : (
          /* Authenticated Dashboard */
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    <span>توليد أكواد الاشتراكات</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md font-mono">
                      المهندس زكريا
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">إنشاء كود فوري وإرسال رسالة الواتساب للزبون</p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleGenerate} className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  الأيقونة / الخدمة المراد فتحها للزبون بهذا الكود (كود أحادي الخدمة):
                </label>
                <select
                  value={selectedServiceCode}
                  onChange={(e) => setSelectedServiceCode(e.target.value)}
                  className="w-full rounded-lg bg-slate-900 border border-emerald-500/50 px-3 py-2 text-xs text-emerald-300 font-bold focus:border-emerald-400 focus:outline-none cursor-pointer"
                >
                  {LOCKABLE_SERVICES.map((s) => (
                    <option key={s.code} value={s.code} className="bg-slate-900 text-white font-medium">
                      {s.emoji} {s.nameAr} {s.code === 'ALL' ? '— (VIP كافة الأيقونات معاً)' : '— [أيقونة واحدة فقط]'}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-amber-400/90 mt-1 flex items-center gap-1">
                  <span>💡</span>
                  <span>هذا الكود سيفتح فقط الأيقونة المحددة أعلاه ولن يسمح بفتح أي خدمة أخرى.</span>
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    اسم الزبون أو المزرعة:
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="مثال: مزرعة البركة - سطيف"
                    className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    مدة الاشتراك:
                  </label>
                  <select
                    value={durationMonths}
                    onChange={(e) => setDurationMonths(Number(e.target.value))}
                    className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none cursor-pointer"
                  >
                    <option value={1}>شهر واحد (30 يوماً)</option>
                    <option value={2}>شهران (60 يوماً)</option>
                    <option value={3}>3 أشهر (90 يوماً)</option>
                    <option value={6}>6 أشهر (نصف سنوي)</option>
                    <option value={12}>سنة كاملة (365 يوماً - VIP)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 py-2.5 px-4 text-xs font-extrabold text-slate-950 hover:text-white transition shadow-md cursor-pointer"
                >
                  <Sparkles className="size-3.5" />
                  <span>توليد كود التفعيل المخصص لهذه الأيقونة</span>
                </button>
              </div>
            </form>

            {/* Generated Key result */}
            {lastGeneratedKey && (
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-3.5 space-y-2.5 animate-in fade-in">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-300">الكود المولد بنجاح:</span>
                  <span className="text-slate-400">ينتهي في: {lastGeneratedExpiry}</span>
                </div>

                <div className="flex items-center gap-2 bg-slate-950 rounded-lg p-2.5 border border-emerald-500/30">
                  <code className="text-emerald-300 font-mono font-bold text-xs tracking-wider flex-1 text-center select-all" dir="ltr">
                    {lastGeneratedKey}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyKey}
                    className="p-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-slate-950 transition cursor-pointer"
                    title="نسخ الكود"
                  >
                    {copiedKey ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  </button>
                </div>

                {/* Service confirmation banner */}
                <div className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/30 rounded-lg p-2 text-[11px] text-amber-200">
                  <span className="text-amber-400 font-black">🔒 مقفل على أيقونة:</span>
                  <span className="font-bold underline text-white">{lastGeneratedServiceName}</span>
                  <span className="text-[10px] text-slate-400 mr-auto">(لا يفتح أي خدمة أخرى)</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCopyWhatsApp}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2 px-3 text-xs transition cursor-pointer"
                  >
                    <Share2 className="size-3.5" />
                    <span>{copiedMsg ? 'تم نسخ رسالة الواتساب!' : 'نسخ رسالة الواتساب كاملة للزبون'}</span>
                  </button>

                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(getWhatsAppMessage())}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 font-bold py-2 px-3 text-xs transition cursor-pointer"
                  >
                    <span>فتح WhatsApp</span>
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              </div>
            )}

            {/* Permanent VIP Master License Controls & Test Visitor Mode */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-300 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-300 font-bold">
                  <ShieldCheck className="size-4 text-emerald-400" />
                  <span>رخصة المطور الدائمة المعتمدة (VIP Master)</span>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold">
                  محمي ومشفر 🛡️
                </span>
              </div>

              {visitorMsg && (
                <div className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center">
                  {visitorMsg}
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    activateMasterAdmin();
                    setVisitorMsg('تم تفعيل جهازك بنجاح بترخيص VIP Master ✨');
                    if (onActivationSuccess) onActivationSuccess();
                    setTimeout(() => setVisitorMsg(''), 3000);
                  }}
                  className="w-full sm:flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Sparkles className="size-3.5 text-amber-300" />
                  <span>⚡ تفعيل هذا الجهاز برخصة المطور</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (confirm('هل تريد قفل التفعيل والتحويل فوراً لوضع الزائر (دجاج اللحم فقط مفتوح وباقي السلالات مقفلة للتجربة)؟')) {
                      resetToVisitorMode();
                      onClose();
                      if (onSwitchToVisitor) {
                        onSwitchToVisitor();
                      }
                    }
                  }}
                  className="w-full sm:w-auto py-2 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Lock className="size-3.5" />
                  <span>🔒 تجربة وضع الزائر</span>
                </button>
              </div>
            </div>

            {/* History table */}
            {history.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-bold flex items-center gap-1">
                    <Calendar className="size-3.5 text-emerald-400" />
                    <span>آخر الأكواد التي ولّدتها ({history.length}):</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('مسح سجل الأكواد من المتصفح؟')) {
                        setHistory([]);
                        localStorage.removeItem('fc_admin_keys_history');
                      }
                    }}
                    className="text-[10px] text-slate-500 hover:text-rose-400 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="size-3" />
                    <span>مسح السجل</span>
                  </button>
                </div>

                <div className="max-h-36 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/60 divide-y divide-slate-800/60 text-[11px]">
                  {history.slice(0, 10).map((h) => (
                    <div key={h.id} className="p-2 flex items-center justify-between gap-2">
                      <div className="truncate flex items-center gap-1.5">
                        <span className="font-bold text-white">{h.clientName}</span>
                        {h.serviceNameAr && (
                          <span className="bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded text-[10px] font-bold">
                            {h.serviceNameAr}
                          </span>
                        )}
                        <span className="text-slate-400">({h.durationMonths} شهر)</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <code className="font-mono text-emerald-400" dir="ltr">{h.key}</code>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(h.key);
                            alert('تم نسخ الكود: ' + h.key);
                          }}
                          className="p-1 rounded bg-slate-800 text-slate-300 hover:text-emerald-300"
                        >
                          <Copy className="size-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteHistoryItem(h.id)}
                          className="p-1 rounded bg-slate-800 text-slate-300 hover:text-rose-400"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
