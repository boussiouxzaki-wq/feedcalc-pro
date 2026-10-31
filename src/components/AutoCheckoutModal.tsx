import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  ShieldCheck, 
  Sparkles, 
  Lock, 
  Smartphone, 
  Building2, 
  CheckCircle2, 
  ArrowRight, 
  Calendar, 
  MessageSquare, 
  AlertCircle, 
  Layers, 
  Phone, 
  KeyRound,
  ExternalLink
} from 'lucide-react';
import { Language } from '../types';
import { 
  LOCKABLE_SERVICES, 
  SINGLE_SERVICE_PRICE_USD, 
  SINGLE_SERVICE_PRICE_DZD, 
  ALL_SERVICES_BUNDLE_PRICE_USD, 
  ALL_SERVICES_BUNDLE_PRICE_DZD, 
  activateApp, 
  autoPurchaseAndActivate,
  getServiceById 
} from '../utils/license';
import { getPaymentSettings, hasConfiguredPayment, hasBankOrCcp, PaymentSettings } from '../utils/paymentSettings';

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
  const [receiptRef, setReceiptRef] = useState<string>('');
  const [activationKeyInput, setActivationKeyInput] = useState<string>('');
  const [activationError, setActivationError] = useState<string>('');
  const [activationSuccessMsg, setActivationSuccessMsg] = useState<string>('');
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(getPaymentSettings);

  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [generatedKeyResult, setGeneratedKeyResult] = useState<string>('');

  useEffect(() => {
    if (initialSpeciesId && initialSpeciesId !== 'tilapia') {
      setSelectedServiceId(initialSpeciesId);
    }
    if (isOpen) {
      setActivationError('');
      setActivationSuccessMsg('');
      setActivationKeyInput('');
      setGeneratedKeyResult('');
      setIsVerifying(false);
      setPaymentSettings(getPaymentSettings());
    }
  }, [isOpen, initialSpeciesId]);

  if (!isOpen) return null;

  const isBundle = selectedServiceId === 'all';
  const priceUsd = isBundle ? ALL_SERVICES_BUNDLE_PRICE_USD : SINGLE_SERVICE_PRICE_USD;
  const priceDzd = isBundle ? ALL_SERVICES_BUNDLE_PRICE_DZD : SINGLE_SERVICE_PRICE_DZD;

  const currentService = LOCKABLE_SERVICES.find(s => s.id === selectedServiceId) || LOCKABLE_SERVICES[0];
  const isRtl = lang === 'ar';

  const handleAutoVerifyAndActivate = (e: React.FormEvent) => {
    e.preventDefault();
    setActivationError('');

    if (!receiptRef.trim()) {
      setActivationError(isRtl ? 'يرجى كتابة رقم العملية المطبوع على وصل بريدي موب (المرجع / Numéro de transaction)' : 'Please enter receipt transaction number');
      return;
    }

    setIsVerifying(true);
    setTimeout(() => {
      const res = autoPurchaseAndActivate({
        serviceIdOrCode: selectedServiceId,
        clientName: clientName.trim() || 'مشترك بريدي موب',
        clientPhone: clientPhone.trim() || undefined,
        paymentMethod: 'baridimob',
        referenceNumber: receiptRef.trim(),
        durationDays: 30
      });

      setIsVerifying(false);
      if (res.success && res.order) {
        setGeneratedKeyResult(res.order.generatedKey);
        setActivationSuccessMsg(res.message);
        if (onSuccess && res.order.serviceId) {
          onSuccess(res.order.serviceId);
        }
      } else {
        setActivationError(res.message || (isRtl ? 'تعذر التحقق من الوصل' : 'Verification failed'));
      }
    }, 700);
  };

  const handleActivateKey = (e: React.FormEvent) => {
    e.preventDefault();
    setActivationError('');

    if (!activationKeyInput.trim()) {
      setActivationError(isRtl ? 'يرجى إدخال كود التفعيل المستلم من المطور' : 'Please enter the activation key');
      return;
    }

    const res = activateApp(activationKeyInput.trim(), clientName.trim() || undefined);
    if (res.success) {
      setActivationSuccessMsg(res.message);
      if (onSuccess && res.serviceId) {
        onSuccess(res.serviceId);
      }
      setTimeout(() => {
        onClose();
      }, 2000);
    } else {
      setActivationError(res.message || (isRtl ? 'الكود غير صحيح أو انتهت صلاحيته' : 'Invalid or expired key'));
    }
  };

  const getWhatsAppOrderUrl = () => {
    const nameStr = clientName.trim() || (isRtl ? 'مشترك جديد' : 'New Client');
    const phoneStr = clientPhone.trim() || (isRtl ? 'غير محدد' : 'N/A');
    const refStr = receiptRef.trim() || (isRtl ? 'سيتم إرسال صورة الوصل' : 'Receipt attached');
    const serviceName = currentService ? `${currentService.emoji} ${currentService.nameAr}` : 'الخدمة';

    const text = isRtl
      ? `مرحباً مطور التطبيقات زكريا بسيود 🌾
أنا: ${nameStr}
الهاتف: ${phoneStr}
أريد تفعيل اشتراك في تطبيق FeedCalc Pro:
📌 الخدمة المطلوبة: ${serviceName}
💰 المبلغ: ${priceDzd} دج (${priceUsd}$ دولار)
🧾 رقم عملية التحويل / الوصل: ${refStr}
يرجى تأكيد الدفع وتزويدي بكود التفعيل.`
      : `Hello Zakarya Bessioud,
I want to subscribe to FeedCalc Pro:
Service: ${serviceName}
Amount: $${priceUsd} USD (${priceDzd} DZD)
Name: ${nameStr}
Phone: ${phoneStr}
Ref: ${refStr}
Please verify payment and provide my activation key.`;

    return `https://wa.me/213655870392?text=${encodeURIComponent(text)}`;
  };

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
              <KeyRound className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  {lang === 'ar' ? 'طلب اشتراك شهري وتأكيد الدفع' : 'Monthly Subscription & Activation'}
                </h3>
                <span className="rounded-full bg-amber-400 text-slate-950 px-2 py-0.5 text-[10px] font-black uppercase">
                  ${priceUsd} USD
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                {lang === 'ar' 
                  ? 'الدفع المعتمد عبر بريدي موب / CCP وتأكيد التفعيل مع المطور زكريا بسيود'
                  : 'Official payment via BaridiMob / CCP and activation with Developer Zakarya'}
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

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {activationSuccessMsg ? (
            /* Success State */
            <div className="rounded-2xl bg-emerald-50 border-2 border-emerald-500 p-6 text-center space-y-3 animate-in zoom-in-95">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md">
                <CheckCircle2 className="size-8" />
              </div>
              <h4 className="text-lg font-black text-emerald-950">
                {isRtl ? '🎉 تم تفعيل الخدمة بنجاح!' : 'Service Activated Successfully!'}
              </h4>
              <p className="text-xs text-emerald-800 font-semibold leading-relaxed">
                {activationSuccessMsg}
              </p>
              <div className="text-[11px] text-emerald-700 bg-emerald-100 p-2.5 rounded-xl">
                {isRtl ? 'جاري فتح الخدمة فوراً في جهازك...' : 'Opening unlocked service...'}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Step 1: Select Species/Service */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Layers className="size-4 text-emerald-600" />
                    <span>{isRtl ? '1. اختر الخدمة أو السلالة المراد فتحها:' : '1. Select Species / Service to Unlock:'}</span>
                  </span>
                  <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    {isBundle ? '$15 VIP (كافة الأيقونات)' : '$3 فقط شهرياً'}
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

              {/* Price Banner */}
              <div className="rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-teal-50 to-white p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-600 block">
                    {isRtl ? 'الخدمة المختارة:' : 'Selected Service:'}
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
                  <span className="text-[11px] font-bold text-emerald-700 block">
                    ({priceDzd} دج جزائري شهرياً)
                  </span>
                </div>
              </div>

              {/* Step 2: Payment Details (BaridiMob / CCP / Bank) - ONLY rendered if developer manually filled them in Admin Dashboard */}
              {hasBankOrCcp(paymentSettings) && (
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                    <Smartphone className="size-4 text-teal-600" />
                    <span>{isRtl ? '2. بيانات تحويل مبلغ الاشتراك المعتمدة:' : '2. Transfer Payment Details:'}</span>
                  </label>

                  <div className="rounded-xl border border-teal-200 bg-teal-50/70 p-3.5 space-y-2.5 text-xs text-slate-700">
                    <div className="font-bold text-teal-950 flex items-center justify-between">
                      <span>حسابات التحويل المعتمدة:</span>
                      <span className="text-[11px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-teal-200">
                        المبلغ المطلوب: {priceDzd} دج
                      </span>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-teal-200 font-mono text-[11px] space-y-1.5 text-slate-800">
                      {paymentSettings.accountHolderName && (
                        <div><strong>صاحب الحساب:</strong> {paymentSettings.accountHolderName}</div>
                      )}
                      {paymentSettings.baridiMobRip && (
                        <div>
                          <strong>RIP BaridiMob:</strong>{' '}
                          <span className="font-bold text-teal-700 select-all tracking-wider">{paymentSettings.baridiMobRip}</span>
                        </div>
                      )}
                      {paymentSettings.ccpNumber && (
                        <div>
                          <strong>رقم CCP:</strong>{' '}
                          <span className="font-bold text-teal-700 select-all">{paymentSettings.ccpNumber}</span>
                          {paymentSettings.ccpKey && <span> Clé {paymentSettings.ccpKey}</span>}
                        </div>
                      )}
                      {paymentSettings.bankName && (
                        <div><strong>البنك:</strong> {paymentSettings.bankName}</div>
                      )}
                      {paymentSettings.bankRibIban && (
                        <div>
                          <strong>RIB / IBAN:</strong>{' '}
                          <span className="font-bold text-teal-700 select-all tracking-wider">{paymentSettings.bankRibIban}</span>
                        </div>
                      )}
                      {paymentSettings.customInstructions && (
                        <div className="pt-1.5 border-t border-slate-100 text-[10px] text-slate-600 font-sans">
                          <strong>ملاحظات:</strong> {paymentSettings.customInstructions}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Customer Info & Send Receipt via WhatsApp */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
                <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <MessageSquare className="size-4 text-emerald-600" />
                  <span>{isRtl ? '3. إرسال إشعار التحويل لاستلام كود التفعيل:' : '3. Send Proof to Receive Activation Key:'}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      {isRtl ? 'اسمك أو اسم المزرعة:' : 'Your Name / Farm:'}
                    </label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder={isRtl ? 'مثال: مزرعة البركة - سطيف' : 'e.g. Green Farm'}
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs bg-white text-slate-800 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      {isRtl ? 'رقم هاتفك:' : 'Your Phone Number:'}
                    </label>
                    <input
                      type="tel"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="06XXXXXXXX"
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs bg-white text-slate-800 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    {isRtl ? 'رقم عملية التحويل بالإشعار (أو لقطة شاشة):' : 'Transaction Ref / Receipt:'}
                  </label>
                  <input
                    type="text"
                    value={receiptRef}
                    onChange={(e) => setReceiptRef(e.target.value)}
                    placeholder={isRtl ? 'أدخل رقم العملية المسجل بوصل بريدي موب' : 'Transaction reference number'}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs bg-white font-mono text-slate-800 focus:border-emerald-500"
                  />
                </div>

                {/* Hosted Payment Gateway (Chargily Pay / Stripe) if configured by Developer */}
                {(paymentSettings.chargilyPaymentUrl || paymentSettings.stripePaymentUrl || paymentSettings.paypalPaymentUrl) && (
                  <div className="pt-1 space-y-2">
                    <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                      <Building2 className="size-3.5 text-teal-600" />
                      <span>{isRtl ? 'أو ادفع مباشرة عبر بوابات الدفع الإلكترونية المعتمدة:' : 'Or pay directly via official payment gateways:'}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {paymentSettings.chargilyPaymentUrl && (
                        <a
                          href={paymentSettings.chargilyPaymentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold py-2.5 px-3 text-xs shadow-sm transition"
                        >
                          <span>💳 بريدي موب / الذهبية (Chargily)</span>
                          <ExternalLink className="size-3" />
                        </a>
                      )}
                      {paymentSettings.stripePaymentUrl && (
                        <a
                          href={paymentSettings.stripePaymentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-3 text-xs shadow-sm transition"
                        >
                          <span>💳 بطاقة دولية (Stripe $3)</span>
                          <ExternalLink className="size-3" />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Instant Automated Verification Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    disabled={isVerifying}
                    onClick={handleAutoVerifyAndActivate}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black py-3 px-4 text-xs shadow-md shadow-emerald-950/20 transition cursor-pointer disabled:opacity-60"
                  >
                    {isVerifying ? (
                      <>
                        <div className="size-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        <span>{isRtl ? 'جاري التحقق الآلي من رقم العملية وإصدار الكود...' : 'Verifying transaction reference...'}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="size-4 text-amber-300" />
                        <span>
                          {isRtl 
                            ? '⚡ التحقق الآلي من رقم العملية وتفعيل الخدمة فوراً' 
                            : '⚡ Auto-Verify Reference & Unlock Instantly'}
                        </span>
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-slate-500 text-center mt-1.5">
                    {isRtl 
                      ? '🔒 فحص آلي فوري لمنع تكرار الإيصالات وإصدار كود الترخيص الرسمي وتنشيط الأيقونة في ثوانٍ' 
                      : 'Instant automated check with anti-replay protection'}
                  </p>
                </div>

                {/* WhatsApp & Call Action Buttons (Fallback Support) */}
                <div className="pt-2 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-600">
                  <span>{isRtl ? 'تحتاج مساعدة أو تفضل إرسال الوصل للمطور يدوياً؟' : 'Prefer sending receipt manually?'}</span>
                  <div className="flex items-center gap-2">
                    <a
                      href={getWhatsAppOrderUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold hover:bg-emerald-100 transition"
                    >
                      <MessageSquare className="size-3" />
                      <span>واتساب</span>
                    </a>
                    <a
                      href="tel:+213655870392"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-300 font-bold hover:bg-slate-200 transition"
                    >
                      <Phone className="size-3" />
                      <span>اتصال</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Step 4: Key Activation Input Box */}
              <form onSubmit={handleActivateKey} className="rounded-xl border-2 border-emerald-500/60 bg-emerald-50/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-emerald-950 flex items-center gap-1.5">
                    <KeyRound className="size-4 text-emerald-700" />
                    <span>{isRtl ? '4. تفعيل الكود (بمجرد استلامه من المطور زكريا):' : '4. Enter Key Received from Zakarya:'}</span>
                  </label>
                  <span className="text-[10px] text-emerald-700 font-bold bg-white px-2 py-0.5 rounded border border-emerald-200">
                    {isRtl ? 'تفعيل فوري' : 'Instant Unlock'}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={activationKeyInput}
                    onChange={(e) => {
                      setActivationKeyInput(e.target.value.toUpperCase());
                      setActivationError('');
                    }}
                    placeholder={isRtl ? 'الصق كود التفعيل هنا (مثال: FC-BRL-...)' : 'Paste license key here...'}
                    dir="ltr"
                    className="flex-1 rounded-xl border border-emerald-400 bg-white px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 uppercase"
                  />

                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black px-5 py-2.5 text-xs shadow-md transition cursor-pointer"
                  >
                    <Sparkles className="size-3.5 text-amber-300" />
                    <span>{isRtl ? 'تفعيل الخدمة الآن' : 'Activate Now'}</span>
                  </button>
                </div>

                {activationError && (
                  <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-1.5">
                    <AlertCircle className="size-3.5 shrink-0" />
                    <span>{activationError}</span>
                  </div>
                )}
              </form>

              {/* Assurance strip */}
              <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 pt-1">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="size-3.5 text-emerald-600" />
                  <span>تفعيل معتمد وصالح لمدة 30 يوماً</span>
                </span>
                <span className="flex items-center gap-1">
                  <Lock className="size-3.5 text-slate-400" />
                  <span>أمان كامل وخالٍ من أي بطاقات بنكية</span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-100 bg-slate-50/70 px-6 py-3 flex items-center justify-between text-xs text-slate-500">
          <span>
            مطور تطبيقات وبرامج حر: زكريا بسيود • هاتف: 0655870392
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1 font-bold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
          >
            {isRtl ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
