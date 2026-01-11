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

// Mount React App in Shadow DOM
function mountUI() {
  console.warn('[Gems Manager] Attempting to mount UI...');
  const hostId = 'gemini-gems-manager-host';
  if (document.getElementById(hostId)) {
    console.warn('[Gems Manager] UI host already exists.');
    return;
  }

  const host = document.createElement('div');
  host.id = hostId;
  host.style.position = 'fixed';
  host.style.top = '0';
  host.style.left = '0';
  host.style.width = '0';
  host.style.height = '0';
  host.style.zIndex = '99999';
  host.style.pointerEvents = 'none'; // Let clicks pass through unless on UI

  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: 'open' });
  
  // Container for React App
  const rootContainer = document.createElement('div');
  // Enable pointer events for the UI container itself
  rootContainer.style.pointerEvents = 'auto'; 
  shadow.appendChild(rootContainer);

  const root = createRoot(rootContainer);
  root.render(<App />);
  console.warn('[Gems Manager] UI mounted successfully.');
}

// Wait for body to be available
if (document.body) {
  mountUI();
} else {
  document.addEventListener('DOMContentLoaded', mountUI);
}

// Listen for messages from the injected script
window.addEventListener('message', (event) => {
  // We only accept messages from ourselves
  if (event.source !== window) {
    return;
  }

  if (event.data.type && (event.data.type === 'GEMS_INTERCEPTED')) {
    console.warn('[Gems Manager] Content script received gems:', event.data.gems);
    
    // Forward to background script/storage
    browser.runtime.sendMessage({
      type: 'GEMS_UPDATED',
      data: event.data.gems
    }).catch(err => console.error('[Gems Manager] Failed to send message to background:', err));
  }
});
