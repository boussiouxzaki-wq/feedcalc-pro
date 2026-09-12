// FeedCalc Pro - Licensing and Single-Service Subscription Engine
// Intellectual Property of Eng. ZAKARYA Bessioud (+213 655 870 392)

const STORAGE_VERSION = 'v4';
const MASTER_ACTIVATED_KEY = `feedcalc_master_activated_${STORAGE_VERSION}`;
const SERVICES_STORAGE_KEY = `feedcalc_active_services_${STORAGE_VERSION}`;
const ADMIN_SESSION_KEY = 'fc_admin_auth_v4';

const SALT = 'ZAKARYA_BESSIOUD_ALGERIA_0655870392';

export interface ServiceItem {
  id: string; // Species ID (e.g. 'layer', 'sheep', 'rabbit', etc.)
  code: string; // 3-letter code
  nameAr: string;
  nameEn: string;
  emoji: string;
}

/**
 * List of lockable species/services.
 * Note: 'broiler' (دجاج التسمين) is ALWAYS free for everyone and never locked!
 */
export const LOCKABLE_SERVICES: ServiceItem[] = [
  { id: 'layer', code: 'LAY', nameAr: 'دجاج البيض / البياض', nameEn: 'Layer Hens', emoji: '🥚' },
  { id: 'sheep', code: 'SHP', nameAr: 'الأغنام وتسمين الحملان', nameEn: 'Sheep & Lambs', emoji: '🐑' },
  { id: 'dairy_cow', code: 'DCW', nameAr: 'أبقار حلوب', nameEn: 'Dairy Cattle', emoji: '🐄' },
  { id: 'beef_cow', code: 'BCW', nameAr: 'أبقار وعجول تسمين', nameEn: 'Beef Cattle', emoji: '🐂' },
  { id: 'dairy_goat', code: 'GOT', nameAr: 'الماعز الحلوب', nameEn: 'Dairy Goats', emoji: '🐐' },
  { id: 'rabbit', code: 'RAB', nameAr: 'الأرانب (تسمين وإنتاج)', nameEn: 'Rabbits', emoji: '🐇' },
  { id: 'camel', code: 'CAM', nameAr: 'الإبل (البعير / النوق)', nameEn: 'Camels', emoji: '🐪' },
  { id: 'honeybee', code: 'BEE', nameAr: 'النحل (طوائف وخلايا)', nameEn: 'Honeybees', emoji: '🐝' },
  { id: 'tilapia', code: 'TIL', nameAr: 'سمك البلطي', nameEn: 'Tilapia Fish', emoji: '🐟' },
  { id: 'carp', code: 'CRP', nameAr: 'سمك الشبوط', nameEn: 'Carp Fish', emoji: '🐟' },
  { id: 'swine', code: 'SWN', nameAr: 'الخنازير (تسمين)', nameEn: 'Swine', emoji: '🐖' },
  { id: 'all', code: 'ALL', nameAr: 'الباقة الشاملة VIP (كافة الأيقونات)', nameEn: 'All Species (VIP Full)', emoji: '👑' },
];

export function getServiceByCode(code: string): ServiceItem | undefined {
  const clean = code.trim().toUpperCase();
  return LOCKABLE_SERVICES.find(s => s.code === clean);
}

export function getServiceById(id: string): ServiceItem | undefined {
  return LOCKABLE_SERVICES.find(s => s.id === id);
}

export interface ActivatedServiceRecord {
  serviceId: string;
  serviceCode: string;
  serviceName: string;
  clientName: string;
  key: string;
  activatedAt: string;
  expiresAt: string | null;
  daysRemaining: number;
  isLifetime: boolean;
}

export interface LicenseStatus {
  isActivated: boolean; // True if ANY paid service or master is unlocked
  hasMasterAccess: boolean; // True if full developer/VIP license
  unlockedServicesCount: number;
  activeServices: ActivatedServiceRecord[];
  clientName: string | null;
  tier: 'free' | 'single' | 'multi' | 'lifetime';
}

/**
 * Permanent VIP master keys for Eng. Zakarya himself
 */
const MASTER_LIFETIME_KEYS = [
  'ZAKI-2026-PRO',
  'FEEDCALC-VIP-2026',
  'BESSIOUD-PRO-AGRI',
  'ZAKI-ALGERIA-2026',
  'FC-MASTER-UNLIMITED'
];

