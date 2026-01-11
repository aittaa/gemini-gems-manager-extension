import browser from 'webextension-polyfill';
import { ExtensionMessage } from '../types/messages';
import { setStorage } from '../utils/storage';

browser.runtime.onInstalled.addListener((): void => {
  console.log('Gemini Gems Manager installed');
});

browser.runtime.onMessage.addListener((message: unknown) => {
  const msg = message as ExtensionMessage;

  if (msg.type === 'GEMS_UPDATED') {
    console.log('[Background] Received Gems update:', msg.data);
    setStorage({ gems: msg.data }).catch((err) => {
      console.error('[Background] Failed to save Gems:', err);
    });
  }
});
