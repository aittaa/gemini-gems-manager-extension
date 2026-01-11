import { Gem } from './messages';

export interface LocalStorage {
  gems: Gem[];
  favorites: string[]; // List of Gem IDs
  emojiMap: Record<string, string>; // Gem ID -> Emoji
  options: {
    showInEmptyState: boolean;
    showInChat: boolean;
    isPinned: boolean;
  };
}

export const defaultStorage: LocalStorage = {
  gems: [],
  favorites: [],
  emojiMap: {},
  options: {
    showInEmptyState: true,
    showInChat: true,
    isPinned: false,
  },
};