import browser from 'webextension-polyfill';
import { LocalStorage } from '../types/storage';

export type LocalStorageKeys = keyof LocalStorage;

export function getStorage<Key extends LocalStorageKeys>(
  keys: Key[]
): Promise<Pick<LocalStorage, Key>> {
  return browser.storage.local.get(keys) as Promise<Pick<LocalStorage, Key>>;
}

export function setStorage(items: Partial<LocalStorage>): Promise<void> {
  return browser.storage.local.set(items);
}