/**
 * Fast deterministic hash function for key signatures
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(4, '0');
  return hex.substring(0, 4);
}

export interface KeyVerificationResult {
  valid: boolean;
  expired: boolean;
  expiresAt?: Date | null;
  daysRemaining?: number;
  planName?: string;
  tier: 'free' | 'monthly' | 'pro' | 'lifetime';
  client?: string;
  error?: string;
  serviceId?: string;
  serviceCode?: string;
  serviceNameAr?: string;
  isSingleService?: boolean;
}

/**
 * Verify license key authenticity, target service, and expiration date
 */
export function verifyLicenseKey(rawKey: string): KeyVerificationResult {
  if (!rawKey) {
    return { valid: false, expired: false, tier: 'free', error: 'الرجاء إدخال الكود' };
  }

  const key = rawKey.trim().toUpperCase();

  // 1. Check permanent developer / VIP master keys
  if (MASTER_LIFETIME_KEYS.includes(key)) {
    return {
      valid: true,
      expired: false,
      expiresAt: null,
      daysRemaining: 9999,
      planName: 'ترخيص المطور الشامل الدائم (VIP Master)',
      tier: 'lifetime',
      client: 'المهندس زكريا بسيود / ترخيص دائم',
      serviceId: 'all',
      serviceCode: 'ALL',
      serviceNameAr: 'الباقة الشاملة VIP (كافة الأيقونات)',
      isSingleService: false
    };
  }

  // 2. Single Service or Universal Format:
  // FC-[SERVICE_CODE]-[DAYS]D-[TIMESTAMP_B36]-[CHECKSUM]-ZB
  // Example: FC-SHP-30D-K8J2QA-9F2B-ZB  (Sheep only 30 days)
  // Example: FC-RAB-30D-K8J2QA-4A8E-ZB  (Rabbit only 30 days)
  // Example: FC-ALL-30D-K8J2QA-1C2D-ZB  (All services)
  const singleServiceRegex = /^FC-([A-Z0-9]{3})-(\d+)D-([A-Z0-9]{5,8})-([A-Z0-9]{4})-ZB$/;
  const singleMatch = key.match(singleServiceRegex);

  if (singleMatch) {
    const serviceCode = singleMatch[1];
    const durationDays = parseInt(singleMatch[2], 10);
    const timestampB36 = singleMatch[3];
    const checksum = singleMatch[4];

    // Cryptographically verify checksum bound to THIS exact service code
    const expectedChecksum = simpleHash(`${serviceCode}_${durationDays}_${timestampB36}_${SALT}`);
    if (checksum !== expectedChecksum) {
      return { valid: false, expired: false, tier: 'free', error: 'مفتاح التفعيل غير سليم أو تم تعديله!' };
    }

    const service = getServiceByCode(serviceCode);
    if (!service) {
      return { valid: false, expired: false, tier: 'free', error: 'رمز الخدمة في الكود غير معروف!' };
    }

    // Decode timestamp
    const expiryEpochSec = parseInt(timestampB36, 36);
    const expiryDate = new Date(expiryEpochSec * 1000);
    const now = new Date();

    const diffMs = expiryDate.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    if (diffMs <= 0) {
      return {
        valid: false,
        expired: true,
        expiresAt: expiryDate,
        daysRemaining: 0,
        planName: `اشتراك ${service.nameAr} (منتهي الصلاحية)`,
        tier: 'monthly',
        serviceId: service.id,
        serviceCode: service.code,
        serviceNameAr: service.nameAr,
        isSingleService: service.id !== 'all',
        error: `انتهت صلاحية اشتراك خدمة [${service.nameAr}]! يرجى التواصل مع المهندس زكريا للتجديد.`
      };
    }

    return {
      valid: true,
      expired: false,
      expiresAt: expiryDate,
      daysRemaining,
      planName: service.id === 'all' 
        ? `اشتراك شامل لكافة الأيقونات (${durationDays} يوماً)`
        : `اشتراك أيقونة [${service.nameAr}] (${durationDays} يوماً)`,
      tier: durationDays <= 31 ? 'monthly' : 'pro',
      client: 'اشتراك معتمد',
      serviceId: service.id,
      serviceCode: service.code,
      serviceNameAr: service.nameAr,
      isSingleService: service.id !== 'all'
    };
  }

  // 3. Legacy timed keys format: FCM[DAYS]-[TIMESTAMP_B36]-[CHECKSUM]-ZB
  const legacyTimedRegex = /^(?:FCM(\d+)|FC-(\d+)D)-([A-Z0-9]{5,8})-([A-Z0-9]{4})-ZB$/;
  const legacyMatch = key.match(legacyTimedRegex);

  if (legacyMatch) {
    const daysStr = legacyMatch[1] || legacyMatch[2];
    const timestampB36 = legacyMatch[3];
    const checksum = legacyMatch[4];
    const durationDays = parseInt(daysStr, 10);

    const expectedChecksum = simpleHash(`${durationDays}_${timestampB36}_${SALT}`);
    if (checksum === expectedChecksum) {
      const expiryEpochSec = parseInt(timestampB36, 36);
      const expiryDate = new Date(expiryEpochSec * 1000);
      const diffMs = expiryDate.getTime() - new Date().getTime();
      const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

      if (diffMs <= 0) {
        return {
          valid: false,
          expired: true,
          expiresAt: expiryDate,
          daysRemaining: 0,
          tier: 'monthly',
          error: 'انتهت صلاحية هذا الكود!'
        };
      }

      return {
        valid: true,
        expired: false,
        expiresAt: expiryDate,
        daysRemaining,
        planName: `اشتراك ${durationDays} يوماً`,
        tier: 'monthly',
        serviceId: 'all',
        serviceCode: 'ALL',
        serviceNameAr: 'الباقة الشاملة',
        isSingleService: false
      };
    }
  }

  return { valid: false, expired: false, tier: 'free', error: 'صيغة الكود غير صحيحة أو غير صالحة' };
}

