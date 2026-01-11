import browser from 'webextension-polyfill';

browser.runtime.onInstalled.addListener((): void => {
  console.log('Gemini Gems Manager installed');
});

// Future: Handle messages from content scripts for Gem data
browser.runtime.onMessage.addListener((message: unknown) => {
  console.log('Message received in background:', message);
});