import type {FC} from 'react';
import styles from './Popup.module.scss';

const Popup: FC = () => {
  return (
    <section className={styles.popup}>
      <header className={styles.header}>
        <h1 className={styles.title}>Gemini Gems Manager</h1>
      </header>
      <main>
        <p>Manage your Gems efficiently.</p>
      </main>
    </section>
  );
};

export default Popup;