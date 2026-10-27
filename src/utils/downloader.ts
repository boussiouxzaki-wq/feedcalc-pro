import { universalSaveOrShare, universalDownloadText } from './universalDownloader';

/**
 * Universal file downloader utility that safely handles iframe restrictions,
 * Web Share API for mobile devices, and direct browser download fallbacks.
 */
export async function downloadFile(url: string, filename: string): Promise<boolean> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }
    const blob = await response.blob();
    const result = await universalSaveOrShare({
      blob,
      filename,
      title: filename,
    });
    return result.success;
  } catch (err) {
    console.warn('Blob download failed or blocked by iframe, falling back to direct window.open', err);
    try {
      window.open(url, '_blank');
      return true;
    } catch {
      return false;
    }
  }
}

export function downloadTextAsFile(
  filename: string,
  content: string,
  mimeType: string = 'text/plain;charset=utf-8'
): boolean {
  try {
    universalDownloadText(filename, content, mimeType);
    return true;
  } catch (err) {
    console.error('Failed to download text as file', err);
    return false;
  }
}
