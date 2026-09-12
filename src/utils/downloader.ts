/**
 * Universal file downloader utility that safely handles iframe restrictions,
 * Blob generation, and direct browser download fallbacks.
 */
export async function downloadFile(url: string, filename: string): Promise<boolean> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }
    const blob = await response.blob();
    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(objectUrl);
    }, 200);
    return true;
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
    const blob = new Blob([content], { type: mimeType });
    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(objectUrl);
    }, 200);
    return true;
  } catch (err) {
    console.error('Failed to download text as file', err);
    return false;
  }
}

