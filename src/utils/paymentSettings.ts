/**
 * Management and persistent storage for Developer's Bank, Postal & Gateway Settings
 * All fields are EMPTY by default so the developer can manually configure them
 * via his dedicated Admin Dashboard without hardcoded dummy numbers.
 */

export interface PaymentSettings {
  accountHolderName: string;
  baridiMobRip: string;
  ccpNumber: string;
  ccpKey: string;
  bankName: string;
  bankRibIban: string;
  chargilyPaymentUrl: string; // رابط الدفع الآلي لبريدي موب / البطاقة الذهبية (Chargily Pay)
  stripePaymentUrl: string;   // رابط الدفع بالبطاقات الدولية (Stripe Payment Link)
  paypalPaymentUrl: string;   // رابط PayPal المباشر
  customInstructions: string;
  updatedAt?: string;
}

const STORAGE_KEY = 'feedcalc_admin_payment_settings';

export const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  accountHolderName: '',
  baridiMobRip: '',
  ccpNumber: '',
  ccpKey: '',
  bankName: '',
  bankRibIban: '',
  chargilyPaymentUrl: '',
  stripePaymentUrl: '',
  paypalPaymentUrl: '',
  customInstructions: '',
};

export function getPaymentSettings(): PaymentSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PAYMENT_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      accountHolderName: parsed.accountHolderName || '',
      baridiMobRip: parsed.baridiMobRip || '',
      ccpNumber: parsed.ccpNumber || '',
      ccpKey: parsed.ccpKey || '',
      bankName: parsed.bankName || '',
      bankRibIban: parsed.bankRibIban || '',
      chargilyPaymentUrl: parsed.chargilyPaymentUrl || '',
      stripePaymentUrl: parsed.stripePaymentUrl || '',
      paypalPaymentUrl: parsed.paypalPaymentUrl || '',
      customInstructions: parsed.customInstructions || '',
      updatedAt: parsed.updatedAt || undefined,
    };
  } catch {
    return { ...DEFAULT_PAYMENT_SETTINGS };
  }
}

export function savePaymentSettings(settings: PaymentSettings): void {
  try {
    const dataToSave: PaymentSettings = {
      ...settings,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  } catch (e) {
    console.error('Failed to save payment settings', e);
  }
}

export function hasConfiguredPayment(settings: PaymentSettings): boolean {
  return Boolean(
    settings.baridiMobRip.trim() ||
    settings.ccpNumber.trim() ||
    settings.bankRibIban.trim() ||
    settings.chargilyPaymentUrl.trim() ||
    settings.stripePaymentUrl.trim() ||
    settings.paypalPaymentUrl.trim()
  );
}

export function hasBankOrCcp(settings: PaymentSettings): boolean {
  return Boolean(
    settings.baridiMobRip.trim() ||
    settings.ccpNumber.trim() ||
    settings.bankRibIban.trim()
  );
}
