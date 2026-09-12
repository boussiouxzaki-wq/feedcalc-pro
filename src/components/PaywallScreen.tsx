import React, { useState } from 'react';
import { 
  Lock, 
  KeyRound, 
  ShieldCheck, 
  Phone, 
  MessageSquare, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Wheat,
  Zap,
  Award,
  ArrowRight
} from 'lucide-react';
import { Language } from '../types';
import { activateApp, getLicenseStatus } from '../utils/license';
import { isMasterAdminPassword } from '../utils/adminSecret';

interface PaywallScreenProps {
  lang: Language;
  onActivated: () => void;
  onOpenActivationModal: () => void;
  onOpenAdmin?: () => void;
}

export const PaywallScreen: React.FC<PaywallScreenProps> = ({
  lang,
  onActivated,
  onOpenActivationModal,
  onOpenAdmin
}) => {
  const [keyInput, setKeyInput] = useState('');
  const [clientName, setClientName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isActivating, setIsActivating] = useState(false);

  const handleDirectActivate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!keyInput.trim()) {
      setErrorMsg(lang === 'ar' ? 'يرجى كتابة كود الاشتراك أو التفعيل' : 'Please enter the activation key');
      return;
    }

    setIsActivating(true);

    // If master password or key
    if (isMasterAdminPassword(keyInput.trim())) {
      activateApp('FC-MASTER-UNLIMITED', 'المهندس زكريا بسيود (المطور)');
      onActivated();
      setIsActivating(false);
      return;
    }

    const res = activateApp(keyInput.trim(), clientName.trim() || undefined);
    if (res.success) {
      onActivated();
    } else {
      setErrorMsg(res.message);
    }
    setIsActivating(false);
  };

  return (
    <div className="mx-auto max-w-4xl py-6 px-4">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 p-8 text-white shadow-2xl border border-emerald-500/30">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-1.5 text-xs font-bold text-amber-300 shadow-inner mb-4">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>{lang === 'ar' ? 'التطبيق مغلق ومحمي بنظام التراخيص الرقمية' : 'App is Protected by Digital Licensing'}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white mb-3">
            {lang === 'ar' ? 'مرحباً بك في FeedCalc Pro' : 'Welcome to FeedCalc Pro'}
          </h2>

          <p className="max-w-xl text-sm sm:text-base text-slate-300 mb-6 leading-relaxed">
            {lang === 'ar' 
              ? 'هذا التطبيق مخصص لأصحاب المزارع والمربين ومصانع الأعلاف المرخصين. للاستفادة من حساب تركيبات الأعلاف بدقة عالية لجميع أنواع الحيوانات، يرجى تفعيل اشتراكك.'
              : 'This application is dedicated to licensed breeders, farms, and feed factories. Please activate your monthly subscription key to access all formulation tools.'}
          </p>

          {/* Quick Activation Form */}
          <div className="w-full max-w-md bg-white/10 backdrop-blur-md p-5 rounded-xl border border-white/20 shadow-xl mb-6 text-right">
            <form onSubmit={handleDirectActivate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-emerald-300 mb-1.5">
                  {lang === 'ar' ? '🔑 كود الاشتراك أو التفعيل:' : '🔑 Subscription Key:'}
                </label>
                <input
                  type="text"
                  value={keyInput}
                  onChange={(e) => {
                    setKeyInput(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder={lang === 'ar' ? 'أدخل الكود هنا (مثال: FC-2026-...)' : 'Enter code here...'}
                  className="w-full rounded-lg bg-slate-950/80 border border-emerald-500/50 px-3.5 py-2.5 text-sm text-white placeholder-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 font-mono tracking-wider text-center"
                  dir="ltr"
                />
              </div>

              <div>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder={lang === 'ar' ? 'اسمك أو اسم المزرعة (اختياري)' : 'Your Name / Farm (Optional)'}
                  className="w-full rounded-lg bg-slate-950/50 border border-slate-700 px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:border-emerald-400 focus:outline-none text-center"
                />
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs text-right">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isActivating}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 py-2.5 px-4 text-sm font-bold text-slate-950 hover:text-white transition-all shadow-lg shadow-emerald-900/30 cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>{lang === 'ar' ? 'تفعيل الاشتراك وفتح التطبيق الآن' : 'Activate & Unlock App'}</span>
              </button>
            </form>
          </div>

          {/* Contact Developer Section */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-lg">
            <a
              href="https://wa.me/213655870392?text=مرحباً%20مهندس%20زكريا،%20أريد%20طلب%20كود%20اشتراك%20في%20تطبيق%20FeedCalc%20Pro"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white transition shadow-md shadow-emerald-950/30 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{lang === 'ar' ? 'طلب كود عبر واتساب (WhatsApp)' : 'Request Key via WhatsApp'}</span>
            </a>

            <a
              href="tel:0655870392"
              className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-700 hover:bg-slate-600 px-4 py-2.5 text-xs font-bold text-white transition border border-slate-600 cursor-pointer"
            >
              <Phone className="w-4 h-4 text-emerald-400" />
              <span>{lang === 'ar' ? 'اتصال بالمهندس: 0655870392' : 'Call: 0655870392'}</span>
            </a>
          </div>

          <div className="mt-4 text-xs text-slate-400">
            {lang === 'ar' 
              ? 'تطوير المهندس: زكريا بسيود (Zakarya Boussioux) - جميع الحقوق محفوظة 2026'
              : 'Developed by Eng. Zakarya Boussioux - All rights reserved 2026'}
          </div>
        </div>
      </div>

      {/* Pro Features Showcase */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm mb-2">
            <Wheat className="w-4 h-4" />
            <span>11 سلالة حيوانية</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            دجاج لحم، بياض، سمان، رومي، بط، أغنام، ماعز، أبقار حلوب، عجول تسمين، إبل، أسماك، أرانب.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm mb-2">
            <Zap className="w-4 h-4" />
            <span>معايير NRC و INRA</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            حسابات دقيقة للبروتين الخام، الطاقة الاستقلابية، الألياف، الكالسيوم، والفوسفور مع تقارير PDF.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm mb-2">
            <Award className="w-4 h-4" />
            <span>عمل بدون إنترنت (PWA)</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            تثبيت التطبيق على هاتفك واستخدامه مباشرة في المزرعة أو المصنع حتى بدون اتصال إنترنت.
          </p>
        </div>
      </div>
    </div>
  );
};
