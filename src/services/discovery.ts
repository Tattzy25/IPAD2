/**
 * discovery.ts — Store Discovery Service
 *
 * Discovers JUST the clean domain (e.g. 'example.com' with NO http/https or paths)
 * from the well-known discovery file at page load:
 *
 *   const ucpDiscoveryUrl = `${window.location.origin}/.well-known/ucp`;
 *
 * Fallback:
 *   const merchantDomain = window.location.hostname;
 */

function cleanDomain(val?: string | null): string {
  if (!val) return '';
  return val
    .replace(/^https?:\/\//i, '')
    .replace(/\/.*$/, '')
    .trim();
}

let cachedDomain: string = '';

export async function discoverStoreDomain(): Promise<string> {
  if (cachedDomain) {
    return cachedDomain;
  }

  const merchantDomain = cleanDomain(window.location.hostname);
  const ucpDiscoveryUrl = `${window.location.origin}/.well-known/ucp`;

  try {
    const response = await fetch(ucpDiscoveryUrl);
    if (response.ok) {
      const data = await response.json();
      const raw = data.domain || data.shop_domain || data.merchant_domain;
      const cleaned = cleanDomain(raw);
      if (cleaned) {
        cachedDomain = cleaned;
        return cachedDomain;
      }
    }
  } catch {
    // Continue to fallback
  }

  const fallback =
    merchantDomain && !merchantDomain.includes('run.app') && !merchantDomain.includes('localhost')
      ? merchantDomain
      : 'store.anigok.com';

  cachedDomain = fallback;
  return cachedDomain;
}

export function getDiscoveredDomain(): string {
  if (cachedDomain) {
    return cachedDomain;
  }
  const merchantDomain = cleanDomain(window.location.hostname);
  return merchantDomain && !merchantDomain.includes('run.app') && !merchantDomain.includes('localhost')
    ? merchantDomain
    : 'store.anigok.com';
}
