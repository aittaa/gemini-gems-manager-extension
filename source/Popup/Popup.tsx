import type {FC} from 'react';
import styles from './Popup.module.scss';

const Popup: FC = () => {
  return (
    <section className={styles.popup} style={{ padding: '20px', minWidth: '240px', fontFamily: '"Google Sans", Roboto, Arial, sans-serif', color: '#1f1f1f' }}>
      <header className={styles.header} style={{ marginBottom: '16px', borderBottom: '1px solid #f1f3f4', paddingBottom: '12px' }}>
        <h1 className={styles.title} style={{ margin: 0, fontSize: '18px', fontWeight: 500, color: '#1a73e8' }}>
          Gems Manager
        </h1>
      </header>
      <main>
        <p style={{ fontSize: '14px', lineHeight: '1.5', color: '#444', marginBottom: '16px' }}>
          Enhance your Google Gemini with advanced Gem management.
        </p>
        
        <div style={{ background: '#f8f9fa', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>⭐</span>
            <span style={{ fontSize: '13px' }}>Click the <b>Star button</b> on the top-right of Gemini to open.</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>⌨️</span>
            <span style={{ fontSize: '13px' }}>Use <kbd style={{ padding: '2px 4px', background: '#fff', border: '1px solid #dadce0', borderRadius: '4px', fontSize: '11px' }}>Ctrl + .</kbd> to toggle the UI quickly.</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>🎨</span>
            <span style={{ fontSize: '13px' }}>Click any <b>Emoji</b> in the list to customize it.</span>
          </div>
        </div>
      </main>
      <footer style={{ marginTop: '16px', textAlign: 'center' }}>
        <a 
          href="https://github.com/aittaa/gemini-gems-manager-extension" 
          target="_blank" 
          rel="noreferrer"
          style={{ fontSize: '12px', color: '#5f6368', textDecoration: 'none' }}
        >
          View on GitHub
        </a>
      </footer>
    </section>
  );
};

export default Popup;
