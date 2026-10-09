export function getBasePath(): string {
  if (typeof window === 'undefined') return '';
  return window.location.pathname.startsWith('/micarta') ? '/micarta' : '';
}

export function getAppOrigin(): string {
  if (typeof window === 'undefined' || !window.location.origin) {
    return 'https://micarta.io';
  }
  return `${window.location.origin}${getBasePath()}`;
}

export function getAssetUrl(assetPath: string): string {
  const clean = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
  return `${getBasePath()}${clean}`;
}
