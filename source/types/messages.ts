export interface Gem {
  id: string;
  name: string;
  description?: string;
  emoji?: string; // Custom emoji mapped by user
}

export type ExtensionMessage = 
  | { type: 'GEMS_UPDATED'; data: Gem[] }
  | { type: 'OPEN_URL'; url: string; active: boolean }
  | { type: 'PING' };