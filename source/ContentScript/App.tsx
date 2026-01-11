import React, { useEffect, useState, useMemo, useRef } from 'react';
import browser from 'webextension-polyfill';
import { getStorage, setStorage } from '../utils/storage';
import { Gem } from '../types/messages';

const App: React.FC = () => {
  const [gems, setGems] = useState<Gem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [emojiMap, setEmojiMap] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [visible, setVisible] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const loadSettings = async () => {
    const result = await getStorage(['gems', 'favorites', 'emojiMap', 'options']);
    setGems(result.gems || []);
    setFavorites(result.favorites || []);
    setEmojiMap(result.emojiMap || {});
    
    const pinned = result.options?.isPinned || false;
    setIsPinned(pinned);
    if (pinned) setVisible(true);
  };

  useEffect(() => {
    loadSettings();

    const handleStorageChange = (changes: browser.Storage.StorageChange, area: string) => {
      if (area === 'local') {
        const anyChanges = changes as any;
        if (anyChanges.gems) setGems(anyChanges.gems.newValue);
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
    };
  }, []);

  const filteredGems = useMemo(() => {
    let list = gems.map(gem => ({
      ...gem,
      emoji: emojiMap[gem.id] || gem.emoji,
      isFavorite: favorites.includes(gem.id)
    }));

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      list = list.filter(gem => 
        (gem.name && gem.name.toLowerCase().includes(lowerQuery)) || 
        (typeof gem.description === 'string' && gem.description.toLowerCase().includes(lowerQuery))
      );
    }

    const sortedList = list.sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return a.name.localeCompare(b.name);
    });

    setSelectedIndex(0);
    return sortedList;
  }, [gems, favorites, emojiMap, searchQuery]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  // Global keydown handler for toggle and Escape
  useEffect(() => {
    const handleGlobalKeydown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '.') {
        setVisible(prev => !prev);
      } else if (e.key === 'Escape' && visible) {
        setVisible(false);
      }
    };
    window.addEventListener('keydown', handleGlobalKeydown);
    return () => window.removeEventListener('keydown', handleGlobalKeydown);
  }, [visible]);

  const handleInputKeydown = (e: React.KeyboardEvent) => {
    if (filteredGems.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredGems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredGems.length) % filteredGems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredGems[selectedIndex]) {
        window.location.href = `https://gemini.google.com/gem/${filteredGems[selectedIndex].id}`;
      }
    }
  };

  // Outside click detection
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isPinned && visible && containerRef.current) {
        const path = event.composedPath();
        const isInside = path.includes(containerRef.current);
        const isToggleButton = path.some(el => 
          el instanceof HTMLElement && el.classList.contains('gemini-gems-manager-toggle-btn')
        );

        if (!isInside && !isToggleButton) {
          setVisible(false);
        }
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [visible, isPinned]);

  const toggleFavorite = (id: string) => {
    const newFavorites = favorites.includes(id) 
      ? favorites.filter(favId => favId !== id)
      : [...favorites, id];
    setFavorites(newFavorites);
    setStorage({ favorites: newFavorites });
  };

  const togglePin = async () => {
    const nextPinned = !isPinned;
    setIsPinned(nextPinned);
    const { options } = await getStorage(['options']);
    await setStorage({
      options: {
        ...(options || { showInEmptyState: true, showInChat: true }),
        isPinned: nextPinned
      }
    });
    if (nextPinned) setVisible(true);
  };

  const updateEmoji = (id: string, emoji: string) => {
    const newEmojiMap = { ...emojiMap, [id]: emoji };
    setEmojiMap(newEmojiMap);
    setStorage({ emojiMap: newEmojiMap });
  };

  return (
    <>
      <button 
        className="gemini-gems-manager-toggle-btn"
        onClick={(e) => {
          e.stopPropagation();
          setVisible(!visible);
        }}
        title="Toggle Gems List (Ctrl + .)"
        style={{
          position: 'fixed',
          top: '80px',
          right: '20px',
          zIndex: 10000,
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: visible ? '#1a73e8' : '#ffffff',
          color: visible ? '#ffffff' : '#5f6368',
          border: '1px solid #dadce0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          pointerEvents: 'auto',
          transition: 'all 0.2s'
        }}
      >
        ⭐
      </button>

      {visible && (
        <div 
          ref={containerRef}
          onKeyDown={handleInputKeydown}
          style={{
            position: 'fixed',
            top: '125px',
            right: '20px',
            zIndex: 9999,
            background: '#ffffff',
            padding: '16px',
            borderRadius: '16px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
            width: '320px',
            fontFamily: 'Google Sans, Roboto, Arial, sans-serif',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '70vh',
            border: '1px solid #e0e0e0',
            color: '#1f1f1f',
            pointerEvents: 'auto'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 500 }}>Gemini Gems</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={togglePin} title={isPinned ? "Unpin" : "Pin UI"} style={{ border: 'none', background: isPinned ? '#e8f0fe' : 'none', cursor: 'pointer', fontSize: '16px', color: isPinned ? '#1a73e8' : '#5f6368', padding: '4px', borderRadius: '4px' }}>📌</button>
              <button onClick={() => setVisible(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '20px', color: '#5f6368', padding: '4px' }}>&times;</button>
            </div>
          </div>

          <input
            type="text"
            placeholder="Search your Gems..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '10px',
              border: '1px solid #dadce0',
              fontSize: '14px',
              outline: 'none',
              marginBottom: '16px',
              boxSizing: 'border-box',
              backgroundColor: '#f8f9fa',
              color: '#1f1f1f'
            }}
          />

          <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px' }} ref={listRef}>
            {filteredGems.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {filteredGems.map((gem, index) => (
                  <div 
                    key={gem.id} 
                    style={{ 
                      padding: '10px', 
                      borderRadius: '10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'background 0.2s',
                      backgroundColor: selectedIndex === index ? '#f1f3f4' : 'transparent',
                      outline: selectedIndex === index ? '1px solid #dadce0' : 'none'
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    onClick={() => {
                      window.location.href = `https://gemini.google.com/gem/${gem.id}`;
                    }}
                  >
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        const emoji = prompt('Enter an emoji for this Gem:', gem.emoji || '💎');
                        if (emoji !== null) updateEmoji(gem.id, emoji);
                      }}
                      style={{ 
                        width: '36px', 
                        height: '36px', 
                        borderRadius: '10px', 
                        background: gem.isFavorite ? '#fff4e5' : '#e8f0fe', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        marginRight: '12px',
                        fontSize: '20px',
                        flexShrink: 0,
                        border: gem.isFavorite ? '1px solid #ffcc80' : '1px solid transparent'
                      }}
                      title="Click to change emoji"
                    >
                      {gem.emoji || '💎'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{gem.name}</div>
                      {gem.description && <div style={{ fontSize: '11px', color: '#5f6368', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{gem.description}</div>}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(gem.id);
                      }}
                      style={{
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        fontSize: '18px',
                        color: gem.isFavorite ? '#f9ab00' : '#dadce0',
                        padding: '4px',
                        transition: 'transform 0.1s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      {gem.isFavorite ? '★' : '☆'}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: '#5f6368', fontSize: '14px', marginTop: '20px' }}>No Gems found</p>
            )}
          </div>

          <div style={{ marginTop: '16px', fontSize: '11px', color: '#70757a', textAlign: 'center', paddingTop: '12px', borderTop: '1px solid #f1f3f4' }}>
            <kbd style={{ padding: '2px 6px', background: '#f1f3f4', border: '1px solid #dadce0', borderRadius: '4px', boxShadow: '0 1px 1px rgba(0,0,0,0.1)', marginRight: '4px', color: '#333' }}>Ctrl</kbd> + <kbd style={{ padding: '2px 6px', background: '#f1f3f4', border: '1px solid #dadce0', borderRadius: '4px', boxShadow: '0 1px 1px rgba(0,0,0,0.1)', color: '#333' }}>.</kbd> to toggle
          </div>
        </div>
      )}
    </>
  );
};

export default App;