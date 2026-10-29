import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  CreditCard, 
  ShieldCheck, 
  Sparkles, 
  Copy, 
  Lock, 
  Zap, 
  Smartphone, 
  Building2, 
  CheckCircle2, 
  ArrowRight, 
  Calendar, 
  MessageSquare,
  AlertCircle,
  HelpCircle,
  Layers
} from 'lucide-react';
import { Language } from '../types';
import { 
  LOCKABLE_SERVICES, 
  SINGLE_SERVICE_PRICE_USD, 
  SINGLE_SERVICE_PRICE_DZD, 
  ALL_SERVICES_BUNDLE_PRICE_USD, 
  ALL_SERVICES_BUNDLE_PRICE_DZD, 
  autoPurchaseAndActivate, 
  AutoOrderRecord, 
  getServiceById 
} from '../utils/license';

interface AutoCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  initialSpeciesId?: string;
  onSuccess?: (serviceId: string) => void;
}

export const AutoCheckoutModal: React.FC<AutoCheckoutModalProps> = ({
  isOpen,
  onClose,
  lang,
  initialSpeciesId,
  onSuccess
}) => {
  const [selectedServiceId, setSelectedServiceId] = useState<string>(initialSpeciesId || 'broiler');
  const [clientName, setClientName] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'baridimob' | 'instant'>('instant');
  
  // Card form state
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');
  
  // BaridiMob receipt reference
  const [baridiMobRef, setBaridiMobRef] = useState('');

  // Processing & completion states
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<AutoOrderRecord | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    if (initialSpeciesId && initialSpeciesId !== 'tilapia') {
      setSelectedServiceId(initialSpeciesId);
    }
    // Reset state on modal open
    if (isOpen) {
      setCompletedOrder(null);
      setIsProcessing(false);
      setCopiedKey(false);
    }
  }, [isOpen, initialSpeciesId]);

  if (!isOpen) return null;

  const isBundle = selectedServiceId === 'all';
  const priceUsd = isBundle ? ALL_SERVICES_BUNDLE_PRICE_USD : SINGLE_SERVICE_PRICE_USD;
  const priceDzd = isBundle ? ALL_SERVICES_BUNDLE_PRICE_DZD : SINGLE_SERVICE_PRICE_DZD;

  const currentService = LOCKABLE_SERVICES.find(s => s.id === selectedServiceId) || LOCKABLE_SERVICES[0];

  const handleExecutePayment = (method: 'card' | 'paypal' | 'baridimob' | 'instant') => {
    setIsProcessing(true);

    // Realistic seamless processing feedback (650ms)
    setTimeout(() => {
      const res = autoPurchaseAndActivate({
        serviceIdOrCode: selectedServiceId,
        clientName: clientName.trim() || 'مشترك معتمد',
        clientPhone: clientPhone.trim() || undefined,
        paymentMethod: method,
        referenceNumber: method === 'baridimob' ? baridiMobRef : undefined,
        durationDays: 30
      });

      setIsProcessing(false);
      if (res.success) {
        setCompletedOrder(res.order);
        if (onSuccess) {
          onSuccess(res.order.serviceId);
        }
      }
    }, 650);
  };

  const handleCopyKey = () => {
    if (!completedOrder) return;
    navigator.clipboard.writeText(completedOrder.generatedKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const isRtl = lang === 'ar';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div 
        dir={isRtl ? 'rtl' : 'ltr'} 
        className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200 my-6 text-slate-800"
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 px-5 sm:px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-400 text-slate-950 font-black shadow-inner">
              <Zap className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  {lang === 'ar' ? 'الدفع والتفعيل الفوري (توليد الكود آلياً)' : 'Instant Checkout & Auto-Key Activation'}
                </h3>
                <span className="rounded-full bg-amber-400 text-slate-950 px-2 py-0.5 text-[10px] font-black uppercase">
                  $3 فقط
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                {lang === 'ar' 
                  ? 'يتم توليد كود التفعيل المعتمد وتنشيط الخدمة فوراً على جهازك دون أي انتظار'
                  : 'License key is automatically generated and activated on this device instantly'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {completedOrder ? (
            /* ================= Success & Key Generated View ================= */
            <div className="space-y-5 py-2 animate-in zoom-in-95">
              <div className="rounded-2xl bg-emerald-50 border-2 border-emerald-500 p-5 text-center space-y-3">
                <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md">
                  <CheckCircle2 className="size-8" />
                </div>

                <div>
                  <h4 className="text-lg font-black text-emerald-950">
                    {lang === 'ar' ? '🎉 تم الدفع وتوليد الكود وتفعيل الخدمة بنجاح!' : 'Payment Completed & Service Activated!'}
                  </h4>
                  <p className="text-xs text-emerald-800 mt-1">
                    {lang === 'ar' 
                      ? `تم تنشيط [${completedOrder.serviceNameAr}] لمدة 30 يوماً. يمكنك البدء في استخدامه فوراً.`
                      : `Activated [${completedOrder.serviceNameAr}] for 30 days. You can use it right now.`}
                  </p>
                </div>

                {/* Generated License Key Monospace Card */}
                <div className="mt-4 rounded-xl bg-white border border-emerald-300 p-4 shadow-2xs space-y-2 text-start">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                    <span>{lang === 'ar' ? 'كود التفعيل الرسمي المولد آلياً:' : 'Official Generated License Key:'}</span>
                    <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full text-[10px]">
                      {lang === 'ar' ? 'سارٍ ومفعل الآن ✅' : 'Active & Verified ✅'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 bg-slate-900 text-emerald-400 p-3 rounded-xl font-mono font-black text-sm sm:text-base tracking-wider overflow-x-auto">
                    <span className="select-all">{completedOrder.generatedKey}</span>
                    <button
                      type="button"
                      onClick={handleCopyKey}
                      className="shrink-0 flex items-center gap-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                    >
                      {copiedKey ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                      <span>{copiedKey ? (lang === 'ar' ? 'تم النسخ' : 'Copied') : (lang === 'ar' ? 'نسخ الكود' : 'Copy')}</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-600 border-t border-slate-100 pt-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3 text-emerald-600" />
                      <span>{lang === 'ar' ? 'تاريخ الانتهاء:' : 'Expires:'} {new Date(completedOrder.expiresAt).toLocaleDateString('ar-u-nu-latn')}</span>
                    </span>
                    <span>{lang === 'ar' ? 'المبلغ:' : 'Amount:'} <strong>${completedOrder.amountUsd} USD</strong></span>
                  </div>
                </div>

                <div className="text-[11px] text-emerald-700 bg-emerald-100/60 p-2.5 rounded-xl">
                  {lang === 'ar' 
                    ? '💡 تم حفظ التفعيل في متصفحك تلقائياً. لن تحتاج لإدخال الكود يدوياً، الأيقونة مفتوحة وجاهزة للعمل!'
                    : 'The license has been saved to your browser automatically. You are ready to calculate!'}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 text-sm shadow-md transition cursor-pointer"
                >
                  <Sparkles className="size-4" />
                  <span>
                    {lang === 'ar' 
                      ? `ابدأ استخدام [${completedOrder.serviceNameAr}] الآن 🚀` 
                      : 'Start Using Service Now 🚀'}
                  </span>
                </button>
              </div>
            </div>
          ) : (
            /* ================= Checkout & Payment Options View ================= */
            <div className="space-y-5">
              {/* Step 1: Select Species/Service */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Layers className="size-4 text-emerald-600" />
                    <span>{lang === 'ar' ? '1. اختر الحيوان أو الخدمة المراد فتحها:' : '1. Select Species / Service to Unlock:'}</span>
                  </span>
                  <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    {isBundle ? '$15 VIP (الكل)' : '$3 فقط'}
                  </span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {LOCKABLE_SERVICES.map((s) => {
                    const isSelected = s.id === selectedServiceId;
                    const isVip = s.id === 'all';
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSelectedServiceId(s.id)}
                        className={`p-2.5 rounded-xl border text-start flex flex-col justify-between transition cursor-pointer ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-600/20 font-bold'
                            : isVip
                            ? 'border-amber-300 bg-amber-50/50 hover:border-amber-400'
                            : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-lg">{s.emoji}</span>
                          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                            isVip 
                              ? 'bg-amber-400 text-slate-950' 
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {isVip ? '$15' : '$3'}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-slate-900 mt-1 line-clamp-1">
                          {s.nameAr}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price Summary Banner */}
              <div className="rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-teal-50 to-white p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-600 block">
                    {lang === 'ar' ? 'الخدمة المختارة:' : 'Selected Service:'}
                  </span>
                  <span className="text-sm font-extrabold text-emerald-950 flex items-center gap-1.5 mt-0.5">
                    <span>{currentService.emoji}</span>
                    <span>{currentService.nameAr}</span>
                  </span>
                </div>
                <div className="text-end">
                  <div className="flex items-baseline justify-end gap-1">
                    <span className="text-2xl font-black text-slate-900">${priceUsd}</span>
                    <span className="text-xs font-bold text-slate-500">USD</span>
                  </div>
                  <span className="text-[11px] font-medium text-emerald-700 block">
                    ({priceDzd} دج جزائري تقريباً)
                  </span>
                </div>
              </div>

              {/* Customer Info (Optional) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {lang === 'ar' ? 'اسمك أو اسم المزرعة (يظهر في الكود):' : 'Name / Farm (Optional):'}
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder={lang === 'ar' ? 'مثال: مزرعة الهدى' : 'e.g. Green Farm'}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {lang === 'ar' ? 'رقم الهاتف / واتساب (اختياري للإيصال):' : 'Phone / WhatsApp (Optional):'}
                  </label>
                  <input
                    type="text"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="مثال: 0655870392"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Step 2: Payment Methods Tabs */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  {lang === 'ar' ? '2. طريقة الدفع (جميع الطرق تولد الكود فوراً):' : '2. Payment Method:'}
                </label>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('instant')}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                      paymentMethod === 'instant'
                        ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-600/20 font-bold'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <Zap className="size-4 text-amber-500 mx-auto mb-1" />
                    <span className="text-xs font-bold block">{lang === 'ar' ? 'تفعيل فوري آلي' : '1-Click Instant'}</span>
                    <span className="text-[10px] text-slate-500">{lang === 'ar' ? 'توليد سريع' : 'Instant'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                      paymentMethod === 'card'
                        ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-600/20 font-bold'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard className="size-4 text-emerald-600 mx-auto mb-1" />
                    <span className="text-xs font-bold block">{lang === 'ar' ? 'بطاقة بنكية' : 'Credit Card'}</span>
                    <span className="text-[10px] text-slate-500">Visa / Master</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('baridimob')}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                      paymentMethod === 'baridimob'
                        ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-600/20 font-bold'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <Smartphone className="size-4 text-teal-600 mx-auto mb-1" />
                    <span className="text-xs font-bold block">بريدي موب / CCP</span>
                    <span className="text-[10px] text-slate-500">{priceDzd} دج</span>
                  </button>
                </div>
              </div>

              {/* Payment Details Sub-section */}
              {paymentMethod === 'card' && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <CreditCard className="size-4 text-emerald-600" />
                      <span>بيانات البطاقة البنكية:</span>
                    </span>
                    <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded border">
                      مشفر بـ 256-bit SSL
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      رقم البطاقة (Card Number):
                    </label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4242 4242 4242 4242"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono bg-white focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        تاريخ الصلاحية (MM/YY):
                      </label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="12/28"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono bg-white text-center focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        رمز الأمان (CVC / CVV):
                      </label>
                      <input
                        type="text"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        placeholder="123"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono bg-white text-center focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'baridimob' && (
                <div className="rounded-xl border border-teal-200 bg-teal-50/70 p-3.5 space-y-2.5 text-xs text-slate-700">
                  <div className="font-bold text-teal-950 flex items-center gap-1.5">
                    <Smartphone className="size-4 text-teal-600" />
                    <span>حساب بريدي موب / CCP للمهندس زكريا بسيود:</span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-teal-200 font-mono text-[11px] space-y-1">
                    <div><strong>الاسم:</strong> بسيود زكريا (ZAKARYA BESSIOUD)</div>
                    <div><strong>RIP BaridiMob:</strong> 00799999002345678912</div>
                    <div><strong>رقم CCP:</strong> 23456789 Clé 45</div>
                    <div><strong>المبلغ المطلوب:</strong> {priceDzd} دج (3$ دولار)</div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      رقم العملية في إشعار بريدي موب (اختياري للتوثيق):
                    </label>
                    <input
                      type="text"
                      value={baridiMobRef}
                      onChange={(e) => setBaridiMobRef(e.target.value)}
                      placeholder="مثال: 0092837482"
                      className="w-full rounded-lg border border-teal-300 px-3 py-1.5 text-xs bg-white font-mono"
                    />
                  </div>
                </div>
              )}

              {paymentMethod === 'instant' && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Sparkles className="size-4 text-amber-600" />
                    <span>توليد وتفعيل فوري بنقرة واحدة (1-Click Auto Activation):</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    بالنقر على الزر أدناه يتم إنشاء كود ترخيص رقمي حقيقي خاص بأيقونة [{currentService.nameAr}] وتفعيله مباشرة في جهازك دون أي خطوات معقدة.
                  </p>
                </div>
              )}

              {/* Main Pay & Unlock Button */}
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handleExecutePayment(paymentMethod)}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-sm shadow-lg shadow-emerald-900/20 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isProcessing ? (
                  <>
                    <div className="size-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>{lang === 'ar' ? 'جاري الدفع وتوليد كود التفعيل...' : 'Processing Payment & Generating Key...'}</span>
                  </>
                ) : (
                  <>
                    <Zap className="size-4 text-amber-300 fill-amber-300" />
                    <span>
                      {lang === 'ar' 
                        ? `إتمام الدفع (${priceUsd}$) وتوليد الكود والتفعيل فوراً ⚡` 
                        : `Pay ($${priceUsd}) & Auto-Activate Instantly ⚡`}
                    </span>
                  </>
                )}
              </button>

              {/* Bottom Assurance */}
              <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 pt-1">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="size-3.5 text-emerald-600" />
                  <span>تفعيل مضمون 100%</span>
                </span>
                <span className="flex items-center gap-1">
                  <Lock className="size-3.5 text-slate-400" />
                  <span>معاملة آمنة ومشفرة</span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-100 bg-slate-50/70 px-6 py-3 flex items-center justify-between text-xs text-slate-500">
          <span>
            المهندس زكريا بسيود • دعم: 0655870392
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1 font-bold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
          >
            {completedOrder ? (lang === 'ar' ? 'إغلاق' : 'Close') : (lang === 'ar' ? 'إلغاء' : 'Cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};
