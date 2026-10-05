/**
 * backend.ts — Backend URL resolver for Shopify Theme Extensions and Vercel
 *
 * Dynamically resolves the backend base URL with zero localhost hardcoding:
 * 1. window.LIVE_COMMERCE_BACKEND_URL (set in Liquid script)
 * 2. data-backend-url attribute on #live-commerce-root or #root
 * 3. import.meta.env.VITE_BACKEND_URL
 * 4. Fallback to '' (same-origin relative /api routes)
 */

const DEFAULT_BACKEND_URL = 'https://ttk.facetimefy.com';

export function getBackendUrl(): string {
  if (typeof window !== 'undefined' && (window as any).LIVE_COMMERCE_BACKEND_URL) {
    return String((window as any).LIVE_COMMERCE_BACKEND_URL).replace(/\/+$/, '');
  }

  if (typeof document !== 'undefined') {
    const el =
      document.getElementById('live-commerce-root') ||
      document.getElementById('root');
    const dataUrl = el?.getAttribute('data-backend-url');
    if (dataUrl) {
      return dataUrl.replace(/\/+$/, '');
    }
  }

  if (import.meta.env.VITE_BACKEND_URL) {
    return String(import.meta.env.VITE_BACKEND_URL).replace(/\/+$/, '');
  }

  // When running on a Shopify storefront, route API requests to your Vercel backend
  if (
    typeof window !== 'undefined' &&
    window.location.hostname &&
    !window.location.hostname.includes('run.app') &&
    !window.location.hostname.includes('localhost') &&
    !window.location.hostname.includes('ttk.facetimefy.com')
  ) {
    return DEFAULT_BACKEND_URL;
  }

  return '';
}
