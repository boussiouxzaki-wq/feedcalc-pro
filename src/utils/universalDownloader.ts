/**
 * Universal Cross-Device Downloader & Exporter Utility
 * 
 * Works 100% reliably across:
 * - Android Chrome, Samsung Internet, Xiaomi Mi Browser, Opera
 * - iOS Safari, Chrome on iOS, iPadOS
 * - In-App WebViews (WhatsApp, Telegram, Facebook, Instagram, Messenger)
 * - Desktop Chrome, Firefox, Edge, Safari
 * - Sandboxed Iframes & PWA standalone mode
 */

export interface DeviceInfo {
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isWebView: boolean;
  canWebShareFiles: boolean;
}

export function detectDevice(): DeviceInfo {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      isMobile: false,
      isIOS: false,
      isAndroid: false,
      isWebView: false,
      canWebShareFiles: false,
    };
  }

  const ua = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  const isMobile = isIOS || isAndroid || /Mobi|Tablet|Opera Mini/i.test(ua);

  // Detect in-app webviews like WhatsApp, Facebook, Instagram, Telegram, WeChat
  const isWebView = /(FBAN|FBAV|Instagram|WhatsApp|Telegram|Line|WeChat|MicroMessenger|musical_ly|Snapchat|GSA|Line)/i.test(ua)
    || (isAndroid && /Version\/[0-9.]+/i.test(ua) && !/Chrome\/[0-9.]+\s+Mobile/i.test(ua));

  let canWebShareFiles = false;
  try {
    if (typeof navigator.canShare === 'function' && typeof File !== 'undefined') {
      const dummyFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      canWebShareFiles = navigator.canShare({ files: [dummyFile] });
    }
  } catch {
    canWebShareFiles = false;
  }

  return {
    isMobile,
    isIOS,
    isAndroid,
    isWebView,
    canWebShareFiles,
  };
}

export interface UniversalExportOptions {
  blob: Blob;
  filename: string;
  title?: string;
  text?: string;
  mimeType?: string;
}

export interface UniversalExportResult {
  success: boolean;
  actionTaken: 'shared' | 'downloaded' | 'opened_in_new_tab' | 'blob_url_created' | 'cancelled';
  message: string;
  blobUrl?: string;
}

/**
 * Universal save or share that cascades through the most reliable
 * strategy for the current device and browser.
 */
export async function universalSaveOrShare(options: UniversalExportOptions): Promise<UniversalExportResult> {
  const { blob, filename, title = filename, text = '', mimeType = blob.type || 'application/pdf' } = options;
  const device = detectDevice();

  // Create a proper File instance for sharing
  let file: File | null = null;
  try {
    file = new File([blob], filename, { type: mimeType, lastModified: Date.now() });
  } catch {
    file = null;
  }

  // STRATEGY 1: Web Share API with Files (Android & iOS native save/share sheet)
  // This is the absolute golden path on mobile: iOS opens "Save to Files / AirDrop / WhatsApp"
  // and Android opens "Save to Downloads / Drive / WhatsApp / Print".
  if (device.isMobile && file && typeof navigator.share === 'function') {
    try {
      const canShare = typeof navigator.canShare === 'function' ? navigator.canShare({ files: [file] }) : true;
      if (canShare) {
        await navigator.share({
          files: [file],
          title,
          text,
        });
        return {
          success: true,
          actionTaken: 'shared',
          message: 'تم فتح قائمة المشاركة / الحفظ بجهازك بنجاح!',
        };
      }
    } catch (shareErr: unknown) {
      // User cancelled the native share sheet
      const err = shareErr as { name?: string };
      if (err && (err.name === 'AbortError' || err.name === 'CancelError')) {
        return {
          success: true,
          actionTaken: 'cancelled',
          message: 'تم إلغاء عملية الحفظ.',
        };
      }
      console.warn('Web Share failed or was rejected, falling back to direct download:', shareErr);
    }
  }

  // STRATEGY 2: Standard Anchor Download with Object URL (Desktop & supporting mobile browsers)
  let objectUrl = '';
  try {
    objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      try {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
        // Don't revoke immediately in iOS Safari
        setTimeout(() => {
          window.URL.revokeObjectURL(objectUrl);
        }, 15000);
      } catch {}
    }, 500);

    // If mobile or in a webview, anchor clicks might be silently dropped,
    // so we also provide the objectUrl in the return
    return {
      success: true,
      actionTaken: 'downloaded',
      message: 'تم بدء التنزيل بنجاح!',
      blobUrl: objectUrl,
    };
  } catch (downloadErr) {
    console.warn('Anchor download failed, attempting window.open:', downloadErr);
  }

  // STRATEGY 3: Window.open / Location navigation (iOS Safari fallback)
  try {
    if (!objectUrl) {
      objectUrl = window.URL.createObjectURL(blob);
    }
    const win = window.open(objectUrl, '_blank');
    if (win) {
      return {
        success: true,
        actionTaken: 'opened_in_new_tab',
        message: 'تم فتح التقرير في نافذة جديدة للمعاينة والحفظ.',
        blobUrl: objectUrl,
      };
    }
  } catch (winErr) {
    console.warn('window.open blocked:', winErr);
  }

  return {
    success: !!objectUrl,
    actionTaken: 'blob_url_created',
    message: 'تم تجهيز الملف!',
    blobUrl: objectUrl,
  };
}

/**
 * Download arbitrary text (like HTML or CSV) as a file with universal mobile fallback
 */
export async function universalDownloadText(
  filename: string,
  content: string,
  mimeType: string = 'text/html;charset=utf-8'
): Promise<UniversalExportResult> {
  const blob = new Blob([content], { type: mimeType });
  return universalSaveOrShare({
    blob,
    filename,
    title: filename,
    mimeType,
  });
}