/**
 * Get map of all activated services from localStorage
 */
export function getActivatedServicesMap(): Record<string, ActivatedServiceRecord> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(SERVICES_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    const now = new Date();
    const result: Record<string, ActivatedServiceRecord> = {};

    for (const [key, val] of Object.entries(parsed)) {
      const item = val as ActivatedServiceRecord;
      if (item.expiresAt) {
        const expDate = new Date(item.expiresAt);
        if (expDate.getTime() <= now.getTime()) {
          // Expired, omit or mark
          continue;
        }
        item.daysRemaining = Math.max(0, Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      } else {
        item.daysRemaining = 9999;
      }
      result[key] = item;
    }
    return result;
  } catch {
    return {};
  }
}

/**
 * Check if Master Admin is currently active on this device
 */
export function isMasterAdminActive(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(MASTER_ACTIVATED_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Check if a specific animal/species icon is unlocked and active
 */
export function isSpeciesUnlocked(speciesId: string): boolean {
  // 1. Broiler (دجاج اللحم والتسمين) is free for all visitors/clients
  if (speciesId === 'broiler') return true;

  // 2. Master Admin Developer VIP mode
  if (isMasterAdminActive()) return true;

  // 3. Check activated services map
  const activeMap = getActivatedServicesMap();

  // If client purchased 'all' VIP package
  if (activeMap['all']) return true;

  // If client purchased this specific icon
  if (activeMap[speciesId]) return true;

  return false;
}

/**
 * Returns a list of all unlocked species IDs for the current user
 */
export function getUnlockedSpeciesIds(): string[] {
  // Broiler is always first and unlocked
  const unlocked = ['broiler'];

  if (isMasterAdminActive()) {
    return LOCKABLE_SERVICES.map(s => s.id).concat(['broiler']);
  }

  const activeMap = getActivatedServicesMap();
  if (activeMap['all']) {
    return LOCKABLE_SERVICES.map(s => s.id).concat(['broiler']);
  }

  for (const serviceId of Object.keys(activeMap)) {
    if (!unlocked.includes(serviceId)) {
      unlocked.push(serviceId);
    }
  }

  return unlocked;
}

/**
 * Overall license status summary
 */
export function getLicenseStatus(): LicenseStatus {
  const masterActive = isMasterAdminActive();
  const activeMap = getActivatedServicesMap();
  const activeList = Object.values(activeMap);

  const isActivated = masterActive || activeList.length > 0;

  return {
    isActivated,
    hasMasterAccess: masterActive || Boolean(activeMap['all']),
    unlockedServicesCount: masterActive || activeMap['all'] ? LOCKABLE_SERVICES.length : activeList.length,
    activeServices: activeList,
    clientName: activeList[0]?.clientName || (masterActive ? 'المهندس زكريا بسيود (المطور)' : null),
    tier: masterActive ? 'lifetime' : activeList.length > 1 ? 'multi' : activeList.length === 1 ? 'single' : 'free'
  };
}

/**
 * Activate a key for a single service or all
 */
export function activateApp(key: string, clientName?: string): { 
  success: boolean; 
  message: string; 
  serviceId?: string; 
  serviceName?: string;
  daysRemaining?: number 
} {
  const result = verifyLicenseKey(key);
  if (!result.valid) {
    return {
      success: false,
      message: result.error || 'مفتاح التفعيل غير صالح أو منتهي الصلاحية!'
    };
  }

  try {
    const cleanKey = key.trim().toUpperCase();
    const serviceId = result.serviceId || 'all';
    const serviceName = result.serviceNameAr || 'الخدمة';

    if (serviceId === 'all' && result.tier === 'lifetime') {
      // Master admin VIP
      localStorage.setItem(MASTER_ACTIVATED_KEY, 'true');
      return {
        success: true,
        message: '⚡ تم تفعيل رخصة المطور الدائمة VIP Master (كافة الأيقونات مفتوحة بلا حدود)!',
        serviceId: 'all',
        serviceName: 'كافة الأيقونات'
      };
    }

    const currentServices = getActivatedServicesMap();
    const serviceCode = result.serviceCode || 'ALL';

    currentServices[serviceId] = {
      serviceId,
      serviceCode,
      serviceName,
      clientName: clientName?.trim() || 'مشترك',
      key: cleanKey,
      activatedAt: new Date().toISOString(),
      expiresAt: result.expiresAt ? result.expiresAt.toISOString() : null,
      daysRemaining: result.daysRemaining ?? 30,
      isLifetime: result.tier === 'lifetime'
    };

    localStorage.setItem(SERVICES_STORAGE_KEY, JSON.stringify(currentServices));

    const durationText = result.daysRemaining 
      ? `صالح لمدة ${result.daysRemaining} يوماً` 
      : 'ترخيص دائم';

    const singleNote = result.isSingleService 
      ? `(ملاحظة: هذا الكود مخصص لأيقونة ${serviceName} فقط)`
      : '(كافة الأيقونات مفتوحة)';

    return {
      success: true,
      message: `🎉 تم تفعيل أيقونة [${serviceName}] بنجاح! ${durationText} ${singleNote}`,
      serviceId,
      serviceName,
      daysRemaining: result.daysRemaining
    };
  } catch (err) {
    return {
      success: false,
      message: 'تعذر حفظ التفعيل في المتصفح.'
    };
  }
}

/**
 * Remove a specific service activation
 */
export function deactivateService(serviceId: string): void {
  try {
    const current = getActivatedServicesMap();
    delete current[serviceId];
    localStorage.setItem(SERVICES_STORAGE_KEY, JSON.stringify(current));
  } catch {}
}

/**
 * Deactivate / reset all paid services to visitor trial mode
 */
export function deactivateApp(): void {
  try {
    localStorage.removeItem(MASTER_ACTIVATED_KEY);
    localStorage.removeItem(SERVICES_STORAGE_KEY);
  } catch {}
}

/**
 * Complete reset to clean Visitor Mode (clears keys, services, admin auth session)
 */
export function resetToVisitorMode(): void {
  deactivateApp();
  try {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    sessionStorage.removeItem('fc_admin_auth');
    if (typeof window !== 'undefined') {
      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }
  } catch {}
}

/**
 * Activate master VIP unlimited developer license directly
 */
export function activateMasterAdmin(): { success: boolean; message: string } {
  return activateApp('FC-MASTER-UNLIMITED', 'المهندس زكريا بسيود (المطور)');
}

/**
 * Tool for Eng. Zakarya to generate new keys for his clients!
 * Can target a SINGLE service/icon (e.g. 'SHP', 'RAB', 'LAY') or 'ALL'
 */
export function generateClientKey(
  clientName: string, 
  days: number = 30, 
  serviceCode: string = 'LAY'
): {
  key: string;
  expiryDate: Date;
  days: number;
  formattedExpiry: string;
  serviceCode: string;
  serviceNameAr: string;
  isSingleService: boolean;
} {
  const cleanCode = (serviceCode || 'LAY').trim().toUpperCase();
  const service = getServiceByCode(cleanCode) || LOCKABLE_SERVICES[0];

  const now = new Date();
  const expiryDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  
  // Convert epoch seconds to base36
  const epochSec = Math.floor(expiryDate.getTime() / 1000);
  const timestampB36 = epochSec.toString(36).toUpperCase();

  // Cryptographic checksum bound to this exact service code and duration
  const checksum = simpleHash(`${service.code}_${days}_${timestampB36}_${SALT}`);

  // Format: FC-[CODE]-[DAYS]D-[TIMESTAMP]-[CHECKSUM]-ZB
  // Example: FC-SHP-30D-K8J2QA-9F2B-ZB
  const key = `FC-${service.code}-${days}D-${timestampB36}-${checksum}-ZB`;

  const formattedExpiry = expiryDate.toLocaleDateString('ar-DZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return {
    key,
    expiryDate,
    days,
    formattedExpiry,
    serviceCode: service.code,
    serviceNameAr: service.nameAr,
    isSingleService: service.code !== 'ALL'
  };
}

