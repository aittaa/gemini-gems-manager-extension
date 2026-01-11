import {useEffect, useState} from 'react';
import type {FC} from 'react';
import {getStorage, setStorage} from '../utils/storage';
import {Button} from '../components/Button/Button';
import {Checkbox} from '../components/Checkbox/Checkbox';
import styles from './Options.module.scss';

const Options: FC = () => {
  const [showInEmptyState, setShowInEmptyState] = useState(true);
  const [showInChat, setShowInChat] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getStorage(['options']).then((result) => {
      if (result.options) {
        setShowInEmptyState(result.options.showInEmptyState);
        setShowInChat(result.options.showInChat);
      }
    });
  }, []);

  const handleSave = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    await setStorage({
      options: {
        showInEmptyState,
        showInChat,
      }
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className={styles.options}>
      <header className={styles.header}>
        <h1>Gemini Gems Manager Settings</h1>
        <p>Configure your preferences</p>
      </header>

      <form onSubmit={handleSave} className={styles.form}>
        <div className={styles.section}>
          <Checkbox
            id="showInEmptyState"
            name="showInEmptyState"
            label="Show Gems in empty state"
            checked={showInEmptyState}
            onChange={(e): void => setShowInEmptyState(e.target.checked)}
          />
        </div>

        <div className={styles.section}>
          <Checkbox
            id="showInChat"
            name="showInChat"
            label="Show Gems in chat screen"
            checked={showInChat}
            onChange={(e): void => setShowInChat(e.target.checked)}
          />
        </div>

        <div className={styles.actions}>
          <Button type="submit" variant="primary" size="large">
            Save Settings
          </Button>
          {saved && <span className={styles.status}>Settings saved</span>}
        </div>
      </form>
    </div>
  );
};

export default Options;