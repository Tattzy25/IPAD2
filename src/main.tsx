import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

declare global {
  interface Window {
    __LIVE_COMMERCE_ROOT__?: any;
  }
}

function mountApp() {
  if (typeof document === 'undefined') return;

  const target =
    document.getElementById('live-commerce-root') ||
    document.getElementById('root');

  if (!target) {
    if (document.body) {
      const el = document.createElement('div');
      el.id = 'live-commerce-root';
      document.body.appendChild(el);
      mountToElement(el);
    } else {
      window.addEventListener('DOMContentLoaded', mountApp, { once: true });
    }
    return;
  }

  mountToElement(target);
}

function mountToElement(target: HTMLElement) {
  if ((target as any).__reactRoot) {
    (target as any).__reactRoot.render(<App />);
    return;
  }

  if (window.__LIVE_COMMERCE_ROOT__) {
    window.__LIVE_COMMERCE_ROOT__.render(<App />);
    return;
  }

  const root = createRoot(target);
  (target as any).__reactRoot = root;
  window.__LIVE_COMMERCE_ROOT__ = root;
  root.render(<App />);
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountApp, { once: true });
  } else {
    mountApp();
  }
}
