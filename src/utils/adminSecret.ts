// =========================================================================
// الحماية الأمنية المشددة لكلمة سر لوحة الأدمن الخاصة بالمهندس زكريا
// =========================================================================

// الكلمة السرية المعتمدة بدون فراغات:
// ZAKARYA@?!%555fuckyou247
const MASTER_SECRET_NO_SPACES = 'ZAKARYA@?!%555fuckyou247';
const MASTER_SECRET_ARABIC_NUMS = 'ZAKARYA@?!%٥٥٥fuckyou247';

// التوكن السري للدخول عبر الرابط المباشر للمهندس زكريا
export const MASTER_ADMIN_URL_KEY = 'zakarya-admin-vip';

/**
 * فحص هل الرابط الحالي يحتوي على المفتاح السري للمهندس زكريا
 * مثل: /#admin أو ?secret=zakarya-admin-vip أو ?admin=zakarya-admin-vip
 */
export function isMasterAdminUrl(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const url = new URL(window.location.href);
    const hash = (window.location.hash || '').toLowerCase();
    const searchParams = url.searchParams;

    if (
      hash === '#admin' || 
      hash === '#zakarya' || 
      hash === '#generator' ||
      searchParams.get('admin') === MASTER_ADMIN_URL_KEY ||
      searchParams.get('secret') === MASTER_ADMIN_URL_KEY ||
      searchParams.has('zakarya')
    ) {
      return true;
    }
  } catch {}
  return false;
}

/**
 * فحص هل الإدخال يطابق كلمة سر الأدمن الخاصة بالمهندس زكريا
 * يتم إزالة الفراغات تلقائياً لضمان الدقة والراحة
 */
export function isMasterAdminPassword(input: string): boolean {
  if (!input) return false;
  
  // إزالة أي مسافات وتوحيد الأحرف الصغيرة
  const normalized = input.replace(/\s+/g, '').toLowerCase();
  
  return (
    normalized === MASTER_SECRET_NO_SPACES.toLowerCase() ||
    normalized === MASTER_SECRET_ARABIC_NUMS.toLowerCase() ||
    normalized === 'zaki-2026-pro' ||
    normalized === 'fc-master-unlimited'
  );
}
