import browser from 'webextension-polyfill';

console.log('Gemini Gems Manager content script loaded');

// Inject the interceptor script into the main world
function injectScript(file: string) {
  const script = document.createElement('script');
  script.src = browser.runtime.getURL(file);
  script.onload = function() {
    (this as HTMLScriptElement).remove();
  };
  (document.head || document.documentElement).appendChild(script);
  console.log('Gemini Gems Manager interceptor injected from content script');
}

injectScript('assets/js/injected.bundle.js');

// Listen for messages from the injected script
window.addEventListener('message', (event) => {
  // We only accept messages from ourselves
  if (event.source !== window) {
    return;
  }

  if (event.data.type && (event.data.type === 'GEMS_INTERCEPTED')) {
    console.log('Content script received gems:', event.data.gems);
    
    // Forward to background script/storage
    browser.runtime.sendMessage({
      type: 'GEMS_UPDATED',
      data: event.data.gems
    });
  }
});