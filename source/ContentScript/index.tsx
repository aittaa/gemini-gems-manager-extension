import browser from 'webextension-polyfill';
import { createRoot } from 'react-dom/client';
import App from './App';

console.warn('[Gems Manager] Content script loaded!');

// Inject the interceptor script into the main world
function injectScript(file: string) {
  try {
    const script = document.createElement('script');
    script.src = browser.runtime.getURL(file);
    script.onload = function() {
      (this as HTMLScriptElement).remove();
    };
    (document.head || document.documentElement).appendChild(script);
    console.warn('[Gems Manager] Interceptor script injected:', file);
  } catch (e) {
    console.error('[Gems Manager] Failed to inject script:', e);
  }
}

injectScript('assets/js/injected.bundle.js');

const HOST_ID = 'gemini-gems-manager-host';

// Mount React App in Shadow DOM
function mountUI() {
  if (document.getElementById(HOST_ID)) return;

  const host = document.createElement('div');
  host.id = HOST_ID;
  host.style.position = 'fixed';
  host.style.top = '0';
  host.style.left = '0';
  host.style.width = '0';
  host.style.height = '0';
  host.style.zIndex = '99999';
  host.style.pointerEvents = 'none';

  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: 'open' });
  const rootContainer = document.createElement('div');
  rootContainer.style.pointerEvents = 'auto'; 
  shadow.appendChild(rootContainer);

  const root = createRoot(rootContainer);
  root.render(<App />);
  console.warn('[Gems Manager] UI mounted.');
}

// Observe body to ensure host element is not removed by Gemini's SPA logic
const observer = new MutationObserver((_mutations) => {
  if (!document.getElementById(HOST_ID)) {
    mountUI();
  }
});

if (document.body) {
  mountUI();
  observer.observe(document.body, { childList: true });
} else {
  document.addEventListener('DOMContentLoaded', () => {
    mountUI();
    observer.observe(document.body, { childList: true });
  });
}

// Listen for messages from the injected script
window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  if (event.data.type === 'GEMS_INTERCEPTED') {
    browser.runtime.sendMessage({
      type: 'GEMS_UPDATED',
      data: event.data.gems
    }).catch(() => {});
  }
});