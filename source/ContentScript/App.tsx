import React, { useEffect, useState, useMemo, useRef } from 'react';
import browser from 'webextension-polyfill';
import { getStorage, setStorage } from '../utils/storage';
import { Gem } from '../types/messages';

const COMMON_EMOJIS = ['💎', '⭐', '🔥', '🧠', '✍️', '🎨', '🚀', '📊', '💻', '💡', '✅', '❤️', '🍀', '🎯'];

const EmojiPicker: React.FC<{
  onSelect: (emoji: string) => void;
  onClose: () => void;
  anchorRect: DOMRect | null;
  pickerRef: React.RefObject<HTMLDivElement | null>;
  isDark: boolean;
}> = ({ onSelect, onClose, anchorRect, pickerRef, isDark }) => {
  if (!anchorRect) return null;
  const bg = isDark ? '#282a2d' : '#ffffff';
  const border = isDark ? '#444746' : '#e0e0e0';
  const hover = isDark ? '#3c4043' : '#f1f3f4';
  const text = isDark ? '#e3e3e3' : '#1f1f1f';

  return (
    <div ref={pickerRef} style={{ position: 'fixed', top: anchorRect.bottom + 8, left: Math.max(20, anchorRect.left - 100), zIndex: 10001, background: bg, padding: '10px', borderRadius: '12px', boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 32px rgba(0,0,0,0.15)', border: `1px solid ${border}`, width: '200px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', pointerEvents: 'auto' }}>
      {COMMON_EMOJIS.map(emoji => (
        <button key={emoji} onClick={(e) => { e.stopPropagation(); onSelect(emoji); onClose(); }} style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', padding: '4px', borderRadius: '8px', transition: 'background 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = hover} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>{emoji}</button>
      ))}
      <div style={{ gridColumn: 'span 5', marginTop: '6px', borderTop: `1px solid ${hover}`, paddingTop: '6px' }}>
        <input type="text" placeholder="Custom..." maxLength={2} onClick={(e) => e.stopPropagation()} onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter') { const val = (e.target as HTMLInputElement).value; if (val) { onSelect(val); onClose(); } } }} style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: `1px solid ${border}`, fontSize: '12px', color: text, background: isDark ? '#1e1f20' : '#f8f9fa', outline: 'none', boxSizing: 'border-box' }} />
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [gems, setGems] = useState<Gem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [emojiMap, setEmojiMap] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [visible, setVisible] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filterEmojiIndex, setFilterEmojiIndex] = useState(0);
  const [isDark, setIsDark] = useState(false);
  
  const [editingGemId, setEditingGemId] = useState<string | null>(null);
  const [pickerAnchor, setPickerAnchor] = useState<DOMRect | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const filterBarRef = useRef<HTMLDivElement>(null);
  const userInteractedRef = useRef(false);

  const loadSettings = async () => {
    const result = await getStorage(['gems', 'favorites', 'emojiMap', 'options']);
    let gemsList = result.gems || [];
    
    // Clean up any stale "Unknown Gem" data from storage
    const validGems = gemsList.filter(g => g.name && g.name !== 'Unknown Gem');
    if (validGems.length !== gemsList.length) {
      setStorage({ gems: validGems });
      gemsList = validGems;
    }

    setGems(gemsList);
    setFavorites(result.favorites || []);
    setEmojiMap(result.emojiMap || {});
    const pinned = result.options?.isPinned || false;
    setIsPinned(pinned);
    if (pinned) setVisible(true);
  };

  useEffect(() => {
    loadSettings();
    const checkTheme = () => {
      const isDarkTheme = document.documentElement.classList.contains('dark-theme') || document.body.classList.contains('dark-theme');
      setIsDark(isDarkTheme);
    };
    checkTheme();
    const themeObserver = new MutationObserver(checkTheme);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    const handleStorageChange = (changes: browser.Storage.StorageChange, area: string) => {
      if (area === 'local') {
        const anyChanges = changes as any;
        if (anyChanges.gems) {
          const newGems = (anyChanges.gems.newValue as Gem[]).filter(g => g.name && g.name !== 'Unknown Gem');
          setGems(newGems);
        }
        if (anyChanges.favorites) setFavorites(anyChanges.favorites.newValue);
        if (anyChanges.emojiMap) setEmojiMap(anyChanges.emojiMap.newValue);
        if (anyChanges.options) {
          const newPinned = anyChanges.options.newValue.isPinned;
          setIsPinned(newPinned);
          if (newPinned) setVisible(true);
        }
      }
    };

    let lastUrl = window.location.href;
    const urlObserver = new MutationObserver(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        loadSettings();
      }
    });
    urlObserver.observe(document, { subtree: true, childList: true });

    browser.storage.onChanged.addListener(handleStorageChange);
    return () => {
      browser.storage.onChanged.removeListener(handleStorageChange);
      urlObserver.disconnect();
      themeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const handleCaptureMousedown = () => {
      userInteractedRef.current = true;
      setTimeout(() => { userInteractedRef.current = false; }, 200);
    };
    const handleFocus = (e: FocusEvent) => {
      if (visible && inputRef.current && e.target !== inputRef.current && !userInteractedRef.current) {
        inputRef.current.focus();
      }
    };
    window.addEventListener('mousedown', handleCaptureMousedown, true);
    window.addEventListener('focus', handleFocus, true);
    return () => {
      window.removeEventListener('mousedown', handleCaptureMousedown, true);
      window.removeEventListener('focus', handleFocus, true);
    };
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      setTimeout(() => {
        const selectors = ['div[contenteditable="true"]', 'div[role="textbox"]', 'textarea[aria-label*="prompt"]', '.ql-editor', 'input[type="text"]'];
        for (const selector of selectors) {
          const el = document.querySelector(selector);
          if (el instanceof HTMLElement) { el.focus(); el.click(); break; }
        }
      }, 100);
    }
  }, [visible]);

  const uniqueEmojis = useMemo(() => {
    const emojis = gems.map(g => emojiMap[g.id] || g.emoji || '💎');
    return ['All', ...new Set(emojis)];
  }, [gems, emojiMap]);

  const filteredGems = useMemo(() => {
    let list = gems
      .filter(gem => gem.name && gem.name !== 'Unknown Gem') // Safety filter
      .map(gem => ({ ...gem, emoji: emojiMap[gem.id] || gem.emoji || '💎', isFavorite: favorites.includes(gem.id) }));
    if (filterEmojiIndex > 0) {
      const targetEmoji = uniqueEmojis[filterEmojiIndex];
      list = list.filter(gem => gem.emoji === targetEmoji);
    }
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      list = list.filter(gem => (gem.name && gem.name.toLowerCase().includes(lowerQuery)) || (typeof gem.description === 'string' && gem.description.toLowerCase().includes(lowerQuery)));
    }
    return list.sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [gems, favorites, emojiMap, searchQuery, filterEmojiIndex, uniqueEmojis]);

  useEffect(() => { setSelectedIndex(0); }, [filteredGems.length, searchQuery, filterEmojiIndex]);

  useEffect(() => {
    if (listRef.current) {
      const wrapper = listRef.current.firstElementChild;
      if (wrapper && wrapper.children[selectedIndex]) {
        (wrapper.children[selectedIndex] as HTMLElement).scrollIntoView({ block: 'nearest', behavior: 'auto' });
      }
    }
  }, [selectedIndex]);

  useEffect(() => {
    if (filterBarRef.current) {
      const activeFilter = filterBarRef.current.children[filterEmojiIndex] as HTMLElement;
      if (activeFilter) activeFilter.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'auto' });
    }
  }, [filterEmojiIndex]);

  useEffect(() => { if (visible && inputRef.current) inputRef.current.focus(); }, [visible]);

  const handleGlobalKeydown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === '.') setVisible(prev => !prev);
    else if (e.key === 'Escape' && visible) {
      if (editingGemId) setEditingGemId(null);
      else setVisible(false);
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleGlobalKeydown);
    return () => window.removeEventListener('keydown', handleGlobalKeydown);
  }, [visible, editingGemId]);

    const openGem = (id: string, newTab: boolean) => {
      // Detect session part (e.g., /u/1) from current URL to prevent account switching
      const sessionMatch = window.location.pathname.match(/\/u\/(\d+)/);
      const sessionPath = sessionMatch ? sessionMatch[0] : '';
      
      // Construct target URL preserving the session
      const targetUrl = `https://gemini.google.com${sessionPath}/gem/${id}`;

      if (newTab) {
        window.open(targetUrl, '_blank');
      } else {
        window.location.href = targetUrl;
      }
    };

  

    const handleInputKeydown = (e: React.KeyboardEvent) => {

      if (editingGemId) return;

      if (e.key === 'ArrowDown') { e.preventDefault(); if (filteredGems.length > 0) setSelectedIndex(prev => (prev + 1) % filteredGems.length); }

      else if (e.key === 'ArrowUp') { e.preventDefault(); if (filteredGems.length > 0) setSelectedIndex(prev => (prev - 1 + filteredGems.length) % filteredGems.length); }

      else if (e.key === 'ArrowRight') { setFilterEmojiIndex(prev => (prev + 1) % uniqueEmojis.length); }

      else if (e.key === 'ArrowLeft') { setFilterEmojiIndex(prev => (prev - 1 + uniqueEmojis.length) % uniqueEmojis.length); }

      else if (e.key === 'Enter') {

        e.preventDefault();

        if (filteredGems[selectedIndex]) openGem(filteredGems[selectedIndex].id, e.ctrlKey || e.metaKey);

      }

    };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const path = event.composedPath();
      const isInsideUI = containerRef.current && path.includes(containerRef.current);
      const isInsidePicker = pickerRef.current && path.includes(pickerRef.current);
      const isToggleButton = path.some(el => el instanceof HTMLElement && el.classList.contains('gemini-gems-manager-toggle-btn'));
      if (!isInsideUI && !isInsidePicker && !isToggleButton) {
        if (visible && !isPinned) setVisible(false);
        if (editingGemId) setEditingGemId(null);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [visible, isPinned, editingGemId]);

  const toggleFavorite = (id: string) => {
    const newFavorites = favorites.includes(id) ? favorites.filter(favId => favId !== id) : [...favorites, id];
    setFavorites(newFavorites);
    setStorage({ favorites: newFavorites });
  };

  const togglePin = async () => {
    const nextPinned = !isPinned;
    setIsPinned(nextPinned);
    const { options } = await getStorage(['options']);
    await setStorage({ options: { ...(options || { showInEmptyState: true, showInChat: true }), isPinned: nextPinned } });
    if (nextPinned) setVisible(true);
  };

  const updateEmoji = (id: string, emoji: string) => {
    const trimmedEmoji = Array.from(emoji).slice(0, 2).join('');
    const newEmojiMap = { ...emojiMap, [id]: trimmedEmoji };
    setEmojiMap(newEmojiMap);
    setStorage({ emojiMap: newEmojiMap });
  };

  const handleEmojiClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setPickerAnchor(rect);
    setEditingGemId(id);
  };

  const theme = {
    bg: isDark ? '#1e1f20' : '#ffffff',
    surface: isDark ? '#282a2d' : '#f8f9fa',
    border: isDark ? '#444746' : '#dadce0',
    text: isDark ? '#e3e3e3' : '#1f1f1f',
    textSecondary: isDark ? '#c4c7c5' : '#5f6368',
    accent: '#1a73e8',
    accentHover: isDark ? '#3c4043' : '#f1f3f4',
    shadow: isDark ? '0 12px 48px rgba(0,0,0,0.5)' : '0 12px 48px rgba(0,0,0,0.12)'
  };

  return (
    <>
      <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
      
      <button 
        className="gemini-gems-manager-toggle-btn"
        onClick={(e) => { e.stopPropagation(); setVisible(!visible); }}
        style={{ position: 'fixed', top: '80px', right: '20px', zIndex: 10000, width: '32px', height: '32px', borderRadius: '10px', background: visible ? theme.accent : theme.bg, color: visible ? '#ffffff' : theme.textSecondary, border: `1px solid ${theme.border}`, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', pointerEvents: 'auto', transition: 'all 0.2s' }}
      >
        ⭐
      </button>

      {visible && (
        <div ref={containerRef} onKeyDown={handleInputKeydown} style={{ position: 'fixed', top: '120px', right: '20px', zIndex: 9999, background: theme.bg, padding: '16px', borderRadius: '20px', boxShadow: theme.shadow, width: '300px', fontFamily: '"Google Sans", Roboto, Arial, sans-serif', display: 'flex', flexDirection: 'column', maxHeight: '75vh', border: `1px solid ${theme.border}`, color: theme.text, pointerEvents: 'auto', transition: 'opacity 0.2s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 500 }}>Gems</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={togglePin} title={isPinned ? "Unpin" : "Pin UI"} style={{ border: 'none', background: isPinned ? (isDark ? '#3c4043' : '#e8f0fe') : 'none', cursor: 'pointer', fontSize: '16px', color: isPinned ? theme.accent : theme.textSecondary, padding: '4px', borderRadius: '6px', display: 'flex' }}>📌</button>
              <button onClick={(e) => { e.stopPropagation(); setVisible(false); }} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '20px', color: theme.textSecondary, padding: '4px', display: 'flex', alignItems: 'center' }}>&times;</button>
            </div>
          </div>

          <input ref={inputRef} type="text" placeholder="Search Gems..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${theme.border}`, fontSize: '14px', outline: 'none', marginBottom: '8px', boxSizing: 'border-box', backgroundColor: theme.surface, color: theme.text }} />

          <div ref={filterBarRef} className="hide-scrollbar" style={{ display: 'flex', gap: '8px', overflowX: 'auto', overflowY: 'hidden', alignItems: 'center', padding: '2px 16px', margin: '0 -16px 8px -16px', scrollBehavior: 'smooth', minHeight: '36px' }}>
            {uniqueEmojis.map((emoji, index) => (
              <button key={index} onClick={() => setFilterEmojiIndex(index)} style={{ height: '30px', minWidth: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', border: '1px solid', borderColor: filterEmojiIndex === index ? theme.accent : theme.border, background: filterEmojiIndex === index ? (isDark ? '#3c4043' : '#e8f0fe') : theme.bg, color: filterEmojiIndex === index ? theme.accent : theme.textSecondary, fontSize: '13px', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s', flexShrink: 0, boxSizing: 'border-box', padding: '0 12px', margin: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{emoji === 'All' ? 'All' : emoji}</div>
              </button>
            ))}
          </div>

          <div style={{ overflowY: 'auto', flex: 1, padding: '0 2px' }} ref={listRef}>
            {filteredGems.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '2px 0' }}>
                {filteredGems.map((gem, index) => (
                                      <div key={gem.id} style={{ padding: '10px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s', backgroundColor: selectedIndex === index ? theme.accentHover : 'transparent', boxShadow: selectedIndex === index ? `inset 0 0 0 1px ${theme.border}` : 'none' }} onMouseMove={() => setSelectedIndex(index)} onClick={(e) => { openGem(gem.id, e.ctrlKey || e.metaKey); }} onAuxClick={(e) => { if (e.button === 1) openGem(gem.id, true); }}>                    <div onClick={(e) => handleEmojiClick(e, gem.id)} style={{ width: '36px', height: '36px', borderRadius: '10px', background: gem.isFavorite ? (isDark ? '#4f3500' : '#fff4e5') : theme.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px', fontSize: '20px', flexShrink: 0, border: gem.isFavorite ? `1px solid ${isDark ? '#7e5700' : '#ffcc80'}` : '1px solid transparent' }} title="Click to change emoji">{gem.emoji}</div>
                    <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: '14px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: theme.text }}>{gem.name}</div>{gem.description && <div style={{ fontSize: '11px', color: theme.textSecondary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{gem.description}</div>}</div>
                    <button onClick={(e) => { e.stopPropagation(); toggleFavorite(gem.id); }} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px', color: gem.isFavorite ? '#f9ab00' : theme.border, padding: '4px', transition: 'transform 0.1s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>{gem.isFavorite ? '★' : '☆'}</button>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: theme.textSecondary, fontSize: '13px', marginTop: '16px' }}>No Gems found</p>
            )}
          </div>

          <div style={{ marginTop: '16px', fontSize: '11px', color: theme.textSecondary, textAlign: 'center', paddingTop: '12px', borderTop: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}><kbd style={{ padding: '2px 4px', background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '4px', color: theme.text }}>↑↓</kbd> Select <span style={{ opacity: 0.5 }}>|</span> <kbd style={{ padding: '2px 4px', background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '4px', color: theme.text }}>←→</kbd> Filter <span style={{ opacity: 0.5 }}>|</span> <kbd style={{ padding: '2px 4px', background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '4px', color: theme.text }}>Enter</kbd> Open</div>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center', opacity: 0.8 }}><kbd style={{ padding: '2px 4px', background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '4px', color: theme.text }}>Ctrl</kbd> + <kbd style={{ padding: '2px 4px', background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '4px', color: theme.text }}>.</kbd> to toggle</div>
          </div>
        </div>
      )}

      {editingGemId && (
        <EmojiPicker onSelect={(emoji) => updateEmoji(editingGemId, emoji)} onClose={() => setEditingGemId(null)} anchorRect={pickerAnchor} pickerRef={pickerRef} isDark={isDark} />
      )}
    </>
  );
};

export default App;