import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

function mountApp() {
  let target =
    document.getElementById('live-commerce-root') ||
    document.getElementById('root');

  if (!target) {
    target = document.createElement('div');
    target.id = 'live-commerce-root';
    document.body.appendChild(target);
  }

  createRoot(target).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountApp);
  } else {
    mountApp();
  }
}
