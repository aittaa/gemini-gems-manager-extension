import type {FC} from 'react';
import styles from './Popup.module.scss';

const Popup: FC = () => {
  return (
    <section className={styles.popup}>
      <header className={styles.header}>
        <h1 className={styles.title}>Gems Manager</h1>
        <div className={styles.greeting}>Powerful management tool for Google Gemini</div>
      </header>
      
      <main>
        <div className={styles.statsCard}>
          <div className={styles.statsTitle}>How to use</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '18px' }}>⭐</span>
              <span style={{ fontSize: '13px', color: '#1f1f1f' }}>Click the <b>Star button</b> on the top-right of Gemini.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '18px' }}>🎨</span>
              <span style={{ fontSize: '13px', color: '#1f1f1f' }}>Click any <b>Emoji</b> in the list to customize it.</span>
            </div>
          </div>
        </div>

        <div className={styles.shortcuts}>
          <div className={styles.shortcutTitle}>Keyboard Shortcuts</div>
          <div className={styles.shortcutList}>
            <div className={styles.shortcutItem}>
              <div className={styles.keyLabel}>
                <kbd className={styles.key}>Ctrl</kbd>
                <span style={{ color: '#dadce0' }}>+</span>
                <kbd className={styles.key}>.</kbd>
              </div>
              <div className={styles.description}>Toggle Manager UI</div>
            </div>

            <div className={styles.shortcutItem}>
              <div className={styles.keyLabel}>
                <kbd className={styles.key}>Enter</kbd>
              </div>
              <div className={styles.description}>Open in current tab</div>
            </div>

            <div className={styles.shortcutItem}>
              <div className={styles.keyLabel}>
                <kbd className={styles.key}>Ctrl</kbd>
                <span style={{ color: '#dadce0' }}>+</span>
                <kbd className={styles.key}>Enter</kbd>
              </div>
              <div className={styles.description}>Open in background</div>
            </div>

            <div className={styles.shortcutItem}>
              <div className={styles.keyLabel}>
                <kbd className={styles.key}>↑</kbd>
                <kbd className={styles.key}>↓</kbd>
              </div>
              <div className={styles.description}>Navigate list</div>
            </div>

            <div className={styles.shortcutItem}>
              <div className={styles.keyLabel}>
                <kbd className={styles.key}>←</kbd>
                <kbd className={styles.key}>→</kbd>
              </div>
              <div className={styles.description}>Filter by Emoji</div>
            </div>

            <div className={styles.shortcutItem}>
              <div className={styles.keyLabel}>
                <kbd className={styles.key}>Esc</kbd>
              </div>
              <div className={styles.description}>Close UI / Picker</div>
            </div>
          </div>
        </div>
      </main>

      <footer style={{ marginTop: '24px', textAlign: 'center' }}>
        <a 
          href="https://github.com/aittaa/gemini-gems-manager-extension" 
          target="_blank" 
          rel="noreferrer"
          style={{ fontSize: '12px', color: '#5f6368', textDecoration: 'none', opacity: 0.8 }}
        >
          View on GitHub
        </a>
      </footer>
    </section>
  );
};

export default Popup;
