import React, { useEffect, useState, useMemo } from 'react';
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

  useEffect(() => {
    // Initial load
    getStorage(['gems', 'favorites', 'emojiMap']).then((result) => {
      setGems(result.gems || []);
      setFavorites(result.favorites || []);
      setEmojiMap(result.emojiMap || {});
    });

    // Listen for storage changes
    const handleStorageChange = (changes: browser.Storage.StorageChange, area: string) => {
      if (area === 'local') {
        const anyChanges = changes as any;
        if (anyChanges.gems) setGems(anyChanges.gems.newValue);
        if (anyChanges.favorites) setFavorites(anyChanges.favorites.newValue);
        if (anyChanges.emojiMap) setEmojiMap(anyChanges.emojiMap.newValue);
      }
    };

    browser.storage.onChanged.addListener(handleStorageChange);
    return () => {
      browser.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  // Toggle visibility with Ctrl+. (Cmd+.)
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '.') {
        setVisible(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, []);

  const toggleFavorite = (id: string) => {
    const newFavorites = favorites.includes(id) 
      ? favorites.filter(favId => favId !== id)
      : [...favorites, id];
    setFavorites(newFavorites);
    setStorage({ favorites: newFavorites });
  };

  const updateEmoji = (id: string, emoji: string) => {
    const newEmojiMap = { ...emojiMap, [id]: emoji };
    setEmojiMap(newEmojiMap);
    setStorage({ emojiMap: newEmojiMap });
  };

  const filteredGems = useMemo(() => {
    let list = gems.map(gem => ({
      ...gem,
      emoji: emojiMap[gem.id] || gem.emoji,
      isFavorite: favorites.includes(gem.id)
    }));

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      list = list.filter(gem => 
        gem.name.toLowerCase().includes(lowerQuery) || 
        (gem.description && gem.description.toLowerCase().includes(lowerQuery))
      );
    }

    // Sort: Favorites first, then alphabetical
    return list.sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [gems, favorites, emojiMap, searchQuery]);

  if (!visible && !isPinned) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '60px',
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
      maxHeight: '75vh',
      border: '1px solid #e0e0e0',
      color: '#1f1f1f',
      transition: 'opacity 0.2s'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 500 }}>Gemini Gems</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => setIsPinned(!isPinned)}
            title={isPinned ? "Unpin" : "Pin UI"}
            style={{ 
              border: 'none', 
              background: isPinned ? '#e8f0fe' : 'none', 
              cursor: 'pointer', 
              fontSize: '16px',
              color: isPinned ? '#1a73e8' : '#5f6368',
              padding: '4px',
              borderRadius: '4px'
            }}
          >
            📌
          </button>
          <button 
            onClick={() => setVisible(false)}
            style={{ 
              border: 'none', 
              background: 'none', 
              cursor: 'pointer', 
              fontSize: '20px',
              color: '#5f6368',
              padding: '4px'
            }}
          >
            &times;
          </button>
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
          backgroundColor: '#f8f9fa'
        }}
      />

      <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
        {filteredGems.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {filteredGems.map(gem => (
              <div 
                key={gem.id} 
                style={{ 
                  padding: '10px', 
                  borderRadius: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f3f4'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
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
                <div 
                  style={{ flex: 1, minWidth: 0 }}
                  onClick={() => {
                    window.location.href = `https://gemini.google.com/app?gem_id=${gem.id}`;
                  }}
                >
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {gem.name}
                  </div>
                  {gem.description && (
                     <div style={{ 
                      fontSize: '11px', 
                      color: '#5f6368',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {gem.description}
                    </div>
                  )}
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
          <p style={{ textAlign: 'center', color: '#5f6368', fontSize: '14px', marginTop: '20px' }}>
            No Gems found
          </p>
        )}
      </div>

      <div style={{ 
        marginTop: '16px', 
        fontSize: '11px', 
        color: '#70757a', 
        textAlign: 'center',
        paddingTop: '12px',
        borderTop: '1px solid #f1f3f4'
      }}>
        <kbd style={{ 
          padding: '2px 6px', 
          background: '#f1f3f4', 
          border: '1px solid #dadce0',
          borderRadius: '4px',
          boxShadow: '0 1px 1px rgba(0,0,0,0.1)',
          marginRight: '4px'
        }}>Ctrl</kbd> + <kbd style={{ 
          padding: '2px 6px', 
          background: '#f1f3f4', 
          border: '1px solid #dadce0',
          borderRadius: '4px',
          boxShadow: '0 1px 1px rgba(0,0,0,0.1)'
        }}>.</kbd> to toggle
      </div>
    </div>
  );
};

export default App;
