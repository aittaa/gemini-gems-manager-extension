import browser from 'webextension-polyfill';
import { ExtensionMessage } from '../types/messages';
import { setStorage } from '../utils/storage';

browser.runtime.onInstalled.addListener((): void => {
  // console.log('Gemini Gems Manager installed');
});

browser.runtime.onMessage.addListener((message: unknown) => {
  const msg = message as ExtensionMessage;

  if (msg.type === 'GEMS_UPDATED') {
    setStorage({ gems: msg.data }).catch(() => {});
  } else if (msg.type === 'OPEN_URL') {
    browser.tabs.create({ url: msg.url, active: msg.active }).catch(() => {});
  }
});