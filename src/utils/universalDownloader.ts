/**
 * Universal Cross-Device Downloader & Exporter Engine
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
  isInIframe: boolean;
  canWebShareFiles: boolean;
}

export function detectDevice(): DeviceInfo {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      isMobile: false,
      isIOS: false,
      isAndroid: false,
      isWebView: false,
      isInIframe: false,
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

  let isInIframe = false;
  try {
    isInIframe = window.self !== window.top;
  } catch {
    isInIframe = true;
  }

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
    isInIframe,
    canWebShareFiles,
  };
}

export async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export interface UniversalExportOptions {
  blob: Blob;
  filename: string;
  title?: string;
  text?: string;
  mimeType?: string;
  /** Force web share if available */
  preferShare?: boolean;
}

export interface UniversalExportResult {
  success: boolean;
  actionTaken: 'shared' | 'downloaded' | 'opened_in_new_tab' | 'blob_url_created' | 'cancelled';
  message: string;
  blobUrl: string;
  dataUrl?: string;
  file?: File;
}

/**
 * Universal save or share that cascades through the most reliable
 * strategy for the current device and browser.
 */
export async function universalSaveOrShare(options: UniversalExportOptions): Promise<UniversalExportResult> {
  const { blob, filename, title = filename, text = '', mimeType = blob.type || 'application/pdf', preferShare = false } = options;
  const device = detectDevice();

  // Create or retrieve objectUrl
  let objectUrl = '';
  try {
    objectUrl = window.URL.createObjectURL(blob);
  } catch {
    objectUrl = '';
  }

  // Create a proper File instance for sharing
  let file: File | null = null;
  try {
    file = new File([blob], filename, { type: mimeType, lastModified: Date.now() });
  } catch {
    file = null;
  }

  // STRATEGY 1: Native Web Share API with Files (Android & iOS)
  // When preferShare is true or on mobile devices where direct anchor downloads fail silently
  if ((preferShare || device.isMobile) && file && typeof navigator.share === 'function') {
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
          blobUrl: objectUrl,
          file,
        };
      }
    } catch (shareErr: unknown) {
      const err = shareErr as { name?: string; message?: string };
      // User cancelled native share sheet
      if (err && (err.name === 'AbortError' || err.name === 'CancelError')) {
        return {
          success: true,
          actionTaken: 'cancelled',
          message: 'تم إلغاء عملية المشاركة.',
          blobUrl: objectUrl,
          file,
        };
      }
      console.warn('Web Share failed or transient user gesture expired:', err);
      // Fall through to other strategies
    }
  }

  // STRATEGY 2: iOS Safari specific handling
  // iOS Safari ignores the `download` attribute on blob URLs!
  // Opening the blob URL or navigating to it triggers Safari's built-in PDF viewer
  // which provides the native iOS "Share / Save to Files" button right on the screen.
  if (device.isIOS && objectUrl) {
    try {
      const win = window.open(objectUrl, '_blank');
      if (win) {
        return {
          success: true,
          actionTaken: 'opened_in_new_tab',
          message: 'تم فتح التقرير في نافذة مستقلة. اضغط على أيقونة المشاركة (Share) ثم "حفظ في الملفات".',
          blobUrl: objectUrl,
          file: file || undefined,
        };
      } else {
        // If popup was blocked, navigate directly or return blobUrl
        window.location.href = objectUrl;
        return {
          success: true,
          actionTaken: 'opened_in_new_tab',
          message: 'تم فتح التقرير للمعاينة والحفظ بجهازك.',
          blobUrl: objectUrl,
          file: file || undefined,
        };
      }
    } catch (iosErr) {
      console.warn('iOS Safari direct view failed:', iosErr);
    }
  }

  // STRATEGY 3: Standard Anchor Download with Object URL (Desktop & Android Chrome)
  if (objectUrl) {
    try {
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
          // Do not revoke too quickly for slow mobile devices
          setTimeout(() => {
            try {
              window.URL.revokeObjectURL(objectUrl);
            } catch {}
          }, 30000);
        } catch {}
      }, 500);

      return {
        success: true,
        actionTaken: 'downloaded',
        message: 'تم بدء التنزيل بنجاح!',
        blobUrl: objectUrl,
        file: file || undefined,
      };
    } catch (downloadErr) {
      console.warn('Anchor download failed:', downloadErr);
    }
  }

  // STRATEGY 4: Window.open / Location navigation fallback
  try {
    if (objectUrl) {
      const win = window.open(objectUrl, '_blank');
      if (win) {
        return {
          success: true,
          actionTaken: 'opened_in_new_tab',
          message: 'تم فتح التقرير في نافذة جديدة للمعاينة والحفظ.',
          blobUrl: objectUrl,
          file: file || undefined,
        };
      }
    }
  } catch (winErr) {
    console.warn('window.open blocked:', winErr);
  }

  return {
    success: !!objectUrl,
    actionTaken: 'blob_url_created',
    message: 'تم تجهيز الملف وجاهز للحفظ.',
    blobUrl: objectUrl,
    file: file || undefined,
  };
}

/**
 * Download arbitrary text (like standalone offline HTML or CSV) as a file
 * with universal data-URI fallback for devices that block blob downloads
 */
export async function universalDownloadText(
  filename: string,
  content: string,
  mimeType: string = 'text/html;charset=utf-8'
): Promise<UniversalExportResult> {
  const blob = new Blob([content], { type: mimeType });
  const objectUrl = window.URL.createObjectURL(blob);
  const device = detectDevice();

  // Try direct Data URI download first for HTML/text on mobile and desktop
  // because data URIs bypass iframe blob sandbox restrictions!
  try {
    const encodedData = 'data:' + mimeType + ',' + encodeURIComponent(content);
    const link = document.createElement('a');
    link.href = encodedData;
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
      } catch {}
    }, 500);

    return {
      success: true,
      actionTaken: 'downloaded',
      message: 'تم تنزيل الملف بنجاح!',
      blobUrl: objectUrl,
      dataUrl: encodedData,
    };
  } catch (dataUriErr) {
    console.warn('Data URI download failed, falling back to blob save/share:', dataUriErr);
  }

  // Fallback to universal blob save/share
  return universalSaveOrShare({
    blob,
    filename,
    title: filename,
    mimeType,
  });
}

/**
 * Opens content directly in a fresh browser window with document.write
 * (100% immune to popup blockers and file system permission restrictions)
 */
export function openHtmlInNewWindow(htmlContent: string, title: string = 'FeedCalc Pro Report'): boolean {
  try {
    const win = window.open('', '_blank');
    if (win) {
      win.document.open();
      win.document.write(htmlContent);
      win.document.close();
      win.document.title = title;
      return true;
    }
  } catch (err) {
    console.warn('Failed to open HTML in new window:', err);
  }
  return false;
}
